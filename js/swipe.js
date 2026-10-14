/* ================= SWIPE ENGINE v2 (his order 2026-10-14, refined
   07:53 same day) =================
   The main screens form a sliding strip, like a slideshow. A clear
   horizontal drag slides the current screen and its neighbor
   TOGETHER under the finger. Wherever the finger stops, the screens
   stop and STAY — lift the thumb, put it back down, and the same
   strip keeps sliding from exactly that spot. Nothing snaps,
   nothing cuts. Sliding a screen fully across settles onto it
   (through the normal go()); sliding back to zero restores the
   current screen. Both screens ride as viewport-fixed slides while
   engaged, so the motion stays smooth — no repaint storms, no
   stutter. The engine locks ONLY on clearly horizontal drags;
   vertical scrolling is never intercepted. In-view carousels/rows,
   the card progress bar, inputs, the chrome bars and open overlays
   keep their own gestures. Manga is skipped: its reader turns its
   own pages. Chain follows the tab bar. */
const SWIPE_TABS=["home","browse","live","streaming","manga","profile"];
const SWIPE_EXCLUDE="input,textarea,select,[contenteditable],#featHero,.hrow,.award-row,.top10-row,.cs-row,.cfbar,.gmenu,#recentSrch,#tabbar,#topbar,#sideBar";
let _sw=null, _swPark=null, _swRaf=0, _swPendingX=null;
function swQueuePlace(s,ndx){
  _swPendingX=ndx;
  if(_swRaf)return;
  _swRaf=requestAnimationFrame(()=>{ _swRaf=0; if(_sw&&_swPendingX!=null){ const x=_swPendingX; _swPendingX=null; swStripPlace(_sw,x); } });
}
function swFlushPlace(s){
  if(_swRaf){ cancelAnimationFrame(_swRaf); _swRaf=0; }
  if(s&&_swPendingX!=null){ const x=_swPendingX; _swPendingX=null; swStripPlace(s,x); }
}
let _swBodyH=0;
function swBodyLock(){
  if(!_swBodyH){ try{ _swBodyH=document.documentElement.scrollHeight||0; }catch(e){} }
  if(_swBodyH){ try{ document.body.style.minHeight=_swBodyH+"px"; }catch(e){} }
}
try{ addEventListener("resize",()=>{ _swBodyH=0; },{passive:true}); }catch(e){}
function swipeBlocked(){
  try{
    if(typeof Manga!=="undefined"&&Manga.readerOpen)return true; // an open book turns its own pages
    if(document.querySelector("#vfOpen.open,#edraw.open,#escrim.open,#sportsReel.open,.scrim.open"))return true;
    for(const id of ["authGate","tutGate"]){
      const el=document.getElementById(id);
      if(el&&getComputedStyle(el).display!=="none")return true; // display only: a rect read here force-laid-out the page on every touch (brain audit #5)
    }
  }catch(e){}
  return false;
}
function swStripPlace(s,dx){
  const W=window.innerWidth||1;
  s.dx=dx;
  const cx=s.dir>0?-dx:dx;
  if(s.curEl)s.curEl.style.transform="translate("+cx+"px,"+(-(s.sy||0))+"px)";
  if(s.peekEl)s.peekEl.style.transform="translate("+((s.dir>0?(W-dx):(-W+dx)))+"px,0px)";
}
function swStripUndress(s){
  const els=[s?s.curEl:null,s?s.peekEl:null];
  // LANDING (brain audit round 2 #5): the ev-mode stylesheet gives
  // .view a .28s transform transition — clearing the inline
  // transition:"none" in the same recalc as the transform made the
  // restored screen ANIMATE home while go()/scrollTo ran. Kill the
  // transition first, pay one reflow, then clear, restore after.
  for(const el of els){ if(el)el.style.transition="none"; }
  try{ void document.body.offsetWidth; }catch(e){}
  for(const el of els){
    if(!el)continue;
    el.classList.remove("swipe-peek"); el.classList.remove("swipe-cur");
    el.style.transform="";
    // willChange STAYS for the whole hub session (#2): stripping it
    // at every settle re-promoted and re-rastered both dense layers
    // at the next lock — the burst right after the drag starts.
    // __swParkClear (hub exit) clears it.
  }
  try{ document.body.style.minHeight=""; }catch(e){}
  try{ document.body.classList.remove("swiping"); }catch(e){}
  requestAnimationFrame(()=>{ for(const el of els){ if(el)el.style.transition=""; } });
}
function swResetStrip(s){
  if(!s)return;
  if(s.stubT){ clearTimeout(s.stubT); s.stubT=0; }
  swStripUndress(s);
  if(s.target==="live"&&curView!=="live"){ try{ if(typeof lsStop==="function")lsStop(); }catch(e){} } // an abandoned Live peek must not keep playing
  if(s.sy!=null){ try{ window.scrollTo(0,s.sy); }catch(e){} }
}
function swSettleRecompute(){ try{ if(typeof cfRecompute==="function")cfRecompute(); }catch(e){} }
/* while the strip is engaged, the Home card preview pauses — a decoding
   video fights the slide for the main thread on a phone (the burst/
   stutter he reported). It resumes when the strip restores Home. */
