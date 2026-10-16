"use strict";
/* ---------- FREE LIVE SPORTS (Live tab → 📺 Sports) ----------
   Official league/federation YouTube channels ONLY — each verified free +
   embeddable before it made the list (live-sports.json). Live state and the
   latest-upload replay id ride the existing yt-live.json pipeline
   (bin/auto-stakes.py checks these channels on the same pass as streamers).
   NO DEAD SCREENS: live → the live broadcast; offline → the channel's latest
   upload as a replay under a "live events return soon" chip; no ids known
   yet → the channel's uploads playlist, which is always playable.
   LIVE SPORTS GUIDE (his order): Sports is the FIRST Live sub-tab and the
   landing section on every Live entry; Watch Party is second. The stage
   autoplays the #1 channel (live-first) WITH SOUND the moment the section
   opens — muted + an Unmute button ONLY if a browser refuses an audible
   start. Below the stage: an ESPN scoreboard strip and TV-Guide-style rows
   for every channel. Lineup, live state and scores re-fetch no-store on
   EVERY open, so a change in what's live shows on that open. */
let LS_CHANS=[], LS_STATE={}, LS_ACTIVE=null, LS_ORDER=null, LS_SINGLE=false, LS_ADV_AT=0;
/* dead-source handling (his standing rule: a walled video is skipped, never
   stared at): LS_FAIL_LVL = how far down a channel's fallback chain the
   stage has been pushed by failures; LS_DEADCH = channels whose whole chain
   failed this visit; LS_OKPLAY = the current source reached playing. */
