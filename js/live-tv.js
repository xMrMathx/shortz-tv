"use strict";
/* ---------- LIVE TV (Live tab → 📡 Live TV) ----------
   Real 24/7 television channels that stream free on YouTube — every one
   verified LIVE and embeddable before it made the list (live-tv.json,
   2026-10-20). The player uses YouTube's permanent live embed
   (embed/live_stream?channel=<id>) so it always lands on the channel's
   CURRENT broadcast — never a hardcoded video id that goes stale.
   These channels never go dark, so there is no replay fallback and no
   live-state file: every row is LIVE. What he taps is what plays — the
   stage NEVER skips on its own (his order 2026-10-20): no watchdog, no
   error-skip, no ended-skip. It changes only when he taps another
   channel or leaves. Sound-first autoplay with the same patient unmute
   discipline as Free Live Sports; hidden = silent. */
let LT_CHANS=[], LT_ACTIVE=null, LT_TOKEN=0, LT_PLAYER=null;
function ltEnsureStyle(){
  if(document.getElementById("ltStyle"))return;
  const st=document.createElement("style"); st.id="ltStyle";
  st.textContent=
  ".lt-head{font-size:19px;font-weight:900;margin:2px 0 2px}"+
  ".lt-sub{color:var(--mut);font-size:12.5px;margin-bottom:12px}"+
  ".lt-stage{position:relative;width:100%;aspect-ratio:16/9;background:#000;border:1px solid var(--line);border-radius:16px;overflow:hidden;margin-bottom:14px}"+
  ".lt-stage iframe{width:100%;height:100%;border:0;display:block;pointer-events:none}"+
  ".lt-stage.stuck{position:fixed;top:calc(54px + env(safe-area-inset-top));left:16px;right:16px;z-index:45;margin:0;max-height:200px;box-shadow:0 12px 40px rgba(0,0,0,.7)}"+
  ".lt-idle{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--mut);text-align:center;padding:16px}"+
  ".lt-chip{position:absolute;top:10px;left:10px;background:rgba(5,5,10,.82);color:#fff;font-size:11.5px;font-weight:800;padding:5px 10px;border-radius:999px;pointer-events:none;max-width:88%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"+
  ".lt-chip .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#ff2d55;margin-right:6px;animation:ltPulse 1.2s infinite}"+
  "@keyframes ltPulse{0%,100%{opacity:1}50%{opacity:.25}}"+
  ".lt-rows{display:flex;flex-direction:column;gap:2px}"+
  ".lt-row{display:flex;align-items:center;gap:12px;padding:10px;border-radius:12px;cursor:pointer;border:1px solid transparent;background:transparent;width:100%;text-align:left;color:inherit;font:inherit}"+
  ".lt-row.on{background:#15151c;border-color:var(--red)}"+
  ".lt-av{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#1c1c26;flex:none}"+
  ".lt-rname{font-weight:800;font-size:14px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"+
  ".lt-rsub{color:var(--mut);font-size:12px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"+
  ".lt-livebadge{display:inline-flex;align-items:center;gap:5px;color:#ff2d55;font-size:11px;font-weight:900;flex:none}"+
  ".lt-livebadge i{width:7px;height:7px;border-radius:50%;background:#ff2d55;animation:ltPulse 1.2s infinite}";
  document.head.appendChild(st);
}
function ltHeadHTML(){
  return '<div class="lt-head">📡 Live TV</div><div class="lt-sub">Real channels, live around the clock — news, weather, business and the world. Free, right here.</div>';
}
function ltStageIdleHTML(){
  return '<div class="lt-idle"><div style="font-size:40px">📡</div><div style="font-weight:800;color:#fff">Pick a channel below</div><div style="font-size:12.5px">Every channel is live right now.</div></div>';
}
function ltRowHTML(ch){
  const on=LT_ACTIVE===ch.channelId;
  return '<button class="lt-row'+(on?" on":"")+'" data-lt-ch="'+esc(ch.channelId)+'">'
    +'<img class="lt-av" src="'+esc(ch.avatar||"")+'" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">'
    +'<div style="flex:1;min-width:0"><div class="lt-rname">'+esc(ch.name)+'</div>'
    +'<div class="lt-rsub">'+esc(ch.cat||"Live")+' · '+esc(ch.blurb||"")+'</div></div>'
    +'<span class="lt-livebadge"><i></i>LIVE</span></button>';
}
function ltRender(){
  const body=$("#livebody"); if(!body)return;
  ltStickInit();
  body.innerHTML=ltHeadHTML()
    +'<div class="lt-stage" id="ltStage">'+ltStageIdleHTML()+'</div>'
    +'<div class="lt-rows">'+LT_CHANS.map(ltRowHTML).join("")+'</div>';
  body.querySelectorAll("[data-lt-ch]").forEach(b=>b.onclick=()=>ltPlay(b.dataset.ltCh));
  if(LT_ACTIVE&&LT_CHANS.some(c=>c.channelId===LT_ACTIVE))ltPlay(LT_ACTIVE,true);
}
function ltEmbed(ch,muted){
  return "https://www.youtube.com/embed/live_stream?channel="+encodeURIComponent(ch.channelId)
    +"&autoplay=1&mute="+(muted?1:0)+"&rel=0&playsinline=1&controls=0&disablekb=1&fs=0&enablejsapi=1";
}
function ltPlay(cid,keep){
  const ch=LT_CHANS.find(c=>c.channelId===cid); if(!ch)return;
  LT_ACTIVE=cid; LT_TOKEN++;
  const stage=$("#ltStage"); if(!stage)return;
  stage.innerHTML='<iframe id="ltFrame" src="'+ltEmbed(ch)+'" frameborder="0" allowfullscreen allow="autoplay; fullscreen; encrypted-media; picture-in-picture"></iframe>'
    +'<div class="lt-chip"><span class="dot"></span>LIVE · '+esc(ch.name)+'</div>';
  document.querySelectorAll("[data-lt-ch]").forEach(b=>b.classList.toggle("on",b.dataset.ltCh===cid));
  if(!keep){ try{ stage.scrollIntoView({behavior:"smooth",block:"nearest"}); }catch(e){} }
  ltArmSound(LT_TOKEN);
}
function ltArmSound(token){
  const fr=$("#ltFrame"); if(!fr)return;
  ensureYT(()=>{
    if(token!==LT_TOKEN)return;
    const f2=$("#ltFrame"); if(!f2||f2!==fr)return;
    try{
      LT_PLAYER=new YT.Player(f2,{events:{onReady:(e)=>{
        if(token!==LT_TOKEN)return;
        try{ e.target.unMute(); e.target.setVolume(100); e.target.playVideo(); }catch(_){}
        let tries=0;
        const iv=setInterval(()=>{
          if(token!==LT_TOKEN){ clearInterval(iv); return; }
          if(window._szMicLive&&window._szMicLive())return; // mic live: never restart sound
          tries++;
          let st=-1, muted=false;
          try{ st=e.target.getPlayerState(); muted=e.target.isMuted(); }catch(_){}
          if(st===1){
            if(muted){
              try{ e.target.unMute(); e.target.setVolume(100); }catch(_){}
            }
            clearInterval(iv); return;
          }
          if(st===3){ if(tries>=10){ clearInterval(iv); } return; } // buffering is alive — leave it alone
          try{ e.target.unMute(); e.target.setVolume(100); e.target.playVideo(); }catch(_){}
          if(tries>=6){ // ~9s and still not playing/buffering: last-resort muted start (invisible — no button, his order)
            clearInterval(iv);
            try{ e.target.mute(); e.target.playVideo(); }catch(_){}
          }
        },1500);
      }}});
    }catch(_){}
  });
}
function ltStop(){
  LT_TOKEN++; LT_PLAYER=null;
  const f=$("#ltFrame");
  if(f){ try{ f.src="about:blank"; }catch(e){} }
  LT_ACTIVE=null;
}
document.addEventListener("visibilitychange",()=>{ if(document.hidden){ try{ltStop();}catch(e){} } });
/* sticky stage — same follow-the-scroll pattern as the Sports guide,
   gated to the TV tab. The seg bar does not pin here, so the stage
   sticks directly under the topbar (54px). */
