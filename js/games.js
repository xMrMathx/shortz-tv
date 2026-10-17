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
  { title:"Meatwave", cat:"Zombie Co-op", orient:"landscape",
    embed:"https://www.meatwave.io/",
    thumb:"games-img/meatwave.png",
    sub:"ONLINE CO-OP zombie survival — up to 4 players team up by lobby code and hold out against the waves · free, no signup (co-op server verified live 2026-10-16). Top-down twin-stick — touch controls under test." },
  { title:"Dead Land: Survival", cat:"Zombie Survival", orient:"landscape",
    embed:"https://playgama.com/export/game/dead-land-survival",
    thumb:"https://static.playgama.com/p-img/pg/dead-land-survival/big_preview/3ec05c224d064e1789d0a98fd4a9d048?width=1200",
    sub:"ONLINE zombie survival — rebuild your settlement, craft, run quests and team up with friends and clanmates for boss raids · free, guest play (game verified loading live 2026-10-16). Isometric — touch controls under test." },
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
  if(gamesBuilt&&v.querySelector(".gcards")){ try{dubsPaint()}catch(e){} return; }
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
  try{dubsPaint()}catch(e){}
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
  try{ dubsStart(g); }catch(e){}
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
  try{ dubsStop(); }catch(e){}
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

/* ============================================================
   SHORTZ DUBS (his order 2026-10-17) — the app's own award
   system for the Games shelf. Not "trophies" (PlayStation),
   not "achievements" (Xbox) — DUBS, his crowned name: wins
   you collect by playing. Every Dub pays Stake Coins through
   the existing Stake path (Stake.coins + saveCoins, only after
   Stake has loaded the real balance — the Brain audit's race
   warning). Shelf games are third-party embeds that report
   nothing back, so Dubs are earned by PLAY: launches, variety,
   time in game, day streaks, multiplayer sessions. Real win
   Dubs belong to our own games only (a later piece).
   State: localStorage "shortztv_dubs"; unlocks mirrored to
   RTDB directory/{uid}/trophies (same store as coins/likes).
   The unlock banner is his crowned mockup: Xbox rise-and-
   expand wearing PlayStation dark glass, gold on charcoal,
   payout plate always fully in frame.
   ============================================================ */