let LS_FAIL_LVL={}, LS_DEADCH=new Set(), LS_OKPLAY=false;
function lsEnsureStyle(){
  if(document.getElementById("lsStyle"))return;
  const st=document.createElement("style"); st.id="lsStyle";
  st.textContent=
  ".ls-head{font-size:19px;font-weight:900;margin:2px 0 2px}"+
  ".ls-sub{color:var(--mut);font-size:12.5px;margin-bottom:12px}"+
  ".ls-stage{position:relative;width:100%;aspect-ratio:16/9;background:#000;border:1px solid var(--line);border-radius:16px;overflow:hidden;margin-bottom:14px}"+
  ".ls-stage iframe{width:100%;height:100%;border:0;display:block;pointer-events:none}"+
  /* sticky follow (his order, mirroring the TV Guide's .tg-preview.stuck):
     seg bar pins under the topbar (48px measured), stage pins under both
     (48 topbar + 37 seg + 14 seg margin + 6 gap = 105), height capped at
     200px exactly like the guide preview so the rows keep the screen. */
  "#view-live.ls-mode .liveseg{position:sticky;top:calc(48px + env(safe-area-inset-top));z-index:39;background:rgba(8,8,13,.94);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-radius:14px}"+
  ".ls-stage.stuck{position:fixed;top:calc(105px + env(safe-area-inset-top));left:16px;right:16px;z-index:45;margin:0;max-height:200px;box-shadow:0 12px 40px rgba(0,0,0,.7)}"+
  ".ls-idle{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--mut);text-align:center;padding:16px}"+
  ".ls-chip{position:absolute;top:10px;left:10px;background:rgba(5,5,10,.82);color:#fff;font-size:11.5px;font-weight:800;padding:5px 10px;border-radius:999px;pointer-events:none;max-width:88%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"+
  ".ls-chip .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#ff2d55;margin-right:6px;animation:lsPulse 1.2s infinite}"+
  "@keyframes lsPulse{0%,100%{opacity:1}50%{opacity:.25}}"+
  ".ls-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:10px}"+
  ".ls-card{background:#101016;border:1px solid var(--line);border-radius:14px;padding:12px;cursor:pointer;text-align:left;width:100%;color:inherit;font:inherit}"+
  ".ls-card.on{border-color:var(--red);box-shadow:0 0 0 1px var(--red)}"+
  ".ls-top{display:flex;align-items:center;gap:9px;margin-bottom:7px}"+
  ".ls-av{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#1c1c26;flex:none}"+
  ".ls-name{font-weight:800;font-size:13.5px;line-height:1.25}"+
  ".ls-sport{color:var(--mut);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px}"+
  ".ls-blurb{color:var(--mut);font-size:12px;line-height:1.4;min-height:32px}"+
  ".ls-live{display:inline-flex;align-items:center;gap:5px;color:#ff2d55;font-size:11px;font-weight:900;margin-top:7px}"+
  ".ls-live i{width:7px;height:7px;border-radius:50%;background:#ff2d55;animation:lsPulse 1.2s infinite}"+
  ".ls-off{color:var(--mut);font-size:11px;font-weight:800;margin-top:7px}"+
  ".ls-unmute{position:absolute;right:10px;bottom:10px;z-index:3;background:rgba(5,5,10,.85);color:#fff;border:1px solid rgba(255,255,255,.35);font-size:12.5px;font-weight:800;padding:8px 14px;border-radius:999px;cursor:pointer}"+
  ".ls-rows{display:flex;flex-direction:column;gap:2px}"+
  ".ls-row{display:flex;align-items:center;gap:12px;padding:10px;border-radius:12px;cursor:pointer;border:1px solid transparent;background:transparent;width:100%;text-align:left;color:inherit;font:inherit}"+
  ".ls-row.on{background:#15151c;border-color:var(--red)}"+
  ".ls-rname{font-weight:800;font-size:14px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"+
  ".ls-rsub{color:var(--mut);font-size:12px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"+
  ".ls-livebadge{display:inline-flex;align-items:center;gap:5px;color:#ff2d55;font-size:11px;font-weight:900;flex:none}"+
  ".ls-livebadge i{width:7px;height:7px;border-radius:50%;background:#ff2d55;animation:lsPulse 1.2s infinite}"+
  ".ls-replaybadge{color:var(--mut);font-size:11px;font-weight:800;flex:none}";
  document.head.appendChild(st);
}
function lsState(ch){ return LS_STATE[ch.channelId]||{}; }
function lsIsLive(ch){ const s=lsState(ch); return !!(s.live&&s.videoId); }
function lsSources(ch){
  // every source a channel row can put on the stage, in the guide's designed
  // fallback order: live broadcast → latest replay → the channel's uploads
  // playlist (always exists). Failures walk DOWN this list (see lsFail).
  const s=lsState(ch), out=[];
  if(s.live&&s.videoId)out.push({k:"live",id:s.videoId});
  if(s.latestVideoId)out.push({k:"replay",id:s.latestVideoId});
  out.push({k:"playlist"});
  return out;
}
function lsSrcFor(ch){
  const srcs=lsSources(ch);
  return srcs[Math.min(LS_FAIL_LVL[ch.channelId]||0,srcs.length-1)];
}
function lsEmbed(ch,muted){
  // sound-on by spec (mute=0); muted is only the platform-refusal fallback
  const q="autoplay=1&mute="+(muted?1:0)+"&rel=0&playsinline=1&controls=0&disablekb=1&fs=0&enablejsapi=1";
  const src=lsSrcFor(ch);
  if(src.k==="playlist")return "https://www.youtube.com/embed?listType=playlist&list="+encodeURIComponent("UU"+String(ch.channelId).slice(2))+"&"+q;
  return "https://www.youtube.com/embed/"+encodeURIComponent(src.id)+"?"+q;
}
function lsHeadHTML(){
  return '<div class="ls-head">📺 Free Live Sports</div><div class="ls-sub">Official live channels — free to watch, right here. When a channel is between events, its latest replay plays instead.</div>';
}
function lsStageIdleHTML(){
  return '<div class="ls-idle"><div style="font-size:40px">📺</div><div style="font-weight:800;color:#fff">Pick a channel below</div><div style="font-size:12.5px">Live events play the moment they start — replays roll in between.</div></div>';
}
function lsSorted(){
  // live channels still lead (standing rule); WITHIN each group the order is
  // this visit's shuffle, built in liveSports() — fresh every entry, stable
  // while he browses (his order)
  const pos=new Map(); (LS_ORDER||[]).forEach((id,i)=>pos.set(id,i));
  const rank=c=>pos.has(c.channelId)?pos.get(c.channelId):(LS_ORDER?LS_ORDER.length:0)+LS_CHANS.indexOf(c);
  return LS_CHANS.slice().sort((a,b)=>((lsIsLive(b)?1:0)-(lsIsLive(a)?1:0))||(rank(a)-rank(b)));
}
/* TV-Guide-style row: every channel appears, live or not, and every row
   names something real — the live broadcast or the latest replay. */
