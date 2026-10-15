/* SHORTZ LIVE — native streamer hosting, PIECE 1: the channels on screen
   (his crowned design: mock v4, 2026-10-15). Streamers hold numbered
   channels (SZ1, SZ2, ...) in a guide at the top of the Streaming tab.
   A channel is NEVER DARK on paper: live -> ON AIR; off air -> his last
   stream replays (the standing replay law). Until the tower flips
   (Cloudflare, parked on his word), a channel's stream is CARRIED from
   the streamer's own platform via the existing streaming machinery —
   tapping a channel jumps the feed to his card and plays it.
   Channel slots/ownership become data in Piece 3 (owner panel); the
   roster below is the founding lineup from the crowned mock. */
const SZ_CHANNELS=[
  {ch:"SZ1", match:"showbizz",    name:"ShowBizz The Adult"},
  {ch:"SZ2", match:"griffpierre", name:"GriffPierre"},
  {ch:"SZ3", match:"deenthegreat",name:"Deen The Great"}
];
function szFindStreamer(def){
  try{
    const list=(typeof sstreamList==="function")?sstreamList():[];
    return list.find(s=>String(s.url||"").toLowerCase().includes(def.match)||String(s.name||"").toLowerCase().replace(/\s+/g,"").includes(def.match))||null;
  }catch(e){ return null; }
}
function szState(s){
  if(!s)return "dark";
  if(s.live)return "live";
  try{ if(typeof sstreamPlayable==="function"&&sstreamPlayable(s))return "replay"; }catch(e){}
  return "off";
}
function szMeta(s){
  if(!s)return "Channel not assigned in the feed yet";
  const plat=s.platform==="kick"?"Kick":s.platform==="twitch"?"Twitch":s.platform==="youtube"?"YouTube":"";
  const cat=s.category?String(s.category):"";
  const st=szState(s);
  if(st==="live")return (cat?cat+" · ":"")+"live now on Shortz VS";
  if(st==="replay")return (cat?cat+" · ":"")+"last stream replaying — the channel never sits black";
  return (cat?cat+" · ":"")+"off air — back soon"+(plat?" · via "+plat:"");
}
function szHeroHTML(def,s){
  const st=szState(s);
  const thumb=s&&typeof ssThumb==="function"?ssThumb(s):"";
  const pill=st==="live"?'<span class="szlive-pill">● LIVE</span>':st==="replay"?'<span class="szlive-pill szrep">▶ REPLAY</span>':'<span class="szlive-pill szoff">OFFLINE</span>';
  return `<div class="szhero" data-sz-tap="${def.ch}">
    ${thumb?`<img class="szhero-art" src="${esc(thumb)}" alt="" loading="lazy" onerror="this.remove()">`:""}
    <div class="szhero-shade"></div>${pill}<span class="szbug">${def.ch}</span>
    <div class="szhero-who"><div class="szhero-name">${esc(def.name)}</div><div class="szhero-sub">${esc(szMeta(s))}</div></div>
  </div>`;
}
function szRowHTML(def,s){
  const st=szState(s);
  const tag=st==="live"?'<span class="sztag szon">ON AIR</span>':st==="replay"?'<span class="sztag szrp">REPLAY</span>':'<span class="sztag szdf">DARK</span>';
  return `<div class="szrow" data-sz-tap="${def.ch}">
    <div class="szchn"><div class="szchn-no">${def.ch}</div><div class="szchn-st">${st==="live"?"ON AIR":st==="replay"?"REPLAY":"DARK"}</div></div>
    <div class="szmeta"><div class="szmeta-t">${esc(def.name)}</div><div class="szmeta-s">${esc(szMeta(s))}</div></div>${tag}
  </div>`;
}
const ShortzLive={
  /* prepend the channels section into the freshly built card stack.
     Called after every ssBuildCards (wrapped below) so it survives
     every feed rebuild and live-refresh, always at the top. */
  decorate(){
    try{
      const box=document.querySelector("#view-streaming #ssCards");
      if(!box||box.querySelector(".szlive"))return;
      const resolved=SZ_CHANNELS.map(def=>({def, s:szFindStreamer(def)}));
      const heroDef=(resolved.find(r=>szState(r.s)==="live")||resolved[0]);
      const rows=resolved.filter(r=>r!==heroDef);
      const sec=document.createElement("div");
      sec.className="szlive";
      sec.innerHTML=`<div class="szlive-hd"><span class="szlive-dot"></span>SHORTZ LIVE<span class="szlive-hdsub">his channels</span></div>`
        +szHeroHTML(heroDef.def,heroDef.s)
        +(rows.length?`<div class="szlive-lab">THE OTHER CHANNELS</div>`+rows.map(r=>szRowHTML(r.def,r.s)).join(""):"");
      const mine=document.createElement("div");
      mine.className="szmine"; mine.dataset.szMine="1";
      mine.innerHTML=`<div><div class="szmine-t">🎥 MY CHANNEL — stream here</div><div class="szmine-s">Your channel, your slot. New here? The guided setup walks you in — no guessing.</div></div><span class="szmine-arrow">›</span>`;
      sec.appendChild(mine);
      sec.addEventListener("click",e=>{
        if(e.target.closest("[data-sz-mine]")){ ShortzLive.openPanel(); return; }
        const hit=e.target.closest("[data-sz-tap]"); if(!hit)return;
        const def=SZ_CHANNELS.find(d=>d.ch===hit.dataset.szTap); if(!def)return;
        const s=szFindStreamer(def); if(!s)return;
        try{ sstreamJumpTo(streamShareId(s)); }catch(err){}
      });
      box.insertBefore(sec, box.firstChild);
    }catch(e){}
  }
};
/* every feed rebuild funnels through ssBuildCards — ride it */
if(typeof ssBuildCards==="function"){
  const _szBuild=ssBuildCards;
  ssBuildCards=function(){ _szBuild(); ShortzLive.decorate(); };
}
window.ShortzLive=ShortzLive;

