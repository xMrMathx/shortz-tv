/* ---------- VIDEO FOLDERS (Profile) ----------
   Data wiring (real sources only — no invented contents):
   - Scouts' Picks <- the Scout inbox (window.Scout.getInbox — the same picks
     the Browse landing and the old inline shelf render; the shelf is hidden
     by CSS now because the folder is the picks' home on this screen).
   - My Picks <- HIS picks: the local ♥ store ("likes", the feed rail's set)
     unioned with this session's social-like cache where the entry is his —
     the exact backfill pattern mgLikedIds() already uses for the manga shelf.
   - My List <- the "mylist" set. Watch History <- the "history" ledger.
   Previews play INLINE inside the Profile — no Watch button, no routing
   away (his standing complaint from 2026-10-13 ~17:14). Sound follows his
   TAP MECHANIC (2026-10-13 ~17:36, superseding the 17:14 sound-on-landing
   law for folder fronts): every front starts MUTED, cycling its folder's
   titles 10 seconds at a time, sliding to the next — never a whole episode
   (dwell law ~17:39). First tap on a folder = its screen plays WITH SOUND,
   in place on the grid; tapping a different folder moves the sound to it;
   second tap on the folder that has the sound = it opens. Exactly one
   audible screen at a time, and scrolling never starts or moves sound.
   The audible mount is the app's own cf pattern (cfPreviewSrc + a
   cfArmSound-style arm) — the tap is a user gesture, so the arm works on
   web and in the APK alike. Previews run only while Profile is on screen;
   go() stops them when he leaves the tab. */