function swFeedPause(){ try{ if(typeof cfPlayer!=="undefined"&&cfPlayer){ if(cfPlayer.pauseVideo)cfPlayer.pauseVideo(); else if(cfPlayer.pause)cfPlayer.pause(); } }catch(e){} }
function swFeedResume(){ try{ if(typeof cfPlayer!=="undefined"&&cfPlayer){ if(cfPlayer.playVideo)cfPlayer.playVideo(); else if(cfPlayer.play){ const p=cfPlayer.play(); if(p&&p.catch)p.catch(()=>{}); } } }catch(e){} }
/* MEDIA SILENCE AT LOCK (brain audit round 2 #1 — the big one):
   swFeedPause only ever paused Home's card. From Profile, the guide
   player (with sound) plus up to five folder-front videos kept
   DECODING inside the moving layers for the whole drag — five-plus
   video pipelines fighting the slide on the phone's main thread.
   At lock, mirror what go() does on exit; on unpark, entry restarts
   them (the guide resumes its remembered show via vfGuideResume). */
function swSilenceCurrent(){
  try{
    if(curView==="profile"){
      if(typeof tgPause==="function")tgPause();
      if(typeof vfStopPreviews==="function")vfStopPreviews();
    }
  }catch(e){}
}
function swWakeCurrent(name){
  try{ if(name==="profile"&&typeof vfStartPreviews==="function")vfStartPreviews(); }catch(e){}
}
function swStubHTML(name){
  const T={home:"Home",browse:"Browse",live:"Live",streaming:"Streaming",manga:"Manga",profile:"Profile"};
  return '<div class="swipe-stub" data-swstub="1"><div class="swipe-stub-logo">SHORTZ <span>VS</span></div><div class="swipe-stub-name">'+(T[name]||"")+'</div></div>';
}
function swStubFlush(s){
  // finger is up (park): build the peeked screen now, if it is
  // still a stub. (Was gated on s.stubT — the deleted lull timer's
  // handle — which silently disabled every park build with it.)
  if(!s)return;
  if(s.stubT){ clearTimeout(s.stubT); s.stubT=0; }
  try{
    const pk=s.peekEl;
    if(pk&&pk.querySelector("[data-swstub]")&&s.target!=="live"&&s.target!=="streaming")renderView(s.target);
  }catch(e){}
}
function swFinalize(s){
  if(s.stubT){ clearTimeout(s.stubT); s.stubT=0; }
  const target=s.target;
  _sw=null; _swPark=null; window.__swiping=false;
  swStripUndress(s);
  if(target){
    // A SETTLE IS AN ENTRY — render like one (his return-black bug,
    // 2026-10-14): go() alone never renders; tab taps call
    // renderView() THEN go(). The strip used to build only when the
    // view was EMPTY or still stubbed — so after leaving Streaming
    // (exit hook empties the slot frames, shell stays) or Live
    // (lsStop kills the stage, shell stays), swiping back skipped
    // the build and landed on a black shell, every time. Same
    // order as the tabs: render first (renders read the OLD
    // curView), then go.
    try{ renderView(target); }catch(e){}
    const chKeep=_swChain; // go() calls __swParkClear, which clears
    // the chain — a momentum chain must survive its own page landings
    try{ go(target); }catch(e){}
    if(chKeep&&!_swChain)_swChain=chKeep;
    const tg=target;
    requestAnimationFrame(()=>{ try{
      // fallback only: if the render above was somehow skipped and
      // the view is still a shell/stub, build it now
      const tv=document.querySelector("#view-"+tg);
      if(tv&&(!tv.innerHTML.trim()||tv.querySelector("[data-swstub]")))renderView(tg);
    }catch(e){} swSettleRecompute(); });
  }
  // keep the EVERYTHING hub header honest after a strip settle
  try{
    if(document.body.classList.contains("ev-mode")){
      const T={home:"Home",browse:"Browse",live:"Live",streaming:"Streaming",manga:"Manga",profile:"Profile"};
      const tt=document.getElementById("evTitle"); if(tt)tt.textContent=T[target]||"";
      const dd=document.getElementById("evDots");
      if(dd){ const i2=SWIPE_TABS.indexOf(target); dd.querySelectorAll("i").forEach((el,j)=>el.classList.toggle("on",j===i2)); }
    }
  }catch(e){}
  if(target)swPrebuild(SWIPE_TABS.indexOf(target));
  if(_swChain){
    if(_swChain.left>0&&_swChain.v>=0.85){ const ch=_swChain; requestAnimationFrame(()=>{ if(_swChain===ch)swChainStep(); }); }
    else _swChain=null;
  }
}
function swUnpark(s){
  _sw=null; _swPark=null; window.__swiping=false;
  swResetStrip(s);
  swFeedResume();
  swWakeCurrent(s.curName);
  swSettleRecompute();
  swPrebuild(SWIPE_TABS.indexOf(s.curName));
}
function __swParkClear(){
  _swChain=null;
  if(_swPark){ const s=_swPark; _swPark=null; swResetStrip(s); }
  if(_sw&&_sw.locked){ const s=_sw; _sw=null; swResetStrip(s); }
  window.__swiping=false;
  try{ document.body.classList.remove("swiping"); }catch(e){}
}
/* hub EXIT only: release the session's layer promotions. (Not in
   __swParkClear — go() calls that on every navigation, which wiped
   the promotions at every settle.) */
