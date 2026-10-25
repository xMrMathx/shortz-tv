/* SHORTZ AGENT — the mic, grown into an agent (VISION-SPEC F1, all six layers).
   Layer 1: command brain — EXTENDS the voice engine (window._voiceCommand),
            never replaces it. Detailed verbs are law: play = plays now via
            cfPresentTitle; bring up / show = Browse (the engine's own rule).
   Layer 5: answers from the app's own data (facts, counts, history).
   Layer 4: on-device memory — what you play through the agent, your usual,
            and the game-stats notebook (window.SZStats) games write to.
   Layer 6: conversation mode — spoken replies + auto-listen loop (a call).
   Layer 2/3 slots: window.SZAgentBrain (cloud free tier) / pocket model —
            consulted for free-form talk when present; absent = Layer 1 only.
   The agent NEVER auto-plays from a find: finds return cards; a card's Play
   button (or an explicit play verb) is the deliberate play. */
(function(){
"use strict";
var $=function(s){return document.querySelector(s)};
function escH(s){ return (typeof esc==="function")?esc(s):String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]}); }
function cat(){ try{ return window.SHORTZ_CATALOG||[]; }catch(e){ return []; } }
function byId(id){ var C=cat(); for(var i=0;i<C.length;i++) if(C[i].id===id) return C[i]; return null; }
function findT(q){ try{ if(window._findSeries) return window._findSeries(q); }catch(e){} return null; }

/* ---------- Layer 4: memory ---------- */
var MEM_KEY="szAgentMem";
function memLoad(){ try{ return JSON.parse(localStorage.getItem(MEM_KEY)||"{}")||{}; }catch(e){ return {}; } }
function memSave(m){ try{ localStorage.setItem(MEM_KEY,JSON.stringify(m)); }catch(e){} }
function memPlay(t){ if(!t||!t.id)return; var m=memLoad(); m.plays=m.plays||[]; m.plays.unshift({id:t.id,g:t.genre||"",ts:Date.now()}); m.plays=m.plays.slice(0,60); memSave(m); }
function usualGenre(){ var m=memLoad(),plays=m.plays||[],score={},i,g; for(i=0;i<plays.length;i++){ g=plays[i].g; if(g) score[g]=(score[g]||0)+1; } var best="",bs=0; for(g in score){ if(score[g]>bs){bs=score[g];best=g;} } return best; }

/* ---------- Layer 4: game-stats notebook ---------- */
var STATS_KEY="szGameStats";
function statsLoad(){ try{ return JSON.parse(localStorage.getItem(STATS_KEY)||"{}")||{}; }catch(e){ return {}; } }
window.SZStats={
  record:function(gameId,gameName,s){
    if(!gameId||!s)return false;
    var all=statsLoad(),g=all[gameId]||{name:gameName||gameId,games:0,totals:{}};
    g.name=gameName||g.name; g.games+=1; g.last={kills:s.kills,deaths:s.deaths,score:s.score,result:s.result,ts:Date.now()};
    ["kills","deaths","score"].forEach(function(k){ if(typeof s[k]==="number") g.totals[k]=(g.totals[k]||0)+s[k]; });
    if(s.result==="win") g.totals.wins=(g.totals.wins||0)+1;
    all[gameId]=g; try{ localStorage.setItem(STATS_KEY,JSON.stringify(all)); }catch(e){}
    return true;
  },
  get:function(gameId){ var all=statsLoad(); return gameId?all[gameId]:all; }
};