function lsRowHTML(ch){
  const live=lsIsLive(ch), on=LS_ACTIVE===ch.channelId, s=lsState(ch);
  const whatsOn=live
    ? (s.latestTitle||"Live broadcast on now")
    : (s.latestTitle?("↻ Replay · "+s.latestTitle):(ch.blurb||"Replays · live events return soon"));
  const badge=live
    ? '<span class="ls-livebadge"><i></i>LIVE NOW</span>'
    : '<span class="ls-replaybadge">↻ REPLAY</span>';
  return '<button class="ls-row'+(on?" on":"")+'" data-ls="'+esc(ch.channelId)+'">'
    +'<img class="ls-av" src="'+esc(ch.avatar||"")+'" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">'
    +'<div style="flex:1;min-width:0"><div class="ls-rname">'+esc(ch.name)+'</div>'
    +'<div class="ls-rsub">'+esc(ch.sport||"Sports")+' · '+esc(whatsOn)+'</div></div>'
    +badge+'</button>';
}
function lsRender(){
  const body=$("#livebody"); if(!body)return;
  lsStickInit();
  const chans=lsSorted();
  body.innerHTML=lsHeadHTML()
    +'<div class="ls-stage" id="lsStage">'+lsStageIdleHTML()+'</div>'
    +'<div id="lsScore"></div>'
    +'<div class="ls-rows">'+chans.map(lsRowHTML).join("")+'</div>';
  body.querySelectorAll("[data-ls]").forEach(b=>b.onclick=()=>lsPlay(b.dataset.ls));
  lsScoreboard(); // fresh ESPN strip on every render — same discipline as the TV Guide
  if(LS_ACTIVE&&LS_CHANS.some(c=>c.channelId===LS_ACTIVE)){
    const ch=LS_CHANS.find(c=>c.channelId===LS_ACTIVE); lsPlay(ch.channelId,true);
  }
}
function lsPlay(cid,keep){
  const ch=LS_CHANS.find(c=>c.channelId===cid); if(!ch)return;
  LS_ACTIVE=cid; LS_TOKEN++;
  const stage=$("#lsStage"); if(!stage)return;
  const s=lsState(ch), src=lsSrcFor(ch), live=src.k==="live";
  // a single-video embed (live broadcast or latest replay) ENDS and must
  // auto-advance; the uploads-playlist fallback already rolls to the next
  // video inside YouTube, so it is excluded from channel advance
  LS_SINGLE=src.k!=="playlist";
  const chip=live
    ? '<div class="ls-chip"><span class="dot"></span>LIVE · '+esc(ch.name)+'</div>'
    : '<div class="ls-chip">↻ REPLAY'+(src.k==="replay"&&s.latestTitle?" · "+esc(s.latestTitle):"")+' — live events return soon</div>';
  stage.innerHTML='<iframe id="lsFrame" src="'+lsEmbed(ch)+'" frameborder="0" allowfullscreen allow="autoplay; fullscreen; encrypted-media; picture-in-picture"></iframe>'+chip
    +'<button class="ls-unmute" id="lsUnmute" style="display:none">🔊 Unmute</button>';
  const ub=$("#lsUnmute");
  if(ub)ub.onclick=(e)=>{ e.stopPropagation(); lsUnmute(); };
  document.querySelectorAll("[data-ls]").forEach(b=>b.classList.toggle("on",b.dataset.ls===cid));
  if(!keep){ try{ stage.scrollIntoView({behavior:"smooth",block:"nearest"}); }catch(e){} }
  LS_OKPLAY=false;
  lsArmSound(LS_TOKEN);
  // playability watchdog: some walls never fire the player's onError (the
  // generic "An error occurred" screen is one) — if this source has not
  // reached playing in 9s it is treated as failed and skipped (lsFail)
  const tk=LS_TOKEN;
  setTimeout(()=>{ if(tk===LS_TOKEN&&LS_ACTIVE===cid&&!LS_OKPLAY)lsFail(); },9000);
}
/* NO DEAD SCREENS (his standing rule, app-wide): a stage source that
   errors or never reaches playing is skipped instantly — first down this
   channel's own fallback chain (live → replay → uploads playlist), then
   to the next channel. A channel whose playlist also fails is dead for
   the rest of the visit; if every channel dies the stage returns to the
   idle picker rather than parking on a YouTube error screen. */
