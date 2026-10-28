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
function _normTitle(s){ return String(s||"").toLowerCase().replace(/[^\w\s]/g," ").replace(/\s+/g," ").trim(); }
function bareTitleMatch(rawText){
  var q=_normTitle(rawText);
  if(!q||q.split(" ").length>8)return null;
  var t=findT(String(rawText||"").replace(/[^\w\s]/g,"").trim());
  if(!t||!t.title)return null;
  var tt=_normTitle(t.title);
  if(tt===q)return t;
  if(tt.replace(/^the /,"")===q||tt===q.replace(/^the /,""))return t;
  return null;
}

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
"#agSend{background:#f5c542;color:#111;border-color:#f5c542;font-weight:700}",
"#agBubble{position:fixed;inset:0;z-index:99995;display:none}",
"#agBubble.open{display:block}",
"#agBubble .agb-back{position:absolute;inset:0;background:rgba(0,0,0,.74)}",
"#agBubble .agb-core{position:absolute;left:0;right:0;top:15%;display:flex;flex-direction:column;align-items:center;gap:14px;padding:0 24px}",
"#agBubble .agb-face{width:118px;height:118px;border-radius:50%;border:3px solid #f5c542;overflow:hidden;background:#17171d;box-shadow:0 10px 34px rgba(0,0,0,.65);flex:0 0 auto}",
"#agBubble .agb-face img{width:100%;height:100%;object-fit:cover;display:block}",
"#agBubble.listening .agb-face{animation:agbPulse 1.6s ease-in-out infinite}",
"@keyframes agbPulse{0%,100%{box-shadow:0 0 0 0 rgba(245,197,66,.45)}50%{box-shadow:0 0 0 15px rgba(245,197,66,0)}}",
"#agBubble .agb-wave{display:flex;gap:4px;align-items:center;height:34px}",
"#agBubble .agb-wave i{display:block;width:5px;border-radius:3px;background:#f5c542;height:5px;transition:height .09s ease}",
"#agBubble .agb-said{color:#eee;font-size:15px;line-height:1.45;text-align:center;max-width:330px;min-height:22px}",
"#agBubble .agb-said.you{color:#9a9aa5;font-size:13px}",
"#agBubble .agb-type{background:#1c1c22;color:#f5c542;border:1px solid #3a3a45;border-radius:999px;padding:10px 18px;font-size:13px}",
"#agBubble .agb-x{position:absolute;top:calc(10px + env(safe-area-inset-top));right:12px;width:38px;height:38px;border-radius:50%;background:#1c1c22;color:#ddd;border:1px solid #33333d;font-size:15px;z-index:2}"
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
var bub=document.createElement("div"); bub.id="agBubble"; bub.setAttribute("aria-hidden","true");
bub.innerHTML='<div class="agb-back"></div><button class="agb-x" type="button" aria-label="Close">✕</button>'
 +'<div class="agb-core"><div class="agb-face"><img src="mascot-avatar.png" alt="Shortz"></div>'
 +'<div class="agb-wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'
 +'<div class="agb-said you">Listening…</div>'
 +'<button class="agb-type" type="button">⌨ Type instead…</button></div>';
document.body.appendChild(bub);
var log=$("#agLog"), input=$("#agIn"), liveBtn=$("#agLive"), micBtn=$("#agMic");
var opened=false, greeted=false, liveMode=false, lastViaVoice=false;
/* talk-back layer (his order 2026-10-25): she asks a follow-up when a find is
   open-ended, takes the answer, and remembers the last picks she showed. */
var pendingAsk=null, lastCards=null, lastFind=null;

/* ---------- speech out (Layer 6) ---------- */
var speakingNow=false, speakWatchdog=null;
/* ECHO SHIELD (2026-10-26, his report — "he hears himself and answers
   himself"): Shortz remembers the exact line he last spoke. Voice intake in
   index.html asks _szEchoHit() before executing anything spoken: a transcript
   that matches his own line (the speaker bleeding into the mic) is dropped,
   never treated as the user. A ~1s quiet window after he finishes keeps the
   mic closed while his voice is still ringing out of the speaker. Short
   transcripts (<4 words) are NEVER echo-dropped — a real "movie" or "series"
   answer to his question can never be swallowed by the shield. */
var lastSpoken={toks:[],end:0}, speakEndAt=0;
var ECHO_QUIET_MS=1000, ECHO_WINDOW_MS=6000;
function echoToks(t){ return String(t||"").toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(Boolean); }
function inQuiet(){ return !!(speakEndAt&&(Date.now()-speakEndAt<ECHO_QUIET_MS)); }
window._szSpeakingNow=function(){ return speakingNow; };
window._szEchoHit=function(raw){
  try{
    var tt=echoToks(raw), st=lastSpoken.toks;
    if(tt.length<4||!st.length)return false;
    if(!lastSpoken.end||Date.now()-lastSpoken.end>ECHO_WINDOW_MS)return false;
    var bag={}, common=0, i, w;
    for(i=0;i<st.length;i++)bag[st[i]]=(bag[st[i]]||0)+1;
    for(i=0;i<tt.length;i++){ w=tt[i]; if(bag[w]){ bag[w]--; common++; } }
    if(common>=4&&common/tt.length>=0.8&&common/st.length>=0.45)return true;
    var tj=" "+tt.join(" ")+" ", sj=" "+st.join(" ")+" ";
    if(tt.length>=5&&sj.indexOf(tj)>=0)return true;
    if(st.length>=5&&st.length/tt.length>=0.6&&tj.indexOf(sj)>=0)return true;
    return false;
  }catch(e){ return false; }
};
function cleanSayText(t){ return String(t).replace(/[▶🎙📞✕➤♥]/g,""); }
function speakDone(){
  if(speakWatchdog){ clearTimeout(speakWatchdog); speakWatchdog=null; }
  if(!speakingNow)return;
  speakingNow=false;
  speakEndAt=Date.now(); lastSpoken.end=speakEndAt;
  afterSpeak();
}
window.onNativeTtsDone=function(){ speakDone(); };
window.onNativeTtsError=function(){ speakDone(); };
window.onNativeTtsStart=function(){};
function stopSpeak(){
  if(speakWatchdog){ clearTimeout(speakWatchdog); speakWatchdog=null; }
  if(speakingNow){ speakEndAt=Date.now(); lastSpoken.end=speakEndAt; }
  speakingNow=false;
  if(_daveAudio){ try{ _daveAudio.onended=null; _daveAudio.onerror=null; _daveAudio.pause(); }catch(e){} }
  try{ if(window.Android&&Android.ttsStop)Android.ttsStop(); }catch(e){}
  try{ if("speechSynthesis" in window)speechSynthesis.cancel(); }catch(e){}
}
/* DAVE-1 VOICE (his crown, 2026-10-25; "throughout" order 2026-10-26):
   lines rendered in his real voice (Dave Style 1) play as clips FIRST —
   exact text match only. Anything without a clip falls to the TTS paths
   below until the live voice service lands, so he is never silent. */