/* ---------- sheet UI ---------- */
var CSS=[
"#agSheet{position:fixed;inset:0;z-index:99990;display:none}",
"#agSheet.open{display:block}",
"#agSheet .ag-back{position:absolute;inset:0;background:rgba(0,0,0,.55)}",
"#agSheet .ag-box{position:absolute;left:0;right:0;bottom:0;max-height:82vh;display:flex;flex-direction:column;background:#101014;border-top:1px solid rgba(245,197,66,.35);border-radius:18px 18px 0 0;box-shadow:0 -12px 40px rgba(0,0,0,.6)}",
"#agSheet .ag-head{display:flex;align-items:center;gap:8px;padding:12px 14px 8px;color:#f5c542;font-weight:700;font-size:15px}",
"#agSheet .ag-head .ag-title{flex:1;color:#fff}",
"#agSheet .ag-head button{background:#1c1c22;color:#ddd;border:1px solid #33333d;border-radius:999px;padding:6px 10px;font-size:12px}",
"#agSheet .ag-head button.on{background:#f5c542;color:#111;border-color:#f5c542}",
"#agLog{overflow-y:auto;padding:4px 14px 10px;display:flex;flex-direction:column;gap:8px;min-height:120px}",
".ag-m{max-width:86%;padding:9px 12px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word}",
".ag-m.u{align-self:flex-end;background:#26262e;color:#fff;border-bottom-right-radius:4px}",
".ag-m.a{align-self:flex-start;background:#17171d;color:#eee;border:1px solid #26262e;border-bottom-left-radius:4px}",
".ag-m.live{opacity:.75}",
".ag-cards{align-self:flex-start;display:flex;flex-direction:column;gap:8px;width:92%}",
".ag-card{display:flex;gap:10px;background:#17171d;border:1px solid #2c2c35;border-radius:12px;padding:8px;align-items:center}",
".ag-card img{width:52px;height:74px;object-fit:cover;border-radius:8px;background:#222}",
".ag-card .ag-ci{flex:1;min-width:0}",
".ag-card .ag-ct{color:#fff;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
".ag-card .ag-cm{color:#9a9aa5;font-size:12px;margin-top:2px}",
".ag-card .ag-cb{display:flex;gap:6px;margin-top:6px}",
".ag-card .ag-cb button{border-radius:999px;padding:5px 11px;font-size:12px;border:1px solid #3a3a45;background:#22222a;color:#eee}",
".ag-card .ag-cb button.play{background:#e50914;border-color:#e50914;color:#fff;font-weight:700}",
".ag-chips{display:flex;gap:6px;flex-wrap:wrap;align-self:flex-start}",
".ag-chips button{background:#1c1c22;color:#f5c542;border:1px solid #3a3a45;border-radius:999px;padding:6px 11px;font-size:12px}",
"#agSheet .ag-row{display:flex;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));border-top:1px solid #22222a;align-items:center}",
"#agIn{flex:1;background:#1a1a20;border:1px solid #33333d;border-radius:999px;color:#fff;padding:11px 14px;font-size:14px;outline:none}",
"#agMic,#agSend{width:44px;height:44px;border-radius:50%;border:1px solid #3a3a45;background:#22222a;color:#fff;font-size:18px;flex:0 0 auto}",
"#agMic.listening{background:rgba(229,9,20,.4);border-color:#e50914}",
"#agSend{background:#f5c542;color:#111;border-color:#f5c542;font-weight:700}"
].join("\n");
var styleEl=document.createElement("style"); styleEl.textContent=CSS; document.head.appendChild(styleEl);
var wrap=document.createElement("div"); wrap.id="agSheet"; wrap.setAttribute("aria-hidden","true");
wrap.innerHTML='<div class="ag-back"></div><div class="ag-box" role="dialog" aria-label="Shortz Agent">'
 +'<div class="ag-head"><span class="ag-title">🎙 Shortz Agent</span>'
 +'<button id="agLive" type="button">📞 Live talk</button>'
 +'<button id="agClose" type="button">✕</button></div>'
 +'<div id="agLog"></div>'
 +'<div class="ag-row"><button id="agMic" type="button" aria-label="Talk">🎙</button>'
 +'<input id="agIn" type="text" placeholder="Say or type: play Fearless…" autocomplete="off" enterkeyhint="go">'
 +'<button id="agSend" type="button" aria-label="Send">➤</button></div></div>';
