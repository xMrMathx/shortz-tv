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
  { title:"Rummy Multiplayer", cat:"Card Game", orient:"landscape",
    embed:"https://html5.gamemonetize.co/3v46j2mwch01pteg5do49xw7a1otu69x/",
    thumb:"https://img.gamemonetize.com/3v46j2mwch01pteg5do49xw7a1otu69x/512x384.jpg",
    sub:"ONLINE rummy vs real people on other phones — public matchmaking, plus vs computer. Plain rummy, not Phase 10." },
  { title:"Pro Football Eleven 2027", cat:"Football", orient:"landscape",
    embed:"https://html5.gamemonetize.co/nsvqmdi6fps4dvi4a2n3yvnnvnq73ost/",
    thumb:"https://img.gamemonetize.com/nsvqmdi6fps4dvi4a2n3yvnnvnq73ost/512x384.jpg",
    sub:"Full 11v11 football — work the ball up the pitch and beat the keeper, vs the computer. His pick from the top-sports list." },
  { title:"PunchBox 3D", cat:"Boxing", orient:"landscape",
    embed:"https://playgama.com/export/game/punchbox-3d",
    thumb:"https://static.playgama.com/p-img/pg/punchbox-3d/big_preview/d03aaa2ef6ec46c9a3bf42c8a4277f02?width=1200",
    sub:"3D boxing career — fight rivals in the ring, build your stats, climb to the belt · solo vs the computer. 4.4 stars from 141 players." },
  { title:"Boxing Stars", cat:"Boxing", orient:"landscape",
    embed:"https://playgama.com/export/game/boxing-stars",
    thumb:"https://static.playgama.com/p-img/pg/boxing-stars/big_preview/e924e27fd059432aaceb25596fa1695a?width=1200",
    sub:"3D boxing career — underground circuit to the championship, tournaments, trainable abilities, knockouts · solo vs the computer." },
  { title:"Rim Rebels 3v3", cat:"Basketball", orient:"landscape",
    embed:"https://playgama.com/export/game/rim-rebels-3v3",
    thumb:"https://static.playgama.com/p-img/pg/rim-rebels-3v3/big_preview/094c1018417f47698154ac9742c03e5f?width=1200",
    sub:"ONLINE 3v3 street basketball — quick match vs real people, or a room code to play a friend · plus vs computer. Brand-new (4.1 stars, 7 ratings) — lobbies unproven." },
  { title:"Football 2026", cat:"Football", orient:"landscape",
    embed:"https://playgama.com/export/game/football-2026",
    thumb:"https://static.playgama.com/p-img/pg/football-2026/big-preview/2237fc6b7b104ab5ba0ef43348407fac?width=1200",
    sub:"Full-match 3D soccer — career mode with a national team, championships and tournaments, Amateur to Legendary · solo vs the computer. 4.5 stars from 2,162 players." },
  { title:"2 Minute Football QB Legend", cat:"American Football", orient:"landscape",
    embed:"https://playgama.com/export/game/2-minute-football-qb-legend",
    thumb:"https://static.playgama.com/p-img/pg/2-minute-football-qb-legend/big-preview/a2e92873908445478f326006daa1c0d5?width=1200",
    sub:"Quarterback game — read the field, thread passes, run two-minute drives to the championship · solo. 4.7 stars from 172 players." },
  { title:"Epic Battle Simulator 2", cat:"Battle Simulator", orient:"landscape",
    embed:"https://playgama.com/export/game/epic-battle-simulator-2",
    thumb:"https://static.playgama.com/p-img/pg/epic-battle-simulator-2/big-preview/5c1998558eb34c5aa9d63d8843542aa5?width=1200",
    sub:"Build the battle, then watch it — place your troops and spectate the ragdoll war · 100+ campaign battles + design-your-own custom mode · solo. 4.7 stars from 4,931 players." },
  { title:"Blue versus Red: Who's better?", cat:"First-Person Shooter", orient:"landscape",
    embed:"https://playgama.com/export/game/blue-versus-red-whos-better",
    thumb:"https://static.playgama.com/p-img/pg/blue-versus-red-whos-better/big_preview/a65b6a0546f14ef9adf447f57860a120?width=1200",
    sub:"ONLINE arena FPS — Team Deathmatch, Free-For-All and zombie mode, short matches, weapon upgrades · joystick + swipe aim. Small new base (4.5 stars, 125 ratings) — lobbies unproven." },
  { title:"ObbloxGun.io 3D FPS Shooter", cat:"First-Person Shooter", orient:"landscape",
    embed:"https://playgama.com/export/game/obbloxgunio-3d-fps-shooter",
    thumb:"https://static.playgama.com/p-img/pg/obbloxgunio-3d-fps-shooter/big_preview/cd770d75f8e64c1884c7520f35bc267e?width=1200",
    sub:"ONLINE arena FPS — fast kill-driven matches · auto-aim and auto-fire on mobile · blocky arena look. (4.3 stars, 102 ratings — lobbies unproven.)" },
  { title:"Chicken Strike", cat:"First-Person Shooter", orient:"landscape",
    embed:"https://playgama.com/export/game/chicken-strike",
    thumb:"https://static.playgama.com/p-img/pg/chicken-strike/big_preview/905e151eb58b4b9eb83fcc2bdc9ca61d?width=1200",
    sub:"Team deathmatch as armed chickens — loadouts, skins, ranks · its page claims team multiplayer; reports conflict, unproven. (4.3 stars, 112 ratings.)" },
  { title:"SWAT OPS: Body Camera", cat:"First-Person Shooter", orient:"landscape",
    embed:"https://playgama.com/export/game/swat-ops-body-camera",
    thumb:"https://static.playgama.com/p-img/pg/swat-ops-body-camera/big_preview/4ade3f1257e841abbe6c3704466b8c2d?width=1200",
    sub:"Body-camera FPS — 3-minute Deathmatch and 4v4 Team Deathmatch against BOTS (not online), 4 maps, 100+ weapon skins. The Venge feel in bot matches · his pick." },
  { title:"Party Games Mini Shooter Battle", cat:"Top-Down Shooter", orient:"landscape",
    embed:"https://playgama.com/export/game/party-games-mini-shooter-battle",
    thumb:"https://static.playgama.com/p-img/pg/party-games-mini-shooter-battle/big-preview/1df03c20a9274246abfbde5c76475520?width=1200",
    sub:"Mini top-down arena battles — free-for-all, weapon drops, dash button · billed as multiplayer with friends; online versus unproven, may be same-device. (4.2 stars, 103 ratings.)" },
  { title:"Hotline Miami", cat:"Top-Down Shooter", orient:"landscape",
    embed:"https://html5.gamemonetize.co/9hox58eqiu1ghoxfy80v691ijtd2ou92/",
    thumb:"https://img.gamemonetize.com/9hox58eqiu1ghoxfy80v691ijtd2ou92/512x384.jpg",
    sub:"Top-down twin-stick room-clearing — left stick moves, right stick shoots · solo. (A fan-made namesake of the 2012 classic — the channel's clone under this name; his pick.)" },
  { title:"Outbreak Ops", cat:"Top-Down Shooter", orient:"landscape",
    embed:"https://html5.gamemonetize.co/h8tqlnll0m80exyi5l7q8eggc2p8zkyc/",
    thumb:"https://img.gamemonetize.com/h8tqlnll0m80exyi5l7q8eggc2p8zkyc/512x384.jpg",
    sub:"Top-down zombie shooter — virtual joystick, dash and grenades, unlockable weapons · solo waves and missions." },
  { title:"Tank Arena Multiplayer", cat:"Top-Down Shooter", orient:"landscape",
    embed:"https://playgama.com/export/game/tank-arena-multiplayer",
    thumb:"https://static.playgama.com/p-img/pg/tank-arena-multiplayer/big-preview/afece83b5238464b8564375629db263d?width=1200",
    sub:"ONLINE top-down tank arena — real-time matches up to 4 players · twin-stick touch: left stick moves, right stick aims · plus bots to practice. Thin base (4.2 stars, 112 ratings)." },
  { title:"Online Car Destruction Simulator 3D", cat:"Racing", orient:"landscape",
    embed:"https://playgama.com/export/game/online-car-destruction",
    thumb:"https://static.playgama.com/p-img/pg/online-car-destruction/big-preview/39924242bbdd4fe0b34a807e27611dc2?width=1200",
    sub:"ONLINE co-play crash sandbox — one shared world with real players and a leaderboard; smash cars together · not a structured versus mode. Deepest base: 4.7 stars, 7,036 ratings." },
  { title:"Chess Online Multiplayer", cat:"Board", orient:"portrait",
    embed:"https://playgama.com/export/game/chess-online-multiplayer",
    thumb:"https://static.playgama.com/p-img/pg/chess-online-multiplayer/big_preview/94a907a44037494c955d803fb45ec5fd?width=1200",
    sub:"ONLINE chess — ranked duels against players worldwide plus direct friend challenges · tap-and-drag pieces, legal moves lit up. 4.6 stars, 6,399 ratings." },
  { title:"English Checkers Online Multiplayer", cat:"Board", orient:"portrait",
    embed:"https://playgama.com/export/game/english-checkers-online-multiplayer",
    thumb:"https://static.playgama.com/p-img/pg/english-checkers-online-multiplayer/big_preview/fc3eed1af47c484da91e805482fee74e?width=1200",
    sub:"ONLINE checkers — live PvP against real opponents, rating ladder, five time controls · plus AI (10 levels) and local play. 4.6 stars, 5,778 ratings." },
  { title:"Domino Online Multiplayer", cat:"Board", orient:"portrait",
    embed:"https://playgama.com/export/game/domino-online-multiplayer",
    thumb:"https://static.playgama.com/p-img/pg/domino-online-multiplayer/big_preview/aa648994ddda4f9aad9c2f07a72ee3f6?width=1200",
    sub:"ONLINE dominoes — real-time ranked duels with live chat, or challenge a friend by link · tap to play. 4.4 stars, 1,337 ratings." },
  { title:"Zombie Madness", cat:"Third-Person Shooter", orient:"landscape",
    embed:"https://html-classic.itch.zone/html/7899881/Poc%20WebGL%20gzip/index.html",
    thumb:"games-img/zombie-madness.png",
    sub:"Third-person SWAT shooter vs zombie waves in a desert town · built for phones — full on-screen touch controls. Solo vs AI." },
  { title:"Survev.io", cat:"Battle Royale", orient:"landscape",
    embed:"https://survev.io/",
    thumb:"games-img/survev.png",
    sub:"ONLINE battle royale — 50 players drop in, loot up, last one standing as the red zone closes · Solo, Duo and Squad, live lobbies. Top-down, touch controls." },
  { title:"ZombsRoyale.io", cat:"Battle Royale", orient:"landscape",
    embed:"https://zombsroyale.io/",
    thumb:"games-img/zombsroyale.png",
    sub:"ONLINE battle royale — 100 players, gas closing in, Solo, Duos and Squads · free, cosmetics only. Top-down shooter — touch controls under test." },
  { title:"BuildRoyale.io", cat:"Battle Royale", orient:"landscape",
    embed:"https://buildroyale.io/",
    thumb:"games-img/buildroyale.png",
    sub:"ONLINE battle royale with building — up to 100 per match, storm closing, Solo, Duos and Squad · free. Top-down, touch controls." },
];
/* HUNT ZONE IS OUT (2026-10-15, Brain audit before his phone test): the
   game itself is a Playhop dist-app document (playhop.com/dist-app) —
   the exact pattern that frame-blocked Pool Club on his phone — and
   Playgama flags the title is_hidden / NOT in the export catalog, so
   the door was never officially open. Pulled pre-emptively build after
   …8414; do not re-add unless its door changes class. */
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