const VF_DEFS=[
  {key:"scouts", name:"Scouts' Picks", cls:"vf-gold",  unit:"picks",
   empty:"Your Scout is still hunting — picks land here."},
  {key:"mine",   name:"My Picks",      cls:"vf-blue",  unit:"picks",
   empty:"Nothing liked yet.<br>Hold any cover to like it — your picks live here."},
  {key:"list",   name:"My List",       cls:"vf-violet",unit:"saved",
   empty:"Nothing saved yet.<br>Tap ＋ Save on any short to keep it here."},
  {key:"history",name:"Watch History",cls:"vf-teal",  unit:"watched",
   empty:"No watch history yet."}
];
let vfState={}, vfObs=null, vfOpenKey=null;
function vfInbox(){ try{ if(window.Scout&&Scout.getInbox) return Scout.getInbox()||[]; }catch(e){} return []; }
function vfMsgLine(m){ try{ if(window.Scout&&Scout.msgLine) return Scout.msgLine(m)||""; }catch(e){} return (m&&m.reason)||""; }
function vfFolderItems(key){
  if(key==="scouts"){
    const out=[], used=new Set();
    for(const m of vfInbox()){
      if(!m||!m.titleId||used.has(m.titleId))continue;
      let t=null; try{ t=byId(m.titleId); }catch(e){}
      if(!t)continue;
      used.add(m.titleId);
      out.push({t,reason:vfMsgLine(m)});
      if(out.length>=30)break;
    }
    return out;
  }
  if(key==="mine"){
    const ids=[];
    const push=id=>{ if(id&&ids.indexOf(id)<0)ids.push(id); };
    try{ Object.keys(likes||{}).forEach(push); }catch(e){}
    try{
      if(window.Likes&&Likes.cache&&Likes.uid){
        for(const id of Object.keys(Likes.cache)){
          const v=Likes.cache[id];
          if(v&&v[Likes.uid])push(id);
        }
      }
    }catch(e){}
    return ids.reverse().map(id=>{ try{ return byId(id); }catch(e){ return null; } })
      .filter(Boolean).map(t=>({t,reason:""}));
  }
  if(key==="list"){
    return [...mylist].reverse().map(id=>{ try{ return byId(id); }catch(e){ return null; } })
      .filter(Boolean).map(t=>({t,reason:""}));
  }
  if(key==="history"){
    return (history||[]).map(h=>{ try{ return byId(h&&h.id); }catch(e){ return null; } })
      .filter(Boolean).map(t=>({t,reason:""}));
  }
  return [];
}
function renderVideoFolders(){
  const sec=$("#vfSection"); if(!sec)return;
  vfStopPreviews();
  vfState={};
  const cells=VF_DEFS.map(d=>{
    const items=vfFolderItems(d.key);
    vfState[d.key]={items, i:0, timer:null, media:null, now:null, folder:null,
      ratio:0, audible:false, _audibleMounted:null, player:null};
    const first=items[0]&&items[0].t;
    const poster=first?thumb(first,"hq"):"";
    const count=items.length?items.length+" "+d.unit:"Empty";
    return `<button class="vf-folder ${d.cls}" data-vf="${d.key}" aria-label="${esc(d.name)}">
      <span class="vf-tab"></span>
      <span class="vf-body">
        <span class="vf-screen">
          <span class="vf-media cfmedia" data-vf-media>${poster?`<img class="cfart" src="${poster}" alt="" onerror="this.style.display='none'">`:""}<span class="vf-fade"></span></span>
          <span class="vf-glass"></span>
          <span class="vf-now" data-vf-now></span>
        </span>
        <span class="vf-plate"><span class="vf-name">${esc(d.name)}</span><span class="vf-count">${count}</span></span>
      </span>
    </button>`;
  }).join("");
  sec.innerHTML=`<div class="sect" style="margin-top:20px">Video Folders</div>
    <div class="vf-grid">${cells}
      <button class="vf-add" id="vfAdd" aria-label="New Video Folder">
        <span class="vf-tab"></span>
        <span class="vf-body"><span class="vf-plus">+</span><span class="vf-addtxt">New Video Folder</span></span>
      </button>
    </div>`;
  sec.querySelectorAll(".vf-folder").forEach(f=>{
    const key=f.dataset.vf, s=vfState[key];
    s.folder=f;
    s.media=f.querySelector("[data-vf-media]");
    s.now=f.querySelector("[data-vf-now]");
    f.onclick=()=>vfFolderTap(key);
  });
  const add=$("#vfAdd");
  if(add)add.onclick=()=>toast("Custom Video Folders are coming soon");
  vfStartPreviews();
}
/* ----- folder-front previews: every front cycles through its folder's
   titles MUTED, 10 seconds apiece, sliding to the next (never a whole
   episode). Sound is BY TAP ONLY (his mechanic, 2026-10-13 ~17:36): the
   grid starts silent, the first tap on a folder makes ITS screen audible
   in place, a tap on another folder moves the sound, and a second tap on
   the folder holding the sound opens it. Scrolling never starts or moves
   sound. The audible mount reuses the app's own cf pattern (cfPreviewSrc
   + a cfArmSound-style arm). Exactly one audible screen at a time. ----- */
let vfActiveKey=null;
/* the one folder he tapped for sound; null = every folder muted. Cleared
   whenever previews stop, so the grid always starts silent. */
let vfSoundKey=null;
function vfStartPreviews(){
  vfStopPreviews();
  if(curView!=="profile")return;
  if(!("IntersectionObserver" in window)){
    Object.values(vfState).forEach(s=>{ s.ratio=1; });
    vfSyncPreviews();
    return;
  }
  vfObs=new IntersectionObserver(es=>{
    es.forEach(en=>{
      const key=en.target.dataset&&en.target.dataset.vf;
      const s=key&&vfState[key];
      if(s)s.ratio=en.intersectionRatio;
    });
    vfSyncPreviews();
  },{threshold:[0,0.2,0.35,0.5,0.7,0.9]});
  Object.values(vfState).forEach(s=>{ if(s.folder)vfObs.observe(s.folder); });
}
function vfSyncPreviews(){
  /* visibility decides play/pause ONLY — it never picks the audible folder.
     Sound belongs to vfSoundKey (his tap) and scrolling cannot move it. */
  vfActiveKey=vfSoundKey;
  for(const d of VF_DEFS){
    const s=vfState[d.key]; if(!s)continue;
    s.audible=(d.key===vfSoundKey);
    const shouldPlay=s.ratio>=0.35&&s.items.length>0;
    if(shouldPlay&&!s.timer){ vfPlay(d.key); if(s.audible){ try{ tgPause(); }catch(e){} } } // the sound folder back in view takes the room back from the guide
    else if(!shouldPlay&&s.timer)vfPause(d.key);
    else if(shouldPlay&&s.timer&&s._audibleMounted!==s.audible)vfMount(d.key); // sound moved by tap: remount
  }
  // his rule (2026-10-14): once the folders scroll off and the
  // folder audio stops, the guide video he was watching continues
  vfGuideResume();
}
/* resume the TV Guide's remembered show when no folder holds the
   room — the guide's box remembers its title (pv._tid) through a
   tgPause; an open folder overlay still owns the screen, so the
   resume waits for it to close (its own close path resumes too). */