document.body.appendChild(wrap);
var log=$("#agLog"), input=$("#agIn"), liveBtn=$("#agLive"), micBtn=$("#agMic");
var opened=false, greeted=false, liveMode=false, lastViaVoice=false;

/* ---------- speech out (Layer 6) ---------- */
function speak(text){
  try{
    if(!("speechSynthesis" in window))return false;
    speechSynthesis.cancel();
    var u=new SpeechSynthesisUtterance(String(text).replace(/[▶🎙📞✕➤♥]/g,""));
    u.lang="en-US"; u.rate=1.02;
    u.onend=function(){ afterSpeak(); };
    u.onerror=function(){ afterSpeak(); };
    speechSynthesis.speak(u);
    return true;
  }catch(e){ return false; }
}
function afterSpeak(){
  if(liveMode&&opened){
    setTimeout(function(){ if(liveMode&&opened) startListen(); },300);
  }
}

/* ---------- log ---------- */
function addMsg(text,who){
  var d=document.createElement("div"); d.className="ag-m "+(who||"a"); d.textContent=text;
  log.appendChild(d); log.scrollTop=log.scrollHeight; return d;
}
function meta(t){
  var bits=[]; if(t.genre)bits.push(t.genre);
  if(t.runtime)bits.push(String(t.runtime));
  var n=(t.episodes&&t.episodes.length)||t.eps||0; if(n>1)bits.push(n+" episodes");
  return bits.join(" · ");
}
function addCards(list,note){
  if(note)addMsg(note,"a");
  var box=document.createElement("div"); box.className="ag-cards";
  list.forEach(function(t){
    var c=document.createElement("div"); c.className="ag-card";
    var img=""; try{ img=(typeof thumb==="function")?thumb(t,"hq"):""; }catch(e){}
    c.innerHTML='<img alt="" src="'+escH(img)+'"><div class="ag-ci"><div class="ag-ct">'+escH(t.title||"")+'</div><div class="ag-cm">'+escH(meta(t))+'</div>'
      +'<div class="ag-cb"><button class="play" type="button">▶ Play</button><button class="det" type="button">Details</button></div></div>';
    c.querySelector(".play").addEventListener("click",function(){ memPlay(t); closeSheet(); try{ cfPresentTitle(t); }catch(e){} });
    c.querySelector(".det").addEventListener("click",function(){ closeSheet(); try{ openDetail(t.id); }catch(e){} });
    c.addEventListener("click",function(ev){ if(ev.target.tagName!=="BUTTON"){ closeSheet(); try{ openDetail(t.id); }catch(e){} } });
    box.appendChild(c);
  });
  log.appendChild(box); log.scrollTop=log.scrollHeight;
}
function addChips(list){
  var box=document.createElement("div"); box.className="ag-chips";
  list.forEach(function(txt){
    var b=document.createElement("button"); b.type="button"; b.textContent=txt;
    b.addEventListener("click",function(){ input.value=""; handle(txt,false); });
    box.appendChild(b);
  });
  log.appendChild(box); log.scrollTop=log.scrollHeight;
}
function say(text,opts){
  addMsg(text,"a");
  if((liveMode||(opts&&opts.voice))){ if(!speak(text)&&liveMode) afterSpeak(); }
}