function lsFail(){
  const cid=LS_ACTIVE; if(!cid)return;
  const ch=LS_CHANS.find(c=>c.channelId===cid); if(!ch)return;
  const lvl=(LS_FAIL_LVL[cid]||0)+1;
  if(lvl<lsSources(ch).length){ LS_FAIL_LVL[cid]=lvl; lsPlay(cid,true); return; }
  LS_DEADCH.add(cid);
  const chans=lsSorted().filter(c=>!LS_DEADCH.has(c.channelId));
  if(!chans.length){ LS_ACTIVE=null; lsRender(); return; }
  const i=chans.findIndex(c=>c.channelId===cid);
  lsPlay(chans[(i+1)%chans.length].channelId,true);
}
/* Auto-advance (his order): a finished video goes to the NEXT channel in
   this visit's fresh order and plays it — no tap, no sitting on an ended
   frame. Cycles back to the top after the last channel. */
function lsAdvance(){
  if(!LS_ACTIVE||!LS_SINGLE)return;
  const now=Date.now();
  if(now-LS_ADV_AT<5000)return; // same dedup discipline as the TV Guide
  LS_ADV_AT=now;
  const chans=lsSorted().filter(c=>!LS_DEADCH.has(c.channelId)); if(chans.length<1)return;
  const i=chans.findIndex(c=>c.channelId===LS_ACTIVE);
  const nxt=chans[(i+1)%chans.length];
  if(nxt&&nxt.channelId!==LS_ACTIVE)lsPlay(nxt.channelId,true); // keep=true: never yank his scroll
}
/* SOUND-FIRST autoplay (his order: "No mute — have the video playing with
   sound"). The stage player is created inside the Live-tab tap's activation
   window (renderLive runs synchronously off the tab click), and the APK
   shell already permits audible autoplay — MainActivity sets
   setMediaPlaybackRequiresUserGesture(false). LAST RESORT ONLY: if a
   browser still refuses an audible start, the video starts muted WITH an
   Unmute button rather than sitting paused — never a dead screen. */
