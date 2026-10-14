/* ============================================================
   GAMES (his order 2026-10-14) — a new section in the ring
   between Manga and Profile. Publisher-embed games (licensed
   for exactly this) in a Home-style CARD FEED: scroll the
   cards, tap one, it plays inside the card — nothing ever
   downloads. Landscape games offer fullscreen (the APK can
   hold the phone sideways); portrait games stay one-handed.
   Test shelf: one FPS, one sports, one puzzle.
   ============================================================ */
const GAMES=[
  { title:"Masked Forces", cat:"First-Person Shooter", orient:"landscape",
    embed:"https://html5.gamedistribution.com/b9470c6050344e3da132533e877ebf8c/",
    thumb:"https://img.gamedistribution.com/b9470c6050344e3da132533e877ebf8c-512x384.jpeg",
    sub:"Online FPS — campaign and multiplayer battles. Gun in hand, like the big apps." },
  { title:"Penalty Shooters 2", cat:"Sports", orient:"landscape",
    embed:"https://html5.gamedistribution.com/571b9df027e449f78e3869ba19658754/",
    thumb:"https://img.gamedistribution.com/571b9df027e449f78e3869ba19658754-512x384.jpeg",
    sub:"Pick your team, take the penalties, then guard the goal. Touch to aim and dive." },
  { title:"Tile Master Deluxe", cat:"Puzzle", orient:"portrait",
    embed:"https://html5.gamedistribution.com/9e669ebc80ff472d9dca79362b75325f/",
    thumb:"https://img.gamedistribution.com/9e669ebc80ff472d9dca79362b75325f-512x384.jpeg",
    sub:"Match the tiles, clear the board. One hand, tap to play." },
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
function gameMount(card,g){
  if(!card||!g)return;
  gameStop();
  gamesActiveCard=card;
  const fr=card.querySelector("[data-gframe]"), stage=card.querySelector(".gcard-stage");
  fr.innerHTML=`<iframe src="${esc(g.embed)}" allow="autoplay; fullscreen; gamepad; keyboard-mouse" allowfullscreen title="${esc(g.title)}"></iframe>`
    +`<button class="gstop" data-gstop>✕ Close</button>`;
  fr.querySelector("[data-gstop]").addEventListener("click",()=>gameStop());
  // landscape games belong sideways: try fullscreen + lock —
  // where the platform refuses (iPhone web), the card still plays in place
  if(g.orient!=="portrait"&&stage&&stage.requestFullscreen){
    try{
      const p=stage.requestFullscreen({navigationUI:"hide"});
      if(p&&p.then)p.then(()=>{ try{ if(screen.orientation&&screen.orientation.lock)screen.orientation.lock("landscape").catch(()=>{}); }catch(e){} }).catch(()=>{});
    }catch(e){}
  }
  try{ card.scrollIntoView({block:"center",behavior:"smooth"}); }catch(e){}
}
function gameStop(){
  if(document.fullscreenElement){ try{ document.exitFullscreen().catch(()=>{}); }catch(e){} }
  if(!gamesActiveCard)return;
  const i=+gamesActiveCard.dataset.gcard, fr=gamesActiveCard.querySelector("[data-gframe]");
  if(fr&&GAMES[i])fr.innerHTML=gamePosterHTML(GAMES[i]);
  const b=fr?fr.querySelector("[data-gplay]"):null;
  if(b)b.addEventListener("click",()=>gameMount(gamesActiveCard,GAMES[i]));
  gamesActiveCard=null;
}
window.Games={stop:gameStop};
