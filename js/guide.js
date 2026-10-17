/* ---------- TV Guide (Profile): classic guide — preview player + full channel list ----------
   Tap a row → it plays in the preview box. Tap the preview → fullscreen.
   Scrolling the list plays the row most in view in the (sticky) preview box —
   WITH SOUND (his order). Sound-on is the design default everywhere in the
   guide; a muted start + Unmute button appears ONLY if the platform refuses
   an audible start. */
let tgList=null, tgShown=0, tgQuery="";
const TG_CHUNK=60;
/* Fisher-Yates shuffle (in place, returns the array) */
function svShuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
/* This visit's shuffled catalog order (ids). Built ONLY when the guide is
   entered (renderTvGuide) — his order: fresh every time he goes to the
   guide, never reshuffled mid-visit, so rows never move under his finger. */
let tgOrder=null;
function tgEmbed(t,muted){
  // sound-on by spec (mute=0); muted is only the platform-refusal fallback
  const u=t.url||"";
  if(u.indexOf("vimeo.com")>=0){
    const m=u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return m?"https://player.vimeo.com/video/"+m[1]+"?autoplay=1&muted="+(muted?1:0)+"&title=0&byline=0&portrait=0":"";
  }
  const id=ytId(u); if(!id)return "";
  return "https://www.youtube.com/embed/"+id+"?autoplay=1&mute="+(muted?1:0)+"&rel=0&playsinline=1&modestbranding=1&vq=hd1080&controls=0&disablekb=1&fs=0&enablejsapi=1";
}
function tgRowHTML(t){
  const sm=thumb(t,"mq");
  return `<div class="tg-row" data-id="${t.id}">
    <img class="tg-rt" loading="lazy" src="${sm}" alt="" onerror="this.style.display='none'">
    <div style="flex:1;min-width:0"><div class="tg-rtitle">${esc(t.title)}</div>
    <div class="tg-rsub">${esc(t.genre||"")} · ${esc(t.eps||"")}</div></div>
    <span class="tg-rplay">▶</span></div>`;
}
function tgFiltered(){
  const raw=tgQuery.trim(), q=searchNorm(tgQuery), qf=q.replace(/ /g,"");
  if(!tgOrder)tgOrder=svShuffle(C.map(t=>t.id)); // first use builds the visit order
  const match=t=>!raw||searchMatch((t.title||"")+" "+(t.genre||""),q,qf);
  const seen=new Set(), out=[];
  // the visit's fresh order is the list; search narrows FROM it, never re-sorts
  tgOrder.forEach(id=>{ const t=byId(id); if(t&&match(t)){ out.push(t); seen.add(id); } });
  // titles spliced into C mid-visit (background catalog refresh) append after
  // the visit order, in catalog order — existing rows never jump
  C.forEach(t=>{ if(t&&!seen.has(t.id)&&match(t))out.push(t); });
  return out;
}
function tgMore(){
  const box=$("#tgList"); if(!box||!tgList)return;
  const next=Math.min(tgList.length,tgShown+TG_CHUNK);
  if(next<=tgShown)return;
  const frag=document.createElement("div");
  frag.innerHTML=tgList.slice(tgShown,next).map(tgRowHTML).join("");
  while(frag.firstChild)box.appendChild(frag.firstChild);
  tgShown=next;
  box.querySelectorAll(".tg-row").forEach(r=>{
    if(r._tg)return; r._tg=true;
    r.onclick=()=>tgPreview(r.dataset.id);
  });
}
function tgPreview(id,_skip){
  const t=byId(id); if(!t)return;
  tgHideUnmute();
  document.querySelectorAll("#tgList .tg-row").forEach(r=>r.classList.toggle("sel",r.dataset.id===id));
  const fr=$("#tgFrame"); if(!fr)return;
  const url=tgEmbed(t);
  const th=thumb(t,"hq");
  $("#tgTitle").textContent=t.title||"";
  $("#tgSub").textContent=`${t.genre||""} · ${t.eps||""}${t.runtime?" · "+t.runtime:""}`;
  const im=$("#tgThumb"); if(im){im.src=th;im.style.display=th?"":"none";}
  const ph=$("#tgPh"); if(ph)ph.style.display="none";
  // Claim the preview box BEFORE arming the end/sound handlers: tgArmEnd's
  // player guard compares its token against pv._tid, and with the YT API
  // already loaded its mk() runs synchronously — arming first meant the
  // guard saw the PREVIOUS preview's id and bailed, so no YT.Player (no
  // ENDED handler, no sound arm) was ever attached. That ordering bug is
  // the root cause of the guide's dead auto-advance; the Vimeo leg only
  // worked because its arm defers through a promise.
  fr._tid=t.id;
  const pv=$("#tgPreviewBox"); if(pv)pv._tid=t.id;
  if(url){fr.innerHTML=`<iframe src="${url}" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;tgArmEnd(t);}
  else if(isArchiveUrl(t.url)){
    // archive.org titles (11,144 in the catalog) have no embed iframe —
    // tgEmbed returns "" and the preview box sat BLACK (his report,
    // 2026-10-14). Play the direct MP4 in a <video>, the Home cards'
    // pattern: sound on, muted retry + Unmute if refused, next on end.
    tgWatchEnd();
    fr.innerHTML="";
    const v=document.createElement("video");
    v.setAttribute("playsinline",""); v.setAttribute("preload","auto");
    v.style.cssText="width:100%;height:100%;object-fit:contain;background:#000;display:block";
    v.src=t.url;
    fr.appendChild(v);
    tgPlayerKind="archive"; tgPlayer=makeArchivePlayer(v);
    const tok=t.id;
    v.addEventListener("ended",()=>{
      const pv2=$("#tgPreviewBox"); if(!pv2||pv2._tid!==tok)return;
      const now=Date.now(); if(now-tgAdvanceAt<5000)return; tgAdvanceAt=now; tgNext();
    });
    try{ const p=v.play(); if(p&&p.catch)p.catch(()=>{ try{ v.muted=true; const p2=v.play(); if(p2&&p2.catch)p2.catch(()=>{}); tgShowUnmute(); }catch(e){} }); }catch(e){}
  }
  else if((_skip||0)<8&&tgList&&tgList.length>1){
    // no playable source at all — never leave a dead black box:
    // step to the next title in the guide (bounded)
    const i=tgList.findIndex(x=>x.id===t.id);
    if(i>=0){ tgPreview(tgList[(i+1)%tgList.length].id,(_skip||0)+1); return; }
  }
  const wb2=$("#tgWatch"); if(wb2)wb2.style.display="";
}
/* entry hook for go(): tab entry renders BEFORE curView flips, so
   the render above correctly stays silent; go() calls this once
   Profile is actually current and starts the preview then. */
window.__tgStartGuide=function(){ try{ const fr=$("#tgFrame"); if(fr&&!fr.querySelector("iframe,video")&&typeof tgList!=="undefined"&&tgList&&tgList.length)tgPreview(tgList[0].id); }catch(e){} };
function tgPause(){
  const fr=$("#tgFrame");
  if(fr){fr.innerHTML="";fr._tid=null;}
  tgWatchEnd();
  tgHideUnmute();
}
/* one-audio law (his report 2026-10-17: guide audio layered under other
   pages after a tab switch): the guide preview plays WITH SOUND by his
   order, so it must cut when the tab hides — same stop/recompute pair
   the Home feed uses (cfStopPreview/cfRecompute). */
document.addEventListener("visibilitychange",()=>{ if(document.hidden){ try{tgPause();}catch(e){} } else if(typeof curView!=="undefined"&&curView==="profile"){ try{ if(window.__tgStartGuide)window.__tgStartGuide(); }catch(e){} } });
/* ---------- guide sound: previews play WITH SOUND (his order) ----------
   tgEmbed requests an audible start; the APK shell permits it
   (setMediaPlaybackRequiresUserGesture(false) in MainActivity). If a browser
   still refuses, the preview starts muted and the Unmute button shows —
   never a dead/paused preview. */
function tgShowUnmute(){ const b=$("#tgUnmute"); if(b)b.style.display=""; }
function tgHideUnmute(){ const b=$("#tgUnmute"); if(b)b.style.display="none"; }
function tgUnmuteNow(){
  tgHideUnmute();
  try{
    if(tgPlayerKind==="yt"&&tgPlayer){ tgPlayer.unMute(); tgPlayer.setVolume(100); tgPlayer.playVideo(); return; }
    if(tgPlayerKind==="vm"&&tgPlayer){ tgPlayer.setVolume(1); tgPlayer.play(); return; }
    if(tgPlayerKind==="archive"&&tgPlayer){ tgPlayer.unMute(); tgPlayer.setVolume(100); tgPlayer.playVideo(); return; }
  }catch(e){}
  const fr=document.querySelector("#tgFrame iframe");
  if(fr&&fr.contentWindow){
    try{
      fr.contentWindow.postMessage(JSON.stringify({event:"command",func:"setVolume",args:[100]}),"*");
      fr.contentWindow.postMessage(JSON.stringify({event:"command",func:"unMute",args:""}),"*");
      fr.contentWindow.postMessage(JSON.stringify({event:"command",func:"playVideo",args:""}),"*");
    }catch(e){}
  }
}
function tgSoundArm(kind,player,token){
  tgHideUnmute();
  const stillMine=()=>{ const pv=$("#tgPreviewBox"); return pv&&pv._tid===token; };
  try{
    if(kind==="yt"){ player.unMute(); player.setVolume(100); player.playVideo(); }
    else if(kind==="vm"){ player.setVolume(1); const p=player.play(); if(p&&p.catch)p.catch(()=>{}); }
  }catch(e){}
  setTimeout(()=>{
    if(!stillMine())return;
    try{
      if(kind==="yt"){
        const st=player.getPlayerState();
        if(st!==1&&st!==3){ try{ player.mute(); player.playVideo(); }catch(e){} tgShowUnmute(); }
      }else if(kind==="vm"){
        player.getPaused().then(paused=>{
          if(paused&&stillMine()){ try{ player.setVolume(0); const p2=player.play(); if(p2&&p2.catch)p2.catch(()=>{}); }catch(e){} tgShowUnmute(); }
        }).catch(()=>{});
      }
    }catch(e){}
  },1800);
}
/* ---------- guide preview switching: CLICK or natural END only (his law) ----------
   Scrolling the guide must NEVER start, switch or re-arm the preview. An
   earlier scroll-play observer did exactly that — the row nearest screen
   center hijacked the preview mid-scroll — and he ordered it out. The
   preview now changes only on a row tap (tgPreview via onclick) or when
   the playing video ends (tgArmEnd → tgNext below). */
/* Shortz VS Guide auto-advance: when the preview video ends, play the next row */
let tgPlayer=null, tgPlayerKind=null, tgAdvanceAt=0;
function tgWatchEnd(){
  try{
    if(tgPlayerKind==="yt"&&tgPlayer&&tgPlayer.destroy)tgPlayer.destroy();
    else if(tgPlayerKind==="vm"&&tgPlayer&&tgPlayer.unload)tgPlayer.unload();
  }catch(e){}
  tgPlayer=null; tgPlayerKind=null;
}
function tgNext(){
  if(!tgList||!tgList.length)return;
  const pv=$("#tgPreviewBox");
  const cur=pv&&pv._tid;
  let i=tgList.findIndex(t=>t.id===cur);
  i=(i+1)%tgList.length; // loop back to the top at the end
  tgPreview(tgList[i].id);
  try{
    // keep the playing row in view ONLY while he is actually at the
    // guide — an auto-advance must never yank the page away from his
    // folders, his lists, or an open folder (his order).
    const pv=$("#tgPreviewBox");
    const r=pv&&pv.getBoundingClientRect();
    const atGuide=r&&r.bottom>0&&r.top<(window.innerHeight||0)&&!document.querySelector("#vfOpen.open");
    if(atGuide){
      const row=document.querySelector('#tgList .tg-row[data-id="'+tgList[i].id+'"]');
      if(row)row.scrollIntoView({block:"nearest",behavior:"smooth"});
    }
  }catch(e){}
}
function tgArmEnd(t){
  tgWatchEnd();
  const fr=$("#tgFrame"); if(!fr)return;
  const iframe=fr.querySelector("iframe"); if(!iframe)return;
  const token=t.id; // only the latest preview may trigger the advance
  const fire=()=>{
    const pv=$("#tgPreviewBox");
    if(!pv||pv._tid!==token)return;
    const fr2=$("#tgFrame");
    if(!fr2||!fr2.querySelector("iframe,video"))return; // a paused guide is REMEMBERED, not alive: a stale ENDED from its orphaned player must not resurrect it over whatever silenced it
    const now=Date.now();
    if(now-tgAdvanceAt<5000)return; // same dedup as the main feed
    tgAdvanceAt=now;
    tgNext();
  };
  const u=t.url||"";
  if(u.indexOf("vimeo.com")>=0){
    const ready=(window.Vimeo&&window.Vimeo.Player)
      ? Promise.resolve()
      : new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://player.vimeo.com/api/player.js";s.onload=res;s.onerror=rej;document.head.appendChild(s);});
    ready.then(()=>{try{
      if(token!==($("#tgPreviewBox")||{})._tid)return;
      tgPlayerKind="vm"; tgPlayer=new Vimeo.Player(iframe);
      tgPlayer.on("ended",fire);
      tgSoundArm("vm",tgPlayer,token);
    }catch(e){}}).catch(()=>{});
  }else{
    const mk=()=>{try{
      if(token!==($("#tgPreviewBox")||{})._tid)return;
      tgPlayerKind="yt";
      tgPlayer=new YT.Player(iframe,{events:{onReady:(e)=>{ tgSoundArm("yt",e.target,token); },onStateChange:(e)=>{if(e.data===0)fire();}}});
    }catch(e){}};
    if(window.YT&&window.YT.Player)mk(); else ensureYT(mk);
  }
}
function renderTvGuide(){
  const box=$("#tvGuide"); if(!box)return;
  tgQuery=""; tgShown=0;
  tgOrder=svShuffle(C.map(t=>t.id)); // fresh order on EVERY entry (his order)
  tgList=tgFiltered();
  box.innerHTML=`
    <div class="tg-preview" id="tgPreviewBox" title="Tap to watch fullscreen">
      <div class="tg-frame" id="tgFrame">
        <div class="tg-ph" id="tgPh"><span style="font-size:30px">📺</span><span>Tap a show below to preview it here</span></div>
        <div class="uprog"><i id="tgProg"></i></div>
      </div>
      <button id="tgUnmute" style="display:none;position:absolute;top:10px;right:10px;z-index:6;background:rgba(5,5,10,.85);color:#fff;border:1px solid rgba(255,255,255,.35);font-size:12.5px;font-weight:800;padding:8px 14px;border-radius:999px;cursor:pointer">🔊 Unmute</button>
      <div class="tg-meta">
        <img class="tg-thumb" id="tgThumb" alt="" style="display:none" onerror="this.style.display='none'">
        <div style="flex:1;min-width:0"><div class="tg-title" id="tgTitle">Shortz VS Guide</div>
        <div class="tg-sub" id="tgSub">${C.length} shows · tap one to preview</div></div>
        <button class="btn-play tg-watch" id="tgWatch" style="display:none">▶ Watch</button>
      </div>
    </div>
    <div class="searchbar"><input id="tgSearch" type="text" placeholder="🔍 Search the guide…" autocomplete="off" enterkeyhint="search"></div>
    <div id="tgHL"></div>
    <div id="tgScore"></div>
    <div id="tgList"></div>
    <div id="tgEmpty" class="empty" style="display:none">No shows found.</div>`;
  tgMore();
  // preview the first show so the box isn't empty — ONLY when
  // Profile is truly the current screen. A build that happens
  // off-screen (swipe peek / neighbor pre-build) must stay silent:
  // an autoplaying guide under another tab had no exit hook, and
  // its audio never stopped (his report, 2026-10-14).
  if(tgList.length&&curView==="profile")tgPreview(tgList[0].id);
  renderTgHighlights(true);
  renderTgScoreboard(true);
  tgRefreshGuideData(); // guide opens on live data, same as Home — see below
  const pb=$("#tgPreviewBox");
  const goFull=()=>{const id=pb._tid; if(!id)return; const t=byId(id); if(!t)return; tgPause(); go("home"); playSeries(t);};
  pb.onclick=goFull;
  const wb=$("#tgWatch"); if(wb){wb.style.display="";wb.onclick=(e)=>{e.stopPropagation();goFull();};}
  const ub2=$("#tgUnmute"); if(ub2){ub2.onclick=(e)=>{e.stopPropagation();tgUnmuteNow();};}
  const si=$("#tgSearch");
  si.addEventListener("input",()=>{
    tgQuery=si.value; tgShown=0; tgList=tgFiltered();
    const l=$("#tgList"); l.innerHTML=""; tgMore();
    $("#tgEmpty").style.display=tgList.length?"none":"";
  });
  if(!window._tgHook){
    window._tgHook=true;
    window.addEventListener("scroll",()=>{
      if(curView!=="profile")return;
      const l=$("#tgList"); if(!l||!tgList)return;
      try{if(l.getBoundingClientRect().bottom<window.innerHeight+900)tgMore();}catch(e){}
      tgStickCheck();
    },{passive:true});
  }
  tgStickInit();
}
/* ---------- TV Guide freshness: live data on every open, same as Home ----------
   The channel list renders from C, but C was only fetched at launch — in a long
   session the guide drifted stale while the catalog moved on server-side. Every
   guide open now re-pulls the catalog exactly like SHORTZ_CATALOG_READY does
   (version.json cache-bust + cache:"no-store") and splices it into the SAME C
   array — never a replacement object — so Home/Browse/every existing reference
   sees the fresh data too. The on-screen (boot/bundled) copy stays untouched if
   the fetch fails: it is the offline fallback, not the source. */
let tgFreshBusy=false;
function tgCatSig(){
  let eps=0;
  for(let i=0;i<C.length;i++){const t=C[i]; if(t&&t.episodes)eps+=t.episodes.length;}
  return C.length+"|"+(C[0]?C[0].id:"")+"|"+(C[C.length-1]?C[C.length-1].id:"")+"|"+eps;
}
function tgRerenderList(){
  const box=$("#tgList"); if(!box||curView!=="profile")return;
  tgShown=0; tgList=tgFiltered(); // respects any search typed while the fetch flew
  box.innerHTML=""; tgMore();
  const em=$("#tgEmpty"); if(em)em.style.display=tgList.length?"none":"";
  const pv=$("#tgPreviewBox");
  if(pv&&pv._tid){ // a preview is playing: keep its row highlighted, touch nothing else
    const row=box.querySelector('.tg-row[data-id="'+pv._tid+'"]');
    if(row)row.classList.add("sel");
  }else{
    const sb=$("#tgSub"); if(sb)sb.textContent=C.length+" shows · tap one to preview";
  }
}
function tgRefreshGuideData(){
  if(tgFreshBusy)return; tgFreshBusy=true;
  const done=()=>{tgFreshBusy=false;};
  const before=tgCatSig();
  fetch("https://xmrmathx.github.io/shortz-tv/version.json",{cache:"no-store"})
    .then(r=>r.ok?r.json():null)
    .then(v=>(v&&v.v)||String(Date.now()))
    .catch(()=>String(Date.now()))
    .then(ver=>fetch("https://xmrmathx.github.io/shortz-tv/catalog.json?v="+encodeURIComponent(ver),{cache:"no-store"}))
    .then(r=>{if(!r.ok)throw 0;return r.json();})
    .then(data=>{
      if(Array.isArray(data)&&data.length){
        C.length=0;
        for(let i=0;i<data.length;i++)C.push(data[i]);
        window.__catRev=(window.__catRev||0)+1;
        try{buildCatalogIndexes();}catch(e){}
        if(tgCatSig()!==before)tgRerenderList();
      }
      done();
    })
    .catch(done); /* offline/failure: keep what's already on screen */
}
/* keep the guide preview fully visible while it follows the scroll.
   Scroll geometry: in the Everything hub the PANE scrolls and
   window.scrollY never moves — measure the pane there (his report
   2026-10-16: the guide stopped following in Profile AND Live; both
   stick checks read the document scroll the hub never produces). */
function tgStickPane(el){ if(document.body.classList.contains("ev-mode")&&el&&el.closest){ const p=el.closest(".view"); if(p)return p; } return null; }
function tgStickY(el){ const p=tgStickPane(el); return p?p.scrollTop:((window.SZ_SY?SZ_SY():(window.scrollY||0))); }
function tgStickTop(el){ const p=tgStickPane(el); const r=el.getBoundingClientRect(); const k=(window.__SZ_ON&&window.__SZ_K)?window.__SZ_K:1; return p?((r.top-p.getBoundingClientRect().top)/k+p.scrollTop):(r.top/k+((window.SZ_SY?SZ_SY():(window.scrollY||0)))); }
function tgStickInit(){
  const pv=$("#tgPreviewBox"); if(!pv)return;
  pv.classList.remove("stuck");
  const ph=$("#tgStickPh"); if(ph)ph.remove();
  pv._stickTop=null;
}
function tgStickCheck(){
  const pv=$("#tgPreviewBox"); if(!pv||curView!=="profile")return;
  const stuck=pv.classList.contains("stuck");
  if(!stuck){
    if(pv._stickTop==null){
      try{pv._stickTop=tgStickTop(pv);}catch(e){return;}
    }
    if(tgStickY(pv)>pv._stickTop+40){
      const ph=document.createElement("div");
      ph.id="tgStickPh"; ph.style.height=pv.offsetHeight+"px";
      pv.parentNode.insertBefore(ph,pv);
      pv.classList.add("stuck");
    }
  }else{
    const ph=$("#tgStickPh");
    if(ph){
      let phTop=0;
      try{phTop=tgStickTop(ph);}catch(e){}
      if(tgStickY(pv)<=phTop){
        pv.classList.remove("stuck"); ph.remove(); pv._stickTop=null;
      }
    }else{pv.classList.remove("stuck");pv._stickTop=null;}
  }
}

/* ---------- live sports highlights in TV Guide ---------- */
let tgHLData=null, tgHLAt=0, tgHLIdx=-1, tgHLOrder=null;
function loadHighlights(cb,force){
  const now=Date.now();
  if(!force&&tgHLData&&now-tgHLAt<30*60*1000){cb&&cb(tgHLData);return;}
  fetch("sports-highlights.json?"+now,{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{
    if(d&&d.highlights&&d.highlights.length){tgHLData=d;tgHLAt=now;}
    cb&&cb(tgHLData);
  }).catch(()=>cb&&cb(tgHLData));
}
function agoStr(iso){
  try{
    const m=Math.max(1,Math.round((Date.now()-new Date(iso).getTime())/60000));
    if(m<60)return m+"m ago";
    const h=Math.round(m/60);
    if(h<24)return h+"h ago";
    return Math.round(h/24)+"d ago";
  }catch(e){return""}
}
/* ---------- live scoreboard in TV Guide (ESPN API) ---------- */
let tgScoreAt=0;
function renderTgScoreboard(force){
  const box=document.getElementById("tgScore"); if(!box)return;
  const now=Date.now();
  if(!force&&now-tgScoreAt<5*60*1000&&box.dataset.loaded)return;
  const leagues=[
    {key:"NFL",url:"https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"},
    {key:"NBA",url:"https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"},
    {key:"MLB",url:"https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard"},
    {key:"NHL",url:"https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard"}
  ];
  box.innerHTML='<div class="tg-sc-h"><div><div class="t"><span class="live"></span>SCOREBOARD</div>'
    +'<div class="upd">Live scores · ESPN</div></div></div><div style="color:var(--mut);font-size:12px;padding:8px 2px">Loading scores…</div>';
  Promise.all(leagues.map(l=>
    fetch(l.url,{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>({key:l.key,events:(d&&d.events)||[]})).catch(()=>({key:l.key,events:[]}))
  )).then(results=>{
    tgScoreAt=Date.now(); box.dataset.loaded="1";
    let html='<div class="tg-sc-h"><div><div class="t"><span class="live"></span>SCOREBOARD</div>'
      +'<div class="upd">Live scores · ESPN</div></div></div>';
    let any=false;
    results.forEach(r=>{
      if(!r.events.length)return;
      any=true;
      html+='<div class="tg-sc-league">'+r.key+'</div>';
      const sorted=r.events.slice(0,12).sort((a,b)=>{
        const ra=a.status.type.state==="in"?0:a.status.type.state==="pre"?1:2;
        const rb=b.status.type.state==="in"?0:b.status.type.state==="pre"?1:2;
        return ra-rb;
      }).slice(0,4);
      sorted.forEach(e=>{
        try{
          const comp=e.competitions[0];
          const teams=comp.competitors;
          const home=teams.find(t=>t.homeAway==="home")||teams[0];
          const away=teams.find(t=>t.homeAway==="away")||teams[1];
          const st=e.status.type;
          const cls=st.state==="in"?"":st.state==="post"?"final":"pre";
          const status=st.state==="post"?"Final":st.shortDetail;
          const hw=parseInt(home.score||"0",10), aw=parseInt(away.score||"0",10);
          const gid=e.id||"";
          html+='<div class="tg-sc-game" data-gid="'+gid+'" data-league="'+r.key+'" style="cursor:pointer"><div class="tg-sc-teams">'
            +'<div class="tg-sc-team '+(aw>hw?"winner":"")+'"><span class="nm">'+esc(away.team.abbreviation)+' '+esc(away.team.displayName)+'</span><span class="sc">'+(away.score||"0")+'</span></div>'
            +'<div class="tg-sc-team '+(hw>aw?"winner":"")+'"><span class="nm">'+esc(home.team.abbreviation)+' '+esc(home.team.displayName)+'</span><span class="sc">'+(home.score||"0")+'</span></div>'
            +'</div><div class="tg-sc-status '+cls+'">'+esc(status)+'</div></div>';
        }catch(_){}
      });
    });
    if(!any)html+='<div style="color:var(--mut);font-size:12px;padding:8px 2px">No games right now.</div>';
    box.innerHTML=html;
    // tap a game for highlights + play-by-play
    box.querySelectorAll(".tg-sc-game[data-gid]").forEach(g=>{
      g.onclick=()=>openGameDetail(g.dataset.gid, g.dataset.league);
    });
  });
}
/* game detail: highlights + live play-by-play */
function openGameDetail(gid, league){
  const leagueUrls={
    NFL:"https://site.api.espn.com/apis/site/v2/sports/football/nfl",
    NBA:"https://site.api.espn.com/apis/site/v2/sports/basketball/nba",
    MLB:"https://site.api.espn.com/apis/site/v2/sports/baseball/mlb",
    NHL:"https://site.api.espn.com/apis/site/v2/sports/hockey/nhl"
  };
  const base=leagueUrls[league]||leagueUrls.NFL;
  // build modal
  let m=document.getElementById("gameModal");
  if(m)m.remove();
  m=document.createElement("div");
  m.id="gameModal";
  m.innerHTML=`<div class="gm-back"></div><div class="gm-box">
    <button class="gm-x" aria-label="Close">✕</button>
    <div class="gm-head"><div class="t">Loading game…</div></div>
    <div class="gm-sec"><div class="gm-sub">Highlights</div><div class="gm-hl" id="gmHL"><div style="color:var(--mut);font-size:12px">Loading…</div></div></div>
    <div class="gm-sec"><div class="gm-sub">Play by play</div><div class="gm-pbp" id="gmPBP"><div style="color:var(--mut);font-size:12px">Loading…</div></div></div>
  </div>`;
  document.body.appendChild(m);
  m.querySelector(".gm-x").onclick=()=>m.remove();
  m.querySelector(".gm-back").onclick=()=>m.remove();
  // fetch game summary (includes play-by-play)
  fetch(base+"/summary?event="+encodeURIComponent(gid),{cache:"no-store"})
    .then(r=>r.ok?r.json():null).then(d=>{
      if(!d)return;
      const comp=(d.header&&d.header.competitions&&d.header.competitions[0])||{};
      const teams=comp.competitors||[];
      const home=teams.find(t=>t.homeAway==="home")||{};
      const away=teams.find(t=>t.homeAway==="away")||{};
      const hn=(home.team||{}).displayName||"", an=(away.team||{}).displayName||"";
      const hs=home.score||"0", as=away.score||"0";
      const st=((d.header||{}).status||{}).type||{};
      m.querySelector(".gm-head").innerHTML=`<div class="t">${esc(an)} ${esc(as)} @ ${esc(hn)} ${esc(hs)}</div>`
        +`<div class="gm-status">${esc(st.shortDetail||"")}</div>`;
      // play-by-play: real-time from ESPN (NFL: drives.previous[].plays, others: plays[])
      const pbp=document.getElementById("gmPBP");
      const plays=[];
      try{
        let raw=[];
        if(league==="NFL"){
          const prev=((d.drives||{}).previous||[]);
          prev.forEach(dr=>{(dr.plays||[]).forEach(p=>raw.push(p));});
        }else{
          raw=d.plays||[];
        }
        raw.forEach(p=>{
          const txt=p.text||"";
          if(!txt||/^(End of|Start of)/i.test(txt)&&raw.length>20)return;
          const clk=(p.clock&&p.clock.displayValue)||"";
          const per=(p.period&&(p.period.displayValue||("Q"+p.period.number)))||"";
          const meta=[per,clk].filter(Boolean).join(" · ");
          plays.push({t:txt,m:meta,s:(p.awayScore!=null&&p.homeScore!=null)?p.awayScore+"–"+p.homeScore:""});
        });
      }catch(e){}
      // fallback: team leaders with real stats (skip empties)
      if(!plays.length){
        try{
          (d.leaders||[]).forEach(l=>{
            (l.leaders||[]).slice(0,3).forEach(x=>{
              const nm=(x.athlete||{}).displayName||"";
              const dv=x.displayValue||"";
              if(nm&&dv)plays.push({t:`${nm} — ${dv}`,m:(l.shortDisplayName||""),s:""});
            });
          });
        }catch(e){}
      }
      pbp.innerHTML=plays.length
        ? plays.slice(-15).reverse().map(p=>
            `<div class="gm-play"><div class="gm-pt">${esc(p.t)}</div>`+
            (p.m||p.s?`<div class="gm-pm">${esc(p.m)}${p.s?" · "+esc(p.s):""}</div>`:"")+`</div>`
          ).join("")
        : `<div style="color:var(--mut);font-size:12px">No play data yet — game may not have started.</div>`;
      // highlights: search YouTube for this matchup
      const hl=document.getElementById("gmHL");
      const q=encodeURIComponent(`${an} vs ${hn} highlights`);
      hl.innerHTML=`<a href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener"
        style="display:block;background:#1a1a22;border-radius:10px;padding:14px;text-align:center;color:#fff;font-weight:700;text-decoration:none">
        ▶ Watch ${esc(an)} vs ${esc(hn)} highlights on YouTube</a>`;
    }).catch(()=>{});
}
function renderTgHighlights(force){
  const box=$("#tgHL"); if(!box)return;
  loadHighlights(d=>{
    if(!d||!d.highlights||!d.highlights.length){box.innerHTML="";return;}
    const upd=agoStr(d.updatedAt);
    // fresh display order on every guide entry (his order) — cards carry the
    // REAL highlight index, so taps and playback are unaffected by the shuffle
    tgHLOrder=svShuffle(d.highlights.map((h,i)=>i));
    box.innerHTML=`
      <div class="tg-hl-h">
        <div><div class="t"><span class="live"></span>SPORTS HIGHLIGHTS</div>
        <div class="upd">Fresh from official channels · updated ${upd}</div></div>
        <button class="tg-hl-play" id="tgHLPlay">▶ Play all</button>
      </div>
      <div class="tg-hl-row">
        ${tgHLOrder.map(i=>{const h=d.highlights[i];return `
          <div class="tg-hl-c" data-i="${i}">
            <img src="${esc(h.thumb)}" loading="lazy" alt="">
            <div class="sb">${esc(h.sport)}</div>
            <div class="ti">${esc(h.title)}</div>
            <div class="ag">${agoStr(h.publishedAt)}</div>
          </div>`;}).join("")}
      </div>`;
    box.querySelectorAll(".tg-hl-c").forEach(c=>{
      c.onclick=(e)=>{e.stopPropagation();tgPlayHighlight(+c.dataset.i);};
    });
    const pa=$("#tgHLPlay");
    if(pa)pa.onclick=(e)=>{e.stopPropagation();tgPlayHighlight(tgHLOrder&&tgHLOrder.length?tgHLOrder[0]:0);};
  },force);
}
function tgPlayHighlight(i){
  if(!tgHLData||!tgHLData.highlights.length)return;
  tgHLIdx=((i%tgHLData.highlights.length)+tgHLData.highlights.length)%tgHLData.highlights.length;
  const h=tgHLData.highlights[tgHLIdx];
  document.querySelectorAll("#tgList .tg-row").forEach(r=>r.classList.remove("sel"));
  const fr=$("#tgFrame"); if(!fr)return;
  $("#tgTitle").textContent=h.title||"";
  $("#tgSub").textContent=`${h.sport} · ${h.channel||""} · ${agoStr(h.publishedAt)}`;
  const im=$("#tgThumb"); if(im){im.src=h.thumb;im.style.display=h.thumb?"":"none";}
  const ph=$("#tgPh"); if(ph)ph.style.display="none";
  fr.innerHTML=`<iframe src="https://www.youtube.com/embed/${h.vid}?autoplay=1&rel=0&vq=hd1080" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  fr._tid="hl:"+h.vid;
  const pv=$("#tgPreviewBox"); if(pv)pv._tid="hl:"+h.vid;
  const wb=$("#tgWatch"); if(wb)wb.style.display="none"; // highlights play in the preview; no fullscreen series view
  tgArmHighlightEnd();
}
function tgArmHighlightEnd(){
  tgWatchEnd();
  const fr=$("#tgFrame"); if(!fr)return;
  const iframe=fr.querySelector("iframe"); if(!iframe)return;
  const token=fr._tid;
  const fire=()=>{
    const pv=$("#tgPreviewBox");
    if(!pv||pv._tid!==token)return;
    const now=Date.now();
    if(now-tgAdvanceAt<5000)return;
    tgAdvanceAt=now;
    // next in this visit's shuffled display order, cycling back to the top
    let nxt=tgHLIdx+1;
    if(tgHLOrder&&tgHLOrder.length){ const p=tgHLOrder.indexOf(tgHLIdx); nxt=tgHLOrder[(p+1)%tgHLOrder.length]; }
    tgPlayHighlight(nxt);
  };
  const mk=()=>{try{
    if(token!==($("#tgPreviewBox")||{})._tid)return;
    tgPlayerKind="yt";
    tgPlayer=new YT.Player(iframe,{events:{onStateChange:(e)=>{if(e.data===0)fire();}}});
  }catch(e){}};
  if(window.YT&&window.YT.Player)mk(); else ensureYT(mk);
}
