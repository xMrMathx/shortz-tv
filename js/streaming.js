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
  const before=!!s.live, beforeThumb=s.thumb||"";
  return Promise.race([
    fetch("https://kick.com/api/v1/channels/"+encodeURIComponent(ch),{cache:"no-store"}),
    kickFetchTimeout(4000)
  ])
    .then(r=>r.ok?r.json():null)
    .then(d=>{
      if(!d)return false;
      const pic=d.user&&d.user.profile_pic; if(pic&&!s.avatar)s.avatar=pic;
      const ls=d.livestream||null;
      s.live=!!ls;
      if(ls){ s.title=ls.session_title||s.title; s.viewers=ls.viewer_count!=null?String(ls.viewer_count):s.viewers;
        const lt=ssPickThumb(ls.thumbnail)||ssPickThumb(ls.thumbnail_url); if(lt)s.thumb=lt;
        return ((!!s.live)!==before)||((s.thumb||"")!==beforeThumb); }
      if(!s.vod_id||!s.thumb)return kickFetchVod(s).then(changed=>changed||((!!s.live)!==before));
      return ((!!s.live)!==before)||((s.thumb||"")!==beforeThumb);
    }).catch(()=>false);
}
/* most recent offline VOD for a Kick channel */
function kickFetchVod(s){
  const ch=String(s.url||"").split("/").filter(Boolean).pop();
  if(!ch)return Promise.resolve(false);
  const beforeId=s.vod_id||null, beforeThumb=s.thumb||"";
  return Promise.race([
    fetch("https://kick.com/api/v2/channels/"+encodeURIComponent(ch)+"/videos",{cache:"no-store"}),
    kickFetchTimeout(4000)
  ])
    .then(r=>r.ok?r.json():null)
    .then(vids=>{
      if(!vids||!vids.length)return false;
      const q=vids.filter(v=>!v.is_live).slice(0,5).map(v=>({id:v.id,title:v.session_title||"",hls:v.source||"",thumb:ssPickThumb(v.thumbnail)}));
      if(!q.length){ const v0=vids[0]; q.push({id:v0.id,title:v0.session_title||"",hls:v0.source||"",thumb:ssPickThumb(v0.thumbnail)}); }
      s.vodQueue=q;
      const vod=q[0];
      s.vod_id=vod.id;
      s.vod_title=vod.title;
      s.vod_hls=vod.hls; // direct HLS URL — play in <video> tag, bypasses Kick player
      if(vod.thumb)s.thumb=vod.thumb; // the card's cover art = the thumbnail of the video it will play
      return (s.vod_id!==beforeId)||((s.thumb||"")!==beforeThumb);
    }).catch(()=>false);
}
// Twitch VOD via public GraphQL (no auth needed) — resolves true when VOD data changed
function twitchFetchVod(s){
  const ch=String(s.url||"").split("/").filter(Boolean).pop();
  if(!ch)return Promise.resolve(false);
  const before=s.vod_id||null, beforeThumb=s.thumb||"";
  return Promise.race([
    fetch("https://gql.twitch.tv/gql",{
      method:"POST",
      headers:{"Client-ID":"kimne78kx3ncx6brgo4mv6wki5h1ko","Content-Type":"application/json"},
      body:JSON.stringify({query:"query($login:String!){user(login:$login){profileImageURL(width:300) videos(first:5){edges{node{id title previewThumbnailURL}}}}}","variables":{login:ch.toLowerCase()}})
    }),
    kickFetchTimeout(4000)
  ])
    .then(r=>r.ok?r.json():null)
    .then(d=>{
      const edges=(d&&d.data&&d.data.user&&d.data.user.videos&&d.data.user.videos.edges)||[];
      if(!edges.length){ if(d&&d.data&&d.data.user&&d.data.user.profileImageURL&&!s.thumb)s.thumb=d.data.user.profileImageURL; return (s.thumb||"")!==beforeThumb; }
      // his rotation (2026-10-14): the 5 most recent VODs, back to
      // back, then loop — HLS resolves lazily per VOD (see ssVodWire)
      s.vodQueue=edges.slice(0,5).map(e=>({id:String(e.node.id),vid:"v"+e.node.id,title:e.node.title||"",hls:""}));
      const pt=(edges[0].node.previewThumbnailURL||"").replace(/%{width}/g,"640").replace(/%{height}/g,"360").replace("{width}","640").replace("{height}","360");
      if(pt)s.thumb=pt;
      else if(d&&d.data&&d.data.user&&d.data.user.profileImageURL)s.thumb=d.data.user.profileImageURL;
      const edge=edges[0];
      const nid="v"+edge.node.id; // Twitch VOD IDs need "v" prefix
      const changed=(nid!==before)||((edge.node.title||"")!==(s.vod_title||""))||((s.thumb||"")!==beforeThumb);
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
            if(u&&seen.has(u))return;
            /* stub rows (name-only, from the Stakes-era adds) have no
               url for `seen` to match — heal them BY NAME from the
               directory instead of pushing a duplicate card: the
               baked url/avatar/thumb/vod fields fill the stub in
               place, so a phone carrying the old cache converges
               on the full directory with art, no cache-clear needed */
            const stub=(STREAMERS[p]||[]).find(x=>!x.url&&String(x.name||"").toLowerCase()===String(s.name||"").toLowerCase());
            if(stub){
              ["url","avatar","thumb","vod_id","vod_title","vod_hls","category","followers"].forEach(f=>{ if(s[f]&&!stub[f])stub[f]=s[f]; });
              if(u)seen.add(u);
              addedNew=true;
              return;
            }
            if(u){ seen.add(u); (STREAMERS[p]=STREAMERS[p]||[]).push(s); addedNew=true; }
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
  // pinned first (Mr. Moore's favorites), then a FEATURED live event
  // (the Delta Force tournament — his "push them" order, 2026-10-15: a
  // featured stream that is live outranks every other live streamer, so
  // the tournament sits directly under the pin), then LIVE, then playable
  out.sort((a,b)=>((b.pinned?1:0)-(a.pinned?1:0))||(((b.featured&&b.live)?1:0)-((a.featured&&a.live)?1:0))||((b.live?1:0)-(a.live?1:0))||((sstreamPlayable(b)?1:0)-(sstreamPlayable(a)?1:0)));
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
let sstreamStack=[], sstreamPos=-1, sstreamMounted=false;
let sdragging=false, sdragDy=0, sdragX0=0, sdragY0=0, sdragT0=0, smovedPx=0, sdragYielded=false, sdragCommitted=false;
let svelSamples=[], ssnapAnim=false, ssuppressClick=false, sskipMouseUntil=0;
let streamMuted=false, streamPollTimer=null; // streams start WITH SOUND (his law, 2026-10-12) — the APK shell permits audible autoplay; the tap toggle now mutes instead of unmuting
/* ---------- stream sharing: deep link opens inside Shortz VS, never the platform ---------- */
function streamShareId(s){
  if(!s)return"";
  if(s.platform==="youtube")return"youtube:"+(s.channelId||"");
  const slug=String(s.url||"").split("/").filter(Boolean).pop()||s.name||"";
  return(s.platform||"kick")+":"+slug.toLowerCase();
}
function streamShareUrl(s){
  const id=streamShareId(s);
  const plat=id.split(":")[0], part=id.split(":").slice(1).join(":");
  return "https://xmrmathx.github.io/shortz-tv/watch/stream-"+plat+"-"+encodeURIComponent(part)+"/";
}
function shareStream(s){
  if(!s)return;
  const url=streamShareUrl(s); // the streamer's own share page — its preview IS his cover art (his order 2026-10-14), not the site's default card
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
/* jump the card feed to a shared streamer id (platform:slug):
   scroll his card to the center and make it the playing one */
function sstreamJumpTo(id){
  if(!id||!sstreamStack.length)return false;
  const idx=sstreamStack.findIndex(x=>streamShareId(x)===id);
  if(idx<0)return false;
  const card=ssCards[idx];
  if(card)card.scrollIntoView({block:"center"});
  ssActivate(idx);
  return true;
}
function ssCardHTML(){
  return `<div class="sscard-stage"><div class="sscard-frame" data-sframe></div><div class="ssbar" data-sbar><div class="ssbar-rail"><div class="ssbar-fill" data-sbarfill></div></div><span class="ssbar-time" data-sbartime></span></div></div>
  <div class="sscard-ov" data-sov>
    <div class="sscard-top"><span data-s-live></span><span class="sstream-plat" data-s-plat></span><button class="sstream-sharebtn" data-s-share title="Share this stream">↗ Share</button></div>
    <div class="sscard-name" data-s-name></div>
    <div class="sscard-title" data-s-title></div>
    <div class="sscard-meta" data-s-meta></div>
    <span data-s-sound style="display:none"></span>
  </div>`;
}
/* card posters (his order 2026-10-14): a card is NEVER blank —
   every streamer shows a thumbnail until his card scrolls into
   play, and the poster stays up while the player loads */
function ssPickThumb(t){
  if(!t)return "";
  if(typeof t==="string")return t;
  return t.src||t.url||"";
}
function ssThumb(s){
  if(!s)return "";
  if(s.platform==="youtube"){
    const id=s.live&&s.ytVideoId?s.ytVideoId:(s.ytLatestId||(s.ytRecent&&s.ytRecent[0])||null);
    if(id)return "https://i.ytimg.com/vi/"+encodeURIComponent(id)+"/hqdefault.jpg";
  }
  return s.thumb||s.avatar||"";
}
function ssPosterHTML(s){
  const initial=esc(((s&&s.name)||"?").charAt(0).toUpperCase()||"?");
  const plat=s&&s.platform?s.platform:"stream";
  const ph=`<div class="ssposter ssposter-ph ssposter-${plat}"><span>${initial}</span></div>`;
  const t=ssThumb(s);
  if(!t)return ph;
  return ph+`<img class="ssposter" src="${esc(t)}" alt="" loading="lazy" onerror="this.remove()">`;
}
/* ---------- the replay play bar (his order 2026-10-14) ----------
   A replay gets a scrub bar at the bottom of its card: drag to
   skip forward or rewind. Live gets none — you can't skip live.
   One ticker per playing card drives it, whichever engine is
   underneath (YouTube API player or a native VOD <video>). */
function ssBarReset(node){
  if(node._ssBarT){ clearInterval(node._ssBarT); node._ssBarT=null; }
  const bar=node.querySelector("[data-sbar]"); if(bar)bar.classList.remove("on");
}
function ssBarArm(node,s){
  ssBarReset(node);
  if(!s||s.live)return; // live: no bar, ever
  const bar=node.querySelector("[data-sbar]"), fill=node.querySelector("[data-sbarfill]"), tlab=node.querySelector("[data-sbartime]");
  if(!bar)return;
  const engine=()=>{
    if(node._ssPlayer&&node._ssPlayer.getCurrentTime)return {get:()=>({t:node._ssPlayer.getCurrentTime()||0,d:node._ssPlayer.getDuration()||0}),seek:f=>{ try{ node._ssPlayer.seekTo(f*(node._ssPlayer.getDuration()||0),true); }catch(e){} }};
    const vid=node.querySelector("[data-sframe] video");
    if(vid)return {get:()=>({t:vid.currentTime||0,d:vid.duration||0}),seek:f=>{ if(vid.duration)vid.currentTime=f*vid.duration; }};
    return null;
  };
  const fmt=x=>{ if(!isFinite(x))return "--:--"; x=Math.max(0,Math.floor(x||0)); const h=Math.floor(x/3600), m=Math.floor((x%3600)/60), ss=x%60; return (h?h+":":"")+(h&&m<10?"0":"")+m+":"+(ss<10?"0":"")+ss; };
  let shown=false;
  node._ssBarT=setInterval(()=>{
    if(!node.isConnected){ ssBarReset(node); return; }
    const e=engine(); if(!e)return;
    const g=e.get();
    if(g.d>0&&isFinite(g.d)){
      if(!shown){ shown=true; bar.classList.add("on"); }
      fill.style.width=Math.min(100,(g.t/g.d)*100)+"%";
      tlab.textContent=fmt(g.t)+" / "+fmt(g.d);
    }
  },500);
  if(!bar._ssWired){
    bar._ssWired=true;
    let drag=false;
    const frac=ev=>{ const r=bar.getBoundingClientRect(); const x=(ev.touches?ev.touches[0].clientX:ev.clientX); return Math.min(1,Math.max(0,(x-r.left)/r.width)); };
    bar.addEventListener("pointerdown",ev=>{ drag=true; try{ bar.setPointerCapture&&bar.setPointerCapture(ev.pointerId); }catch(e){} const card=bar.closest(".sscard"); const eng=card&&card._ssBarLiveEngine; const e2=eng?eng():null; if(e2)e2.seek(frac(ev)); ev.preventDefault(); ev.stopPropagation(); },{passive:false});
    bar.addEventListener("pointermove",ev=>{ if(!drag)return; const card=bar.closest(".sscard"); const eng=card&&card._ssBarLiveEngine; const e2=eng?eng():null; if(e2)e2.seek(frac(ev)); });
    const up=()=>{ drag=false; };
    bar.addEventListener("pointerup",up); bar.addEventListener("pointercancel",up);
  }
  // the ticker's engine, exposed for the bar's own drag handlers
  node._ssBarLiveEngine=engine;
}
function sstreamFill(node,s,mode){
  const fr=node.querySelector("[data-sframe]"), ov=node.querySelector("[data-sov]");
  ssBarReset(node);
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
  if(mode==="unload"){ fr.innerHTML=ssPosterHTML(s); return; }
  fr.innerHTML=ssPosterHTML(s); // poster first — the mount below paints over it, never a black wait
  // nothing playable (offline + no genuine replay): honest card, never a broken "video unavailable" embed
  if(!live&&!replay){
    fr.innerHTML=ssPosterHTML(s)+`<div class="sstream-offline"><div style="font-size:38px">📡</div><div style="font-weight:800;font-size:16px;margin-top:8px">@${esc(s.name||"unknown")} is offline</div><div style="color:#c9c9d2;font-size:13px;margin-top:6px">No recent replay available — check back soon.</div></div>`;
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
  if(mode==="current")ssBarArm(node,s);
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
  box.style.cssText="width:100%;height:100%;position:relative";
  const poster=fr.querySelector(".ssposter"); // keep the thumbnail up while the player loads
  fr.innerHTML=""; if(poster)fr.appendChild(poster); fr.appendChild(box);
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
          onReady:e=>{ node._ssPlayer=player; if(poster)poster.remove(); try{ e.target.unMute(); e.target.setVolume(100); e.target.playVideo(); }catch(_){ } },
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
  const th=ssThumb(s); if(th&&!vid.getAttribute("poster"))vid.setAttribute("poster",th);
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
/* ---------- CARDS (his order 2026-10-14): the Streaming tab is
   a card feed like Home — one card per streamer, scroll up and
   down freely. The card nearest the reading line plays, with
   sound; every other card shows its info over a still frame.
   sstreamFill does all the mounting, as it did for the stage. */
let ssCards=[], ssActiveIdx=-1, ssScrollBound=false, ssScrollRaf=0;
function ssUnloadFrame(node){
  if(!node)return;
  if(node._ssPlayer){ try{ node._ssPlayer.destroy(); }catch(e){} node._ssPlayer=null; }
  const f=node.querySelector("[data-sframe]");
  if(f)f.querySelectorAll("video").forEach(v=>{ try{ v.pause(); v.removeAttribute("src"); v.load(); }catch(e){} });
}
function ssActivate(idx){
  if(idx===ssActiveIdx||idx<0||!ssCards.length)return;
  const old=ssCards[ssActiveIdx];
  if(old&&sstreamStack[ssActiveIdx]){ ssUnloadFrame(old); sstreamFill(old,sstreamStack[ssActiveIdx],"unload"); }
  ssActiveIdx=idx; sstreamPos=idx;
  const card=ssCards[idx];
  if(card&&sstreamStack[idx])sstreamFill(card,sstreamStack[idx],"current");
}
let ssSettleT=null, ssPendingIdx=-1;
function ssPickActive(){
  ssScrollRaf=0;
  if(!ssCards.length)return;
  // the reading line lives in the VIEWPORT — in normal mode the
  // window scrolls this view, in the hub the pane does; card rects
  // are viewport-relative either way, so the math is one and the same
  const vh=window.innerHeight||0, line=vh*0.38;
  let best=-1, bd=1e9;
  ssCards.forEach((c,i)=>{ const r=c.getBoundingClientRect(); if(r.bottom<0||r.top>vh)return; const d=Math.abs((r.top+r.bottom)/2-line); if(d<bd){ bd=d; best=i; } });
  if(best<0)best=0;
  // NEVER swap players mid-scroll (root fix, 2026-10-14): mounting
  // and unmounting iframes under his finger kills the scroll/fling
  // on a real phone — the gesture dies at every card boundary and
  // the list feels nailed down. While the list is moving, NOTHING
  // in the DOM changes; the swap happens once, when the scroll
  // has been settled for a beat — the same discipline the hub
  // learned. Posters carry the eye during the flight.
  ssPendingIdx=best;
  if(ssSettleT)clearTimeout(ssSettleT);
  ssSettleT=setTimeout(()=>{ ssSettleT=null; if(ssPendingIdx>=0)ssActivate(ssPendingIdx); },240);
}
function ssBindScroll(){
  if(ssScrollBound)return; ssScrollBound=true;
  const v=$("#view-streaming"); if(!v)return;
  v.addEventListener("scroll",()=>{ if(!ssScrollRaf)ssScrollRaf=requestAnimationFrame(ssPickActive); },{passive:true});
  window.addEventListener("scroll",()=>{ if(curView==="streaming"&&!ssScrollRaf)ssScrollRaf=requestAnimationFrame(ssPickActive); },{passive:true});
}
function ssBuildCards(){
  const v=$("#view-streaming"); if(!v)return;
  const prevTop=v.scrollTop, prevWin=window.scrollY||0, hadCards=ssCards.length>0;
  ssCards.forEach(ssUnloadFrame);
  v.innerHTML=`<div class="sscards" id="ssCards"></div>`;
  const box=v.querySelector("#ssCards");
  ssCards=sstreamStack.map(st=>{
    const d=document.createElement("article");
    d.className="sscard"; d.innerHTML=ssCardHTML();
    box.appendChild(d);
    return d;
  });
  ssActiveIdx=-1;
  ssCards.forEach((c,i)=>sstreamFill(c,sstreamStack[i],"unload"));
  v.scrollTop=hadCards?prevTop:0;
  if(hadCards&&prevWin)window.scrollTo(0,prevWin);
  ssBindScroll();
  ssPickActive();
}
/* re-sort the feed after live-status changes; the card list
   rebuilds around the same scroll position */
let ssLastSig="";
function ssStackSig(){ return sstreamStack.map(x=>(x.url||"")+"|"+(x.live?1:0)+"|"+(x.vod_id||"")+"|"+(x.ytLatestId||"")+"|"+(x.thumb||"")).join(";;"); }
function restackStreams(){
  if(!sstreamMounted)return;
  sstreamStack=sstreamList();
  if(!sstreamStack.length)return;
  const sig=ssStackSig();
  if(sig===ssLastSig&&ssCards.length)return; // nothing real changed — a rebuild here only murders scrolls
  ssLastSig=sig;
  ssBuildCards();
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
function sstreamToggleSound(){
  // RETIRED (his order 2026-10-14): no tap-to-mute/unmute in the
  // Streaming tab — streams play with sound automatically, always.
}
function stopStreamFeed(){
  stopStreamPoll();
  ssCards.forEach(n=>{ ssUnloadFrame(n); const f=n.querySelector("[data-sframe]"); if(f)f.innerHTML=""; });
}
async function mountStreamFeed(){
  document.body.classList.remove("feedfull"); // a scrolling card feed now, not the fullscreen stage
  const v=$("#view-streaming");
  sstreamMounted=true;
  const sfill=()=>{
    const list=sstreamList();
    if(!list.length)return false;
    sstreamStack=list;
    ssLastSig=ssStackSig();
    ssBuildCards();
    return true;
  };
  if(!sfill()){
    v.innerHTML=`<div class="sscards"><div class="sscard"><div class="sscard-ov"><div class="sscard-name">Loading streams…</div></div></div></div>`;
  }
  startStreamPoll();
  // Data loads in background; rebuild + live-refresh when it arrives.
  loadStreamers().then(()=>{
    refreshStreamersLive(); // fire-and-forget: live badges + replays refresh in background
    // the mount-time poll can fire before the directory loads (empty
    // STREAMERS.youtube -> no-op) and the next poll is 10 min out:
    // poll again now that the directory exists, or the pinned replay
    // never paints on a cold entry
    try{ pollYtLive(); }catch(e){}
    if(curView!=="streaming")return;
    if(!sfill()){
      v.innerHTML=`<div class="wrap"><div class="sempty" style="grid-column:1/-1">No streamers yet — check back soon.</div></div>`;
      sstreamMounted=false; ssCards=[];
    }
  });
}
async function renderStreaming(){ await mountStreamFeed(); }