window.__swSessionClear=function(){
  try{ document.querySelectorAll(".view").forEach(v=>{ v.style.willChange=""; }); }catch(e){}
};
window.__swParkClear=__swParkClear;
window.__stripOwnsSwipe=true; // the EVERYTHING hub's swipe-snap stands down (see its touchend)
/* neighbor pre-build + poster decode, scheduled from locks and
   settles only (brain audit #3/#4): screens build half a second
   after a real swipe moment, and their images decode on idle time —
   never mid-drag on the compositor's first tile, never detonating
   inside an unrelated vertical scroll. */
function swPrebuild(idx){
  setTimeout(()=>{
    if(window.__swiping)return; // never build into a moving strip
    try{
      for(const nb of [SWIPE_TABS[(idx+SWIPE_TABS.length-1)%SWIPE_TABS.length],SWIPE_TABS[(idx+1)%SWIPE_TABS.length]]){ // wrapped neighbors too
        if(!nb||nb==="live"||nb==="streaming")continue;
        const el=document.querySelector("#view-"+nb);
        if(el&&!el.innerHTML.trim())renderView(nb);
        if(el){
          const imgs=el.querySelectorAll("img"); let n=0;
          const dec=()=>{ imgs.forEach(im=>{ if(n++<48&&im.decode)im.decode().catch(()=>{}); }); };
          if(window.requestIdleCallback)requestIdleCallback(dec,{timeout:900}); else setTimeout(dec,60);
        }
      }
    }catch(e){}
  },500);
}
document.addEventListener("touchstart",e=>{
  if(window.__evNative)return; // RETIRED in the hub (2026-10-14): the Everything hub scrolls NATIVELY now — this engine stands down for good
  // THE EVERYTHING GATE (his order 2026-10-14): swiping exists ONLY
  // inside the Everything hub — grid toggle ON. Toggle off, the
  // screens are locked in place and the strip does not exist.
  if(!document.body.classList.contains("ev-mode"))return;
  // mid-glide touch: the glide's position becomes a park, and the
  // normal resume path below picks the strip up under the finger —
  // complete control, the glide never fights the hand
  _swChain=null; // any new touch ends a momentum chain — the strip is his
  if(_swGlide&&_sw&&e.touches.length===1){
    cancelAnimationFrame(_swGlide.raf); _swGlide=null;
    const gs=_sw; swFlushPlace(gs);
    _swPark={dx:gs.dx,dir:gs.dir,target:gs.target,peekEl:gs.peekEl,curEl:gs.curEl,curName:gs.curName,sy:gs.sy};
    _sw=null;
  }
  if(_sw||e.touches.length!==1)return;
  if(swipeBlocked())return;
  const t0=e.target;
  if(t0&&t0.closest&&t0.closest(SWIPE_EXCLUDE))return;
  const tt=e.touches[0];
  if(_swPark){
    // resume the parked strip exactly where it stopped
    const p=_swPark;
    _sw={resume:true,locked:true,x0:tt.clientX,y0:tt.clientY,base:p.dx,dx:p.dx,dir:p.dir,target:p.target,peekEl:p.peekEl,curEl:p.curEl,curName:p.curName,sy:p.sy,moved:false};
    window.__swiping=true;
    return;
  }
  const idx=SWIPE_TABS.indexOf(curView);
  if(idx<0)return;
  _sw={resume:false,locked:false,x0:tt.clientX,y0:tt.clientY,base:0,dx:0,dir:0,target:null,peekEl:null,curEl:$("#view-"+curView),curName:curView,idx:idx,sy:0,moved:false};
  // PRE-ARM is state only now: the document-height measure moved
  // INTO the lock (paid once per real swipe, not on every tap or
  // scroll start — brain audit #2), and neighbor pre-builds are
  // scheduled from locks and settles instead of raw touches (#4).
},{capture:true,passive:true});
document.addEventListener("touchmove",e=>{
  if(window.__evNative)return;
  const s=_sw; if(!s)return;
  const tt=e.touches[0]; if(!tt)return;
  const W=window.innerWidth||1;
  if(!s.locked){
    const dx=tt.clientX-s.x0, dy=tt.clientY-s.y0;
    if(Math.abs(dy)>10&&Math.abs(dy)>=Math.abs(dx)){ _sw=null; if(!_swPark){ try{ document.body.style.minHeight=""; }catch(e){} } return; } // vertical: native scroll owns this gesture
    if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.3){
      s.dir=dx<0?1:-1; // 1 = next screen (finger moving left), -1 = previous
      const nIdx=(s.idx+s.dir+SWIPE_TABS.length)%SWIPE_TABS.length; // the chain CYCLES (his order 2026-10-14): from Home a rightward swipe wraps to Profile; from Profile a leftward swipe wraps to Home — no dead ends
      s.target=SWIPE_TABS[nIdx];
      const pk=$("#view-"+s.target);
      if(pk&&!pk.innerHTML.trim()){
        // PEEK DISCIPLINE: a peek never starts a live system — Live and
        // Streaming build on entry, as they did before the strip existed
        // (starting them inside a peek raced the real entry and left
        // "Loading channels…" / black screens behind). Static screens
        // render into the peek a breath after the slide starts moving,
        // so the first swipe never pays their build cost mid-drag.
        pk.innerHTML=swStubHTML(s.target);
        // NO MID-GESTURE BUILDS (brain audit round 2 #3): the old
        // lull-gate built the real screen whenever the thumb rested
        // ~200ms — but a slow drag is full of 200ms micro-pauses
        // WITH THE FINGER DOWN, so a full Browse/Profile build plus
        // a poster-decode storm detonated mid-gesture. Builds now
        // happen finger-up only: at park (swStubFlush) and one frame
        // after a settle (swFinalize).
      }
      s.sy=window.scrollY||0;
      swBodyLock();
      if(s.curEl){ s.curEl.classList.add("swipe-cur"); s.curEl.style.transition="none"; s.curEl.style.willChange="transform"; }
      if(pk){ pk.classList.add("swipe-peek"); pk.style.transition="none"; pk.style.willChange="transform"; s.peekEl=pk; }
      s.locked=true; window.__swiping=true; swFeedPause();
      try{ document.body.classList.add("swiping"); }catch(e){}
      swSilenceCurrent();
      swPrebuild(nIdx); // a demonstrable swipe moment: queue the neighbors
    } else return;
  }
  e.preventDefault(); // strip engaged: the page must not scroll under the drag
  const travel=s.dir>0?(s.x0-tt.clientX):(tt.clientX-s.x0);
  let ndx=s.base+travel;
  if(ndx<0)ndx=0; if(ndx>W)ndx=W;
  if(Math.abs(ndx-(s.dx||0))>=0.5)s.moved=true;
  s.lastMoveT=Date.now();
  swQueuePlace(s,ndx);
  // release-velocity samples for the momentum glide
  (s.hist||(s.hist=[])).push({dx:ndx,t:performance.now()});
  if(s.hist.length>12)s.hist.shift();
},{capture:true,passive:false});
/* release velocity in travel px/ms. A real flick decelerates as
   the thumb rolls off, so the plain last-120ms average under-reads
   it and the strip parked mid-screen (his "still stopping"). The
   release speed is the average OR 0.8x the fastest 45ms segment in
   in the gesture, whichever is higher — a positioning drag never
   makes a fast segment, so slow drags still park exactly. */
