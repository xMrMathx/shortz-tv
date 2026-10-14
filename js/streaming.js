/* ---------- LIVE STREAMING: TikTok-style vertical swipe feed ---------- */
let STREAMERS={kick:[],twitch:[],youtube:[]}, STREAMERS_LOADED=false;
/* refresh one Kick channel: live status via v1, most-recent VOD via v2 when offline */
/* 4s ceiling for EVERY network call in the streaming refresh path —
   a single slow API can never hang the whole tab */
function kickFetchTimeout(ms){
  return new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),ms));
}
function kickRefreshOne(s){
  const ch=String(s.url||"").split("/").filter(Boolean).pop();
  if(!ch)return Promise.resolve(false);
  const before=!!s.live;
  return Promise.race([
    fetch("https://kick.com/api/v1/channels/"+encodeURIComponent(ch),{cache:"no-store"}),
    kickFetchTimeout(4000)
  ])
    .then(r=>r.ok?r.json():null)
    .then(d=>{
      if(!d)return false;
      const ls=d.livestream||null;
      s.live=!!ls;
      if(ls){ s.title=ls.session_title||s.title; s.viewers=ls.viewer_count!=null?String(ls.viewer_count):s.viewers; return (!!s.live)!==before; }
      if(!s.vod_id)return kickFetchVod(s).then(()=>((!!s.live)!==before));
      return (!!s.live)!==before;
    }).catch(()=>false);
}
/* most recent offline VOD for a Kick channel */
function kickFetchVod(s){
  const ch=String(s.url||"").split("/").filter(Boolean).pop();
  if(!ch)return Promise.resolve();
  return Promise.race([
    fetch("https://kick.com/api/v2/channels/"+encodeURIComponent(ch)+"/videos",{cache:"no-store"}),
    kickFetchTimeout(4000)
  ])
    .then(r=>r.ok?r.json():null)
    .then(vids=>{
      if(!vids||!vids.length)return;
      // his rotation (2026-10-14): the 5 most recent VODs play back
      // to back, then loop — a slide is never still
      const q=vids.filter(v=>!v.is_live).slice(0,5).map(v=>({id:v.id,title:v.session_title||"",hls:v.source||""}));
      if(!q.length){ const v0=vids[0]; q.push({id:v0.id,title:v0.session_title||"",hls:v0.source||""}); }
      s.vodQueue=q;
      const vod=q[0];
      s.vod_id=vod.id;
      s.vod_title=vod.title;
      s.vod_hls=vod.hls; // direct HLS URL — play in <video> tag, bypasses Kick player
    }).catch(()=>{});
}
// Twitch VOD via public GraphQL (no auth needed) — resolves true when VOD data changed
function twitchFetchVod(s){
  const ch=String(s.url||"").split("/").filter(Boolean).pop();
  if(!ch)return Promise.resolve(false);
  const before=s.vod_id||null;
  return Promise.race([
    fetch("https://gql.twitch.tv/gql",{
      method:"POST",
      headers:{"Client-ID":"kimne78kx3ncx6brgo4mv6wki5h1ko","Content-Type":"application/json"},
      body:JSON.stringify({query:"query($login:String!){user(login:$login){videos(first:5){edges{node{id title}}}}}","variables":{login:ch.toLowerCase()}})
    }),
    kickFetchTimeout(4000)
  ])
    .then(r=>r.ok?r.json():null)
    .then(d=>{
      const edges=(d&&d.data&&d.data.user&&d.data.user.videos&&d.data.user.videos.edges)||[];
      if(!edges.length)return false;
      // his rotation (2026-10-14): the 5 most recent VODs, back to
      // back, then loop — HLS resolves lazily per VOD (see ssVodWire)
      s.vodQueue=edges.slice(0,5).map(e=>({id:String(e.node.id),vid:"v"+e.node.id,title:e.node.title||"",hls:""}));
      const edge=edges[0];
      const nid="v"+edge.node.id; // Twitch VOD IDs need "v" prefix
      const changed=(nid!==before)||((edge.node.title||"")!==(s.vod_title||""));
      s.vod_id=nid;
      s.vod_title=edge.node.title||"";
      // Also fetch the direct HLS stream URL (bypasses Twitch's embed player)
      return twitchFetchVodStream(s,edge.node.id).then(()=>{ const q0=s.vodQueue&&s.vodQueue[0]; if(q0)q0.hls=s.vod_hls||""; return changed; });
    }).catch(()=>false);
}
// Get direct HLS URL for a Twitch VOD via playback access token (no embed player needed)
function twitchFetchVodStream(s,vodId){
  return Promise.race([
    fetch("https://gql.twitch.tv/gql",{
      method:"POST",
      headers:{"Client-ID":"kimne78kx3ncx6brgo4mv6wki5h1ko","Content-Type":"application/json"},
      body:JSON.stringify({
        operationName:"PlaybackAccessToken",
        query:"query PlaybackAccessToken($vodID: ID!){videoPlaybackAccessToken(id: $vodID, params: {platform: \"web\", playerBackend: \"mediaplayer\", playerType: \"site\"}){value signature}}",
        variables:{vodID:String(vodId)}
      })
    }),
    kickFetchTimeout(4000)
  ])
    .then(r=>r.ok?r.json():null)
    .then(d=>{
      const tok=d&&d.data&&d.data.videoPlaybackAccessToken;
      if(!tok||!tok.value||!tok.signature)return;
      const vid=String(vodId);
      s.vod_hls="https://usher.ttvnw.net/vod/"+vid+".m3u8?sig="+encodeURIComponent(tok.signature)+"&token="+encodeURIComponent(tok.value)+"&allow_source=true";
      s._lastHls=s.vod_hls;
    }).catch(()=>{});
}
/* Cache load ONLY — renders instantly, never touches live APIs.
   Order: window.SHORTZ_STREAMERS (bundled) -> localStorage (last background refresh) -> streamers.json */