function vfGuideResume(){
  try{
    if(curView!=="profile")return;
    if(document.querySelector("#vfOpen.open"))return;
    const sk=vfSoundKey&&vfState[vfSoundKey];
    if(sk&&(sk.timer||(sk.ratio||0)>=0.35))return; // the sound folder owns the room while it plays OR is on screen (a tap starts it a tick after the sync — never resume over a folder he is looking at)
    const pv=$("#tgPreviewBox"), fr=$("#tgFrame");
    if(pv&&pv._tid&&fr&&!fr.querySelector("iframe,video"))tgPreview(pv._tid);
  }catch(e){}
}
function vfStopPreviews(){
  if(vfObs){ try{ vfObs.disconnect(); }catch(e){} vfObs=null; }
  vfActiveKey=null;
  vfSoundKey=null;
  Object.keys(vfState||{}).forEach(k=>vfPause(k));
}
/* his tap mechanic: FIRST tap on a folder = its screen plays WITH SOUND,
   right there on the grid (no open). Tapping a different folder moves the
   sound to it. SECOND tap on the folder that already has the sound = it
   opens. A folder with nothing in it has no screen to make audible, so it
   opens on the first tap. */
function vfFolderTap(key){
  const s=vfState[key]; if(!s)return;
  if(!s.items.length||vfSoundKey===key){ vfOpenFolder(key); return; }
  vfSoundKey=key;
  try{ tgPause(); }catch(e){} // folder sound wins the room: the TV Guide cuts the moment a folder takes sound, not just on open (his order 2026-10-14)
  vfSyncPreviews(); /* hands the sound over: old folder remounts muted, this one audible */
  if(!s.timer)vfPlay(key); /* tapped while only partly in view: start it (audible) */
}
function vfPlay(key){
  const s=vfState[key]; if(!s||s.timer||!s.items.length)return;
  vfShowTitle(key);
  vfMount(key);
  s.timer=setInterval(()=>vfAdvance(key),10000); /* 10s dwell — a preview never plays the whole thing (his order) */
}
function vfPause(key){
  const s=vfState[key]; if(!s)return;
  if(s.timer){ clearInterval(s.timer); s.timer=null; }
  if(s.player){ try{ if(s.player.destroy)s.player.destroy(); else if(s.player.pauseVideo)s.player.pauseVideo(); }catch(e){} s.player=null; }
  s._audibleMounted=null;
  if(s.media)s.media.querySelectorAll("iframe,video").forEach(el=>{
    try{ if(el.tagName==="VIDEO")el.pause(); }catch(e){}
    el.remove();
  });
}
function vfShowTitle(key){
  const s=vfState[key]; if(!s||!s.now)return;
  const it=s.items[s.i%s.items.length];
  s.now.textContent=it&&it.t?("▶ "+(it.t.title||"")):"";
}
function vfAdvance(key){
  const s=vfState[key]; if(!s||!s.items.length||!s.media)return;
  s.i=(s.i+1)%s.items.length;
  vfMount(key,true); /* SLIDE to the next title (his order — no fade) */
  vfShowTitle(key);
}
function vfMutedSrc(t){
  /* the muted twin of cfPreviewSrc — same URL machinery, sound off */
  const u=(t&&(t.url||((t.episodes&&t.episodes[0]&&t.episodes[0].url)||"")))||"";
  if(!u)return "";
  const id=ytId(u);
  if(id)return "https://www.youtube.com/embed/"+id+"?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&controls=0&disablekb=1&fs=0&loop=1&playlist="+id;
  if(u.indexOf("vimeo.com")>=0)return embedSrc(u,false)+"&autoplay=1&muted=1&loop=1";
  return embedSrc(u,false)+"&autoplay=1&mute=1";
}
function vfMount(key,slide){
  const s=vfState[key]; if(!s||!s.media)return;
  const it=s.items[s.i%s.items.length]; if(!it)return;
  const t=it.t, m=s.media;
  const olds=[...m.querySelectorAll("iframe,video")];
  const oldPlayer=s.player; s.player=null;
  const dropOlds=()=>{
    olds.forEach(el=>{ try{ if(el.tagName==="VIDEO")el.pause(); }catch(e){} el.remove(); });
    if(oldPlayer){ try{ if(oldPlayer.destroy)oldPlayer.destroy(); else if(oldPlayer.pauseVideo)oldPlayer.pauseVideo(); }catch(e){} }
  };
  s._audibleMounted=!!s.audible;
  const u=(t.url||((t.episodes&&t.episodes[0]&&t.episodes[0].url)||""))||"";
  if(!u){ dropOlds(); return; }
  let el=null, arm=false;
  if(isArchiveUrl(u)){
    /* archive.org: a real <video> on the direct MP4 — the cfActivate contract;
       sound follows the same rule (audible folder + soundOn), muted fallback
       if the platform refuses an audible start */
    const v=document.createElement("video");
    v.className="cfprev"; v.loop=true;
    v.muted=!(s.audible&&soundOn);
    v.setAttribute("playsinline",""); v.setAttribute("preload","metadata");
    v.src=u;
    el=v;
  }else{
    const src=s.audible?cfPreviewSrc(t):vfMutedSrc(t);
    if(!src){ dropOlds(); return; }
    const fr=document.createElement("iframe");
    fr.className="cfprev";
    fr.setAttribute("referrerpolicy","strict-origin-when-cross-origin");
    fr.setAttribute("allow","autoplay; encrypted-media; picture-in-picture");
    fr.setAttribute("title","Video Folder preview");
    fr.src=src;
    el=fr; arm=!!s.audible;
  }
  /* place the new screen: on an advance it SLIDES in from the right while
     the old screen slides out to the left (his order); any other mount is
     an instant swap. The outgoing player is torn down once it has slid
     off (or right away on a swap) — same teardown vfPause performs. */
  if(slide&&olds.length){
    el.style.transform="translateX(100%)";
    m.appendChild(el);
    void el.offsetWidth; /* settle at the start position, then slide */
    el.style.transform="translateX(0)";
    olds.forEach(o=>{ o.style.transform="translateX(-100%)"; });
    setTimeout(dropOlds,490);
  }else{
    m.appendChild(el);
    dropOlds();
  }
  if(el.tagName==="VIDEO"){
    try{
      const p=el.play();
      if(p&&p.catch)p.catch(()=>{ if(el.isConnected){ try{ el.muted=true; const p2=el.play(); if(p2&&p2.catch)p2.catch(()=>{}); }catch(e){} } });
    }catch(e){}
  }
  if(arm)vfArmSound(key,t,el);
}
/* drive the audible folder's sound — a cfArmSound mirror scoped to the
   folder (the cf globals belong to the Home feed and are never touched) */