/* ---------- the brain (Layer 1 + 5 + 4) ---------- */
var GENRE_WORDS={horror:"Horror",scary:"Horror",comedy:"Comedy",funny:"Comedy",action:"Action",drama:"Drama",western:"Western",westens:"Western","sci-fi":"Sci-Fi",scifi:"Sci-Fi","science fiction":"Sci-Fi",romance:"Romance",thriller:"Thriller",mystery:"Mystery",crime:"Crime",documentary:"Documentary",animation:"Animation",anime:"Anime",family:"Family",war:"War",music:"Music",sports:"Sports",reality:"Reality",wrestling:"Wrestling"};
function runtimeMin(t){
  var r=String(t.runtime||""); if(!r)return null;
  var h=r.match(/(\d+)\s*h/), m=r.match(/(\d+)\s*m/);
  if(h||m) return (h?parseInt(h[1],10)*60:0)+(m?parseInt(m[1],10):0);
  var plain=r.match(/^(\d+)$/); return plain?parseInt(plain[1],10):null;
}
function isSeries(t){ return ((t.episodes&&t.episodes.length)||t.eps||0)>1; }

function doFind(genreWord,typeWord,maxMin,phrase){
  var C=cat(), out=[], i, t, g = genreWord?GENRE_WORDS[genreWord]:null;
  for(i=0;i<C.length&&out.length<40;i++){
    t=C[i]; if(!t||!t.title)continue;
    if(g && String(t.genre||"").toLowerCase()!==g.toLowerCase())continue;
    if(!g && phrase){
      var hay=(String(t.title)+" "+String(t.genre||"")).toLowerCase();
      if(phrase.split(/\s+/).some(function(w){ return w.length>2 && hay.indexOf(w)<0; }))continue;
    }
    if(typeWord==="movie"&&isSeries(t))continue;
    if(typeWord==="series"&&!isSeries(t))continue;
    if(maxMin){ var rm=runtimeMin(t); if(rm!==null&&rm>maxMin)continue; if(rm===null&&typeWord!=="short")continue; }
    if(typeWord==="short"){ var r2=runtimeMin(t); if(r2!==null&&r2>45)continue; }
    out.push(t);
  }
  out.sort(function(a,b){ return ((b.award_verified?2:0)+(b.verified?1:0))-((a.award_verified?2:0)+(a.verified?1:0)); });
  return out.slice(0,3);
}

function describeDelegate(text){
  var m=text.match(/(?:take me to|open up|go to|bring up|show me|open|play|watch|put on|start|search for|find|look for)\s+(.+)/);
  if(!m)return "Searched Browse for \u201C"+text+"\u201D.";
  var verb=m[0], target=m[1].trim();
  var t=findT(target.replace(/[^\w\s]/g,"").trim());
  if(t&&/play|watch|put on|start/.test(verb)){ memPlay(t); return "▶ Playing "+(t.title||target)+"."; }
  if(t){ return "Brought up "+(t.title||target)+" — tap a result to open it, or hit Play on its page."; }
  return "Done.";
}

function statsAnswer(text){
  var all=statsLoad(), keys=Object.keys(all);
  var gname=text.replace(/.*(on|in|for)\s+/,"").trim();
  var hit=null;
  keys.forEach(function(k){ var g=all[k]; if(text.indexOf(g.name.toLowerCase())>=0||gname===k) hit=g; });
  if(!hit&&keys.length===1)hit=all[keys[0]];
  if(!hit){
    if(!keys.length) return "No games have reported stats to me yet. Once a game is wired to the notebook, ask me again and I'll know your last game.";
    return "I have stats for "+keys.map(function(k){return all[k].name;}).join(", ")+". Which one do you mean?";
  }
  var L=hit.last||{}, T=hit.totals||{}, bits=[];
  if(typeof L.kills==="number")bits.push(L.kills+" kills");
  if(typeof L.deaths==="number")bits.push(L.deaths+" deaths");
  if(typeof L.score==="number")bits.push("score "+L.score);
  if(L.result)bits.push("a "+L.result);
  var s="Last game on "+hit.name+": "+(bits.join(", ")||"played")+".";
  if(hit.games>1) s+=" Across "+hit.games+" games: "+(T.kills||0)+" kills, "+(T.deaths||0)+" deaths"+(T.wins?", "+T.wins+" wins":"")+".";
  return s;
}