/* ============ PIECE 2: the streamer's own panel + THE GUIDED SETUP ====
   (his orders, 2026-10-15: the First-Timer's Door + the guided setup —
   "point them directly how to set it up and start streaming on our app
   immediately... I don't want them to have to guess.")
   Honest pre-flip state: the tower (Cloudflare) flips on the owner's
   word; until then there are NO real keys to hand out, so the panel
   runs the full setup with the key fields locked and labeled, and the
   START button routes into the guide. Nothing fake goes live. */
const SZ_STORE_KEY="shortz_sz_setup", SZ_APPLY_KEY="shortz_sz_apply", SZ_CHAN_KEY="shortz_sz_my_channel";
const SZ_STREAMLABS_URL="https://play.google.com/store/apps/details?id=com.streamlabs";
function szLS(k,d){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch(e){ return d; } }
function szSetLS(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
function szMyChannel(){ return szLS(SZ_CHAN_KEY,null); }
function szStep(){ return szLS(SZ_STORE_KEY,{step:0}).step|0; }
function szSetStep(n){ szSetLS(SZ_STORE_KEY,{step:n}); }

function szGuideHTML(){
  const step=szStep();
  if(step>=4) return `<div class="szp-done">
      <div class="szp-done-t">✅ You're set up.</div>
      <div class="szp-done-s">The day the owner flips the tower, your channel goes live from this phone — Streamlabs sends your screen, Shortz VS puts it on your channel. Nothing left to guess.</div>
      <button class="szp-ghost" data-sz-act="restart">↺ Run the setup again</button>
    </div>`;
  const head=`<div class="szp-steps">${[1,2,3,4].map(i=>`<span class="szp-dot${step>=i?" done":""}${step===i-1?" now":""}">${step>=i?"✓":i}</span>${i<4?'<span class="szp-link"></span>':""}`).join("")}</div>
    <div class="szp-steplab">STEP ${step+1} OF 4</div>`;
  if(step===0) return head+`<div class="szp-stept">Get the free Streamlabs app</div>
    <div class="szp-stepb">Streamlabs is the camera app — it sends your phone screen (or your face) to your channel. It's free. Tap the button, install it, come back here.</div>
    <a class="szp-big szp-ext" href="${SZ_STREAMLABS_URL}" target="_blank" rel="noopener">GET STREAMLABS — FREE</a>
    <button class="szp-big szp-ok" data-sz-act="next">I HAVE IT ✓</button>`;
  if(step===1) return head+`<div class="szp-stept">Connect it to your channel</div>
    <div class="szp-stepb">Every channel has a <b>server</b> and a secret <b>key</b> — the address and the password to your channel's door. When your channel is activated, yours appear right here with Copy buttons. In Streamlabs they go in: <b>Menu → Settings → Stream → Custom RTMP</b>. Paste the server in the top box, the key in the bottom one.</div>
    ${szKeyFieldsHTML()}
    <button class="szp-big szp-ok" data-sz-act="next">GOT IT ✓</button>`;
  if(step===2) return head+`<div class="szp-stept">Show your screen</div>
    <div class="szp-stepb">In Streamlabs, tap <b>GO LIVE</b> and pick <b>Screen Broadcast</b> (to play games) or <b>Camera</b> (to talk face-to-face). Android will ask "let Streamlabs record your screen?" — tap <b>Start now</b>. Your whole phone is now the camera.</div>
    <button class="szp-big szp-ok" data-sz-act="next">GOT IT ✓</button>`;
  return head+`<div class="szp-stept">Play a game here — you're on</div>
    <div class="szp-stepb">Come back to Shortz VS and open any game in the <b>Games</b> tab. You're playing it <b>on your channel</b> — that's the whole trick: no console, no computer, nothing to buy. Viewers can even jump into the multiplayer ones with you.</div>
    <button class="szp-big szp-games" data-sz-act="games">🎮 OPEN THE GAMES</button>
    <button class="szp-big szp-ok" data-sz-act="next">DONE ✓</button>`;
}
function szKeyFieldsHTML(){
  return `<div class="szp-keys">
    <div class="szp-keyrow"><span class="szp-keylab">SERVER</span><span class="szp-keyval">🔒 Opens when your channel is activated</span></div>
    <div class="szp-keyrow"><span class="szp-keylab">YOUR KEY</span><span class="szp-keyval">🔒 Never share it — it's your channel's password</span></div>
  </div>`;
}
function szChannelHTML(){
  const mine=szMyChannel(), applied=szLS(SZ_APPLY_KEY,null);
  if(mine) return `<div class="szp-chan">
      <div class="szp-chan-top"><span class="szbug">${esc(mine.ch||"SZ")}</span><span class="szp-chan-name">${esc(mine.name||"Your channel")}</span></div>
      <div class="szp-chan-sub">Your slot: ${esc(mine.slot||"—")} · your channel replays your last stream when you're off — it never sits black.</div>
    </div>`;
  if(applied) return `<div class="szp-chan">
      <div class="szp-chan-name">📨 Application in — for “${esc(applied.name||"")}”</div>
      <div class="szp-chan-sub">Mr. Moore hands out every channel himself. When he gives you one, it lands here with your SZ number. Meanwhile, run the setup below so you're ready day one.</div>
    </div>`;
  return `<div class="szp-chan">
      <div class="szp-chan-name">You don't have a channel yet</div>
      <div class="szp-chan-sub">Channels aren't sold and they aren't automatic — <b>Mr. Moore gives them out himself.</b> Put your streamer name in and apply. While you wait, run the setup below — when your channel lands, you'll be ready to go live the same day.</div>
      <div class="szp-applyrow"><input id="szApplyName" class="szp-input" type="text" maxlength="40" placeholder="Your streamer name"><button class="szp-apply" data-sz-act="apply">APPLY</button></div>
    </div>`;
}
function szPanelHTML(){
  return `<div class="szp-head"><button class="szp-x" data-sz-act="close" aria-label="Close">✕</button>
      <div class="szp-title">🎥 MY CHANNEL</div><div class="szp-sub">Stream on Shortz VS</div></div>
    <div class="szp-scroll">
      ${szChannelHTML()}
      <button class="szp-start" data-sz-act="start">● START STREAMING</button>
      <div class="szp-startsub">New channels launch soon — set up now and be ready the day they open.</div>
      <div class="szp-card" id="szGuideCard"><div class="szp-cardt">🚀 THE GUIDED SETUP</div><div class="szp-cardb" id="szGuideBody">${szGuideHTML()}</div></div>
      <details class="szp-card szp-pro"><summary>⚙️ PRO STREAMING</summary>
        <div class="szp-cardb">
          ${szKeyFieldsHTML()}
          <div class="szp-pronote">Already stream on Kick or Twitch? Keep going — Shortz VS carries your outside stream too, and multistreaming here + there is allowed. No exclusivity, ever.</div>
        </div>
      </details>
    </div>`;
}
ShortzLive.openPanel=function(){
  let p=document.getElementById("szPanel");
  if(!p){ p=document.createElement("div"); p.id="szPanel"; p.className="szpanel"; document.body.appendChild(p);
    p.addEventListener("click",e=>{
      const b=e.target.closest("[data-sz-act]"); if(!b)return;
      const act=b.dataset.szAct;
      if(act==="close") ShortzLive.closePanel();
      else if(act==="next"){ szSetStep(Math.min(4,szStep()+1)); ShortzLive.paintPanel(); }
      else if(act==="restart"){ szSetStep(0); ShortzLive.paintPanel(); }
      else if(act==="start"){ const c=document.getElementById("szGuideCard"); if(c)c.scrollIntoView({behavior:"smooth",block:"center"}); }
      else if(act==="apply"){ const inp=document.getElementById("szApplyName"); const nm=(inp&&inp.value||"").trim(); if(!nm){ if(inp)inp.focus(); return; } szSetLS(SZ_APPLY_KEY,{name:nm,ts:Date.now()}); ShortzLive.paintPanel(); }
      else if(act==="games"){ ShortzLive.closePanel(); try{ renderView("games"); go("games"); }catch(err){} }
    });
  }
  ShortzLive.paintPanel();
  p.classList.add("open"); document.body.style.overflow="hidden";
};
ShortzLive.paintPanel=function(){ const p=document.getElementById("szPanel"); if(p)p.innerHTML=szPanelHTML(); };
ShortzLive.closePanel=function(){ const p=document.getElementById("szPanel"); if(p)p.classList.remove("open"); document.body.style.overflow=""; };