function swVel(s){
  let h=s.hist||[]; if(h.length<2)return 0;
  // stillness split: samples from before the thumb's last >150ms
  // rest are history, not intent — a drag-hold-release is a park
  let cut=0;
  for(let i=1;i<h.length;i++){ if(h[i].t-h[i-1].t>150)cut=i; }
  if(cut>0)h=h.slice(cut);
  if(h.length<2)return 0;
  const now=performance.now(), last=h[h.length-1];
  let old=h[0];
  for(let i=h.length-1;i>=0;i--){ if(now-h[i].t<=120)old=h[i]; else break; }
  const dt=now-old.t;
  let avg=0; if(dt>=16)avg=(last.dx-old.dx)/dt;
  let peak=0;
  for(let i=0;i<h.length;i++){
    for(let j=i+1;j<h.length;j++){
      const d=h[j].t-h[i].t; if(d>110)break;
      if(d>=18){ const v=(h[j].dx-h[i].dx)/d; if(Math.abs(v)>Math.abs(peak))peak=v; }
    }
  }
  const lastSeg=h.length>1?Math.sign(last.dx-h[h.length-2].dx):0;
  if(Math.sign(peak)===Math.sign(avg)||avg===0||Math.sign(peak)===lastSeg)return Math.abs(peak*0.8)>Math.abs(avg)?peak*0.8:avg;
  return avg;
}
let _swGlide=null;
/* MULTI-PAGE MOMENTUM (his order 2026-10-14): the vertical feed's
   fling doesn't stop after one screen — a hard flick keeps flying
   until friction or his thumb stops it. The strip now chains: a
   strong release carries across page after page (velocity decaying
   per page) until it settles. A touch anywhere kills the chain and
   hands him the strip (existing mid-glide catch). */