function vfArmSound(key,t,fr){
  const s=vfState[key]; if(!s)return;
  const u=(t&&(t.url||((t.episodes&&t.episodes[0]&&t.episodes[0].url)||"")))||"";
  const stillMine=()=>vfState[key]===s&&s.audible&&fr.isConnected;
  if(u.indexOf("vimeo.com")>=0){
    const ready=(window.Vimeo&&window.Vimeo.Player)
      ? Promise.resolve()
      : new Promise((res,rej)=>{ const sc=document.createElement("script"); sc.src="https://player.vimeo.com/api/player.js"; sc.onload=res; sc.onerror=rej; document.head.appendChild(sc); });
    ready.then(()=>{ try{
      if(!stillMine())return;
      s.player=new Vimeo.Player(fr);
      try{ s.player.setVolume(1); const p=s.player.play(); if(p&&p.catch)p.catch(()=>{}); }catch(e){}
    }catch(e){} }).catch(()=>{});
  }else if(ytId(u)){
    const mk=()=>{ try{
      if(!stillMine())return;
      s.player=new YT.Player(fr,{events:{onReady:e=>{
        if(!stillMine())return;
        try{ e.target.unMute(); e.target.setVolume(100); e.target.playVideo(); }catch(err){}
        /* survival check, cf-style: if an audible start was refused and the
           player sits idle, fall back to a muted play so the screen MOVES */
        setTimeout(()=>{ if(!stillMine())return;
          try{ const st=e.target.getPlayerState();
            if(st!==1&&st!==3){ e.target.mute(); e.target.playVideo(); }
          }catch(err){}
        },1800);
      }}});
    }catch(e){} };
    if(window.YT&&window.YT.Player)mk(); else ensureYT(mk);
  }
}
/* ----- open / close: the icon shoots to the top-left; contents take the screen ----- */
function vfEnsureOverlay(){
  let ov=$("#vfOpen");
  if(ov)return ov;
  ov=document.createElement("div");
  ov.id="vfOpen";
  ov.innerHTML=`<div class="vf-top">
      <button class="vf-bars" id="vfBars" aria-label="Close folder"><span></span><span></span></button>
      <div class="vf-chip" id="vfChip"><span class="vf-tab"></span><span class="vf-cbody"><span class="vf-cscr"></span></span></div>
      <div style="flex:1;min-width:0"><div class="vf-otitle" id="vfOTitle"></div><div class="vf-ocount" id="vfOCount"></div></div>
    </div>
    <div class="vf-scroll" id="vfScroll"></div>`;
  document.body.appendChild(ov);
  ov.querySelector("#vfBars").onclick=()=>vfCloseFolder(false);
  ov.querySelector("#vfChip").onclick=()=>vfCloseFolder(false);
  /* ONE TAP INSIDE A FOLDER = THE SHOW (his recordings, builds ...0303
     and ...0938): the generic card binder routes a card tap through a
     300ms double-tap wait and a 450ms hold-to-like swallow — on a real
     finger, inside this heavy overlay, the tap could be eaten whole:
     the folder closed (this listener) and nothing ever presented,
     leaving him on Profile. A folder card has no inner controls and
     exactly one meaning, so the tap is served HERE on capture: close,
     present, and the generic gesture machinery never sees it. */
  ov.querySelector("#vfScroll").addEventListener("click",e=>{
    const vc=e.target.closest&&e.target.closest(".vcard");
    if(!vc)return;
    e.stopPropagation(); e.preventDefault();
    const t=vc.dataset&&byId(vc.dataset.id);
    vfCloseFolder(true);
    if(t)cfPresentTitle(t);
  },true);
  return ov;
}
function vfChipHTML(cls){
  return `<span class="vf-tab"></span><span class="vf-cbody"><span class="vf-cscr"></span></span>`;
}
function vfFly(fromRect,toRect,cls,reverse,done){
  if(!fromRect||!toRect||!fromRect.width||!toRect.width){ if(done)done(); return; }
  const fly=document.createElement("div");
  fly.id="vfFly"; fly.className="vf-chip "+cls;
  fly.innerHTML=vfChipHTML(cls);
  fly.style.left=fromRect.left+"px"; fly.style.top=fromRect.top+"px";
  fly.style.width=fromRect.width+"px"; fly.style.height=fromRect.height+"px";
  fly.style.transformOrigin="0 0";
  document.body.appendChild(fly);
  const tx=toRect.left-fromRect.left, ty=toRect.top-fromRect.top;
  const sx=toRect.width/fromRect.width, sy=toRect.height/fromRect.height;
  const anim=fly.animate([
    {transform:"translate(0,0) scale(1,1)",opacity:1},
    {transform:`translate(${tx}px,${ty}px) scale(${sx},${sy})`,opacity:1}
  ],{duration:reverse?340:400,easing:"cubic-bezier(.25,.8,.3,1)"});
  let fin=false;
  const end=()=>{ if(fin)return; fin=true; fly.remove(); if(done)done(); };
  anim.onfinish=end;
  setTimeout(end,reverse?460:520); // safety: never strand the flyer
}
function vfOpenFolder(key){
  const def=VF_DEFS.find(d=>d.key===key); if(!def)return;
  const s=vfState[key];
  const items=s?s.items:vfFolderItems(key);
  vfStopPreviews();
  try{ tgPause(); }catch(e){} // the TV Guide preview CUTS OFF the moment a folder opens (his order 2026-10-14) — it was left playing behind the folder
  const ov=vfEnsureOverlay();
  const chip=ov.querySelector("#vfChip");
  chip.className="vf-chip "+def.cls;
  ov.querySelector("#vfOTitle").textContent=def.name;
  ov.querySelector("#vfOCount").textContent=items.length?items.length+" "+def.unit:"Empty";
  const sc=ov.querySelector("#vfScroll");
  if(!items.length){
    sc.innerHTML=`<div class="empty" style="padding-top:70px">${def.empty}</div>`;
  }else if(key==="scouts"){
    sc.innerHTML=`<div class="grid">${items.map(it=>`<div class="vf-pick">${cardHTML(it.t)}${it.reason?`<div class="vf-reason">🤖 Scout: ${esc(it.reason)}</div>`:""}</div>`).join("")}</div>`;
    bindCards(sc);
  }else{
    sc.innerHTML=`<div class="grid">${items.map(it=>cardHTML(it.t)).join("")}</div>`;
    bindCards(sc);
  }
  sc.scrollTop=0;
  vfOpenKey=key;
  ov.classList.add("open");
  requestAnimationFrame(()=>requestAnimationFrame(()=>ov.classList.add("shown")));
  /* the folder's icon shoots up to the top-left, beside the two-bar button */
  const folder=s&&s.folder;
  let fr=null;
  try{ if(folder)fr=folder.getBoundingClientRect(); }catch(e){}
  if(fr&&fr.width){
    chip.style.visibility="hidden";
    const from={left:fr.left+12,top:fr.top+4,width:96,height:72};
    const to=chip.getBoundingClientRect();
    vfFly(from,to,def.cls,false,()=>{ chip.style.visibility=""; });
  }
}
function vfCloseFolder(instant){
  const ov=$("#vfOpen");
  if(!ov||!ov.classList.contains("open"))return;
  const key=vfOpenKey; vfOpenKey=null;
  const chip=ov.querySelector("#vfChip");
  let finished=false;
  const finish=()=>{
    if(finished)return; finished=true;
    ov.classList.remove("open","shown");
    if(key&&vfState[key]&&vfState[key].folder){
      const f=vfState[key].folder;
      f.classList.remove("settle"); void f.offsetWidth; f.classList.add("settle");
    }
    if(curView==="profile"){ vfStartPreviews(); const _pv=$("#tgPreviewBox"); if(_pv&&_pv._tid&&typeof tgPreview==="function"){ try{ tgPreview(_pv._tid); }catch(e){} } } // guide resumes the same show it was previewing
  };
  if(instant||!key||!chip){ finish(); return; }
  const def=VF_DEFS.find(d=>d.key===key);
  const folder=vfState[key]&&vfState[key].folder;
  ov.classList.remove("shown");
  let fr=null;
  try{ if(folder)fr=folder.getBoundingClientRect(); }catch(e){}
  if(!fr||!fr.width){ setTimeout(finish,140); return; }
  chip.style.visibility="hidden";
  const from=chip.getBoundingClientRect();
  const to={left:fr.left+12,top:fr.top+4,width:96,height:72};
  vfFly(from,to,def?def.cls:"",true,()=>{ chip.style.visibility=""; finish(); });
}