function factAnswer(text){
  var m;
  if(m=text.match(/how many (titles|shows|movies|things) (do you have|are there|does shortz have)/)){
    return "Shortz VS has "+cat().length.toLocaleString()+" titles right now — every one free.";
  }
  if(m=text.match(/how many episodes (does|has) (.+?)( have| got)?$/)){
    var t=findT(m[2]); if(t){ var n=(t.episodes&&t.episodes.length)||t.eps||0; return (t.title||m[2])+" has "+(n||1)+" episode"+(n===1?"":"s")+"."; }
    return "I couldn't find that title.";
  }
  if(m=text.match(/(how long is|what genre is) (.+)$/)){
    var t2=findT(m[2].replace(/[?.!]+$/,"")); if(!t2)return "I couldn't find that title.";
    if(m[1]==="how long is") return (t2.title||"It")+(t2.runtime?(" runs "+t2.runtime+"."):" doesn't list a runtime.");
    return (t2.title||"It")+" is "+(t2.genre||"uncategorized")+".";
  }
  return null;
}

function handle(raw, viaVoice){
  var text=String(raw||"").trim(); if(!text)return;
  if(liveBubble){ liveBubble.classList.remove("live"); liveBubble.textContent=text; liveBubble=null; lastTranscript=""; }
  else addMsg(text,"u");
  var low=text.toLowerCase().replace(/\s+/g," ");
  lastViaVoice=!!viaVoice;

  /* conversation courtesies */
  if(/^(hi|hey|hello|yo|what'?s up|good (morning|afternoon|evening))\b/.test(low)){ say("Hey — I'm here. What are we watching?",{voice:viaVoice}); return; }
  if(/^(thanks|thank you|thx)\b/.test(low)){ say("Anytime. What else?",{voice:viaVoice}); return; }
  if(/who are you|your name/.test(low)){ say("I'm the Shortz agent — I run the app by voice and text. Play, find, bring things up, answer questions.",{voice:viaVoice}); return; }
  if(/what can you do|help$|^help\b/.test(low)){ say("Try one of these:",{voice:viaVoice}); addChips(["Play Fearless","Find me a horror short under 20 minutes","What's live","Surprise me","Continue watching"]); return; }
  if(liveMode&&/^(stop|stop talking|goodbye|bye|end call|hang up)\b/.test(low)){ liveMode=false; liveBtn.classList.remove("on"); say("Okay — call ended. I'm still here in text whenever.",{}); return; }

  /* Layer 4: game stats */
  if(/(kills|deaths|stats|score|last game|how did i do)/.test(low)&&!/episode/.test(low)){ say(statsAnswer(low),{voice:viaVoice}); return; }

  /* Layer 5: facts */
  var f=factAnswer(low); if(f){ say(f,{voice:viaVoice}); return; }

  /* Layer 4: the usual */
  if(/\b(my usual|the usual)\b/.test(low)){
    var ug=usualGenre();
    if(!ug){ say("I don't know your usual yet — play a few things through me and I'll learn it.",{voice:viaVoice}); return; }
    var picks=doFind(Object.keys(GENRE_WORDS).filter(function(k){return GENRE_WORDS[k]===ug;})[0],null,null,null);
    if(/play/.test(low)&&picks.length){ memPlay(picks[0]); say("Your usual is "+ug+". Playing "+picks[0].title+".",{voice:viaVoice}); closeSheet(); try{ cfPresentTitle(picks[0]); }catch(e){} return; }
    addCards(picks,"Your usual — "+ug+":"); return;
  }

  /* continue watching */
  if(/^continue( watching)?$|keep watching|resume watching/.test(low)){
    var hist=[]; try{ hist=JSON.parse(localStorage.getItem("shortztv_history")||"[]"); }catch(e){}
    var last=hist.length?byId(hist[0].id):null;
    if(last){ addCards([last],"You were watching:"); }
    else say("Nothing in Continue Watching yet — watch something and it'll be here.",{voice:viaVoice});
    return;
  }

  /* what's live */
  if(/what'?s live|who is live|what is live|anybody live|anyone live/.test(low)){
    say("Here's everything live right now.",{voice:viaVoice}); closeSheet();
    try{ if(typeof renderView==="function")renderView("live"); }catch(e){}
    try{ go("live"); }catch(e){}
    return;
  }

  /* surprise me */
  if(/surprise me|i'?m bored|pick something|something good|random/.test(low)){
    var C=cat().filter(function(t){ return t&&(t.award_verified||t.verified)&&t.title; });
    if(C.length){ var pick=C[Math.floor(Math.random()*C.length)]; addCards([pick],"Surprise pick:"); }
    else say("Couldn't pick just now — try a genre, like 'find me a western'.",{voice:viaVoice});
    return;
  }

  /* filter finds: "find me a horror short under 20 minutes" */
  var fm=low.match(/(?:find|show|get|give|search)(?:\s+me)?\s+(?:a\s+|an\s+|some\s+)?(.+)/);
  if(fm){
    var rest=fm[1], maxMin=null, mm=rest.match(/under\s+(\d+)\s*(min|minute|hour)/);
    if(mm){ maxMin=parseInt(mm[1],10)*(mm[2]==="hour"?60:1); rest=rest.replace(mm[0],""); }
    var typeWord=null; if(/\bseries\b|\bshow\b/.test(rest)&&!/shows?\s+me/.test(low))typeWord="series"; if(/\bmovie\b|\bfilm\b/.test(rest))typeWord="movie"; if(/\bshort\b/.test(rest))typeWord="short";
    var gw=null; for(var k in GENRE_WORDS){ if(rest.indexOf(k)>=0){ gw=k; break; } }
    if(gw||typeWord||maxMin){
      var res=doFind(gw,typeWord,maxMin,null);
      if(res.length){ addCards(res,(gw?GENRE_WORDS[gw]:"Picks")+(typeWord==="short"?" shorts":typeWord==="series"?" series":typeWord==="movie"?" movies":"")+(maxMin?(" under "+maxMin+" minutes"):"")+":"); }
      else say("I couldn't find a match for that in the catalog — try loosening it up, like just the genre.",{voice:viaVoice});
      return;
    }
  }

  /* something like X */
  var sm=low.match(/(?:something|more) like (.+)$/);
  if(sm){
    var base=findT(sm[1].replace(/[^\w\s]/g,"").trim());
    if(base&&base.genre){
      var gk=Object.keys(GENRE_WORDS).filter(function(k){return GENRE_WORDS[k]===base.genre;})[0];
      var sims=doFind(gk,null,null,null).filter(function(t){return t.id!==base.id;});
      if(sims.length){ addCards(sims,"More like "+(base.title||sm[1])+":"); return; }
    }
  }

  /* Layer 2/3 slot: a real chat brain, when one is wired */
  if(window.SZAgentBrain&&typeof window.SZAgentBrain.ask==="function"&&!/(play|bring up|show me|open|go to|find)\b/.test(low)){
    window.SZAgentBrain.ask(text).then(function(reply){
      if(reply) say(reply,{voice:viaVoice});
      else delegate(text,viaVoice);
    }).catch(function(){ delegate(text,viaVoice); });
    return;
  }

  delegate(text,viaVoice);
}

function delegate(text,viaVoice){
  var ok=false;
  try{ ok=!!(window._voiceCommand&&window._voiceCommand(text,false)); }catch(e){}
  if(ok){
    var d=describeDelegate(text.toLowerCase());
    say(d,{voice:viaVoice});
    if(/Playing|Brought up|Searched Browse/.test(d)) setTimeout(closeSheet,650);
  }else{
    var t=findT(text.replace(/[^\w\s]/g,"").trim());
    if(t){ addCards([t],"Did you mean this one? Tap Play, or Details to open it first."); }
    else{ say("I didn't catch a command in that. I understand things like:",{voice:viaVoice}); addChips(["Play Fearless","Bring up Fearless","Find me a horror short","Go to Live","What's live"]); }
  }
}

/* ---------- listening mirror + conversation loop ---------- */
var liveBubble=null, lastTranscript="";
function startListen(){
  /* Arm agent capture: the engine hands the final transcript to handle()
     instead of executing it, so voice gets the FULL agent brain. */
  window._agentCapture=function(t){
    handle(t,true);
    if(liveMode){
      setTimeout(function(){
        var pop=$("#voicePop");
        var listeningNow=pop&&pop.getAttribute("aria-hidden")!=="true";
        var speaking=false; try{ speaking=!!(window.speechSynthesis&&speechSynthesis.speaking); }catch(e){}
        if(liveMode&&opened&&!listeningNow&&!speaking) startListen();
      },1200);
    }
  };
  try{ if(window._micToggle)window._micToggle(); }catch(e){}
}
function watchTranscript(){
  var tx=$("#voiceTranscript"), pop=$("#voicePop"); if(!tx)return;
  var mo=new MutationObserver(function(){
    if(!opened)return;
    var t=(tx.textContent||"").trim();
    if(t&&t!=="Listening…"){
      if(!liveBubble){ liveBubble=addMsg("","u"); liveBubble.classList.add("live"); }
      liveBubble.textContent=t; lastTranscript=t; log.scrollTop=log.scrollHeight;
    }
  });
  mo.observe(tx,{childList:true,characterData:true,subtree:true});
  if(pop){
    var po=new MutationObserver(function(){
      var hidden=pop.getAttribute("aria-hidden")==="true"||!pop.classList.contains("show");
      micBtn.classList.toggle("listening",!hidden);
      if(hidden&&liveBubble){
        /* Capture normally finalizes the bubble inside handle(); this is the
           safety path for a listen that ended with no final transcript. */
        liveBubble.classList.remove("live"); liveBubble=null; lastTranscript="";
      }
    });
    po.observe(pop,{attributes:true,attributeFilter:["aria-hidden","class"]});
  }
}

/* ---------- open / close / wiring ---------- */
function openSheet(autoListen){
  opened=true; wrap.classList.add("open"); wrap.setAttribute("aria-hidden","false");
  if(!greeted){
    greeted=true;
    addMsg("Hey — I'm your Shortz agent. Say it or type it: \"Play Fearless\" plays it, \"Bring up Fearless\" shows it, \"Find me a horror short\" finds one. Tap 📞 Live talk and we can just talk.","a");
    addChips(["Play Fearless","Find me a horror short under 20 minutes","What's live","Surprise me"]);
  }
  if(autoListen) setTimeout(startListen,250);
  else setTimeout(function(){ try{ input.focus(); }catch(e){} },250);
}
function closeSheet(){
  opened=false; wrap.classList.remove("open"); wrap.setAttribute("aria-hidden","true");
  if(liveMode){ liveMode=false; liveBtn.classList.remove("on"); }
}
window._agentOpen=openSheet;
wrap.querySelector(".ag-back").addEventListener("click",closeSheet);
$("#agClose").addEventListener("click",closeSheet);
$("#agSend").addEventListener("click",function(){ var v=input.value; input.value=""; handle(v,false); });
input.addEventListener("keydown",function(e){ if(e.key==="Enter"){ var v=input.value; input.value=""; handle(v,false); } });
micBtn.addEventListener("click",function(){ startListen(); });
liveBtn.addEventListener("click",function(){
  liveMode=!liveMode; liveBtn.classList.toggle("on",liveMode);
  if(liveMode){ say("Live talk on — I'm listening. Talk to me like a call; say \"stop\" anytime to end it.",{}); setTimeout(startListen,400); }
  else{ try{ speechSynthesis.cancel(); }catch(e){} }
});
watchTranscript();
})();