let LS_TOKEN=0, LS_PLAYER=null;
function lsArmSound(token){
  const fr=$("#lsFrame"); if(!fr)return;
  ensureYT(()=>{
    if(token!==LS_TOKEN)return;
    const f2=$("#lsFrame"); if(!f2||f2!==fr)return;
    try{
      LS_PLAYER=new YT.Player(f2,{events:{onReady:(e)=>{
        if(token!==LS_TOKEN)return;
        try{ e.target.unMute(); e.target.setVolume(100); e.target.playVideo(); }catch(_){}
        // SOUND-FIRST, PATIENT (his order: audio automatically, every
        // time). A slow-starting stream is NOT a refused one: the old
        // one-shot 1.8s verdict force-muted healthy players that were
        // still spinning up. Now the audible start is retried while
        // the player loads, a player that has not reached playing is
        // NEVER muted, and the muted start survives only as the last
        // resort for a player genuinely stuck — never a dead screen.
        let tries=0;
        const iv=setInterval(()=>{
          if(token!==LS_TOKEN){ clearInterval(iv); return; }
          tries++;
          let st=-1, muted=false;
          try{ st=e.target.getPlayerState(); muted=e.target.isMuted(); }catch(_){}
          if(st===1){ // playing: sound must be on — one unmute attempt if the platform forced silence
            if(muted){
              try{ e.target.unMute(); e.target.setVolume(100); }catch(_){}
              let still=true; try{ still=e.target.isMuted(); }catch(_){}
              if(still){ const ub=$("#lsUnmute"); if(ub)ub.style.display=""; }
            }
            clearInterval(iv); return;
          }
          if(st===3){ if(tries>=8){ clearInterval(iv); } return; } // buffering is alive — leave it alone
          try{ e.target.unMute(); e.target.setVolume(100); e.target.playVideo(); }catch(_){}
          if(tries>=5){ // ~7.5s and still not playing/buffering: last-resort muted start
            clearInterval(iv);
            try{ e.target.mute(); e.target.playVideo(); }catch(_){}
            const ub=$("#lsUnmute"); if(ub)ub.style.display="";
          }
        },1500);
      },onStateChange:(e)=>{
        if(token!==LS_TOKEN)return;
        if(e.data===1)LS_OKPLAY=true; // reached playing — the playability watchdog stands down
        if(e.data===0)lsAdvance(); // ENDED → next channel plays, no tap
      },onError:(e)=>{
        if(token!==LS_TOKEN)return;
        lsFail(); // walled / unavailable / embed-blocked → skip it, never park on the error screen
      }}});
    }catch(_){}
  });
}
function lsUnmute(){
  const ub=$("#lsUnmute"); if(ub)ub.style.display="none";
  try{ if(LS_PLAYER){ LS_PLAYER.unMute(); LS_PLAYER.setVolume(100); LS_PLAYER.playVideo(); return; } }catch(_){}
  const fr=$("#lsFrame");
  if(fr&&fr.contentWindow){
    try{
      const msg=(func,args)=>fr.contentWindow.postMessage(JSON.stringify({event:"command",func,args:args||""}),"*");
      msg("setVolume",[100]); msg("unMute"); msg("playVideo");
    }catch(_){}
  }
}
function lsStop(){
  LS_TOKEN++; LS_PLAYER=null;
  const f=$("#lsFrame");
  if(f){ try{ f.src="about:blank"; }catch(e){} }
  LS_ACTIVE=null;
}
/* ---------- sticky stage: follow the scroll like the TV Guide preview ----------
   Same pattern as tgStickInit/tgStickCheck: once the stage's natural spot
   scrolls past, a same-height placeholder holds its place in the flow and
   the stage itself goes fixed under the (also pinned) seg bar — the game
   keeps playing in view while the guide rows scroll beneath it. Scrolling
   back to the placeholder restores it. Only ever active in Sports. */
function lsStickInit(){
  const st=$("#lsStage"); if(st){ st.classList.remove("stuck"); st._stickTop=null; }
  const ph=$("#lsStickPh"); if(ph)ph.remove();
}
function lsStickPane(el){ if(document.body.classList.contains("ev-mode")&&el&&el.closest){ const p=el.closest(".view"); if(p)return p; } return null; }
function lsStickY(el){ const p=lsStickPane(el); return p?p.scrollTop:(window.scrollY||0); }
function lsStickTop(el){ const p=lsStickPane(el); const r=el.getBoundingClientRect(); return p?(r.top-p.getBoundingClientRect().top+p.scrollTop):(r.top+(window.scrollY||0)); }
function lsStickCheck(){
  const st=$("#lsStage"); if(!st||typeof curView==="undefined"||curView!=="live"||typeof Live==="undefined"||Live.tab!=="sports")return;
  const stuck=st.classList.contains("stuck");
  if(!stuck){
    if(st._stickTop==null){
      try{ st._stickTop=lsStickTop(st); }catch(e){ return; }
    }
    if(lsStickY(st)>st._stickTop+40){
      const ph=document.createElement("div");
      ph.id="lsStickPh"; ph.style.height=st.offsetHeight+"px";
      st.parentNode.insertBefore(ph,st);
      st.classList.add("stuck");
    }
  }else{
    const ph=$("#lsStickPh");
    if(ph){
      let phTop=0;
      try{ phTop=lsStickTop(ph); }catch(e){}
      if(lsStickY(st)<=phTop){
        st.classList.remove("stuck"); ph.remove(); st._stickTop=null;
      }
    }else{ st.classList.remove("stuck"); st._stickTop=null; }
  }
}
/* ESPN scoreboard strip for the Sports Guide — same endpoints, classes and
   game-detail sheet as the TV Guide scoreboard, but fetched fresh (no-store)
   on EVERY open of the section. */
