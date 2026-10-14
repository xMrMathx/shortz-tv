/* ============================================================
   GAMES (his order 2026-10-14) — a new section in the ring
   between Manga and Profile. Publisher-embed games (licensed
   for exactly this) in a Home-style CARD FEED: scroll the
   cards, tap one, it plays inside the card — nothing ever
   downloads. Landscape games offer fullscreen (the APK can
   hold the phone sideways); portrait games stay one-handed.
   Test shelf: one FPS, one sports, one puzzle.
   ============================================================ */
/* EMBED URLS point at the GAME ITSELF (rvvASMiM/<id>/index.html), never
   the network's wrapper page: the wrapper's SDK breaks out of the app
   on mobile (top-page redirect with tracking params — his phone,
   2026-10-14). The game files are the network's own host either way;
   the wrapper is only an ad/loader shell around them. */
/* HIS LAW (2026-10-14, sharpened same evening): the Games shelf is
   FPS ONLY, and every shooter must be MULTIPLAYER with an ACTIVE
   PLAYER BASE — a multiplayer game with empty lobbies is out
   (EpicShooter3D: his phone found nobody playing, removed), and a
   solo shooter is out no matter how good (Hellgate 1993, removed at
   his order). Only games that verifiably play INSIDE the app — no
   exceptions.
   HIS LAW (2026-10-14): only games that verifiably play INSIDE the
   app — no exceptions. GameDistribution is OUT as a network: their
   game FILES serve a "not available here" block screen to domains
   that aren't registered with them (proven on his phone for Penalty
   Shooters 2 and Tile Master Deluxe, even via the direct file URL).
   GD games return only if the site is registered with GD. Working
   model: GameMonetize — direct embeds, no domain block.
   MASKED FORCES IS OUT (2026-10-14): its web build has NO touch controls
   (keyboard/mouse only — his own gameplay screenshot shows a live match
   with no joystick or fire buttons), and GameDistribution's wrapper
   blocks unregistered domains by design ("block-and-redirect"). It
   fails his on-screen-controls law on both counts. */
const GAMES=[
  { title:"Hazmob FPS", cat:"First-Person Shooter", orient:"landscape",
    embed:"https://playgama.com/export/game/hazmob-fps-online-shooter",
    thumb:"https://static.playgama.com/p-img/pg/hazmob-fps-online-shooter/big_preview/df01c609f8c44052b837b336d0e63617?width=1200",
    sub:"ONLINE multiplayer — Team Deathmatch, Search & Destroy, Domination, Capture the Flag. Live lobbies shared with the phone game's players." },
  { title:"Deadshot.io", cat:"First-Person Shooter", orient:"landscape",
    embed:"https://www.crazygames.com/embed/deadshot-io",
    thumb:"https://images.crazygames.com/games/deadshot-io/cover_16x9-1694770506842.png",
    sub:"ONLINE multiplayer — Free-for-All, Team Deathmatch, Hardpoint, Kill Confirmed. Live lobbies, players around the world." },
];
let gamesBuilt=false, gamesActiveCard=null;
function gamePosterHTML(g){
  return (g.thumb?`<img class="gposter" src="${esc(g.thumb)}" alt="" loading="lazy" onerror="this.remove()">`:"")
    +`<button class="gplay" data-gplay aria-label="Play ${esc(g.title)}"><i>▶</i></button>`;
}
function renderGames(){
  const v=document.getElementById("view-games");
  if(!v)return;
  if(gamesBuilt&&v.querySelector(".gcards"))return;
  gamesBuilt=true;
  v.innerHTML=`<div class="gcards">`
    +GAMES.map((g,i)=>`<article class="gcard" data-gcard="${i}">
      <div class="gcard-stage ${g.orient==="portrait"?"gstage-port":"gstage-land"}"><div class="gcard-frame" data-gframe>${gamePosterHTML(g)}</div></div>
      <div class="gcard-ov"><span class="gcard-name">${esc(g.title)}</span><span class="gcard-cat">${esc(g.cat)}</span><div class="gcard-sub">${esc(g.sub||"Tap play — runs right here, nothing downloads.")}</div></div>
    </article>`).join("")
    +`</div>`;
  v.querySelectorAll("[data-gplay]").forEach(b=>b.addEventListener("click",()=>{
    const card=b.closest(".gcard");
    gameMount(card,GAMES[+card.dataset.gcard]);
  }));
}
function gamePlayerEl(){
  let p = document.getElementById("gamePlayer");
  if(!p){
    p = document.createElement("div");
    p.id = "gamePlayer";
    p.innerHTML = `<button class="gclose" data-gclose>✕ Close</button>`;
    p.querySelector("[data-gclose]").addEventListener("click", () => gameStop());
    document.body.appendChild(p);
  }
  return p;
}
/* HIS ORDER (2026-10-14): the tap takes the game FULL SCREEN in its
   own shape — vertical games tall, horizontal games wide — and it
   plays inside our app, never out on the network's site. */
function gameMount(card, g){
  if(!g) return;
  gameStop();
  gamesActiveCard = card || null;
  const p = gamePlayerEl();
  p.querySelectorAll("iframe").forEach(f => f.remove());
  const ifr = document.createElement("iframe");
  ifr.src = g.embed;
  ifr.setAttribute("allow", "autoplay; fullscreen; gamepad; keyboard-mouse; pointer-lock");
  ifr.setAttribute("allowfullscreen", "");
  ifr.title = g.title;
  p.insertBefore(ifr, p.firstChild);
  p.classList.add("open");
  // take the whole screen; landscape games swing sideways, portrait
  // games stay tall. Where the platform refuses (iPhone web), the
  // layer already fills the screen, so the game still plays big.
  try{
    const fp = p.requestFullscreen ? p.requestFullscreen({ navigationUI: "hide" }) : null;
    const lockIt = () => { try{ if(screen.orientation && screen.orientation.lock) screen.orientation.lock(g.orient === "portrait" ? "portrait" : "landscape").catch(() => {}); }catch(e){} };
    if(fp && fp.then) fp.then(lockIt).catch(() => {});
    else lockIt();
  }catch(e){}
}
function gameStop(){
  if(document.fullscreenElement){ try{ document.exitFullscreen().catch(() => {}); }catch(e){} }
  const p = document.getElementById("gamePlayer");
  if(p){ p.classList.remove("open"); p.querySelectorAll("iframe").forEach(f => f.remove()); }
  gamesActiveCard = null;
}
window.Games={stop:gameStop};