async function loadStreamers(){
  if(STREAMERS_LOADED)return;
  STREAMERS_LOADED=true;
  try{
    if(window.SHORTZ_STREAMERS){
      STREAMERS.kick=window.SHORTZ_STREAMERS.kick||[]; STREAMERS.youtube=window.SHORTZ_STREAMERS.youtube||[];
      STREAMERS.twitch=window.SHORTZ_STREAMERS.twitch||[];
    }else{
      let cached=null;
      try{
        // v2: Chonion removed, YouTube streamers added — old caches are stale
        const cv=localStorage.getItem("shortz_streamers_ver");
        if(cv!=="2"){ localStorage.removeItem("shortz_streamers"); localStorage.setItem("shortz_streamers_ver","2"); }
        cached=JSON.parse(localStorage.getItem("shortz_streamers")||"null");
      }catch(e){}
      if(cached&&Array.isArray(cached.kick)&&Array.isArray(cached.twitch)){
        STREAMERS.kick=cached.kick; STREAMERS.twitch=cached.twitch; STREAMERS.youtube=cached.youtube||[];
      }else{
        // bundled streamers.json — 4s ceiling, a slow file fetch never blocks the tab
        const r=await Promise.race([fetch("streamers.json",{cache:"no-store"}),kickFetchTimeout(4000)]);
        if(r.ok){ const d=await r.json(); STREAMERS.kick=d.kick||[]; STREAMERS.twitch=d.twitch||[]; STREAMERS.youtube=d.youtube||[]; }
      }
    }
  }catch(e){ /* empty directory until streamers.json ships */ }
  // hard filter: Chonion is removed, period — no stale cache can bring him back
  try{
    ["kick","twitch","youtube"].forEach(p=>{
      STREAMERS[p]=(STREAMERS[p]||[]).filter(x=>((x.name||"")+"").toLowerCase()!=="chonion");
    });
  }catch(e){}
}
/* Background live refresh — fired and NOT awaited by the render path.
   Live badges / replay data land via restackStreams() when they arrive. */
let streamersRefreshing=false;
async function refreshStreamersLive(){
  if(streamersRefreshing)return;
  streamersRefreshing=true;
  try{
    if(!STREAMERS.kick.length&&!STREAMERS.twitch.length){
      // cache fetch may have raced out; retry the bundled data once before refreshing
      try{
        const r=await Promise.race([fetch("streamers.json",{cache:"no-store"}),kickFetchTimeout(4000)]);
        if(r.ok){ const d=await r.json(); STREAMERS.kick=d.kick||[]; STREAMERS.twitch=d.twitch||[]; STREAMERS.youtube=d.youtube||[]; }
      }catch(e){}
    }
    // ROOT FIX: the cached list never expired, so newly-added channels in
    // streamers.json never appeared. Merge in any new channels (by URL) every
    // refresh — no cache-clearing needed, ever.
    let addedNew=false;
    try{
      const r2=await Promise.race([fetch("streamers.json",{cache:"no-store"}),kickFetchTimeout(4000)]);
      if(r2.ok){
        const d=await r2.json();
        const seen=new Set();
        ["kick","twitch"].forEach(p=>{(STREAMERS[p]||[]).forEach(s=>seen.add(String(s.url||"").toLowerCase()))});
        ["kick","twitch"].forEach(p=>{
          (d[p]||[]).forEach(s=>{
            const u=String((s&&s.url)||"").toLowerCase();
            if(u&&!seen.has(u)){ seen.add(u); (STREAMERS[p]=STREAMERS[p]||[]).push(s); addedNew=true; }
          });
        });
      }
    }catch(e){}
    // refresh live status for Kick channels (no auth needed); fetch most-recent VOD for offline ones
    const kc=await Promise.all(STREAMERS.kick.map(kickRefreshOne));
    // fetch most-recent VOD for Twitch streamers (assume offline — no auth for live check)
    const tc=await Promise.all(STREAMERS.twitch.map(s=>{ s.live=false; return twitchFetchVod(s); }));
    try{ localStorage.setItem("shortz_streamers",JSON.stringify(STREAMERS)); }catch(e){}
    // live badges (or new replays) arrived — re-sort and re-fill visible slots if the tab is still open
    if(curView==="streaming"&&(addedNew||kc.some(Boolean)||tc.some(Boolean)))restackStreams();
  }catch(e){
    /* every per-call path already catches; belt-and-braces so this can never reject unhandled */
  }finally{
    streamersRefreshing=false;
  }
}
/* unified list: Kick first, then Twitch; live streamers first within each.
   A streamer counts as playable when live OR when a genuine replay exists.
   Non-playable (offline, no replay) sink to the bottom — the feed never leads with a dead player. */
