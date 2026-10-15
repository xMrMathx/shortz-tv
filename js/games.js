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
   POOL CLUB IS OUT (2026-10-14, his phone): its Playgama export door
   opens onto a playhop.com dist-app document that FRAME-BLOCKS us
   (ERR_BLOCKED_BY_RESPONSE in the player) — the export 200 was real,
   the game behind it refuses embedding. Marker for next time: its art
   lived under p-img/ph/ (Playhop) while working titles use p-img/pg/.
   Swapped for Eco Pool Online at his word ("the other multiplayer
   one") — public matchmaking, no private room; its framing is
   unproven until his phone says so.
   SPECIAL OPS: GO + DARK CITY ARE OUT (2026-10-14, his phone: "those
   don't work") — a channel 200 and good paperwork are NOT a working
   game; only his device crowns a title. RIVALS FPS + WARFARE 1942
   passed his testing same night ("everything else is good").
   DEADSHOT.IO IS OUT (2026-10-14, his phone): the CrazyGames embed
   document loads, but the game itself serves "DEADSHOT.io is no
   longer available" at runtime — a channel 200 is not a playable
   game. HAZMOB FPS IS THE CROWNED FLAGSHIP — phone-verified by him
   same evening: "works perfectly fine, it is so cold, it's so
   perfect." Touch, lobbies, in-app: all proven on his device.
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
  { title:"RIVALS FPS: Online Shooter", cat:"First-Person Shooter", orient:"landscape",
    embed:"https://playgama.com/export/game/rivals-fps-online-shooter",
    thumb:"https://static.playgama.com/p-img/pg/rivals-fps-online-shooter/big_preview/f09adf25db724a509d28d6427dfd4d7c?width=1200",
    sub:"ONLINE multiplayer — Deathmatch, 1v1, Team Deathmatch, Battle Royale. Joystick + on-screen buttons." },
  { title:"Warfare 1942", cat:"First-Person Shooter", orient:"landscape",
    embed:"https://playgama.com/export/game/warfare-1942",
    thumb:"https://static.playgama.com/p-img/pg/warfare-1942/big_preview/b6d2f1acce5f428d8f2c3aa570f34660?width=1200",
    sub:"ONLINE multiplayer WW2 FPS — full on-screen touch layout: move left side, aim right side, buttons for the rest." },
  { title:"Commando Force 2", cat:"First-Person Shooter", orient:"landscape",
    embed:"https://playgama.com/export/game/commando-force-2",
    thumb:"https://static.playgama.com/p-img/pg/commando-force-2/big_preview/83606346549d4c5dbcde95004e61f5a5?width=1200",
    sub:"ONLINE multiplayer vs real people — Team Play, Free-for-All, Gun Race, Sniper Only. Virtual joystick + on-screen buttons, auto-aim in settings." },
  { title:"Eco Pool Online", cat:"Billiards", orient:"landscape",
    embed:"https://playgama.com/export/game/eco-pool-online",
    thumb:"https://static.playgama.com/p-img/pg/eco-pool-online/big-preview/7c9668d7721e4f548f17ae043dfe503d?width=1200",
    sub:"ONLINE 1v1 pool duels against real players on separate phones, plus a solo challenge series. (No private rooms — matchmaking only.)" },
  { title:"BitLife - Life Simulator", cat:"Life Simulator", orient:"portrait",
    embed:"https://html5.gamemonetize.co/sunlne8825d1006jux3b1xrl9vda49f1/",
    thumb:"https://img.gamemonetize.com/sunlne8825d1006jux3b1xrl9vda49f1/512x384.jpg",
    sub:"Born, choose, age up year by year — school, career, love, money, health, all the way to the grave. The full life loop, tall like the phone app. (The channel's life sim under this name — not Candywriter's app-store original; he knows, his pick 2026-10-14.)" },
  { title:"Millionaire Life", cat:"Life Simulator", orient:"portrait",
    embed:"https://playgama.com/export/game/millionaire-life",
    thumb:"https://static.playgama.com/p-img/pg/millionaire-life/big_preview/cfdbe49b492d4eac95856419c2c16e05?width=1200",
    sub:"You hit the lottery — a chain of spending choices and bold moves up the outrageous wealthy life. 4.7 stars from 18,000+ players." },
  { title:"My Town Home: Family Playhouse", cat:"Dollhouse Life", orient:"landscape",
    embed:"https://playgama.com/export/game/my-town-home-family-playhouse",
    thumb:"https://static.playgama.com/p-img/pg/my-town-home-family-playhouse/big_preview/7cfc3b9750e84aceb634888d9518f8d3?width=1200",
    sub:"Pick a family and live their stories in a big two-story dollhouse — cook, garden, move room to room, invent the day." },
  { title:"Mom Life Simulator: Baby Care", cat:"Daily Life", orient:"landscape",
    embed:"https://playgama.com/export/game/mom-life-simulator-baby-care",
    thumb:"https://static.playgama.com/p-img/pg/mom-life-simulator-baby-care/big_preview/8fab63cf520a4823bd2161fa9720d72a?width=1200",
    sub:"Play a mom running daily family life in 3D — household and baby-care missions, level by level." },
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
  // his order 2026-10-14: the app's own floating top buttons (hub grid +
  // TV, z-9600) sit ABOVE this player (z-9000) — while a game is open
  // they step off the screen; gameStop() brings them back
  document.body.classList.add("playing-game");
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
  document.body.classList.remove("playing-game");
  if(document.fullscreenElement){ try{ document.exitFullscreen().catch(() => {}); }catch(e){} }
  const p = document.getElementById("gamePlayer");
  if(p){ p.classList.remove("open"); p.querySelectorAll("iframe").forEach(f => f.remove()); }
  gamesActiveCard = null;
}
/* the Games row inside Browse (his order 2026-10-14): fed by THIS list —
   the shelf has one source of truth, and a tap lands on the game's card
   in the Games section (card-first rules intact; playing starts there) */
function renderGamesShelf(){
  const sec=document.getElementById("gamesSec"),row=document.getElementById("gamesRow");
  if(!sec||!row||!GAMES.length)return;
  row.innerHTML=GAMES.map(g=>
    '<div class="gm-item" data-gtitle="'+esc(g.title)+'">'+
      '<img decoding="async" src="'+esc(g.thumb)+'" alt="" loading="lazy" onerror="this.style.display=\'none\'">'+
      '<div class="gm-play">\u25b6</div>'+
      '<div class="award-t">'+esc(g.title)+'</div>'+
      '<div class="award-e">'+esc(g.cat)+'</div>'+
    '</div>').join("");
  row.querySelectorAll(".gm-item").forEach(it=>{
    it.addEventListener("click",()=>{ gamePresent(it.getAttribute("data-gtitle")); });
  });
  const all=document.getElementById("gamesAll");
  if(all)all.onclick=()=>{ try{ renderView("games"); }catch(e){} try{ go("games"); }catch(e){} };
  sec.style.display="";
}
function gamePresent(title){
  try{ renderView("games"); }catch(e){}
  try{ go("games"); }catch(e){}
  setTimeout(()=>{
    const card=[...document.querySelectorAll("#view-games .gcard")].find(c=>{
      const n=c.querySelector(".gcard-name"); return n && n.textContent===title;
    });
    if(!card)return;
    try{ card.scrollIntoView({block:"center",behavior:"smooth"}); }catch(e){ card.scrollIntoView(); }
    card.classList.add("gspot");
    setTimeout(()=>card.classList.remove("gspot"),1900);
  },380);
}
window.Games={stop:gameStop,list:()=>GAMES,present:gamePresent,renderShelf:renderGamesShelf};
try{ renderGamesShelf(); }catch(e){}