const DUB_TIERS={
  bronze:{label:"BRONZE DUB",color:"#eda96b",grad:"linear-gradient(145deg,#eda96b,#b06a2c)"},
  silver:{label:"SILVER DUB",color:"#d7dbe2",grad:"linear-gradient(145deg,#f2f4f8,#9aa3b2 60%,#6e7684)"},
  gold:{label:"GOLD DUB",color:"#f6c945",grad:"linear-gradient(145deg,#ffe9a8,#f6c945 55%,#c9930a)"},
  crown:{label:"CROWN DUB",color:"#ffd968",grad:"linear-gradient(145deg,#fff3c4,#f6c945 50%,#a87b00)"}
};
function dubIsOnline(g){ return /ONLINE/.test((g&&g.sub)||"") || /ONLINE/.test((g&&g.cat)||""); }
function dubDistinct(s){ return Object.keys(s.plays||{}).length; }
function dubOnlineDistinct(s){ return Object.keys(s.onlinePlays||{}).length; }
const DUB_DEFS=[
 {id:"first_bell",tier:"bronze",name:"First Bell",sub:"Play your first game",coins:10,goal:s=>({cur:Math.min(s.totalPlays,1),target:1})},
 {id:"getting_around",tier:"bronze",name:"Getting Around",sub:"Play 3 different games",coins:10,goal:s=>({cur:Math.min(dubDistinct(s),3),target:3})},
 {id:"warm_up",tier:"bronze",name:"Warm-Up",sub:"Play 15 minutes total",coins:10,goal:s=>({cur:Math.min(Math.floor(s.totalSecs/60),15),target:15,unit:"min"})},
 {id:"explorer",tier:"silver",name:"Shelf Explorer",sub:"Play 10 different games",coins:25,goal:s=>({cur:Math.min(dubDistinct(s),10),target:10})},
 {id:"tag_team",tier:"silver",name:"Tag Team",sub:"Play an online multiplayer game",coins:25,goal:s=>({cur:Math.min(dubOnlineDistinct(s),1),target:1})},
 {id:"marathon",tier:"silver",name:"Marathon",sub:"Play 1 hour total",coins:25,goal:s=>({cur:Math.min(Math.floor(s.totalSecs/60),60),target:60,unit:"min"})},
 {id:"regular",tier:"silver",name:"The Regular",sub:"Play 3 days in a row",coins:25,goal:s=>({cur:Math.min(s.bestStreak,3),target:3,unit:"days"})},
 {id:"full_shelf",tier:"gold",name:"Full Shelf",sub:"Play every game on the shelf",coins:50,goal:s=>({cur:dubDistinct(s),target:GAMES.length,unit:"games"})},
 {id:"life_of_party",tier:"gold",name:"Life of the Party",sub:"Play 5 different online multiplayer games",coins:50,goal:s=>({cur:Math.min(dubOnlineDistinct(s),5),target:5})},
 {id:"iron_man",tier:"gold",name:"Iron Man",sub:"Play 5 hours total",coins:50,goal:s=>({cur:Math.min(Math.floor(s.totalSecs/60),300),target:300,unit:"min"})},
 {id:"no_days_off",tier:"crown",name:"No Days Off",sub:"Play 7 days in a row",coins:250,goal:s=>({cur:Math.min(s.bestStreak,7),target:7,unit:"days"})},
 {id:"completionist",tier:"crown",name:"The Completionist",sub:"Earn every other Dub",coins:250,goal:s=>({cur:Object.keys(s.unlocked).filter(k=>k!=="completionist").length,target:11,unit:"Dubs"})}
];
function dubsDefaults(){ return {plays:{},onlinePlays:{},totalPlays:0,totalSecs:0,days:{},lastDay:"",streak:0,bestStreak:0,unlocked:{},pendingCoins:0,dubCoins:0}; }
function dubsLoad(){ try{ const d=JSON.parse(localStorage.getItem("shortztv_dubs")||"null"); if(d&&typeof d==="object") return Object.assign(dubsDefaults(),d); }catch(e){} return dubsDefaults(); }
let DUBS_STATE=dubsLoad();
function dubsSave(){ try{ localStorage.setItem("shortztv_dubs",JSON.stringify(DUBS_STATE)); }catch(e){} }
let dubSession=null;
function dubsDayTouch(){
  const s=DUBS_STATE, today=new Date().toISOString().slice(0,10);
  if(s.lastDay===today) return;
  const yest=new Date(Date.now()-864e5).toISOString().slice(0,10);
  s.streak=(s.lastDay===yest)?(s.streak||0)+1:1;
  s.bestStreak=Math.max(s.bestStreak||0,s.streak);
  s.lastDay=today; s.days[today]=1;
}
function dubsStart(g){
  if(!g) return;
  dubsDayTouch();
  const s=DUBS_STATE;
  s.totalPlays++;
  s.plays[g.title]=(s.plays[g.title]||0)+1;
  if(dubIsOnline(g)) s.onlinePlays[g.title]=(s.onlinePlays[g.title]||0)+1;
  dubSession={title:g.title,start:Date.now()};
  dubsSave();
  setTimeout(()=>{ try{ dubsCheck(); }catch(e){} }, 900);
}
function dubsStop(){
  if(!dubSession) return;
  const secs=Math.min(Math.floor((Date.now()-dubSession.start)/1000), 4*3600);
  dubSession=null;
  if(secs>0){ DUBS_STATE.totalSecs+=secs; dubsSave(); }
  try{ dubsCheck(); }catch(e){}
  try{ dubsPaint(); }catch(e){}
}
function dubsCheck(){
  const s=DUBS_STATE; let changed=false;
  for(const d of DUB_DEFS){
    if(s.unlocked[d.id]) continue;
    let g=null; try{ g=d.goal(s); }catch(e){}
    if(g&&g.cur>=g.target){
      s.unlocked[d.id]=Date.now();
      s.pendingCoins+=d.coins; s.dubCoins+=d.coins; changed=true;
      dubQueuePopup(d);
      dubMirror(d);
    }
  }
  if(changed){ dubsSave(); dubsFlushCoins(); try{ dubsPaint(); }catch(e){} }
}
function dubMirror(d){
  try{
    if(window.Live&&Live.authed&&Live.db&&Live.uid){
      Live.db.ref("directory/"+Live.uid+"/trophies/"+d.id).set({ts:Date.now(),coins:d.coins});
      Live.db.ref("directory/"+Live.uid+"/trophiesMeta").update({count:Object.keys(DUBS_STATE.unlocked).length,dubCoins:DUBS_STATE.dubCoins});
    }
  }catch(e){}
}
function dubsFlushCoins(){
  const s=DUBS_STATE;
  if(!(s.pendingCoins>0)) return;
  try{
    if(window.Stake&&Stake._coinsLoaded&&Stake.uid){
      Stake.coins+=s.pendingCoins; s.pendingCoins=0; dubsSave();
      Stake.saveCoins();
    }
  }catch(e){}
}
setInterval(()=>{ try{ dubsFlushCoins(); }catch(e){} }, 4000);
/* the unlock banner — his crowned mockup, v2 (payout in frame) */
let dubPopQueue=[], dubPopBusy=false;
function dubQueuePopup(d){ dubPopQueue.push(d); if(!dubPopBusy) dubPopNext(); }
function dubPopNext(){
  const d=dubPopQueue.shift(); if(!d){ dubPopBusy=false; return; }
  dubPopBusy=true; dubShowPop(d); setTimeout(dubPopNext, 4700);
}
function dubShowPop(d){
  const t=DUB_TIERS[d.tier]||DUB_TIERS.bronze;
  let el=document.getElementById("dubPop");
  if(!el){ el=document.createElement("div"); el.id="dubPop"; document.body.appendChild(el); }
  el.className=""; void el.offsetWidth;
  el.innerHTML=`<div class="dubMed"><div class="dubDisc" style="background:${t.grad}">W</div>${d.tier==="crown"?'<svg class="dubCrown" viewBox="0 0 24 24"><path d="M3 17 L2 7 L8 11 L12 4 L16 11 L22 7 L21 17 Z" fill="#f6c945" stroke="#8a6400"/></svg>':""}</div>`
    +`<div class="dubTxt"><div class="dubKick" style="color:${t.color}">${t.label} — DUB EARNED</div><div class="dubName">${esc(d.name)}</div><div class="dubSub">${esc(d.sub)}</div></div>`
    +`<div class="dubChip"><span class="dubCoin">S</span><span class="dubAmt"><b>+${Number(d.coins).toLocaleString()}</b><span>STAKE COINS</span></span></div>`;
  if(d.tier==="crown") el.classList.add("crown");
  requestAnimationFrame(()=>{ requestAnimationFrame(()=>{ el.classList.add("in"); }); });
  setTimeout(()=>{ el.classList.remove("in"); el.classList.add("out"); }, 3900);
  setTimeout(()=>{ el.classList.remove("out"); }, 4450);
}
/* the Games-view panel + My Dubs case */
function dubGoalText(g){ return g.cur+" / "+g.target+(g.unit?" "+g.unit:""); }
function dubsPaint(){
  const v=document.getElementById("view-games"); if(!v) return;
  let p=document.getElementById("dubsPanel");
  if(!p){ p=document.createElement("div"); p.id="dubsPanel"; v.insertBefore(p, v.firstChild); }
  const s=DUBS_STATE, earned=Object.keys(s.unlocked).length;
  let next=null;
  for(const d of DUB_DEFS){ if(s.unlocked[d.id]) continue; let g=null; try{ g=d.goal(s); }catch(e){} if(!g) continue; const frac=g.target?Math.min(g.cur/g.target,1):0; if(!next||frac>next.frac) next={d,g,frac}; }
  p.innerHTML=`<div class="dubPanelHead"><span class="dubPanelW">W</span><div class="dubPanelT"><b>SHORTZ DUBS</b><span>${earned} of ${DUB_DEFS.length} earned · ${s.dubCoins} Stake Coins won</span></div><button class="dubPanelBtn" id="dubCaseBtn">MY DUBS</button></div>`
    +(next?`<div class="dubNext"><span>NEXT: <b>${esc(next.d.name)}</b> — ${dubGoalText(next.g)}</span><div class="dubBar"><i style="width:${Math.round(next.frac*100)}%"></i></div></div>`:`<div class="dubNext"><span>Every Dub earned. You run this shelf.</span></div>`);
  const b=document.getElementById("dubCaseBtn"); if(b) b.addEventListener("click", dubCaseOpen);
}
function dubCaseOpen(){
  let o=document.getElementById("dubCase");
  if(!o){
    o=document.createElement("div"); o.id="dubCase";
    o.innerHTML=`<div class="dubCaseHead"><b>MY DUBS</b><button class="dubCaseX" data-dubx>✕ Close</button></div><div class="dubCaseList"></div>`;
    document.body.appendChild(o);
    o.querySelector("[data-dubx]").addEventListener("click", ()=>o.classList.remove("open"));
  }
  const s=DUBS_STATE;
  o.querySelector(".dubCaseList").innerHTML=DUB_DEFS.map(d=>{
    const t=DUB_TIERS[d.tier], un=!!s.unlocked[d.id];
    let g=null; try{ g=d.goal(s); }catch(e){}
    return `<div class="dubRow ${un?"got":""}"><div class="dubDisc sm" style="background:${t.grad}">W</div><div class="dubRowT"><b>${esc(d.name)}</b><span>${esc(d.sub)}</span>${(!un&&g)?`<div class="dubBar sm"><i style="width:${Math.round(Math.min(g.cur/g.target,1)*100)}%"></i></div><span class="dubProg">${dubGoalText(g)}</span>`:""}</div><div class="dubRowR"><span class="dubTier" style="color:${t.color}">${t.label}</span><span class="dubRowCoins">${un?"EARNED · +":"+"}${d.coins} coins</span></div></div>`;
  }).join("");
  o.classList.add("open");
}
/* FOUNDER ACTIVATION (his order 2026-10-17): the owner's own
   account starts on top — a one-time grant to 1,000,000 Stake
   Coins, keyed to his sign-in, recorded so it never repeats. */