function sstreamPlayable(s){
  if(s.live)return true;
  if(s.platform==="youtube")return !!(s.ytLatestId||(s.ytRecent&&s.ytRecent.length));
  return !!(s.vod_hls||s.vod_id);
}
function sstreamList(){
  const out=[];
  ["kick","twitch","youtube"].forEach(p=>{ (STREAMERS[p]||[]).forEach(s=>out.push(Object.assign({platform:p},s))); });
  // pinned first (Mr. Moore's favorites), then playable, then live
  out.sort((a,b)=>((b.pinned?1:0)-(a.pinned?1:0))||((sstreamPlayable(b)?1:0)-(sstreamPlayable(a)?1:0))||((b.live?1:0)-(a.live?1:0)));
  return out;
}
function sstreamChannel(s){ return String(s.url||"").split("/").filter(Boolean).pop()||""; }
function sstreamEmbed(s,muted){
  const ch=encodeURIComponent(sstreamChannel(s)), m=muted?"1":"0";
  if(s.platform==="twitch"){
    const host=(window.location&&window.location.hostname)||"";
    const parents=["xmrmathx.github.io"];
    if(host&&parents.indexOf(host)<0)parents.push(host);
    const pstr=parents.map(p=>"&parent="+encodeURIComponent(p)).join("");
    return "https://player.twitch.tv/?channel="+ch+pstr+"&autoplay=true&muted="+(muted?"true":"false");
  }
  if(s.platform==="youtube"){
    const vid=s.live&&s.ytVideoId?s.ytVideoId:(!s.live&&s.ytLatestId?s.ytLatestId:null);
    if(vid)return "https://www.youtube.com/embed/"+encodeURIComponent(vid)+"?autoplay=1&mute="+m+"&rel=0&controls=0&disablekb=1&fs=0";
    const cid=s.channelId||ch;
    return "https://www.youtube.com/embed/live_stream?channel="+encodeURIComponent(cid)+"&autoplay=1&mute="+m+"&rel=0&controls=0&disablekb=1&fs=0";
  }
  return "https://player.kick.com/"+ch+"?autoplay=true&muted="+(muted?"true":"false");
}
// VOD playback uses a native <video> tag with the direct HLS URL (bypasses Kick player misconfiguration)
function sstreamVodHTML(s,muted){
  const m=muted?"muted":"";
  return `<video src="${s.vod_hls}" ${m} autoplay playsinline controls style="width:100%;height:100%;object-fit:contain;background:#000"></video>`;
}
let sstreamStack=[], sstreamPos=-1, sstreamSlots=[], sstreamMounted=false;
let sdragging=false, sdragDy=0, sdragX0=0, sdragY0=0, sdragT0=0, smovedPx=0;
let svelSamples=[], ssnapAnim=false, ssuppressClick=false, sskipMouseUntil=0;
let streamMuted=false, streamPollTimer=null; // streams start WITH SOUND (his law, 2026-10-12) — the APK shell permits audible autoplay; the tap toggle now mutes instead of unmuting
/* ---------- stream sharing: deep link opens inside Shortz VS, never the platform ---------- */
function streamShareId(s){
  if(!s)return"";
  if(s.platform==="youtube")return"youtube:"+(s.channelId||"");
  const slug=String(s.url||"").split("/").filter(Boolean).pop()||s.name||"";
  return(s.platform||"kick")+":"+slug.toLowerCase();
}
function shareStream(s){
  if(!s)return;
  const id=streamShareId(s);
  const url="https://xmrmathx.github.io/shortz-tv/?stream="+encodeURIComponent(id);
  const title="@"+(s.name||"streamer")+" on Shortz VS";
  const text=(s.live?"\uD83D\uDD34 LIVE now: ":"\u25B6 Watch ")+"@"+(s.name||"")+" streaming on Shortz VS \u2014 free, no account needed";
  const done=()=>{ try{ toast("Link copied"); }catch(e){} };
  if(navigator.share){
    navigator.share({title:title,text:text,url:url}).catch(()=>{});
  }else if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(done).catch(()=>{});
  }else{
    const ta=document.createElement("textarea");ta.value=url;document.body.appendChild(ta);
    ta.select();try{document.execCommand("copy");done();}catch(e){}
    document.body.removeChild(ta);
  }
}
/* jump the stream feed to a shared streamer id (platform:slug) */
function sstreamJumpTo(id){
  if(!id||!sstreamStack.length)return false;
  const idx=sstreamStack.findIndex(x=>streamShareId(x)===id);
  if(idx<0)return false;
  sstreamPos=idx;
  sstreamFill(sstreamSlots[1],sstreamStack[sstreamPos],"current");
  sstreamFill(sstreamSlots[0],sstreamStack[sstreamPos-1]||null,sstreamStack[sstreamPos-1]?"unload":"blank");
  sstreamFill(sstreamSlots[2],sstreamStack[sstreamPos+1]||null,sstreamStack[sstreamPos+1]?"unload":"blank");
  sstreamLayout();
  return true;
}
function sstreamSlideHTML(){
  return `<div class="sstream-frame" data-sframe></div>
  <div class="sstream-ov" data-sov>
    <div class="sstream-top"><span data-s-live></span><span class="sstream-plat" data-s-plat></span><button class="sstream-sharebtn" data-s-share title="Share this stream">↗ Share</button></div>
    <div class="sstream-bot">
      <div class="sstream-name" data-s-name></div>
      <div class="sstream-title" data-s-title></div>
      <div class="sstream-meta" data-s-meta></div>
      <div><span class="sstream-sound" data-s-sound>🔇 Tap for sound</span></div>
    </div>
  </div>`;
}
function sstreamFill(node,s,mode){
  const fr=node.querySelector("[data-sframe]"), ov=node.querySelector("[data-sov]");
  if(node._ssPlayer){ try{ node._ssPlayer.destroy(); }catch(e){} node._ssPlayer=null; }
  node._s=s||null;
  if(!s||mode==="blank"){ fr.innerHTML=""; ov.style.display="none"; return; }
  ov.style.display="";
  const live=!!s.live, replay=!live&&(!!s.vod_id||(s.platform==="youtube"&&!!(s.ytLatestId||(s.ytRecent&&s.ytRecent.length))));
  node.querySelector("[data-s-live]").innerHTML=live?`<span class="slive" style="position:static;transform:none">● LIVE</span>`:replay?`<span class="sreplay">▶ REPLAY</span>`:`<span class="soff">OFFLINE</span>`;
  node.querySelector("[data-s-plat]").textContent=s.platform==="twitch"?"Twitch":s.platform==="youtube"?"YouTube":"Kick";
  node.querySelector("[data-s-name]").textContent="@"+(s.name||"unknown");
  const tt=node.querySelector("[data-s-title]");
  const showTitle=replay?(s.vod_title||""):(s.platform==="youtube"&&!s.live&&s.ytLatestTitle?s.ytLatestTitle:s.title);
  tt.textContent=showTitle||""; tt.style.display=showTitle?"":"none";
  const mt=node.querySelector("[data-s-meta]");
  mt.textContent=live&&s.viewers?(s.viewers+" watching"):live?"Live now":replay?"Most recent stream":"";
  mt.style.display=mt.textContent?"":"none";
  node.querySelector("[data-s-sound]").style.display="none"; // no tap-for-sound anymore (his order 2026-10-14): streams play with sound on their own
  const shb=node.querySelector("[data-s-share]");
  if(shb){
    shb.onclick=(e)=>{ try{e.stopPropagation();}catch(_){} shareStream(s); };
    // don't let the tap bubble to the stage's sound-toggle handler
    shb.ontouchstart=(e)=>{ try{e.stopPropagation();}catch(_){} };
    shb.onmousedown=(e)=>{ try{e.stopPropagation();}catch(_){} };
  }
  if(mode==="unload"){ fr.innerHTML=""; return; }
  // nothing playable (offline + no genuine replay): honest card, never a broken "video unavailable" embed
  if(!live&&!replay){
    fr.innerHTML=`<div class="sstream-novid"><div style="font-size:44px">📡</div><div style="font-weight:800;font-size:16px;margin-top:10px">@${esc(s.name||"unknown")} is offline</div><div style="color:var(--mut);font-size:13px;margin-top:6px">No recent replay available — check back soon.</div></div>`;
    return;
  }
  // offline with VODs: native <video> on direct HLS (bypasses the
  // platform players). The recent VODs play back to back and loop
  // (his order 2026-10-14) — the slide is never still.
  if(s.platform!=="twitch"&&!s.live&&s.vod_hls){
    fr.innerHTML=sstreamVodHTML(s,false);
    ssVodWire(node,s);
  }else if(s.platform==="twitch"&&!s.live&&s.vod_hls){
    fr.innerHTML=`<video src="${s.vod_hls}" style="width:100%;height:100%;background:#000" playsinline webkit-playsinline autoplay></video>`;
    ssVodWire(node,s);
  }else if(s.platform==="twitch"&&!s.live&&s.vod_id){
    // fallback: Twitch iframe embed (if HLS not available)
    let vidId=String(s.vod_id);
    if(vidId.charAt(0)!=="v")vidId="v"+vidId;
    const host=(window.location&&window.location.hostname)||"";
    const parents=["xmrmathx.github.io"];
    if(host&&parents.indexOf(host)<0)parents.push(host);
    const pstr=parents.map(p=>"&parent="+encodeURIComponent(p)).join("");
    fr.innerHTML=`<iframe src="https://player.twitch.tv/?video=${encodeURIComponent(vidId)}${pstr}&autoplay=false" frameborder="0" allowfullscreen allow="autoplay; fullscreen" style="width:100%;height:100%;border:0"></iframe>`;
  }else if(s.platform==="youtube"){
    ssYtMount(node,s);
  }else{
    fr.innerHTML=`<iframe src="${sstreamEmbed(s,false)}" frameborder="0" allowfullscreen allow="autoplay; fullscreen"></iframe>`;
  }
}
/* ---------- the never-still rotation (his order 2026-10-14) ----------
   A slide NEVER sits on an end screen: a YouTube streamer plays his
   5 most recent videos back to back, completely, and loops to the
   first; Kick/Twitch VOD queues do the same. Sound is automatic. */