let _swChain=null;
function swChainStep(){
  const ch=_swChain; if(!ch)return;
  const idx=SWIPE_TABS.indexOf(curView);
  const W=window.innerWidth||1;
  if(idx<0){ _swChain=null; return; }
  const target=SWIPE_TABS[(idx+ch.dir+SWIPE_TABS.length)%SWIPE_TABS.length];
  const curEl=$("#view-"+curView), pk=$("#view-"+target);
  if(!curEl||!pk){ _swChain=null; return; }
  if(!pk.innerHTML.trim()||pk.querySelector("[data-swstub]")){ try{ renderView(target); }catch(e){} }
  const s={resume:false,locked:true,x0:0,y0:0,base:0,dx:0,dir:ch.dir,target:target,peekEl:pk,curEl:curEl,curName:curView,idx:idx,sy:window.scrollY||0,moved:true,
    hist:[{dx:0,t:performance.now()},{dx:Math.max(8,ch.v*16),t:performance.now()+16}]};
  _sw=s; window.__swiping=true;
  try{ document.body.classList.add("swiping"); }catch(e){}
  curEl.classList.add("swipe-cur"); curEl.style.transition="none"; curEl.style.willChange="transform";
  pk.classList.add("swipe-peek"); pk.style.transition="none"; pk.style.willChange="transform";
  swBodyLock(); swSilenceCurrent(); swFeedPause();
  ch.v*=0.78; ch.left--;
  swGlide(s,W,()=>swFinalize(s));
}
/* exponential-decay glide: starts at the finger's own speed
   (tau = remaining / release velocity) and settles — no dead stop,
   no overshoot, no sticking. _sw stays set, so a landing touch
   converts it through the touchstart handler below. */