async function lsScoreboard(){
  const box=$("#lsScore"); if(!box)return;
  const leagues=[
    {key:"NFL",url:"https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"},
    {key:"NBA",url:"https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"},
    {key:"MLB",url:"https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard"},
    {key:"NHL",url:"https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard"}
  ];
  let results;
  try{
    results=await Promise.all(leagues.map(l=>
      fetch(l.url,{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>({key:l.key,events:(d&&d.events)||[]})).catch(()=>({key:l.key,events:[]}))
    ));
  }catch(e){ return; }
  if(!document.getElementById("lsScore"))return; // section closed mid-flight
  if(typeof curView!=="undefined"&&curView!=="live")return;
  let html='<div class="tg-sc-h"><div><div class="t"><span class="live"></span>SCOREBOARD</div>'
    +'<div class="upd">Today\'s games · ESPN</div></div></div>';
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
  box.querySelectorAll(".tg-sc-game[data-gid]").forEach(g=>{
    g.onclick=()=>openGameDetail(g.dataset.gid, g.dataset.league);
  });
}
async function liveSports(){
  lsEnsureStyle();
  if(!window._lsHook){
    window._lsHook=true;
    window.addEventListener("scroll",()=>{ if(typeof curView!=="undefined"&&curView==="live")lsStickCheck(); },{passive:true});
  }
  const body=$("#livebody"); if(!body)return;
  body.innerHTML=lsHeadHTML()+'<div style="color:var(--mut);font-size:13px;padding:8px 0">Loading channels…</div>';
  // fresh lineup + live/replay state on every open — loaded TOGETHER
  // (they used to queue one after another, and the state fetch alone
  // could hold the stage ~3s before anything played)
  const pChans=(async()=>{ try{
    const r=await fetch("live-sports.json",{cache:"no-store"});
    if(r.ok){ const d=await r.json(); if(d&&Array.isArray(d.channels)&&d.channels.length)LS_CHANS=d.channels; }
  }catch(e){} })();
  const pState=(async()=>{ try{
    const to=new Promise((_,rej)=>setTimeout(rej,1500));
    const r=await Promise.race([fetch("yt-live.json",{cache:"no-store"}),to]);
    if(r&&r.ok){ const d=await r.json(); if(d&&typeof d==="object")LS_STATE=d; }
  }catch(e){} })();
  await Promise.all([pChans,pState]);
  if(typeof curView!=="undefined"&&curView!=="live")return;
  if(typeof Live!=="undefined"&&Live.tab!=="sports")return;
  if(!LS_CHANS.length){
    body.innerHTML=lsHeadHTML()+'<div style="color:var(--mut);font-size:13px;padding:8px 0">Channels are on their way — check back soon.</div>';
    return;
  }
  LS_ACTIVE=null;
  LS_FAIL_LVL={}; LS_DEADCH=new Set(); // failure memory is per-visit, same as the order
  LS_ORDER=svShuffle(LS_CHANS.map(c=>c.channelId)); // fresh order on EVERY entry (his order)
  lsRender();
  // his order: the #1 channel (live-first sort) starts playing — with sound —
  // the moment the Sports section opens
  const first=lsSorted()[0];
  if(first)lsPlay(first.channelId,true);
}