function ssYtQueue(s){
  const q=[];
  if(s.ytRecent&&s.ytRecent.length)q.push(...s.ytRecent);
  else if(s.ytLatestId)q.push(s.ytLatestId);
  return q.filter((v,i,a)=>v&&a.indexOf(v)===i).slice(0,5);
}
function ssYtMount(node,s){
  const fr=node.querySelector("[data-sframe]"); if(!fr)return;
  const queue=ssYtQueue(s);
  const startId=s.live&&s.ytVideoId?s.ytVideoId:(queue[0]||null);
  if(!startId){
    const cid=s.channelId||sstreamChannel(s);
    fr.innerHTML=`<iframe src="https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(cid)}&autoplay=1&mute=0&rel=0&controls=0&disablekb=1&fs=0" frameborder="0" allowfullscreen allow="autoplay; fullscreen"></iframe>`;
    return;
  }
  let qi=Math.max(0,queue.indexOf(startId));
  const box=document.createElement("div");
  box.style.cssText="width:100%;height:100%";
  fr.innerHTML=""; fr.appendChild(box);
  let dead=false, player=null;
  const fallback=()=>{ if(dead)return; dead=true;
    const ids=queue.length?queue:[startId];
    fr.innerHTML=`<iframe src="https://www.youtube.com/embed/${encodeURIComponent(ids[0])}?autoplay=1&mute=0&rel=0&controls=0&disablekb=1&fs=0&loop=1&playlist=${encodeURIComponent(ids.join(","))}" frameborder="0" allowfullscreen allow="autoplay; fullscreen"></iframe>`;
  };
  const make=()=>{
    if(dead)return;
    try{
      player=new YT.Player(box,{
        width:"100%",height:"100%",videoId:startId,
        playerVars:{autoplay:1,controls:0,rel:0,playsinline:1,disablekb:1,fs:0,modestbranding:1},
        events:{
          onReady:e=>{ node._ssPlayer=player; try{ e.target.unMute(); e.target.setVolume(100); e.target.playVideo(); }catch(_){ } },
          onStateChange:e=>{
            if(e.data===0){ // ENDED -> next of the 5, looping to the first
              if(queue.length){ qi=(qi+1)%queue.length;
                const tt=node.querySelector("[data-s-title]"); if(tt&&s.ytRecentTitles&&s.ytRecentTitles[qi]){ tt.textContent=s.ytRecentTitles[qi]; tt.style.display=""; }
                try{ player.loadVideoById(queue[qi]); player.unMute(); player.setVolume(100); }catch(_){ }
              } else { try{ player.seekTo(0); player.playVideo(); }catch(_){ } }
            }
          },
          onError:()=>{ if(queue.length>1){ qi=(qi+1)%queue.length; try{ player.loadVideoById(queue[qi]); }catch(_){ } } }
        }
      });
    }catch(e){ fallback(); }
  };
  if(window.YT&&YT.Player)make();
  else if(typeof ensureYT==="function"){ ensureYT(make); setTimeout(()=>{ if(!player)fallback(); },4000); }
  else fallback();
}
function ssVodWire(node,s){
  const vid=node.querySelector("video"); if(!vid)return;
  node._svid=vid;
  vid.muted=false;
  const q=(s.vodQueue&&s.vodQueue.length)?s.vodQueue:[{hls:s.vod_hls,title:s.vod_title||"",id:s.vod_id}];
  let qi=0;
  const playAudible=()=>{ const pr=vid.play(); if(pr&&pr.catch)pr.catch(()=>{ try{ vid.muted=true; const p2=vid.play(); if(p2&&p2.catch)p2.catch(()=>{}); const un=()=>{ vid.muted=false; document.removeEventListener("pointerdown",un,true); }; document.addEventListener("pointerdown",un,true); }catch(e){} }); };
  playAudible(); setTimeout(()=>{ if(vid.paused)playAudible(); },800);
  const prefetch=i=>{ const nx=q[i]; if(nx&&!nx.hls&&s.platform==="twitch"&&nx.id){ twitchFetchVodStream(s,nx.id).then(()=>{ nx.hls=s._lastHls||nx.hls; }); } };
  vid.addEventListener("ended",()=>{
    qi=(qi+1)%q.length;
    const nx=q[qi]; if(!nx)return;
    const tt=node.querySelector("[data-s-title]"); if(tt&&nx.title){ tt.textContent=nx.title; tt.style.display=""; }
    const go=()=>{ vid.src=nx.hls; playAudible(); prefetch((qi+1)%q.length); };
    if(nx.hls)go();
    else if(s.platform==="twitch"&&nx.id){ twitchFetchVodStream(s,nx.id).then(()=>{ nx.hls=s._lastHls||""; if(nx.hls)go(); }); }
  });
  prefetch(1%q.length);
}
function sstreamLayout(){ sstreamSlots.forEach((n,i)=>{ n.style.transform=`translateY(${(i-1)*100}%)`; }); }
function sstreamCur(){ return sstreamSlots[1]; }
/* re-sort the feed after live-status changes; keep the user on the same streamer when possible */
function restackStreams(){
  if(!sstreamMounted||!sstreamStack.length)return;
  const curUrl=sstreamStack[sstreamPos]?sstreamStack[sstreamPos].url:null;
  sstreamStack=sstreamList();
  if(curUrl){
    const ni=sstreamStack.findIndex(s=>s.url===curUrl);
    sstreamPos=ni>=0?ni:Math.min(sstreamPos,sstreamStack.length-1);
  }else sstreamPos=0;
  sstreamFill(sstreamSlots[1],sstreamStack[sstreamPos],"current");
  sstreamFill(sstreamSlots[0],sstreamStack[sstreamPos-1]||null,sstreamStack[sstreamPos-1]?"unload":"blank");
  sstreamFill(sstreamSlots[2],sstreamStack[sstreamPos+1]||null,sstreamStack[sstreamPos+1]?"unload":"blank");
}
/* poll Kick live status every 60s while the Streaming tab is open */
async function pollYtLive(){
  try{
    const r=await fetch("yt-live.json",{cache:"no-store"});
    if(!r.ok)return;
    const d=await r.json();
    let changed=false;
    (STREAMERS.youtube||[]).forEach(s=>{
      const st=d[s.channelId]||{};
      const was=!!s.live, now=!!st.live;
      if(was!==now){ s.live=now; changed=true; }
      if(st.videoId&&s.ytVideoId!==st.videoId){ s.ytVideoId=st.videoId; changed=true; }
      // a newly arrived replay id is a change too: the first fill may
      // have painted before this poll landed (dead first slide on
      // every cold entry) — restack so the replay actually paints
      if(st.latestVideoId&&s.ytLatestId!==st.latestVideoId){ s.ytLatestId=st.latestVideoId; s.ytLatestTitle=st.latestTitle||""; changed=true; }
      // the last-5 rotation list (his order 2026-10-14)
      if(st.recentIds&&st.recentIds.length&&JSON.stringify(s.ytRecent||[])!==JSON.stringify(st.recentIds)){ s.ytRecent=st.recentIds.slice(0,5); s.ytRecentTitles=st.recentTitles||[]; changed=true; }
    });
    if(changed&&curView==="streaming")restackStreams();
  }catch(e){}
}
async function pollKickLive(){
  if(curView!=="streaming"||!STREAMERS.kick.length)return;
  const changed=await Promise.all(STREAMERS.kick.map(kickRefreshOne));
  if(curView==="streaming"&&changed.some(Boolean))restackStreams();
}
let ytPollTimer=null;
function startStreamPoll(){
  stopStreamPoll();
  streamPollTimer=setInterval(pollKickLive,60000);
  pollYtLive(); ytPollTimer=setInterval(pollYtLive,600000);
}
function stopStreamPoll(){
  if(streamPollTimer){clearInterval(streamPollTimer);streamPollTimer=null;}
  if(ytPollTimer){clearInterval(ytPollTimer);ytPollTimer=null;}
}
function sstreamAdvance(dir){
  const stage=$("#sstreamStage"), track=$("#sstreamTrack");
  if(!stage||!track||ssnapAnim)return;
  const H=stage.clientHeight;
  if(dir>0){
    if(sstreamPos>=sstreamStack.length-1){
      track.classList.add("anim");track.style.transform="";
      setTimeout(()=>track.classList.remove("anim"),330);return;
    }
    sstreamPos++;
    ssnapAnim=true;track.classList.add("anim");
    track.style.transform=`translateY(${-H}px)`;
    setTimeout(()=>sstreamCommit(1),330);
  }else{
    if(sstreamPos<=0){
      track.classList.add("anim");track.style.transform="";
      setTimeout(()=>track.classList.remove("anim"),330);return;
    }
    sstreamPos--;
    ssnapAnim=true;track.classList.add("anim");
    track.style.transform=`translateY(${H}px)`;
    setTimeout(()=>sstreamCommit(-1),330);
  }
}
function sstreamCommit(dir){
  const track=$("#sstreamTrack");
  track.classList.remove("anim");track.style.transform="";
  const [nP,nC,nN]=sstreamSlots;
  if(dir>0){ sstreamSlots=[nC,nN,nP]; }else{ sstreamSlots=[nN,nP,nC]; }
  sstreamFill(sstreamSlots[1],sstreamStack[sstreamPos],"current");
  sstreamFill(sstreamSlots[0],sstreamStack[sstreamPos-1]||null,sstreamStack[sstreamPos-1]?"unload":"blank");
  sstreamFill(sstreamSlots[2],sstreamStack[sstreamPos+1]||null,sstreamStack[sstreamPos+1]?"unload":"blank");
  sstreamLayout();
  ssnapAnim=false;
}
function sstreamToggleSound(){
  // RETIRED (his order 2026-10-14): no tap-to-mute/unmute in the
  // Streaming tab — streams play with sound automatically, always.
}
function stopStreamFeed(){
  stopStreamPoll();
  sstreamSlots.forEach(n=>{ if(n._ssPlayer){ try{ n._ssPlayer.destroy(); }catch(e){} n._ssPlayer=null; } const f=n.querySelector("[data-sframe]"); if(f){
    // explicitly pause + unload every <video> BEFORE removing — innerHTML="" alone lets audio leak in WebView
    f.querySelectorAll("video").forEach(v=>{ try{ v.pause(); v.removeAttribute("src"); v.load(); }catch(e){} });
    f.innerHTML="";
  }});
}
async function mountStreamFeed(){
  document.body.classList.add("feedfull");
  const v=$("#view-streaming");
  // 1. Build the 3-slot stage IMMEDIATELY — never await network for DOM.
  if(!sstreamMounted){
    sstreamMounted=true;
    v.innerHTML=`<div class="feedstage" id="sstreamStage"><div id="sstreamTrack"></div></div>`;
    const track=$("#sstreamTrack"), stage=$("#sstreamStage");
    for(let i=0;i<3;i++){
      const d=document.createElement("div");
      d.className="slide";d.innerHTML=sstreamSlideHTML();
      track.appendChild(d);sstreamSlots.push(d);
    }
    sstreamLayout();
    const onStart=(x,y)=>{
      if(ssnapAnim||sdragging)return false;
      sdragging=true;sdragDy=0;smovedPx=0;sdragX0=x;sdragY0=y;sdragT0=Date.now();
      svelSamples=[{y,t:Date.now()}];track.classList.remove("anim");return true;
    };
    const onMove=(x,y)=>{
      if(!sdragging)return;
      sdragDy=y-sdragY0;smovedPx=Math.max(smovedPx,Math.abs(sdragDy),Math.abs(x-sdragX0));
      svelSamples.push({y,t:Date.now()});if(svelSamples.length>6)svelSamples.shift();
      track.style.transform=`translateY(${sdragDy}px)`;
    };
    const onEnd=()=>{
      if(!sdragging)return;sdragging=false;
      const dt=Date.now()-sdragT0,H=stage.clientHeight;
      let vel=0;
      if(svelSamples.length>=2){
        const a=svelSamples[0],b=svelSamples[svelSamples.length-1];
        vel=(b.y-a.y)/Math.max(1,b.t-a.t);
      }
      if(smovedPx<10&&dt<300){
        track.style.transform="";
        ssuppressClick=true;setTimeout(()=>ssuppressClick=false,500);
        return; // taps never mute/unmute here (his order 2026-10-14): the stream plays with sound on its own
      }
      ssuppressClick=true;setTimeout(()=>ssuppressClick=false,500);
      if(sdragDy<-H*0.25||vel<-0.45)sstreamAdvance(1);
      else if(sdragDy>H*0.25||vel>0.45)sstreamAdvance(-1);
      else{track.classList.add("anim");track.style.transform="";
        setTimeout(()=>track.classList.remove("anim"),340);}
    };
    stage.addEventListener("touchstart",e=>{onStart(e.touches[0].clientX,e.touches[0].clientY)},{passive:true});
    stage.addEventListener("touchmove",e=>{
      if(!sdragging)return;
      if(window.__evNative&&document.body.classList.contains("ev-mode")){
        // EVERYTHING HUB: sideways belongs to the hub's native track.
        // Yield WITHOUT preventDefault (a canceled move kills the
        // browser's scroll before it starts — that froze the hub
        // dead on this stage). Vertical stays this pager's own.
        const dx=e.touches[0].clientX-sdragX0, dyy=e.touches[0].clientY-sdragY0;
        if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dyy)*1.2){ sdragging=false; track.style.transform=""; return; }
        if(Math.abs(dx)<12&&Math.abs(dyy)<12)return;
      }
      onMove(e.touches[0].clientX,e.touches[0].clientY);
      if(e.cancelable)e.preventDefault();
    },{passive:false});
    stage.addEventListener("touchend",()=>{sskipMouseUntil=Date.now()+600;onEnd()});
    stage.addEventListener("touchcancel",()=>{sskipMouseUntil=Date.now()+600;sdragging=false;track.classList.add("anim");track.style.transform="";setTimeout(()=>track.classList.remove("anim"),340)});
    stage.addEventListener("mousedown",e=>{if(e.button!==0||Date.now()<sskipMouseUntil)return;onStart(e.clientX,e.clientY)});
    window.addEventListener("mousemove",e=>{if(sdragging)onMove(e.clientX,e.clientY)});
    window.addEventListener("mouseup",()=>{if(sdragging)onEnd()});
    document.addEventListener("keydown",e=>{
      if(curView!=="streaming")return;
      if(e.key==="ArrowUp")sstreamAdvance(1);
      if(e.key==="ArrowDown")sstreamAdvance(-1);
    });
  }
  // 2. Fill from cache instantly if present; otherwise skeleton while it loads.
  const sfill=()=>{
    const list=sstreamList();
    if(!list.length)return false;
    sstreamStack=list;
    sstreamPos=0;
    sstreamFill(sstreamSlots[1],sstreamStack[0],"current");
    sstreamFill(sstreamSlots[0],null,"blank");
    sstreamFill(sstreamSlots[2],sstreamStack[1]||null,sstreamStack[1]?"unload":"blank");
    sstreamLayout();
    return true;
  };
  if(!sfill()){
    sstreamFill(sstreamSlots[1],null,"blank");
    const nm=sstreamSlots[1].querySelector("[data-s-name]");
    if(nm)nm.textContent="Loading streams…";
  }
  startStreamPoll();
  // 3. Data loads in background; fill + live-refresh when it arrives.
  loadStreamers().then(()=>{
    refreshStreamersLive(); // fire-and-forget: live badges + replays refresh in background
    // the mount-time poll can fire before the directory loads (empty
    // STREAMERS.youtube -> no-op) and the next poll is 10 min out:
    // poll again now that the directory exists, or the pinned replay
    // never paints on a cold entry
    try{ pollYtLive(); }catch(e){}
    if(curView!=="streaming")return;
    if(!sfill()){
      document.body.classList.remove("feedfull");
      v.innerHTML=`<div class="wrap"><div class="sempty" style="grid-column:1/-1">No streamers yet — check back soon.</div></div>`;
      sstreamMounted=false; sstreamSlots.length=0;
    }
  });
}
async function renderStreaming(){ await mountStreamFeed(); }