function swGlide(s,toDx,done){
  const from=s.dx;
  const remaining=Math.abs(toDx-from); if(remaining<2){ done(); return; }
  const v=Math.max(0.5,Math.abs(swVel(s)));
  const tau=Math.max(55,Math.min(190,remaining/v)); // cap 190: the 300ms tail crawled sub-pixel for ~1.4s on medium flicks (brain audit #1)
  const t0=performance.now();
  const step=()=>{
    if(_sw!==s){ _swGlide=null; return; } // a touch took over
    const t=performance.now()-t0;
    const left=remaining*Math.exp(-t/tau);
    // write the frame directly: routing the glide through
    // swQueuePlace chains a second rAF and paces unevenly on a phone
    swStripPlace(s,toDx+(from-toDx)*Math.exp(-t/tau));
    if(left>Math.max(2,remaining*0.06)&&t<550){ _swGlide={s:s,raf:requestAnimationFrame(step)}; }
    else{ _swGlide=null; s.dx=toDx; swFlushPlace(s); done(); }
  };
  _swGlide={s:s,raf:requestAnimationFrame(step)};
}
function swEndV2(){
  const s=_sw; if(!s)return;
  if(!s.locked){ _sw=null; if(!_swPark){ try{ document.body.style.minHeight=""; }catch(e){} } return; }
  swFlushPlace(s); // land the strip exactly where the finger stopped
  if(s.resume&&!s.moved){ swUnpark(s); return; } // a tap on a parked strip cancels it — the screen is his again
  const W=window.innerWidth||1;
  // a drag that moved the strip must not fire the tap under the finger
  if(s.moved){
    const swallow=e=>{ e.stopPropagation(); e.preventDefault(); document.removeEventListener("click",swallow,true); };
    document.addEventListener("click",swallow,true);
    setTimeout(()=>{ document.removeEventListener("click",swallow,true); },400);
  }
  if(s.dx>=W-8){ swFinalize(s); return; }
  if(s.dx<=8){ swUnpark(s); return; }
  // MOMENTUM (his order 2026-10-14): a flick keeps its speed after
  // the finger lifts — fast swipe flies across, slow swipe parks.
  const vEnd=swVel(s);
  if(vEnd>0.5&&s.dx>50){
    // pages earned by release speed: a firm flick crosses two
    // screens, a hard one three — like the feed's fling
    const pages=vEnd>2.4?3:(vEnd>1.25?2:1);
    _swChain={dir:s.dir,v:Math.abs(vEnd),left:pages-1};
    swGlide(s,W,()=>swFinalize(s)); return;
  }
  if(vEnd<-0.5){ swGlide(s,0,()=>swUnpark(s)); return; }
  swStubFlush(s); // parked: the peeked screen builds now, while nothing moves
  _swPark={dx:s.dx,dir:s.dir,target:s.target,peekEl:s.peekEl,curEl:s.curEl,curName:s.curName,sy:s.sy};
  _sw=null; // parked: transforms stay exactly where the finger left them
}
document.addEventListener("touchend",swEndV2,{capture:true});
document.addEventListener("touchcancel",swEndV2,{capture:true});