var SZ_DAVE_CLIPS={
  "What's up, Mr. Moore? What you trying to watch today — you trying to play something, catch a streamer?":"audio/dave-greeting.mp3",
  "What's up, Mr. Moore? What are we getting into?":"audio/dave-opener-1.mp3",
  "Hey, Mr. Moore. How's your day treating you so far?":"audio/dave-opener-2.mp3",
  "I'm right here, Mr. Moore. What kind of mood are we in?":"audio/dave-opener-3.mp3",
  "Good to hear you, Mr. Moore. What are we watching?":"audio/dave-opener-4.mp3",
  "Yo, Mr. Moore. Talk to me — what's the move?":"audio/dave-opener-5.mp3",
  "Say that again for me?":"audio/dave-reprompt.mp3",
  "Alright. I'm right here when you need me.":"audio/dave-close.mp3",
  "Hey — I'm here. What are we watching?":"audio/dave-here.mp3",
  "Anytime. What else?":"audio/dave-anytime.mp3",
  "I'm the Shortz agent — I run the app by voice and text. Play, find, bring things up, answer questions.":"audio/dave-iam.mp3",
  "Try one of these:":"audio/dave-try.mp3",
  "Okay — call ended. I'm still here in text whenever.":"audio/dave-callend.mp3",
  "I don't know your usual yet — play a few things through me and I'll learn it.":"audio/dave-nousual.mp3",
  "Nothing in Continue Watching yet — watch something and it'll be here.":"audio/dave-nocontinue.mp3",
  "Here's everything live right now.":"audio/dave-livenow.mp3",
  "Couldn't pick just now — try a genre, like 'find me a western'.":"audio/dave-couldntpick.mp3",
  "Here's some more.":"audio/dave-more.mp3",
  "I couldn't find a match for that in the catalog — try loosening it up, like just the genre.":"audio/dave-nomatch.mp3",
  "I didn't catch a command in that. I understand things like:":"audio/dave-nocatch.mp3",
  "No games have reported stats to me yet. Once a game is wired to the notebook, ask me again and I'll know your last game.":"audio/dave-nostats.mp3",
  "I couldn't find that title.":"audio/dave-notitle.mp3",
  "Done.":"audio/dave-done.mp3",
  "Okay, horror — you looking for a short form, a movie, or a series?":"audio/dave-ask-horror.mp3",
  "Here's some horror shorts — say “play the first one”, or tap one.":"audio/dave-found-horror-shorts.mp3",
  "Here's some horror series — say “play the first one”, or tap one.":"audio/dave-found-horror-series.mp3",
  "Here's some horror movies — say “play the first one”, or tap one.":"audio/dave-found-horror-movies.mp3",
  "Here's some horror picks — say “play the first one”, or tap one.":"audio/dave-found-horror-picks.mp3",
  "No horror shorts in the catalog. Want to try a different kind?":"audio/dave-empty-horror-shorts.mp3",
  "No horror series in the catalog. Want to try a different kind?":"audio/dave-empty-horror-series.mp3",
  "No horror movies in the catalog. Want to try a different kind?":"audio/dave-empty-horror-movies.mp3",
  "No luck with that kind — here's horror picks instead.":"audio/dave-broad-horror.mp3",
  "Nothing under horror at all — try another genre.":"audio/dave-none-horror.mp3",
  "Okay, comedy — you looking for a short form, a movie, or a series?":"audio/dave-ask-comedy.mp3",
  "Here's some comedy shorts — say “play the first one”, or tap one.":"audio/dave-found-comedy-shorts.mp3",
  "Here's some comedy series — say “play the first one”, or tap one.":"audio/dave-found-comedy-series.mp3",
  "Here's some comedy movies — say “play the first one”, or tap one.":"audio/dave-found-comedy-movies.mp3",
  "Here's some comedy picks — say “play the first one”, or tap one.":"audio/dave-found-comedy-picks.mp3",
  "No comedy shorts in the catalog. Want to try a different kind?":"audio/dave-empty-comedy-shorts.mp3",
  "No comedy series in the catalog. Want to try a different kind?":"audio/dave-empty-comedy-series.mp3",
  "No comedy movies in the catalog. Want to try a different kind?":"audio/dave-empty-comedy-movies.mp3",
  "No luck with that kind — here's comedy picks instead.":"audio/dave-broad-comedy.mp3",
  "Nothing under comedy at all — try another genre.":"audio/dave-none-comedy.mp3",
  "Okay, action — you looking for a short form, a movie, or a series?":"audio/dave-ask-action.mp3",
  "Here's some action shorts — say “play the first one”, or tap one.":"audio/dave-found-action-shorts.mp3",
  "Here's some action series — say “play the first one”, or tap one.":"audio/dave-found-action-series.mp3",
  "Here's some action movies — say “play the first one”, or tap one.":"audio/dave-found-action-movies.mp3",
  "Here's some action picks — say “play the first one”, or tap one.":"audio/dave-found-action-picks.mp3",
  "No action shorts in the catalog. Want to try a different kind?":"audio/dave-empty-action-shorts.mp3",
  "No action series in the catalog. Want to try a different kind?":"audio/dave-empty-action-series.mp3",
  "No action movies in the catalog. Want to try a different kind?":"audio/dave-empty-action-movies.mp3",
  "No luck with that kind — here's action picks instead.":"audio/dave-broad-action.mp3",
  "Nothing under action at all — try another genre.":"audio/dave-none-action.mp3",
  "Okay, drama — you looking for a short form, a movie, or a series?":"audio/dave-ask-drama.mp3",
  "Here's some drama shorts — say “play the first one”, or tap one.":"audio/dave-found-drama-shorts.mp3",
  "Here's some drama series — say “play the first one”, or tap one.":"audio/dave-found-drama-series.mp3",
  "Here's some drama movies — say “play the first one”, or tap one.":"audio/dave-found-drama-movies.mp3",
  "Here's some drama picks — say “play the first one”, or tap one.":"audio/dave-found-drama-picks.mp3",
  "No drama shorts in the catalog. Want to try a different kind?":"audio/dave-empty-drama-shorts.mp3",
  "No drama series in the catalog. Want to try a different kind?":"audio/dave-empty-drama-series.mp3",
  "No drama movies in the catalog. Want to try a different kind?":"audio/dave-empty-drama-movies.mp3",
  "No luck with that kind — here's drama picks instead.":"audio/dave-broad-drama.mp3",
  "Nothing under drama at all — try another genre.":"audio/dave-none-drama.mp3",
  "Okay, western — you looking for a short form, a movie, or a series?":"audio/dave-ask-western.mp3",
  "Here's some western shorts — say “play the first one”, or tap one.":"audio/dave-found-western-shorts.mp3",
  "Here's some western series — say “play the first one”, or tap one.":"audio/dave-found-western-series.mp3",
  "Here's some western movies — say “play the first one”, or tap one.":"audio/dave-found-western-movies.mp3",
  "Here's some western picks — say “play the first one”, or tap one.":"audio/dave-found-western-picks.mp3",
  "No western shorts in the catalog. Want to try a different kind?":"audio/dave-empty-western-shorts.mp3",
  "No western series in the catalog. Want to try a different kind?":"audio/dave-empty-western-series.mp3",
  "No western movies in the catalog. Want to try a different kind?":"audio/dave-empty-western-movies.mp3",
  "No luck with that kind — here's western picks instead.":"audio/dave-broad-western.mp3",
  "Nothing under western at all — try another genre.":"audio/dave-none-western.mp3",
  "Okay, sci-fi — you looking for a short form, a movie, or a series?":"audio/dave-ask-sci-fi.mp3",
  "Here's some sci-fi shorts — say “play the first one”, or tap one.":"audio/dave-found-sci-fi-shorts.mp3",
  "Here's some sci-fi series — say “play the first one”, or tap one.":"audio/dave-found-sci-fi-series.mp3",
  "Here's some sci-fi movies — say “play the first one”, or tap one.":"audio/dave-found-sci-fi-movies.mp3",
  "Here's some sci-fi picks — say “play the first one”, or tap one.":"audio/dave-found-sci-fi-picks.mp3",
  "No sci-fi shorts in the catalog. Want to try a different kind?":"audio/dave-empty-sci-fi-shorts.mp3",
  "No sci-fi series in the catalog. Want to try a different kind?":"audio/dave-empty-sci-fi-series.mp3",
  "No sci-fi movies in the catalog. Want to try a different kind?":"audio/dave-empty-sci-fi-movies.mp3",
  "No luck with that kind — here's sci-fi picks instead.":"audio/dave-broad-sci-fi.mp3",
  "Nothing under sci-fi at all — try another genre.":"audio/dave-none-sci-fi.mp3",
  "Okay, romance — you looking for a short form, a movie, or a series?":"audio/dave-ask-romance.mp3",
  "Here's some romance shorts — say “play the first one”, or tap one.":"audio/dave-found-romance-shorts.mp3",
  "Here's some romance series — say “play the first one”, or tap one.":"audio/dave-found-romance-series.mp3",
  "Here's some romance movies — say “play the first one”, or tap one.":"audio/dave-found-romance-movies.mp3",
  "Here's some romance picks — say “play the first one”, or tap one.":"audio/dave-found-romance-picks.mp3",
  "No romance shorts in the catalog. Want to try a different kind?":"audio/dave-empty-romance-shorts.mp3",
  "No romance series in the catalog. Want to try a different kind?":"audio/dave-empty-romance-series.mp3",
  "No romance movies in the catalog. Want to try a different kind?":"audio/dave-empty-romance-movies.mp3",
  "No luck with that kind — here's romance picks instead.":"audio/dave-broad-romance.mp3",
  "Nothing under romance at all — try another genre.":"audio/dave-none-romance.mp3",
  "Okay, thriller — you looking for a short form, a movie, or a series?":"audio/dave-ask-thriller.mp3",
  "Here's some thriller shorts — say “play the first one”, or tap one.":"audio/dave-found-thriller-shorts.mp3",
  "Here's some thriller series — say “play the first one”, or tap one.":"audio/dave-found-thriller-series.mp3",
  "Here's some thriller movies — say “play the first one”, or tap one.":"audio/dave-found-thriller-movies.mp3",
  "Here's some thriller picks — say “play the first one”, or tap one.":"audio/dave-found-thriller-picks.mp3",
  "No thriller shorts in the catalog. Want to try a different kind?":"audio/dave-empty-thriller-shorts.mp3",
  "No thriller series in the catalog. Want to try a different kind?":"audio/dave-empty-thriller-series.mp3",
  "No thriller movies in the catalog. Want to try a different kind?":"audio/dave-empty-thriller-movies.mp3",
  "No luck with that kind — here's thriller picks instead.":"audio/dave-broad-thriller.mp3",
  "Nothing under thriller at all — try another genre.":"audio/dave-none-thriller.mp3",
  "Okay, mystery — you looking for a short form, a movie, or a series?":"audio/dave-ask-mystery.mp3",
  "Here's some mystery shorts — say “play the first one”, or tap one.":"audio/dave-found-mystery-shorts.mp3",
  "Here's some mystery series — say “play the first one”, or tap one.":"audio/dave-found-mystery-series.mp3",
  "Here's some mystery movies — say “play the first one”, or tap one.":"audio/dave-found-mystery-movies.mp3",
  "Here's some mystery picks — say “play the first one”, or tap one.":"audio/dave-found-mystery-picks.mp3",
  "No mystery shorts in the catalog. Want to try a different kind?":"audio/dave-empty-mystery-shorts.mp3",
  "No mystery series in the catalog. Want to try a different kind?":"audio/dave-empty-mystery-series.mp3",
  "No mystery movies in the catalog. Want to try a different kind?":"audio/dave-empty-mystery-movies.mp3",
  "No luck with that kind — here's mystery picks instead.":"audio/dave-broad-mystery.mp3",
  "Nothing under mystery at all — try another genre.":"audio/dave-none-mystery.mp3",
  "Okay, crime — you looking for a short form, a movie, or a series?":"audio/dave-ask-crime.mp3",
  "Here's some crime shorts — say “play the first one”, or tap one.":"audio/dave-found-crime-shorts.mp3",
  "Here's some crime series — say “play the first one”, or tap one.":"audio/dave-found-crime-series.mp3",
  "Here's some crime movies — say “play the first one”, or tap one.":"audio/dave-found-crime-movies.mp3",
  "Here's some crime picks — say “play the first one”, or tap one.":"audio/dave-found-crime-picks.mp3",
  "No crime shorts in the catalog. Want to try a different kind?":"audio/dave-empty-crime-shorts.mp3",
  "No crime series in the catalog. Want to try a different kind?":"audio/dave-empty-crime-series.mp3",
  "No crime movies in the catalog. Want to try a different kind?":"audio/dave-empty-crime-movies.mp3",
  "No luck with that kind — here's crime picks instead.":"audio/dave-broad-crime.mp3",
  "Nothing under crime at all — try another genre.":"audio/dave-none-crime.mp3",
  "Okay, documentary — you looking for a short form, a movie, or a series?":"audio/dave-ask-documentary.mp3",
  "Here's some documentary shorts — say “play the first one”, or tap one.":"audio/dave-found-documentary-shorts.mp3",
  "Here's some documentary series — say “play the first one”, or tap one.":"audio/dave-found-documentary-series.mp3",
  "Here's some documentary movies — say “play the first one”, or tap one.":"audio/dave-found-documentary-movies.mp3",
  "Here's some documentary picks — say “play the first one”, or tap one.":"audio/dave-found-documentary-picks.mp3",
  "No documentary shorts in the catalog. Want to try a different kind?":"audio/dave-empty-documentary-shorts.mp3",
  "No documentary series in the catalog. Want to try a different kind?":"audio/dave-empty-documentary-series.mp3",
  "No documentary movies in the catalog. Want to try a different kind?":"audio/dave-empty-documentary-movies.mp3",
  "No luck with that kind — here's documentary picks instead.":"audio/dave-broad-documentary.mp3",
  "Nothing under documentary at all — try another genre.":"audio/dave-none-documentary.mp3",
  "Okay, animation — you looking for a short form, a movie, or a series?":"audio/dave-ask-animation.mp3",
  "Here's some animation shorts — say “play the first one”, or tap one.":"audio/dave-found-animation-shorts.mp3",
  "Here's some animation series — say “play the first one”, or tap one.":"audio/dave-found-animation-series.mp3",
  "Here's some animation movies — say “play the first one”, or tap one.":"audio/dave-found-animation-movies.mp3",
  "Here's some animation picks — say “play the first one”, or tap one.":"audio/dave-found-animation-picks.mp3",
  "No animation shorts in the catalog. Want to try a different kind?":"audio/dave-empty-animation-shorts.mp3",
  "No animation series in the catalog. Want to try a different kind?":"audio/dave-empty-animation-series.mp3",
  "No animation movies in the catalog. Want to try a different kind?":"audio/dave-empty-animation-movies.mp3",
  "No luck with that kind — here's animation picks instead.":"audio/dave-broad-animation.mp3",
  "Nothing under animation at all — try another genre.":"audio/dave-none-animation.mp3",
  "Okay, anime — you looking for a short form, a movie, or a series?":"audio/dave-ask-anime.mp3",
  "Here's some anime shorts — say “play the first one”, or tap one.":"audio/dave-found-anime-shorts.mp3",
  "Here's some anime series — say “play the first one”, or tap one.":"audio/dave-found-anime-series.mp3",
  "Here's some anime movies — say “play the first one”, or tap one.":"audio/dave-found-anime-movies.mp3",
  "Here's some anime picks — say “play the first one”, or tap one.":"audio/dave-found-anime-picks.mp3",
  "No anime shorts in the catalog. Want to try a different kind?":"audio/dave-empty-anime-shorts.mp3",
  "No anime series in the catalog. Want to try a different kind?":"audio/dave-empty-anime-series.mp3",
  "No anime movies in the catalog. Want to try a different kind?":"audio/dave-empty-anime-movies.mp3",
  "No luck with that kind — here's anime picks instead.":"audio/dave-broad-anime.mp3",
  "Nothing under anime at all — try another genre.":"audio/dave-none-anime.mp3",
  "Okay, family — you looking for a short form, a movie, or a series?":"audio/dave-ask-family.mp3",
  "Here's some family shorts — say “play the first one”, or tap one.":"audio/dave-found-family-shorts.mp3",
  "Here's some family series — say “play the first one”, or tap one.":"audio/dave-found-family-series.mp3",
  "Here's some family movies — say “play the first one”, or tap one.":"audio/dave-found-family-movies.mp3",
  "Here's some family picks — say “play the first one”, or tap one.":"audio/dave-found-family-picks.mp3",
  "No family shorts in the catalog. Want to try a different kind?":"audio/dave-empty-family-shorts.mp3",
  "No family series in the catalog. Want to try a different kind?":"audio/dave-empty-family-series.mp3",
  "No family movies in the catalog. Want to try a different kind?":"audio/dave-empty-family-movies.mp3",
  "No luck with that kind — here's family picks instead.":"audio/dave-broad-family.mp3",
  "Nothing under family at all — try another genre.":"audio/dave-none-family.mp3",
  "Okay, war — you looking for a short form, a movie, or a series?":"audio/dave-ask-war.mp3",
  "Here's some war shorts — say “play the first one”, or tap one.":"audio/dave-found-war-shorts.mp3",
  "Here's some war series — say “play the first one”, or tap one.":"audio/dave-found-war-series.mp3",
  "Here's some war movies — say “play the first one”, or tap one.":"audio/dave-found-war-movies.mp3",
  "Here's some war picks — say “play the first one”, or tap one.":"audio/dave-found-war-picks.mp3",
  "No war shorts in the catalog. Want to try a different kind?":"audio/dave-empty-war-shorts.mp3",
  "No war series in the catalog. Want to try a different kind?":"audio/dave-empty-war-series.mp3",
  "No war movies in the catalog. Want to try a different kind?":"audio/dave-empty-war-movies.mp3",
  "No luck with that kind — here's war picks instead.":"audio/dave-broad-war.mp3",
  "Nothing under war at all — try another genre.":"audio/dave-none-war.mp3",
  "Okay, music — you looking for a short form, a movie, or a series?":"audio/dave-ask-music.mp3",
  "Here's some music shorts — say “play the first one”, or tap one.":"audio/dave-found-music-shorts.mp3",
  "Here's some music series — say “play the first one”, or tap one.":"audio/dave-found-music-series.mp3",
  "Here's some music movies — say “play the first one”, or tap one.":"audio/dave-found-music-movies.mp3",
  "Here's some music picks — say “play the first one”, or tap one.":"audio/dave-found-music-picks.mp3",
  "No music shorts in the catalog. Want to try a different kind?":"audio/dave-empty-music-shorts.mp3",
  "No music series in the catalog. Want to try a different kind?":"audio/dave-empty-music-series.mp3",
  "No music movies in the catalog. Want to try a different kind?":"audio/dave-empty-music-movies.mp3",
  "No luck with that kind — here's music picks instead.":"audio/dave-broad-music.mp3",
  "Nothing under music at all — try another genre.":"audio/dave-none-music.mp3",
  "Okay, sports — you looking for a short form, a movie, or a series?":"audio/dave-ask-sports.mp3",
  "Here's some sports shorts — say “play the first one”, or tap one.":"audio/dave-found-sports-shorts.mp3",
  "Here's some sports series — say “play the first one”, or tap one.":"audio/dave-found-sports-series.mp3",
  "Here's some sports movies — say “play the first one”, or tap one.":"audio/dave-found-sports-movies.mp3",
  "Here's some sports picks — say “play the first one”, or tap one.":"audio/dave-found-sports-picks.mp3",
  "No sports shorts in the catalog. Want to try a different kind?":"audio/dave-empty-sports-shorts.mp3",
  "No sports series in the catalog. Want to try a different kind?":"audio/dave-empty-sports-series.mp3",
  "No sports movies in the catalog. Want to try a different kind?":"audio/dave-empty-sports-movies.mp3",
  "No luck with that kind — here's sports picks instead.":"audio/dave-broad-sports.mp3",
  "Nothing under sports at all — try another genre.":"audio/dave-none-sports.mp3",
  "Okay, reality — you looking for a short form, a movie, or a series?":"audio/dave-ask-reality.mp3",
  "Here's some reality shorts — say “play the first one”, or tap one.":"audio/dave-found-reality-shorts.mp3",
  "Here's some reality series — say “play the first one”, or tap one.":"audio/dave-found-reality-series.mp3",
  "Here's some reality movies — say “play the first one”, or tap one.":"audio/dave-found-reality-movies.mp3",
  "Here's some reality picks — say “play the first one”, or tap one.":"audio/dave-found-reality-picks.mp3",
  "No reality shorts in the catalog. Want to try a different kind?":"audio/dave-empty-reality-shorts.mp3",
  "No reality series in the catalog. Want to try a different kind?":"audio/dave-empty-reality-series.mp3",
  "No reality movies in the catalog. Want to try a different kind?":"audio/dave-empty-reality-movies.mp3",
  "No luck with that kind — here's reality picks instead.":"audio/dave-broad-reality.mp3",
  "Nothing under reality at all — try another genre.":"audio/dave-none-reality.mp3",
  "Okay, wrestling — you looking for a short form, a movie, or a series?":"audio/dave-ask-wrestling.mp3",
  "Here's some wrestling shorts — say “play the first one”, or tap one.":"audio/dave-found-wrestling-shorts.mp3",
  "Here's some wrestling series — say “play the first one”, or tap one.":"audio/dave-found-wrestling-series.mp3",
  "Here's some wrestling movies — say “play the first one”, or tap one.":"audio/dave-found-wrestling-movies.mp3",
  "Here's some wrestling picks — say “play the first one”, or tap one.":"audio/dave-found-wrestling-picks.mp3",
  "No wrestling shorts in the catalog. Want to try a different kind?":"audio/dave-empty-wrestling-shorts.mp3",
  "No wrestling series in the catalog. Want to try a different kind?":"audio/dave-empty-wrestling-series.mp3",
  "No wrestling movies in the catalog. Want to try a different kind?":"audio/dave-empty-wrestling-movies.mp3",
  "No luck with that kind — here's wrestling picks instead.":"audio/dave-broad-wrestling.mp3",
  "Nothing under wrestling at all — try another genre.":"audio/dave-none-wrestling.mp3"
};
var _daveAudio=null;
function speakClip(text,src){
  try{
    stopSpeak();
    if(!_daveAudio)_daveAudio=new Audio();
    var fellBack=false;
    function fallback(){ if(fellBack)return; fellBack=true; if(speakingNow)speakTTS(text); }
    speakingNow=true;
    speakWatchdog=setTimeout(speakDone,12000);
    _daveAudio.onloadedmetadata=function(){ /* size the stall watchdog to the real clip */
      if(speakWatchdog)clearTimeout(speakWatchdog);
      var ms=(_daveAudio.duration&&isFinite(_daveAudio.duration))?(_daveAudio.duration*1000+5000):12000;
      speakWatchdog=setTimeout(speakDone,ms);
    };
    _daveAudio.onended=function(){ speakDone(); };
    _daveAudio.onerror=function(){ fallback(); };
    _daveAudio.src=src;
    var pr=_daveAudio.play();
    if(pr&&pr.catch)pr.catch(function(){ fallback(); });
    return true;
  }catch(e){ return false; }
}
function speakTTS(text){
  /* Native speaker first (APK): Android WebView has no speechSynthesis,
     so the app carries its own TTS bridge (MainActivity.ttsSpeak). */
  try{
    if(window.Android&&typeof Android.ttsSpeak==="function"){
      stopSpeak();
      speakingNow=true;
      var ms=Math.min(24000,Math.max(6000,text.length*95));
      speakWatchdog=setTimeout(speakDone,ms);
      Android.ttsSpeak(text);
      return true;
    }
  }catch(e){}
  try{
    if(!("speechSynthesis" in window))return false;
    speechSynthesis.cancel();
    var u=new SpeechSynthesisUtterance(text);
    u.lang="en-US"; u.rate=1.02;
    /* MALE VOICE (his word 2026-10-27): when the browser offers a man's
       voice, use it — never the female default while a male voice exists. */
    try{
      var vs=speechSynthesis.getVoices()||[];
      for(var i=0;i<vs.length;i++){
        var nm=(vs[i].name||""), lg=(vs[i].lang||"");
        if(!/^en/i.test(lg))continue;
        if(/female|zira|samantha|victoria|aria|jenny|catherine|martha/i.test(nm))continue;
        if(/david|daniel|christopher|\bmale\b|eric|\bguy\b|ryan|brian|arthur|george|james|thomas|fred|alex/i.test(nm)){ u.voice=vs[i]; break; }
      }
    }catch(e){}
    speakingNow=true;
    u.onend=function(){ speakDone(); };
    u.onerror=function(){ speakDone(); };
    speechSynthesis.speak(u);
    return true;
  }catch(e){ speakingNow=false; return false; }
}
function speak(text){
  text=cleanSayText(text);
  lastSpoken={toks:echoToks(text),end:0};
  var clip=SZ_DAVE_CLIPS[text];
  if(clip&&speakClip(text,clip))return true;
  return speakTTS(text);
}
function afterSpeak(){
  /* CATALOG-SMART GREETING: the greeting just ended — chain the pitch in
     this same seam (there is no speech queue; a parallel say() would
     cancel the greeting). Armed by brainGreet, fires once, fresh only. */
  if(pitchArmed&&liveMode&&opened&&Date.now()-pitchArmAt<20000){ pitchArmed=false; if(deliverPitch())return; }
  if(liveMode&&opened){
    /* ECHO SHIELD: wait out the quiet window (~1s after his voice ends)
       before re-opening the mic — 300ms re-armed it while he was still
       ringing out of the speaker, so he transcribed himself. */
    var wait=Math.max(950,speakEndAt+ECHO_QUIET_MS-Date.now());
    setTimeout(function(){
      if(!liveMode||!opened||speakingNow||inQuiet())return;
      if(popShown())return;
      startListen();
    },wait);
  }
}

