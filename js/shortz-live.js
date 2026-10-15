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
function szState(s,def){
  if(def&&typeof szIsCutCh==="function"&&szIsCutCh(def.ch))return "cut";
  if(!s)return "dark";
  if(s.live)return "live";
  try{ if(typeof sstreamPlayable==="function"&&sstreamPlayable(s))return "replay"; }catch(e){}
  return "off";
}
function szMeta(s,def){
  if(def&&typeof szIsCutCh==="function"&&szIsCutCh(def.ch))return "Cut by the owner — off the air until he restores it";
  if(def&&typeof szLineup==="function"){ const lu=szLineup()[def.ch]; if(lu&&(lu.show||lu.slot)){ const base=(lu.show||"")+(lu.slot?" · "+lu.slot:""); const st=szState(s,def); return base+(st==="live"?" · live now":st==="replay"?" · replays when he's off":""); } }
  if(!s)return "Channel not assigned in the feed yet";
  const plat=s.platform==="kick"?"Kick":s.platform==="twitch"?"Twitch":s.platform==="youtube"?"YouTube":"";
  const cat=s.category?String(s.category):"";
  const st=szState(s,def);
  if(st==="live")return (cat?cat+" · ":"")+"live now on Shortz VS";
  if(st==="replay")return (cat?cat+" · ":"")+"last stream replaying — the channel never sits black";
  return (cat?cat+" · ":"")+"off air — back soon"+(plat?" · via "+plat:"");
}
function szHeroHTML(def,s){
  const st=szState(s,def);
  const thumb=s&&typeof ssThumb==="function"?ssThumb(s):"";
  const pill=st==="live"?'<span class="szlive-pill">● LIVE</span>':st==="replay"?'<span class="szlive-pill szrep">▶ REPLAY</span>':st==="cut"?'<span class="szlive-pill szoff">✂ CUT</span>':'<span class="szlive-pill szoff">OFFLINE</span>';
  return `<div class="szhero" data-sz-tap="${def.ch}">
    ${thumb?`<img class="szhero-art" src="${esc(thumb)}" alt="" loading="lazy" onerror="this.remove()">`:""}
    <div class="szhero-shade"></div>${pill}<span class="szbug">${def.ch}</span>
    <div class="szhero-who"><div class="szhero-name">${esc(def.name)}</div><div class="szhero-sub">${esc(szMeta(s,def))}</div></div>
  </div>`;
}
function szRowHTML(def,s){
  const st=szState(s,def);
  const tag=st==="live"?'<span class="sztag szon">ON AIR</span>':st==="replay"?'<span class="sztag szrp">REPLAY</span>':st==="cut"?'<span class="sztag szdf">CUT</span>':'<span class="sztag szdf">DARK</span>';
  return `<div class="szrow" data-sz-tap="${def.ch}">
    <div class="szchn"><div class="szchn-no">${def.ch}</div><div class="szchn-st">${st==="live"?"ON AIR":st==="replay"?"REPLAY":st==="cut"?"CUT":"DARK"}</div></div>
    <div class="szmeta"><div class="szmeta-t">${esc(def.name)}</div><div class="szmeta-s">${esc(szMeta(s,def))}</div></div>${tag}
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
      const resolved=szAllChannels().map(def=>({def, s:szFindStreamer(def)}));
      const heroDef=(resolved.find(r=>szState(r.s,r.def)==="live")||resolved[0]);
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
      if(szIsOwner()){
        const od=document.createElement("div");
        od.className="szmine szowndoor"; od.dataset.szOwner="1";
        od.innerHTML=`<div><div class="szmine-t">👑 THE NETWORK — owner controls</div><div class="szmine-s">Tonight's lineup, give a channel, cut a stream. Your place, your switch.</div></div><span class="szmine-arrow">›</span>`;
        sec.appendChild(od);
      }
      sec.addEventListener("click",e=>{
        if(e.target.closest("[data-sz-owner]")){ ShortzLive.openOwner(); return; }
        if(e.target.closest("[data-sz-mine]")){ ShortzLive.openPanel(); return; }
        const hit=e.target.closest("[data-sz-tap]"); if(!hit)return;
        const def=szAllChannels().find(d=>d.ch===hit.dataset.szTap); if(!def)return;
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
  p.classList.add("open"); document.body.style.overflow="hidden"; document.body.classList.add("sz-open");
};
ShortzLive.paintPanel=function(){ const p=document.getElementById("szPanel"); if(p)p.innerHTML=szPanelHTML(); };
ShortzLive.closePanel=function(){ const p=document.getElementById("szPanel"); if(p)p.classList.remove("open"); document.body.style.overflow=""; if(!document.querySelector(".szpanel.open"))document.body.classList.remove("sz-open"); };

/* ============ PIECE 3: the OWNER network panel (weapon 6: a human
   owns the place). Owner-gated by profile identity. Runs tonight's
   lineup (show + slot per channel, feeds the Piece 1 section), hands
   out channels from the carried directory, and carries per-channel
   END plus the CUT ALL STREAMS master switch. Pre-flip honesty: cuts
   and grants take hold on this device immediately and go network-wide
   the day the tower flips — the panel says so in its footer. */
const SZ_LINEUP_KEY="shortz_sz_lineup", SZ_EXTRA_KEY="shortz_sz_extra", SZ_CUT_KEY="shortz_sz_cut";
function szExtras(){ const v=szLS(SZ_EXTRA_KEY,[]); return Array.isArray(v)?v:[]; }
function szAllChannels(){ return SZ_CHANNELS.concat(szExtras()); }
function szLineup(){ return szLS(SZ_LINEUP_KEY,{}); }
function szCutSet(){ const v=szLS(SZ_CUT_KEY,[]); return Array.isArray(v)?v:[]; }
function szIsCutCh(ch){ return szCutSet().includes(ch); }
function szIsOwner(){
  const norm = v => String(v||"").toLowerCase().replace(/[^a-z0-9@.]/g,"");
  const NAMES = ["mrmath","craigmoore","mrmoore"];
  try{
    const prof=(typeof store!=="undefined"&&store.get)?store.get("profile",null):null;
    const cands=[prof&&prof.name, prof&&prof.username, prof&&prof.displayName,
      (typeof Live!=="undefined"&&Live)?Live.name:null];
    for(const c of cands){ const n=norm(c).replace(/[@.]/g,""); if(NAMES.includes(n))return true; }
    const emails=[prof&&prof.email, (typeof Live!=="undefined"&&Live)?Live.email:null];
    try{ const a=(typeof fbAuth==="function")?fbAuth():null; if(a&&a.currentUser)emails.push(a.currentUser.email); }catch(e){}
    for(const e of emails){ if(norm(e)==="craigjrbb@gmail.com")return true; }
  }catch(e){}
  return false;
}
function szNextNum(){ let m=3; szAllChannels().forEach(d=>{ const n=parseInt(String(d.ch).replace(/\D/g,""),10); if(n>m)m=n; }); return m+1; }
function szSlugOf(s){ try{ const u=String(s.url||""); const seg=u.split("/").filter(Boolean).pop()||""; return seg.replace(/^@/,"").toLowerCase(); }catch(e){ return ""; } }

function szLineupRowHTML(def,s){
  const lu=szLineup()[def.ch]||{};
  const st=szState(s,def), cut=szIsCutCh(def.ch);
  const stateTxt=cut?"CUT":st==="live"?"ON AIR":st==="replay"?"REPLAY":"DARK";
  return `<div class="szown-row" data-ch="${def.ch}">
    <div class="szown-top"><span class="szchn-no2">${def.ch}</span><span class="szown-name">${esc(def.name)}</span><span class="sztag ${cut?"szdf":st==="live"?"szon":st==="replay"?"szrp":"szdf"}">${stateTxt}</span></div>
    <div class="szown-fields">
      <input class="szp-input szown-in" data-lu-show="${def.ch}" type="text" maxlength="48" placeholder="Show title (e.g. Boxing Talk)" value="${esc(lu.show||"")}">
      <input class="szp-input szown-in szown-slot" data-lu-slot="${def.ch}" type="text" maxlength="16" placeholder="Slot (6 PM)" value="${esc(lu.slot||"")}">
    </div>
    <div class="szown-btns">
      <button class="szown-btn" data-sz-own="save" data-ch="${def.ch}">SAVE</button>
      ${cut?`<button class="szown-btn szown-go" data-sz-own="restore" data-ch="${def.ch}">RESTORE</button>`:`<button class="szown-btn szown-end" data-sz-own="cut" data-ch="${def.ch}">✂ END STREAM</button>`}
      ${SZ_CHANNELS.some(d=>d.ch===def.ch)?"":`<button class="szown-btn szown-end" data-sz-own="revoke" data-ch="${def.ch}">REVOKE CHANNEL</button>`}
    </div>
  </div>`;
}
function szOwnerHTML(){
  const all=szAllChannels();
  const holders=new Set(all.map(d=>d.match));
  let cands=[];
  try{ cands=sstreamList().filter(s=>{ const sl=szSlugOf(s); return sl&&!holders.has(sl)&&![...holders].some(h=>String(s.url||"").toLowerCase().includes(h)); }).slice(0,12); }catch(e){}
  const cutN=szCutSet().length;
  return `<div class="szp-head"><button class="szp-x" data-sz-own="close" aria-label="Close">✕</button>
      <div class="szp-title">👑 THE NETWORK</div><div class="szp-sub">Owner controls — you run this place</div></div>
    <div class="szp-scroll">
      <div class="szp-card"><div class="szp-cardt">📋 TONIGHT'S LINEUP</div>
        ${all.map(def=>szLineupRowHTML(def,szFindStreamer(def))).join("")}
      </div>
      <div class="szp-card"><div class="szp-cardt">🎁 GIVE A CHANNEL — next up: SZ${szNextNum()}</div>
        <div class="szp-stepb">A channel is forever placement in the guide — nobody gets buried here. You hand them out yourself.</div>
        ${cands.length?cands.map(s=>`<div class="szown-cand"><span class="szown-candn">${esc(s.name||szSlugOf(s))}</span><span class="szown-candp">${esc(s.platform||"")}</span><button class="szown-btn szown-go" data-sz-own="give" data-slug="${esc(szSlugOf(s))}" data-name="${esc(s.name||szSlugOf(s))}">GIVE HIM SZ${szNextNum()}</button></div>`).join(""):'<div class="szp-stepb">Every streamer in the directory already holds a channel.</div>'}
      </div>
      ${cutN<all.length?`<button class="szown-cutall" data-sz-own="cutall">✂ CUT ALL STREAMS</button>`:""}
      ${cutN?`<button class="szown-restoreall" data-sz-own="restoreall">▶ RESTORE ALL STREAMS</button>`:""}
      <div class="szp-startsub">Cuts and grants take hold on this device now — they go network-wide the day the tower flips.</div>
    </div>`;
}
ShortzLive.openOwner=function(){
  if(!szIsOwner())return;
  let p=document.getElementById("szOwnerPanel");
  if(!p){ p=document.createElement("div"); p.id="szOwnerPanel"; p.className="szpanel"; document.body.appendChild(p);
    p.addEventListener("click",e=>{
      const b=e.target.closest("[data-sz-own]"); if(!b)return;
      const act=b.dataset.szOwn, ch=b.dataset.ch;
      const after=()=>{ ShortzLive.paintOwner(); try{ ssBuildCards(); }catch(err){} };
      if(act==="close") ShortzLive.closeOwner();
      else if(act==="save"){ const lu=szLineup(); const sh=p.querySelector(`[data-lu-show="${ch}"]`), sl=p.querySelector(`[data-lu-slot="${ch}"]`);
        lu[ch]={show:sh?sh.value.trim():"", slot:sl?sl.value.trim():""}; szSetLS(SZ_LINEUP_KEY,lu); after(); }
      else if(act==="cut"){ const c=szCutSet(); if(!c.includes(ch)){ c.push(ch); szSetLS(SZ_CUT_KEY,c); } after(); }
      else if(act==="restore"){ szSetLS(SZ_CUT_KEY,szCutSet().filter(x=>x!==ch)); after(); }
      else if(act==="cutall"){ szSetLS(SZ_CUT_KEY,szAllChannels().map(d=>d.ch)); after(); }
      else if(act==="restoreall"){ szSetLS(SZ_CUT_KEY,[]); after(); }
      else if(act==="revoke"){ szSetLS(SZ_EXTRA_KEY,szExtras().filter(d=>d.ch!==ch)); szSetLS(SZ_CUT_KEY,szCutSet().filter(x=>x!==ch)); after(); }
      else if(act==="give"){ const ex=szExtras(); ex.push({ch:"SZ"+szNextNum(), match:b.dataset.slug, name:b.dataset.name}); szSetLS(SZ_EXTRA_KEY,ex); after(); }
    });
  }
  ShortzLive.paintOwner();
  p.classList.add("open"); document.body.style.overflow="hidden"; document.body.classList.add("sz-open");
};
ShortzLive.paintOwner=function(){ const p=document.getElementById("szOwnerPanel"); if(p)p.innerHTML=szOwnerHTML(); };
ShortzLive.closeOwner=function(){ const p=document.getElementById("szOwnerPanel"); if(p)p.classList.remove("open"); document.body.style.overflow=""; if(!document.querySelector(".szpanel.open"))document.body.classList.remove("sz-open"); };
