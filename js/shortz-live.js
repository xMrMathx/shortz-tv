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
      sec.addEventListener("click",e=>{
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