/* ---------- log ---------- */
function addMsg(text,who){
  var d=document.createElement("div"); d.className="ag-m "+(who||"a"); d.textContent=text;
  log.appendChild(d); log.scrollTop=log.scrollHeight; return d;
}
function epsCount(t){
  /* slim records carry episodes:[] until hydration; the count lives in ec
     or in the eps string — mirror index's epsN so finds split right. */
  if(t.episodes&&t.episodes.length)return t.episodes.length;
  if(t.ec)return +t.ec||0;
  if(t.eps){ var m=String(t.eps).match(/\d+/); if(m)return +m[0]; }
  return 0;
}
function meta(t){
  var bits=[]; if(t.genre)bits.push(t.genre);
  if(t.runtime)bits.push(String(t.runtime));
  var n=epsCount(t); if(n>1)bits.push(n+" episodes");
  return bits.join(" · ");
}
function addCards(list,note){
  lastCards=list.slice();
  if(bubbleOpen){ bubbleCards=true; bubLine(note||"Found it — tap Shortz to see.","him"); }
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
  if(bubbleOpen) bubLine(text,"him");
  if((liveMode||(opts&&opts.voice))){ if(!speak(text)&&liveMode) afterSpeak(); }
}

/* ---------- Layer 2: the real conversation brain (shortz-brain Worker, wired 2026-10-26) ---------- */
var SZ_BRAIN_URL="https://shortz-brain.second-memory.workers.dev/";
var brainHist=[], brainGreetIdx=-1;
var BRAIN_OPENERS=[
  "What's up, Mr. Moore? What are we getting into?",
  "Hey, Mr. Moore. How's your day treating you so far?",
  "I'm right here, Mr. Moore. What kind of mood are we in?",
  "Good to hear you, Mr. Moore. What are we watching?",
  "Yo, Mr. Moore. Talk to me \u2014 what's the move?"
];
function brainContext(){
  try{
    var d=new Date(), days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    var h=d.getHours(), ap=h>=12?"PM":"AM", h12=h%12||12;
    var out="It is "+days[d.getDay()]+", about "+h12+":"+("0"+d.getMinutes()).slice(-2)+" "+ap+", for Mr. Moore. He is in Live talk in the Shortz VS app.";
    var m=memLoad(), p=(m.plays||[])[0];
    if(p&&p.g) out+=" The last thing he watched was a "+p.g+".";
    var ug=usualGenre(); if(ug) out+=" His usual favorite is "+ug+".";
    return out+catalogDigest();
  }catch(e){ return ""; }
}
function brainPost(body,ms){
  return new Promise(function(resolve){
    var done=false, ctl=("AbortController" in window)?new AbortController():null;
    var to=setTimeout(function(){ if(done)return; done=true; if(ctl){ try{ ctl.abort(); }catch(e){} } resolve(null); },ms||7000);
    fetch(SZ_BRAIN_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),signal:ctl?ctl.signal:undefined})
      .then(function(r){ return r.json(); })
      .then(function(j){ if(done)return; done=true; clearTimeout(to); resolve(j&&typeof j.reply==="string"&&j.reply.trim()?j.reply.trim():null); })
      .catch(function(){ if(done)return; done=true; clearTimeout(to); resolve(null); });
  });
}
window.SZAgentBrain={ ask:function(text){
  var cand=brainHist.concat([{role:"user",content:text}]).slice(-10);
  return brainPost({history:cand,context:brainContext()},7000).then(function(reply){
    if(reply){ brainHist=cand.concat([{role:"assistant",content:reply}]); }
    return reply;
  });
}};
/* Live talk opens with HIM talking first (his word 2026-10-26): a fresh brain greeting every
   time; a rotating local opener covers a slow or unreachable brain so it never opens silent. */