function ltStickInit(){
  const st=$("#ltStage"); if(st){ st.classList.remove("stuck"); st._stickTop=null; }
  const ph=$("#ltStickPh"); if(ph)ph.remove();
}
function ltStickPane(el){ if(document.body.classList.contains("ev-mode")&&el&&el.closest){ const p=el.closest(".view"); if(p)return p; } return null; }
function ltStickY(el){ const p=ltStickPane(el); return p?p.scrollTop:((window.SZ_SY?SZ_SY():(window.scrollY||0))); }
function ltStickTop(el){ const p=ltStickPane(el); const r=el.getBoundingClientRect(); const k=(window.__SZ_ON&&window.__SZ_K)?window.__SZ_K:1; return p?((r.top-p.getBoundingClientRect().top)/k+p.scrollTop):(r.top/k+((window.SZ_SY?SZ_SY():(window.scrollY||0)))); }
function ltStickCheck(){
  const st=$("#ltStage"); if(!st||typeof curView==="undefined"||curView!=="live"||typeof Live==="undefined"||Live.tab!=="tv")return;
  const stuck=st.classList.contains("stuck");
  if(!stuck){
    if(st._stickTop==null){
      try{ st._stickTop=ltStickTop(st); }catch(e){ return; }
    }
    if(ltStickY(st)>st._stickTop+40){
      const ph=document.createElement("div");
      ph.id="ltStickPh"; ph.style.height=st.offsetHeight+"px";
      st.parentNode.insertBefore(ph,st);
      st.classList.add("stuck");
    }
  }else{
    const ph=$("#ltStickPh");
    if(ph){
      let phTop=0;
      try{ phTop=ltStickTop(ph); }catch(e){}
      if(ltStickY(st)<=phTop){
        st.classList.remove("stuck"); ph.remove(); st._stickTop=null;
      }
    }else{ st.classList.remove("stuck"); st._stickTop=null; }
  }
}
async function liveTV(){
  ltEnsureStyle();
  if(!window._ltHook){
    window._ltHook=true;
    window.addEventListener("scroll",()=>{ if(typeof curView!=="undefined"&&curView==="live")ltStickCheck(); },{passive:true});
  }
  const body=$("#livebody"); if(!body)return;
  body.innerHTML=ltHeadHTML()+'<div style="color:var(--mut);font-size:13px;padding:8px 0">Loading channels…</div>';
  try{
    const r=await fetch("live-tv.json",{cache:"no-store"});
    if(r.ok){ const d=await r.json(); if(d&&Array.isArray(d.channels)&&d.channels.length)LT_CHANS=d.channels; }
  }catch(e){}
  if(typeof curView!=="undefined"&&curView!=="live")return;
  if(typeof Live!=="undefined"&&Live.tab!=="tv")return;
  if(!LT_CHANS.length){
    body.innerHTML=ltHeadHTML()+'<div style="color:var(--mut);font-size:13px;padding:8px 0">Channels are on their way — check back soon.</div>';
    return;
  }
  LT_ACTIVE=null;
  ltRender();
  const first=LT_CHANS[0];
  if(first)ltPlay(first.channelId,true); // opens on ABC News Live, with sound
}