const DUB_FOUNDER_EMAIL="craigjrbb@gmail.com";
let dubFounderDone=false;
async function dubsFounder(){
  if(dubFounderDone) return;
  try{
    const a=(window.Live&&Live.auth)||(window.firebase&&firebase.auth?firebase.auth():null);
    const u=a&&a.currentUser;
    if(!u||(u.email||"").toLowerCase()!==DUB_FOUNDER_EMAIL) return;
    if(!(window.Stake&&Stake._coinsLoaded&&Stake.uid&&window.Live&&Live.db)) return;
    const ref=Live.db.ref("directory/"+Stake.uid+"/coins");
    const snap=await ref.once("value"); const c=snap.val()||{};
    if(c.founderGrant){ dubFounderDone=true; return; }
    const GRANT=1000000;
    if((Stake.coins||0)<GRANT) Stake.coins=GRANT;
    await ref.update({balance:Math.round(Stake.coins),founderGrant:Date.now()});
    try{ Stake.paintPill(); }catch(e){}
    dubFounderDone=true;
    dubQueuePopup({tier:"crown",name:"The Vault",sub:"Founder activation — welcome home, Mr. Math",coins:GRANT});
  }catch(e){}
}
setInterval(()=>{ try{ dubsFounder(); }catch(e){} }, 5000);
window.Dubs={defs:DUB_DEFS,state:()=>DUBS_STATE,check:dubsCheck,paint:dubsPaint,openCase:dubCaseOpen,start:dubsStart,stop:dubsStop};
