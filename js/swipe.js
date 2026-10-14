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
function swipeBlocked(){
  try{
    if(typeof Manga!=="undefined"&&Manga.readerOpen)return true; // an open book turns its own pages
    if(document.querySelector("#vfOpen.open,#edraw.open,#escrim.open,#sportsReel.open,.scrim.open"))return true;
    for(const id of ["authGate","tutGate"]){
      const el=document.getElementById(id);
      if(el&&getComputedStyle(el).display!=="none"&&el.getBoundingClientRect().height>0)return true;
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
  for(const el of [s?s.curEl:null,s?s.peekEl:null]){
    if(!el)continue;
    el.classList.remove("swipe-peek"); el.classList.remove("swipe-cur");
    el.style.transform=""; el.style.transition=""; el.style.willChange="";
  }
  try{ document.body.style.minHeight=""; }catch(e){}
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
function swFeedResume(){ try{ if(typeof cfPlayer!=="undefined"&&cfPlayer&&cfPlayer.playVideo)cfPlayer.playVideo(); }catch(e){} }
function swStubHTML(name){
  const T={home:"Home",browse:"Browse",live:"Live",streaming:"Streaming",manga:"Manga",profile:"Profile"};
  return '<div class="swipe-stub" data-swstub="1"><div class="swipe-stub-logo">SHORTZ <span>VS</span></div><div class="swipe-stub-name">'+(T[name]||"")+'</div></div>';
}
function swStubFlush(s){
  // finger is up (park): build the peeked screen now, if it is still a stub
  if(!s||!s.stubT)return;
  clearTimeout(s.stubT); s.stubT=0;
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
    // a settle is an entry: if the screen still holds the peek stub (or
    // was never built), build it for real — the same renderView a tab
    // tap runs. Screens the peek already built are left alone.
    try{
      const tv=document.querySelector("#view-"+target);
      if(tv&&(!tv.innerHTML.trim()||tv.querySelector("[data-swstub]")))renderView(target);
    }catch(e){}
    try{ go(target); }catch(e){}
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
  swSettleRecompute();
}
function swUnpark(s){
  _sw=null; _swPark=null; window.__swiping=false;
  swResetStrip(s);
  swFeedResume();
  swSettleRecompute();
}
function __swParkClear(){
  if(_swPark){ const s=_swPark; _swPark=null; swResetStrip(s); }
  if(_sw&&_sw.locked){ const s=_sw; _sw=null; swResetStrip(s); }
  window.__swiping=false;
}
window.__swParkClear=__swParkClear;
window.__stripOwnsSwipe=true; // the EVERYTHING hub's swipe-snap stands down (see its touchend)
document.addEventListener("touchstart",e=>{
  // mid-glide touch: the glide's position becomes a park, and the
  // normal resume path below picks the strip up under the finger —
  // complete control, the glide never fights the hand
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
  // PRE-ARM (his order: "as soon as I turn it on it should be locked
  // and ready"): the document-height measure the lock needs happens
  // NOW, while nothing is moving — and the static neighbor screens
  // quietly build half a second later, so the next drags find real
  // screens waiting. Live/Streaming are never pre-built.
  try{ document.body.style.minHeight=(document.documentElement.scrollHeight||0)+"px"; }catch(e){}
  setTimeout(()=>{
    if(window.__swiping)return; // never build into a moving strip
    try{
      for(const nb of [SWIPE_TABS[(idx+SWIPE_TABS.length-1)%SWIPE_TABS.length],SWIPE_TABS[(idx+1)%SWIPE_TABS.length]]){ // wrapped neighbors pre-build too
        if(!nb||nb==="live"||nb==="streaming")continue;
        const el=document.querySelector("#view-"+nb);
        if(el&&!el.innerHTML.trim())renderView(nb);
      }
    }catch(e){}
  },500);
},{capture:true,passive:true});
document.addEventListener("touchmove",e=>{
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
        if(s.target!=="live"&&s.target!=="streaming"){
          // LULL-GATED: the real screen builds only when the thumb has
          // been still ~200ms (or at park, via swStubFlush) — never
          // while moves are flowing. A build mid-drag was the stutter.
          const pkT=pk, pkName=s.target;
          let tries=0;
          const arm=()=>{ s.stubT=setTimeout(()=>{ s.stubT=0;
            if(!pkT.querySelector("[data-swstub]"))return;
            if(Date.now()-(s.lastMoveT||0)>=200){ try{ renderView(pkName); }catch(err){} }
            else if(++tries<=14)arm();
          },120); };
          arm();
        }
      }
      s.sy=window.scrollY||0;
      if(s.curEl){ s.curEl.classList.add("swipe-cur"); s.curEl.style.transition="none"; s.curEl.style.willChange="transform"; }
      if(pk){ pk.classList.add("swipe-peek"); pk.style.transition="none"; pk.style.willChange="transform"; s.peekEl=pk; }
      s.locked=true; window.__swiping=true; swFeedPause();
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
/* release velocity in travel px/ms over the finger's last ~120ms */
function swVel(s){
  const h=s.hist||[]; if(h.length<2)return 0;
  const now=performance.now(), last=h[h.length-1];
  let old=h[0];
  for(let i=h.length-1;i>=0;i--){ if(now-h[i].t<=120)old=h[i]; else break; }
  const dt=now-old.t; if(dt<16)return 0;
  return (last.dx-old.dx)/dt;
}
let _swGlide=null;
/* exponential-decay glide: starts at the finger's own speed
   (tau = remaining / release velocity) and settles — no dead stop,
   no overshoot, no sticking. _sw stays set, so a landing touch
   converts it through the touchstart handler below. */
function swGlide(s,toDx,done){
  const from=s.dx;
  const remaining=Math.abs(toDx-from); if(remaining<2){ done(); return; }
  const v=Math.max(0.5,Math.abs(swVel(s)));
  const tau=Math.max(55,Math.min(300,remaining/v));
  const t0=performance.now();
  const step=()=>{
    if(_sw!==s){ _swGlide=null; return; } // a touch took over
    const t=performance.now()-t0;
    const left=remaining*Math.exp(-t/tau);
    s.dx=toDx+(from-toDx)*Math.exp(-t/tau);
    swQueuePlace(s,s.dx);
    if(left>1.5){ _swGlide={s:s,raf:requestAnimationFrame(step)}; }
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
  if(vEnd>0.5&&s.dx>50){ swGlide(s,W,()=>swFinalize(s)); return; }
  if(vEnd<-0.5){ swGlide(s,0,()=>swUnpark(s)); return; }
  swStubFlush(s); // parked: the peeked screen builds now, while nothing moves
  _swPark={dx:s.dx,dir:s.dir,target:s.target,peekEl:s.peekEl,curEl:s.curEl,curName:s.curName,sy:s.sy};
  _sw=null; // parked: transforms stay exactly where the finger left them
}
document.addEventListener("touchend",swEndV2,{capture:true});
document.addEventListener("touchcancel",swEndV2,{capture:true});