function brainGreet(){
  /* DAVE-1 GREETING (his "use the voice" order, 2026-10-26): Live talk opens
     with one of his crowned Dave-1 lines — the spec greeting or a rotating
     opener — so the first thing he hears is Dave's real voice, every time.
     The brain still runs the conversation from his first reply onward. */
  var lines=["What's up, Mr. Moore? What you trying to watch today — you trying to play something, catch a streamer?"].concat(BRAIN_OPENERS);
  var i; do{ i=Math.floor(Math.random()*lines.length); }while(lines.length>1&&i===brainGreetIdx);
  brainGreetIdx=i; var line=lines[i];
  brainHist=[{role:"assistant",content:line}];
  say(line,{});
  /* arm the catalog pitch — it chains in afterSpeak when this greeting ends */
  pickSessionPitch();
  pitchArmed=!!sessionPick; pitchArmAt=Date.now();
}

/* ---------- CATALOG-SMART GREETING (his ask 2026-10-27): after he greets
   you, Shortz pitches ONE real pick with its real details. Facts come only
   from the catalog record: title, shelf, episode count, and a runtime
   ONLY when the catalog states it unambiguously. The same session pick
   feeds the pitch, the brain's catalog digest, and the yes/no answer. */
var sessionPick=null, pitchQueue=[], pitchArmed=false, pitchArmAt=0, pitchTplIdx=0;
var PITCH_CHANNELS={"Mr. Ballin":1,"Ray WJ":1,"DUST":1};
function pitchRuntime(t){
  var r=String(t.runtime||"").trim(); if(!r)return null;
  var c=epsCount(t), m;
  if(m=r.match(/^~?\s*(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)\s*min\.?$/)) return {lo:+m[1],hi:+m[2],each:c>1};
  if(m=r.match(/^~?\s*(\d+):(\d\d)\s*[–-]\s*(\d+):(\d\d)$/)) return {lo:+m[1],hi:+m[3],each:c>1};
  if(m=r.match(/^~?\s*(\d+):(\d\d)$/)) return {lo:Math.max(1,Math.round((+m[1])+(+m[2])/60)),hi:0,each:false};
  if(c<=1&&(m=r.match(/^~?\s*(\d+)\s*min\.?$/))) return {lo:+m[1],hi:0,each:false};
  return null;
}
function pitchFacts(t){
  var c=epsCount(t), shelf=String(t.genre||""), chan=!!PITCH_CHANNELS[shelf], s;
  if(c>1) s="It's "+(chan?("a series from "+shelf):("a "+shelf+" series"))+" — "+c+" episodes";
  else s="It's "+(chan?("one from "+shelf):("a "+shelf+" pick"));
  var rt=pitchRuntime(t);
  if(rt) s+=", "+(rt.each?("and they run about "):("runs about "))+rt.lo+(rt.hi?(" to "+rt.hi):"")+" minutes"+(rt.each?" each":"");
  return s+".";
}
function pitchLine(t){
  var tpl=["Got one for you — ","Here's one I like for you: ","Before you ask, this one sits right: "][pitchTplIdx++%3];
  return tpl+(t.title||"")+". "+pitchFacts(t)+" Say the word and I'll put it on.";
}
function markPitched(id){
  try{
    var a=JSON.parse(localStorage.getItem("szPitched")||"[]");
    a.push(id); while(a.length>30)a.shift();
    localStorage.setItem("szPitched",JSON.stringify(a));
  }catch(e){}
}
function pickSessionPitch(){
  sessionPick=null; pitchQueue=[];
  try{
    var C=cat(), recent={};
    try{ (JSON.parse(localStorage.getItem("szPitched")||"[]")).forEach(function(x){ recent[x]=1; }); }catch(e){}
    var ug=""; try{ ug=usualGenre()||""; }catch(e){}
    var pool=[], i, t;
    for(i=0;i<C.length;i++){
      t=C[i]; if(!t||!t.title||!t.id)continue;
      if(epsCount(t)<1)continue;
      if(!(t.episodes&&t.episodes.length)&&!t.url&&!t.v)continue;
      var mm=String(t.title).match(/EP\s*(\d+)\s*[-–]\s*(\d+)/i);
      if(mm&&(+mm[2])-(+mm[1])+1!==epsCount(t))continue; /* part-compilation: count wouldn't be honest */
      pool.push(t);
    }
    pool.sort(function(a,b){
      var sa=(String(a.genre||"")===ug?4:0)+(pitchRuntime(a)?2:0)+(a.award_verified?2:(a.verified?1:0));
      var sb=(String(b.genre||"")===ug?4:0)+(pitchRuntime(b)?2:0)+(b.award_verified?2:(b.verified?1:0));
      return sb-sa;
    });
    for(i=0;i<pool.length&&pitchQueue.length<3;i++){ if(!recent[pool[i].id])pitchQueue.push(pool[i]); }
    if(!pitchQueue.length&&pool.length)pitchQueue=pool.slice(0,3);
    sessionPick=pitchQueue[0]||null;
  }catch(e){}
}
function deliverPitch(){
  if(!sessionPick)return false;
  var line=pitchLine(sessionPick);
  brainHist.push({role:"assistant",content:line});
  pendingAsk={pitch:sessionPick.id,askedAt:Date.now()};
  markPitched(sessionPick.id);
  say(line,{});
  return true;
}
function pitchNext(viaVoice){
  pitchQueue.shift();
  if(!pitchQueue.length)pickSessionPitch();
  sessionPick=pitchQueue[0]||null;
  if(!sessionPick){ say("That's the best I've got lined up — tell me a mood and I'll dig.",{voice:viaVoice}); return; }
  var line=pitchLine(sessionPick);
  brainHist.push({role:"assistant",content:line});
  pendingAsk={pitch:sessionPick.id,askedAt:Date.now()};
  markPitched(sessionPick.id);
  say(line,{voice:viaVoice});
}
function answerPitch(low,viaVoice){
  if(Date.now()-(pendingAsk.askedAt||0)>120000)return false; /* stale — route fresh */
  var t=byId(pendingAsk.pitch); if(!t)return false;
  var words=low.split(/\s+/).length;
  if(words<=5&&/^(yes|yeah|yep|sure|ok|okay|play it|play that|put it on|let'?s go|do it|sounds good|watch it|go ahead)\b/.test(low)){ pendingAsk=null; presentPick(t,viaVoice); return true; }
  if(words<=5&&/\b(another|different|something else|next one|next)\b/.test(low)){ pendingAsk=null; pitchNext(viaVoice); return true; }
  if(words<=5&&/^(no|nope|not now|pass|nah)\b/.test(low)){ pendingAsk=null; say("No problem. What are you in the mood for?",{voice:viaVoice}); return true; }
  return false; /* anything longer/different is a fresh request — handle() clears and routes it */
}
var brainDigest="", brainDigestId="__none__";
function catalogDigest(){
  var id=sessionPick?sessionPick.id:"";
  if(brainDigest&&brainDigestId===id)return brainDigest;
  try{
    var C=cat(), eps=0, gc={}, i, t;
    for(i=0;i<C.length;i++){ t=C[i]; if(!t)continue; eps+=epsCount(t); var g=String(t.genre||""); if(g)gc[g]=(gc[g]||0)+1; }
    var top=Object.keys(gc).sort(function(a,b){ return gc[b]-gc[a]; }).slice(0,5);
    var s=" Catalog digest (real, from the app itself): "+C.length.toLocaleString()+" titles, "+eps.toLocaleString()+" episodes. Biggest shelves: "+top.join(", ")+".";
    function dt(x){ if(!x)return ""; var c=epsCount(x), rt=pitchRuntime(x); return (x.title||"")+" ("+(x.genre||"")+(c>1?(", "+c+" episodes"):", single")+(rt?(", runs about "+rt.lo+(rt.hi?(" to "+rt.hi):"")+" minutes"+(rt.each?" each":"")):"")+")"; }
    if(sessionPick)s+=" The pick you pitched him: "+dt(sessionPick)+".";
    var alts=pitchQueue.slice(1).map(dt).filter(Boolean);
    if(alts.length)s+=" Also lined up: "+alts.join("; ")+".";
    brainDigest=s; brainDigestId=id; return s;
  }catch(e){ return ""; }
}

/* ---------- the brain (Layer 1 + 5 + 4) ---------- */
var GENRE_WORDS={horror:"Horror",scary:"Horror",comedy:"Comedy",funny:"Comedy",action:"Action",drama:"Drama",western:"Western",westens:"Western","sci-fi":"Sci-Fi",scifi:"Sci-Fi","science fiction":"Sci-Fi",romance:"Romance",thriller:"Thriller",mystery:"Mystery",crime:"Crime",documentary:"Documentary",animation:"Animation",anime:"Anime",family:"Family",war:"War",music:"Music",sports:"Sports",reality:"Reality",wrestling:"Wrestling"};
function runtimeMin(t){
  var r=String(t.runtime||""); if(!r)return null;
  var h=r.match(/(\d+)\s*h/), m=r.match(/(\d+)\s*m/);
  if(h||m) return (h?parseInt(h[1],10)*60:0)+(m?parseInt(m[1],10):0);
  var plain=r.match(/^(\d+)$/); return plain?parseInt(plain[1],10):null;
}
function isSeries(t){ return epsCount(t)>1; }

function doFind(genreWord,typeWord,maxMin,phrase,off,extra){
  extra=extra||{};
  var C=cat(), out=[], i, t, g = genreWord?GENRE_WORDS[genreWord]:null;
  var terms=extra.terms||null;
  for(i=0;i<C.length&&out.length<40;i++){
    t=C[i]; if(!t||!t.title)continue;
    if(g && String(t.genre||"").toLowerCase()!==g.toLowerCase())continue;
    if(!g && phrase){
      var hay=(String(t.title)+" "+String(t.genre||"")).toLowerCase();
      if(phrase.split(/\s+/).some(function(w){ return w.length>2 && hay.indexOf(w)<0; }))continue;
    }
    /* FIND EXACTNESS (his order 2026-10-27): theme words and episode-count
       bounds are part of the ask — a title that fails them is not a match,
       and "no match" is an honest answer, never random cards. */
    if(terms){
      var hay2=(String(t.title)+" "+String(t.genre||"")+" "+String(t.desc||"")).toLowerCase(), okT=true;
      for(var ti=0;ti<terms.length;ti++){ var term=terms[ti], stem=term.replace(/(es|s)$/,""); if(hay2.indexOf(term)<0&&hay2.indexOf(stem)<0){ okT=false; break; } }
      if(!okT)continue;
    }
    if(typeWord==="movie"&&isSeries(t))continue;
    if(typeWord==="series"&&!isSeries(t))continue;
    if(extra.minEps&&epsCount(t)<=extra.minEps)continue;
    if(extra.maxEps&&epsCount(t)>=extra.maxEps)continue;
    if(maxMin){ var rm=runtimeMin(t); if(rm!==null&&rm>maxMin)continue; if(rm===null&&typeWord!=="short")continue; }
    if(typeWord==="short"){ var r2=runtimeMin(t); if(r2!==null&&r2>45)continue; }
    out.push(t);
  }
  out.sort(function(a,b){ var d=((b.award_verified?2:0)+(b.verified?1:0))-((a.award_verified?2:0)+(a.verified?1:0)); if(!d&&(terms||extra.minEps))d=epsCount(b)-epsCount(a); return d; });
  return out.slice(off||0,(off||0)+3);
}

/* ---------- talk-back: follow-up answers + referring to the picks ---------- */
function askKind(gw,viaVoice){
  pendingAsk={genre:gw,askedAt:Date.now(),reasks:0};
  say("Okay, "+GENRE_WORDS[gw].toLowerCase()+" — you looking for a short form, a movie, or a series?",{voice:viaVoice});
  addChips(["A short one","A movie","A series","Any of those"]);
}
function answerKind(low,viaVoice){
  if(Date.now()-(pendingAsk.askedAt||0)>120000)return false; // stale question — route fresh
  if(/\b(play|watch|bring up|open|go to|take me)\b/.test(low))return false; // a command beats an answer
  /* a find for a DIFFERENT genre is a new request, never this answer */
  if(/\b(find|show|search|get|give|look for|looking for)\b/.test(low)){
    for(var k in GENRE_WORDS){ if(k!==pendingAsk.genre&&low.indexOf(k)>=0)return false; }
  }
  var tw=null, any=false;
  if(/\bshort\b/.test(low))tw="short"; // short first: "a short movie" means short-form
  else if(/\bseries\b|\bserious\b|\bshows?\b|\btv\b/.test(low))tw="series"; // "serious" = the mic's mis-hear of series
  else if(/\bmovies?\b|\bfilms?\b/.test(low))tw="movie";
  else if(/\b(any|either|whatever|don'?t care|doesn'?t matter|all of them)\b/.test(low))any=true;
  if(!tw&&!any)return false;
  if(low.split(/\s+/).length>6&&!any)return false; // a long sentence is a new request, not an answer
  var mm=low.match(/under\s+(\d+)\s*(min|minute|hour)/), maxMin=null;
  if(mm)maxMin=parseInt(mm[1],10)*(mm[2]==="hour"?60:1);
  var gw=pendingAsk.genre, reasks=pendingAsk.reasks||0; pendingAsk=null;
  var res=doFind(gw,tw,maxMin,null);
  lastFind={gw:gw,typeWord:tw,maxMin:maxMin,off:0};
  var kind=tw==="short"?"shorts":tw==="series"?"series":tw==="movie"?"movies":"picks";
  if(res.length){
    say("Here's some "+GENRE_WORDS[gw].toLowerCase()+" "+kind+" — say \u201Cplay the first one\u201D, or tap one.",{voice:viaVoice});
    addCards(res,GENRE_WORDS[gw]+" "+kind+":");
  }else if(reasks<1){
    pendingAsk={genre:gw,askedAt:Date.now(),reasks:reasks+1};
    say("No "+GENRE_WORDS[gw].toLowerCase()+" "+kind+" in the catalog. Want to try a different kind?",{voice:viaVoice});
    addChips(["A short one","A movie","A series","Any of those"]);
  }else{
    var broad=doFind(gw,null,null,null);
    if(broad.length){ lastFind={gw:gw,typeWord:null,maxMin:null,off:0}; say("No luck with that kind — here's "+GENRE_WORDS[gw].toLowerCase()+" picks instead.",{voice:viaVoice}); addCards(broad,GENRE_WORDS[gw]+" picks:"); }
    else say("Nothing under "+GENRE_WORDS[gw].toLowerCase()+" at all — try another genre.",{voice:viaVoice});
  }
  return true;
}
function presentPick(t,viaVoice){
  memPlay(t);
  say("Playing "+(t.title||"it")+".",{voice:viaVoice});
  closeSheet();
  try{ cfPresentTitle(t); }catch(e){}
}
function openPick(t,viaVoice){
  /* "open / bring up the first one" shows it first (info-first law) —
     only an explicit play verb presents and plays. */
  say("Here's "+(t.title||"it")+".",{voice:viaVoice});
  closeSheet();
  try{ openDetail(t.id); }catch(e){}
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
  if(liveMode&&/^(stop|stop talking|goodbye|bye|end call|hang up)\b/.test(low)){ pendingAsk=null; liveMode=false; liveBtn.classList.remove("on"); say("Okay — call ended. I'm still here in text whenever.",{}); return; }

  /* the catalog pitch gets its own answer lane FIRST (answerKind would
     swallow a yes — it only understands the genre-question shape) */
  if(pendingAsk&&pendingAsk.pitch){ if(answerPitch(low,viaVoice))return; pendingAsk=null; }

  /* talk-back: an answer to her follow-up question beats fresh routing;
     anything else clears the question and routes as a new request */
  if(pendingAsk){ if(answerKind(low,viaVoice))return; pendingAsk=null; }

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

  /* follows: his list + who's live FROM his list (his order 2026-10-27) */
  if(/who am i following|who do i follow|my follows|my following/.test(low)){
    var fl=(typeof window.szFollowedStreamers==="function")?window.szFollowedStreamers():[];
    if(!fl.length)say("You're not following anybody yet. Tap any streamer and hit Follow on their card, and I'll watch them for you.",{voice:viaVoice});
    else say("You're following "+fl.map(function(s){return s.name;}).join(", ")+".",{voice:viaVoice});
    return;
  }

  /* what's live */
  if(/what'?s live|who'?s live|who is live|what is live|anybody live|anyone live/.test(low)){
    var hasFol=(typeof window.szFollowedStreamers==="function"&&window.szFollowedStreamers().length>0);
    if(hasFol){
      var lv=window.szFollowLive();
      if(lv.length)say("From your follows, "+lv.map(function(s){return s.name;}).join(", ")+(lv.length===1?" is":" are")+" live right now.",{voice:viaVoice});
      else say("None of your follows are live right now.",{voice:viaVoice});
      try{ if(typeof refreshStreamersLive==="function")refreshStreamersLive(); }catch(e){}
      return;
    }
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

  /* talk-back: referring to the picks she just showed. A play verb plays;
     open / bring up / a bare pick shows it first (info-first law). */
  var ord={first:0,"1st":0,second:1,"2nd":1,third:2,"3rd":2};
  var pm=low.match(/^(?:play|watch|put on)\s+(?:the\s+)?(first|second|third|1st|2nd|3rd)(?:\s+one)?\s*(?:please)?$/);
  if(pm&&lastCards&&lastCards[ord[pm[1]]]){ presentPick(lastCards[ord[pm[1]]],viaVoice); return; }
  var om=low.match(/^(?:(?:open|bring up|show)\s+)?(?:the\s+)?(first|second|third|1st|2nd|3rd)(?:\s+one)?\s*(?:please)?$/);
  if(om&&lastCards&&lastCards[ord[om[1]]]&&!/^(play|watch|put on)\b/.test(low)){ openPick(lastCards[ord[om[1]]],viaVoice); return; }
  if(/^(play|watch|put on) (it|that|that one)$/.test(low)&&lastCards&&lastCards.length){ presentPick(lastCards[0],viaVoice); return; }
  if(/^(open|bring up) (it|that|that one)$/.test(low)&&lastCards&&lastCards.length){ openPick(lastCards[0],viaVoice); return; }
  if(/^(more|show me more|another|any more)$/.test(low)&&lastFind){
    var more=doFind(lastFind.gw,lastFind.typeWord,lastFind.maxMin||null,null,lastFind.off+3,{minEps:lastFind.minEps,maxEps:lastFind.maxEps,terms:lastFind.terms});
    if(!more.length){ lastFind.off=0; more=doFind(lastFind.gw,lastFind.typeWord,lastFind.maxMin||null,null,0,{minEps:lastFind.minEps,maxEps:lastFind.maxEps,terms:lastFind.terms}); }
    else lastFind.off+=3;
    if(more.length){ say("Here's some more.",{voice:viaVoice}); addCards(more,"More picks:"); return; }
  }

  /* filter finds: "find me a horror short under 20 minutes" */
  var fm=low.match(/(?:find|show|get|give|search|watch|see)(?:\s+me)?\s+(?:a\s+|an\s+|some\s+)?(.+)/);
  if(fm){
    var rest=fm[1], origRest=fm[1], maxMin=null, mm=rest.match(/under\s+(\d+)\s*(min|minute|hour)/);
    if(mm){ maxMin=parseInt(mm[1],10)*(mm[2]==="hour"?60:1); rest=rest.replace(mm[0],""); }
    /* episode-count bounds: "more than five episodes" is part of the ask */
    var minEps=null, maxEps=null, em, NUMW={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,fifteen:15,twenty:20};
    function numW(s){ return /^\d+$/.test(s)?parseInt(s,10):(NUMW[s]||null); }
    if(em=rest.match(/(?:more than|over|at least)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty)\s*episodes?/)){ var nv=numW(em[1]); if(nv!==null){ minEps=nv; rest=rest.replace(em[0]," "); } }
    if(em=rest.match(/(?:fewer than|less than|under)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty)\s*episodes?/)){ var nv2=numW(em[1]); if(nv2!==null){ maxEps=nv2; rest=rest.replace(em[0]," "); } }
    var typeWord=null; if(/\bseries\b|\bserious\b|\bshow\b/.test(rest)&&!/shows?\s+me/.test(low))typeWord="series"; if(/\bmovie\b|\bfilm\b/.test(rest))typeWord="movie"; if(/\bshort\b/.test(rest))typeWord="short";
    var gw=null; for(var k in GENRE_WORDS){ if(rest.indexOf(k)>=0){ gw=k; break; } }
    /* theme terms: whatever content words survive after the kind, the
       genre, and the filler are stripped ("zombie" is the whole point of
       "zombie series" — dropping it silently was the 2026-10-27 bug) */
    var themeStr=rest; if(gw)themeStr=themeStr.split(gw).join(" ");
    var FILLER={series:1,serious:1,show:1,shows:1,movie:1,movies:1,film:1,films:1,short:1,shorts:1,with:1,than:1,more:1,less:1,over:1,under:1,episodes:1,episode:1,eps:1,the:1,and:1,for:1,that:1,have:1,has:1,got:1,some:1,any:1,one:1,ones:1,please:1,something:1,anything:1,stuff:1,video:1,videos:1,kind:1,type:1,genre:1,titles:1,title:1,good:1,great:1,nice:1,best:1,watch:1,watching:1,about:1,from:1,like:1,want:1,need:1};
    var terms=themeStr.replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(function(w){ return w.length>2&&!FILLER[w]; });
    if(gw||typeWord||maxMin||minEps||maxEps||terms.length){
      /* talk-back: a genre ask with the kind still open gets a question
         first, not a silent card dump — his example: "I want to find like
         a drama series" -> "Okay, a drama — short form, a movie, or a
         series?" A want-phrase asks even when a kind word rode along; a
         runtime cap or a direct command with a kind acts at once. Theme
         terms and episode bounds are exact asks — they act at once too. */
      var wantPhrase=/\b(i want|i wanna|i'?m looking for|looking for|i feel like)\b/.test(low);
      if(gw&&!maxMin&&!minEps&&!maxEps&&!terms.length&&(!typeWord||wantPhrase)){ askKind(gw,viaVoice); return; }
      var ex={minEps:minEps,maxEps:maxEps,terms:terms.length?terms:null};
      var res=doFind(gw,typeWord,maxMin,null,0,ex);
      lastFind={gw:gw,typeWord:typeWord,maxMin:maxMin,off:0,minEps:minEps,maxEps:maxEps,terms:terms.length?terms:null};
      if(res.length){
        var note=(terms.length?terms.map(function(w){return w.charAt(0).toUpperCase()+w.slice(1);}).join(" "):(gw?GENRE_WORDS[gw]:"Picks"))+(typeWord==="short"?" shorts":typeWord==="series"?" series":typeWord==="movie"?" movies":"")+(minEps?(" with more than "+minEps+" episodes"):"")+(maxEps?(" with fewer than "+maxEps+" episodes"):"")+(maxMin?(" under "+maxMin+" minutes"):"");
        if(viaVoice||liveMode){ addCards(res); say(note+" — say \u201Cplay the first one\u201D, or tap one.",{voice:viaVoice}); }
        else addCards(res,note+":");
      }
      else say("I couldn't find a match for \u201C"+origRest.trim()+"\u201D in the catalog — nothing in there fits all of that.",{voice:viaVoice});
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

  /* TITLE FIRST (his order 2026-10-26): a bare title name IS the title —
     "remain calm" goes straight to Remain Calm, never to the chat brain as
     a mood to comment on. Strict whole-utterance equality only, so ordinary
     sentences are never hijacked. */
  var bareT=bareTitleMatch(text);
  if(bareT){ openPick(bareT,viaVoice); return; }

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
    bubHeard=true;
    handle(t,true);
    if(liveMode){
      setTimeout(function(){
        var pop=$("#voicePop");
        var listeningNow=!!(pop&&pop.classList.contains("show"));
        var speaking=speakingNow;
        if(liveMode&&opened&&!listeningNow&&!speaking&&!inQuiet()) startListen();
      },1200);
    }
  };
  if(liveMode&&popShown())return; /* session visibly live: capture re-armed above; a toggle would kill it */
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
      if(bubbleOpen) bubLine(t,"you");
    }
  });
  mo.observe(tx,{childList:true,characterData:true,subtree:true});
  if(pop){
    var po=new MutationObserver(function(){
      var hidden=pop.getAttribute("aria-hidden")==="true"||!pop.classList.contains("show");
      micBtn.classList.toggle("listening",!hidden);
      if(bubbleOpen){ bub.classList.toggle("listening",!hidden); if(hidden&&!bubHeard&&!speakingNow) bubLine("Didn't catch that — tap Shortz to try again.","him"); }
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
  pendingAsk=null; /* a pending question dies with the sheet (Pinky audit) */
  opened=false; stopSpeak(); wrap.classList.remove("open"); wrap.setAttribute("aria-hidden","true");
  if(liveMode){ liveMode=false; liveBtn.classList.remove("on"); stopLiveGuard(); }
}
window._agentOpen=openSheet;
window._agentSay=say; /* FOLLOWS LIVE CALL (2026-10-27): the go-live alert speaks through the agent's own say() — clip-first, voice rules intact */
wrap.querySelector(".ag-back").addEventListener("click",closeSheet);
$("#agClose").addEventListener("click",closeSheet);
$("#agSend").addEventListener("click",function(){ var v=input.value; input.value=""; handle(v,false); });
input.addEventListener("keydown",function(e){ if(e.key==="Enter"){ var v=input.value; input.value=""; handle(v,false); } });
micBtn.addEventListener("click",function(){
  /* BARGE-IN (live-talk feel, his word 2026-10-26): tapping the mic while
     Shortz is talking cuts him off and hands the floor to the user —
     deliberate, so it never trips the echo shield. */
  if(speakingNow){ stopSpeak(); setTimeout(function(){ if(opened) startListen(); },200); return; }
  startListen();
});
liveBtn.addEventListener("click",function(){
  liveMode=!liveMode; liveBtn.classList.toggle("on",liveMode);
  if(liveMode){ startLiveGuard(); brainGreet(); }
  else{ pendingAsk=null; stopLiveGuard(); stopSpeak(); }
});
/* ---------- the bubble: the mic's simple face (his word 2026-10-25) ----------
   Mic tap opens THIS, never the chat window: mascot in a circle, a live
   voice line under him driven by the real mic level (native RMS bridge;
   her speaking state pulses it while she talks), one line of text.
   The chat window opens only from the Type pill. */
var bubbleOpen=false, bubbleCards=false, bubHeard=false;
var waveLevel=0, waveTick=null, lastRmsAt=0;
var bubSaid=bub.querySelector(".agb-said"), bubBars=bub.querySelectorAll(".agb-wave i");
window.onNativeVoiceRms=function(v){ var n=parseFloat(v); if(isFinite(n)){ waveLevel=Math.max(0,Math.min(1,n)); lastRmsAt=Date.now(); } };
function popShown(){ var pop=$("#voicePop"); return !!(pop&&pop.classList.contains("show")); }
function bubLine(t,who){ if(bubSaid){ bubSaid.textContent=t; bubSaid.className="agb-said "+(who==="you"?"you":"him"); } }
function waveStart(){ if(waveTick)return; waveTick=setInterval(function(){
  var sp=speakingNow?(0.34+0.18*Math.sin(Date.now()/170)):0;
  if(Date.now()-lastRmsAt>260) waveLevel*=0.72;
  var lv=Math.max(waveLevel,sp), pat=[0.45,0.75,1,0.8,0.55,0.8,1,0.75,0.45];
  for(var i=0;i<bubBars.length;i++){ bubBars[i].style.height=(4+lv*28*(pat[i]||0.6))+"px"; }
},90); }
function waveStop(){ if(waveTick){ clearInterval(waveTick); waveTick=null; } for(var i=0;i<bubBars.length;i++) bubBars[i].style.height="5px"; }
function openBubble(){
  if(opened) closeSheet();
  bubbleOpen=true; bubbleCards=false; bubHeard=false;
  bub.classList.add("open"); bub.setAttribute("aria-hidden","false");
  bubLine("Listening…","you"); waveStart();
  setTimeout(function(){ if(bubbleOpen) startListen(); },200);
}
function closeBubble(){
  if(!bubbleOpen)return;
  bubbleOpen=false; bub.classList.remove("open"); bub.setAttribute("aria-hidden","true"); waveStop();
  if(popShown()){ try{ if(window._micToggle) window._micToggle(); }catch(e){} }
}
window._agentBubble=openBubble;
bub.querySelector(".agb-back").addEventListener("click",closeBubble);
bub.querySelector(".agb-x").addEventListener("click",closeBubble);
bub.querySelector(".agb-type").addEventListener("click",function(){ closeBubble(); openSheet(false); });
bub.querySelector(".agb-face").addEventListener("click",function(){
  if(bubbleCards){ closeBubble(); openSheet(false); }
  else if(speakingNow){ /* BARGE-IN: tap his face mid-sentence — he stops, the mic is yours. */
    stopSpeak(); bubHeard=false; bubLine("Listening…","you");
    setTimeout(function(){ if(bubbleOpen) startListen(); },200);
  }
  else if(!popShown()){ bubHeard=false; bubLine("Listening…","you"); startListen(); }
});

/* ---------- live-talk guard: while Live talk is on, the mic hands back ----------
   Self-healing loop: any dropped re-arm (a native session that ended
   silently, a toggle consumed mid-teardown) is picked up here. Every arm
   is guarded by the same checks, so the paths can never double-start. */
var liveGuard=null;
function startLiveGuard(){ stopLiveGuard(); liveGuard=setInterval(function(){
  if(liveMode&&opened&&!speakingNow&&!inQuiet()&&!popShown()) startListen();
},1300); }
function stopLiveGuard(){ if(liveGuard){ clearInterval(liveGuard); liveGuard=null; } }

watchTranscript();
})();
