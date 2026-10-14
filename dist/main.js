import { GameWorld } from './engine.js';
import { WorldPainter } from './world.js';
import { MusicJourney, AURORA_END, AMBITION_START } from './audio.js';
import { CAMPAIGN } from './campaign.js';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d',{alpha:false});
const SAVE_KEY='aurora-hick-campaign-v3',SETTINGS_KEY='aurora-hick-settings-v3';
const input={left:false,right:false,up:false,down:false,jump:false,heavy:false,throw:false,guard:false,dodge:false,magic:false,interact:false};
const keyboard=new Set(),touches=new Map(),pendingActions=new Set();
const keymap={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Space:'jump',KeyA:'heavy',KeyW:'throw',KeyS:'guard',KeyD:'dodge',KeyQ:'magic',KeyE:'interact'};
const touchDevice=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0||new URLSearchParams(location.search).has('touch');
document.body.classList.toggle('touch',touchDevice);
if(touchDevice)canvas.setAttribute('aria-label','Juego. Usa los botones de dirección, Golpear, Obsidiana, Magia, Defensa, Esquiva, Saltar e Interactuar.');
let active=false,starting=false,startToken=0,currentChapter=-1,transitioning=false,pendingCompletion=null,celebrationTime=0,finalFadeStarted=false,helpReturn='title',cardTimeout,toastTimeout,saveTimer=0,uiTimer=0,visualTime=0,paintNeeded=true,lastMissionId='';
let settings=readStorage(SETTINGS_KEY)||{effects:.18,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches};
let saved=readStorage(SAVE_KEY);
const painter=new WorldPainter();
const conductor=new MusicJourney({onError:text=>{showToast(text,7000);if(active)showPause();}});
function createWorld(){return new GameWorld({onEvent:event=>{
 if(event.type==='toast')showToast(event.text);
 if(event.type==='effect')conductor.effect(event.kind);
 if(event.type==='bossDefeated')pendingCompletion=event;
 if(event.type==='mission'&&event.id){lastMissionId='';}
}});}
let world=createWorld();
new ResizeObserver(()=>{canvas.width=Math.max(320,Math.min(1600,Math.round($('stage').clientWidth*Math.min(devicePixelRatio||1,1.4))));canvas.height=Math.round(canvas.width*9/16);paintNeeded=true;}).observe($('stage'));
function readStorage(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
function writeStorage(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
function formatTime(seconds){const t=Math.floor(Math.max(0,seconds));return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;}
function visible(id,show){$(id).classList.toggle('hidden',!show);}
function clearInputs(){keyboard.clear();touches.clear();pendingActions.clear();for(const k in input)input[k]=false;world.resetInput?.();document.querySelectorAll('[data-input]').forEach(b=>b.classList.remove('pressed'));}
function updateInputs(){for(const action in input)input[action]=pendingActions.has(action)||[...keyboard].some(code=>keymap[code]===action)||[...touches.values()].includes(action);}
function readableInstruction(text=''){
 if(!touchDevice)return text;
 return text.replace(/W lanza obsidiana\.?/g,'Usa Obsidiana para lanzar piedras.').replace(/con E/g,'con Interactuar').replace(/\bE\b/g,'Interactuar').replace(/\bW\b/g,'Obsidiana').replace(/\bQ\b/g,'Magia');
}
function showToast(text,duration=2200){$('toast').textContent=readableInstruction(text);$('toast').classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('toast').classList.remove('visible'),duration);}
function updateContinue(){saved=readStorage(SAVE_KEY);const ok=saved?.version===3&&saved?.music?.elapsed>.5&&!saved?.music?.finished&&saved?.music?.phase!=='ended';visible('continue-btn',ok);if(ok)$('save-time').textContent=CAMPAIGN[saved.world?.chapter||0]?.title||formatTime(saved.music.elapsed);}
function saveGame(){if(!active||starting)return;writeStorage(SAVE_KEY,{version:3,savedAt:Date.now(),music:conductor.exportState(),world:world.exportState(),celebrationTime});}
function applySettings(){conductor.setEffectVolume(settings.effects);$('effect-volume').value=Math.round(settings.effects*100);$('reduced-motion').checked=!!settings.reduced;document.body.classList.toggle('reduce-motion',!!settings.reduced);}
function playControls(){const s=conductor.state;const can=active&&!starting&&!s.paused&&!s.loading&&!s.finished&&!transitioning&&!['cleared','celebration'].includes(world.snapshot.campaign?.phase);visible('touch-controls',touchDevice&&can);visible('desktop-guide',!touchDevice&&can);}
function showCard(label,title,text){$('card-number').textContent=label;$('card-title').textContent=title;$('card-subtitle').textContent=readableInstruction(text);clearTimeout(cardTimeout);$('chapter-card').classList.add('hidden');void $('chapter-card').offsetWidth;visible('chapter-card',true);cardTimeout=setTimeout(()=>visible('chapter-card',false),5000);}
function showChapter(index){const chapter=CAMPAIGN[index];$('chapter-number').textContent=index===0?'APERTURA':`NIVEL ${String(index).padStart(2,'0')}`;$('chapter-title').textContent=chapter.title;lastMissionId='';showCard(index===0?'APERTURA':`NIVEL ${index}`,chapter.title,world.snapshot.objective?.text||chapter.objective||'Completa las misiones y recoge sus tres pergaminos.');}
function updateMissionCard(snapshot){if(!snapshot.missions?.length||snapshot.campaign?.phase!=='missions')return;const id=snapshot.objective?.missionId||snapshot.campaign?.missionId;const m=snapshot.missions.find(m=>m.id===id)||snapshot.missions.find(m=>!m.scrollCollected);if(m&&m.id!==lastMissionId){lastMissionId=m.id;showCard(`${CAMPAIGN[snapshot.chapter].title.toUpperCase()} · MISIÓN ${snapshot.missions.indexOf(m)+1}`,m.title,m.complete&&!m.scrollCollected?'Recoge el pergamino de esta misión con E.':m.objective);}}
async function startGame(continueSaved=false){if(starting)return;const token=++startToken;starting=true;clearInputs();const restore=continueSaved?readStorage(SAVE_KEY):null;world=createWorld();if(restore?.world)world.restoreState(restore.world);transitioning=false;pendingCompletion=null;celebrationTime=restore?.celebrationTime||0;finalFadeStarted=false;active=true;currentChapter=-1;
 for(const id of ['title-screen','ending-screen','pause-screen','help-screen','boss-hud'])visible(id,false);visible('hud',true);visible('objective',true);visible('buffering',true);
 const p=conductor.start(restore?.music||null);await p;if(token!==startToken||!active)return;starting=false;
 currentChapter=conductor.state.chapter;if(world.chapter!==currentChapter)world.enterChapter(currentChapter);showChapter(currentChapter);paintNeeded=true;if(document.hidden){showPause();return;}playControls();saveGame();if(!touchDevice)canvas.focus({preventScroll:true});
}
async function completeLevel(event){if(transitioning||!active)return;transitioning=true;clearInputs();playControls();showToast(event.final?'Comunidad liberada.':'Jefe derrotado. Avanza al siguiente nivel.',3500);
 if(event.final){celebrationTime=0;transitioning=false;return;}
 const token=startToken;const ok=await conductor.advanceLevel(event.chapter+1,{fadeSeconds:3});if(token!==startToken||!active||!ok)return;transitioning=false;currentChapter=conductor.state.chapter;if(world.chapter!==currentChapter)world.enterChapter(currentChapter);showChapter(currentChapter);playControls();saveGame();
}
function showPause(){if(!active||conductor.finished)return;conductor.pause();clearInputs();saveGame();visible('pause-screen',true);visible('touch-controls',false);visible('desktop-guide',false);$('resume-btn').focus({preventScroll:true});}
async function resumeGame(){visible('pause-screen',false);clearInputs();await conductor.resume();if(conductor.paused)return;if(document.hidden){showPause();return;}playControls();if(!touchDevice)canvas.focus({preventScroll:true});}
function goToMenu(){++startToken;saveGame();conductor.stop();active=false;starting=false;transitioning=false;pendingCompletion=null;clearInputs();for(const id of ['pause-screen','help-screen','ending-screen','hud','objective','touch-controls','desktop-guide','chapter-card','hick-reveal','buffering','interaction-prompt','boss-hud'])visible(id,false);document.body.classList.remove('boss-fight');visible('title-screen',true);updateContinue();paintNeeded=true;}
function showHelp(from){helpReturn=from;if(from==='pause')visible('pause-screen',false);visible('help-screen',true);clearInputs();$('help-close').focus({preventScroll:true});}
function closeHelp(){visible('help-screen',false);if(helpReturn==='pause')visible('pause-screen',true);else $('start-btn').focus({preventScroll:true});}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await $('game-shell').requestFullscreen();}catch{showToast('Amplía el navegador para ver todo el paisaje.');}}
function finishGame(){clearInputs();for(const id of ['touch-controls','desktop-guide','objective','chapter-card','interaction-prompt','boss-hud','hud','toast'])visible(id,false);visible('ending-screen',true);const s=world.stats;$('ending-stats').textContent=`${s.defeated||0} enemigos derrotados · ${s.bosses||0} jefes superados · ${formatTime(conductor.state.elapsed)}`;saveGame();$('end-menu-btn').focus({preventScroll:true});}
document.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;if(e.code==='Escape'||e.code==='KeyP'){e.preventDefault();if(e.repeat)return;if(!$('help-screen').classList.contains('hidden'))closeHelp();else if(active&&!starting&&!conductor.finished)conductor.paused?resumeGame():showPause();return;}if(active&&!conductor.paused&&!conductor.finished&&!transitioning&&keymap[e.code]){e.preventDefault();keyboard.add(e.code);if(!e.repeat&&!['left','right','up','down','guard'].includes(keymap[e.code]))pendingActions.add(keymap[e.code]);updateInputs();}});
document.addEventListener('keyup',e=>{if(keymap[e.code]){keyboard.delete(e.code);updateInputs();}});
window.addEventListener('blur',()=>{clearInputs();if(active&&!conductor.paused&&!conductor.finished)showPause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&active&&!conductor.paused&&!conductor.finished)showPause();});window.addEventListener('pagehide',saveGame);
document.querySelectorAll('[data-input]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();if(!active||conductor.paused||transitioning)return;b.setPointerCapture(e.pointerId);touches.set(e.pointerId,b.dataset.input);if(!['left','right','up','down','guard'].includes(b.dataset.input))pendingActions.add(b.dataset.input);b.classList.add('pressed');updateInputs();});const release=e=>{touches.delete(e.pointerId);b.classList.remove('pressed');updateInputs();};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);b.addEventListener('contextmenu',e=>e.preventDefault());});
$('start-btn').addEventListener('click',()=>startGame(false));$('continue-btn').addEventListener('click',()=>startGame(true));$('restart-btn').addEventListener('click',()=>startGame(false));$('pause-btn').addEventListener('click',showPause);$('resume-btn').addEventListener('click',resumeGame);$('menu-btn').addEventListener('click',goToMenu);$('end-menu-btn').addEventListener('click',goToMenu);$('help-title').addEventListener('click',()=>showHelp('title'));$('help-pause').addEventListener('click',()=>showHelp('pause'));$('help-close').addEventListener('click',closeHelp);$('fullscreen-title').addEventListener('click',fullscreen);$('fullscreen-pause').addEventListener('click',fullscreen);
$('interaction-prompt').addEventListener('click',()=>{if(active&&!conductor.paused){pendingActions.add('interact');updateInputs();}});
$('effect-volume').addEventListener('input',e=>{settings.effects=Number(e.target.value)/100;applySettings();writeStorage(SETTINGS_KEY,settings);});$('reduced-motion').addEventListener('change',e=>{settings.reduced=e.target.checked;applySettings();writeStorage(SETTINGS_KEY,settings);});
let last=performance.now(),wasFinished=false;
function frame(now){const delta=Math.max(0,(now-last)/1000);last=now;const dt=Math.min(delta,.25);
 if(active&&!starting){conductor.tick(delta);const s=conductor.state;
  if(s.chapter!==currentChapter){currentChapter=s.chapter;if(world.chapter!==s.chapter)world.enterChapter(s.chapter);showChapter(s.chapter);paintNeeded=true;saveGame();}
  const celebration=world.snapshot.campaign?.phase==='celebration';
  if((!s.paused&&!s.loading&&!s.finished&&s.phase==='music'&&!transitioning)||s.finished&&celebration){let remaining=dt;while(remaining>.00001){const step=Math.min(remaining,1/60);world.update(step,celebration?{}:input,s.chapterProgress);pendingActions.clear();updateInputs();remaining-=step;}visualTime+=settings.reduced?dt*.2:dt;saveTimer+=dt;if(saveTimer>=3){saveTimer=0;saveGame();}}
  if(pendingCompletion){const ev=pendingCompletion;pendingCompletion=null;completeLevel(ev);}
  if(celebration&&!s.paused&&!s.loading&&!s.finished){celebrationTime+=dt;if(celebrationTime>=12&&!finalFadeStarted){finalFadeStarted=true;transitioning=true;conductor.finishCampaign({fadeSeconds:3});}}
  if(!s.paused||paintNeeded){painter.render(ctx,world.snapshot,{time:visualTime,progress:s.chapterProgress,width:canvas.width,height:canvas.height});paintNeeded=false;}
  const reveal=s.phase==='music'&&s.trackIndex===0&&s.loops===0&&s.trackTime>=AURORA_END-10&&s.trackTime<=AURORA_END;visible('hick-reveal',reveal);if(reveal)$('hick-reveal').style.opacity=Math.min(1,(s.trackTime-AURORA_END+10)/2,(AURORA_END-s.trackTime)/.6);
  visible('buffering',s.loading||starting);uiTimer+=dt;
  if(uiTimer>.12&&!s.finished){uiTimer=0;const snap=world.snapshot,p=snap.player;const health=Math.ceil(p.health);$('health').textContent='♥'.repeat(health)+'♡'.repeat(Math.max(0,p.maxHealth-health));$('health').setAttribute('aria-label',`Salud ${health} de ${p.maxHealth}`);$('energy-fill').style.width=`${p.energy/p.maxEnergy*100}%`;$('energy-value').textContent=Math.round(p.energy);$('energy-track').setAttribute('aria-valuenow',Math.round(p.energy));$('ammo-count').textContent=p.ammo??20;$('elapsed').textContent=formatTime(s.elapsed);
   const count=snap.scrolls?.count??snap.campaign?.scrolls??0;$('scroll-count').textContent=s.chapter===0?'APERTURA':`PERGAMINOS ${count}/3`;$('progress-fill').style.width=`${Math.min(100,(Math.max(0,s.chapter-1)+(count/3)*.7+(snap.boss?.defeated ? .3 : 0))/9*100)}%`;
   $('objective-text').textContent=readableInstruction(snap.objective?.text||snap.campaign?.objective||snap.hint);updateMissionCard(snap);
   const boss=snap.boss,showBoss=!!boss?.alive&&snap.campaign?.phase==='boss';visible('boss-hud',showBoss);document.body.classList.toggle('boss-fight',showBoss);if(showBoss){$('boss-name').textContent=boss.name;$('boss-health-fill').style.width=`${Math.max(0,boss.health/boss.maxHealth*100)}%`;$('boss-instruction').textContent=readableInstruction(boss.hint||'Esquiva sus ataques y golpea los puntos marcados.');}
   const interaction=snap.interaction,show=!!interaction&&!s.paused&&!s.loading&&!s.finished&&!transitioning;visible('interaction-prompt',show);visible('touch-interact',touchDevice&&show);if(show){$('interaction-prompt').style.left=`${Math.max(10,Math.min(88,(interaction.x-snap.camera)/1600*100))}%`;$('interaction-prompt').style.top=`${Math.max(38,Math.min(80,(interaction.y-55)/900*100))}%`;$('interaction-prompt').classList.toggle('locked',!!interaction.locked);$('interaction-label').textContent=readableInstruction(interaction.label);$('touch-interact-label').textContent=readableInstruction(interaction.label);}
   playControls();
  }
  if(s.finished&&!wasFinished)finishGame();wasFinished=s.finished;
 }else if(!active){if(paintNeeded){painter.render(ctx,world.snapshot,{time:0,width:canvas.width,height:canvas.height});paintNeeded=false;}wasFinished=false;}
 requestAnimationFrame(frame);
}
applySettings();updateContinue();$('start-btn').disabled=false;requestAnimationFrame(frame);painter.preload().then(()=>{paintNeeded=true;}).catch(()=>showToast('Cargando los escenarios…'));
window.Aurora={getState:()=>({...conductor.state,player:{...world.snapshot.player},stats:{...world.stats},campaign:world.snapshot.campaign,missions:world.snapshot.missions,scrolls:world.snapshot.scrolls,boss:world.snapshot.boss,objective:world.snapshot.objective,interaction:world.snapshot.interaction,worldWidth:world.snapshot.worldWidth})};
if(new URLSearchParams(location.search).has('qa')&&['127.0.0.1','localhost'].includes(location.hostname)){window.Aurora.debug={get world(){return world;},conductor,painter,input,action(name){if(name in input){pendingActions.add(name);updateInputs();}},async level(chapter){++startToken;clearInputs();active=true;starting=true;transitioning=false;pendingCompletion=null;finalFadeStarted=false;celebrationTime=0;world=createWorld();world.enterChapter(chapter);for(const id of ['title-screen','pause-screen','ending-screen','help-screen'])visible(id,false);visible('hud',true);visible('objective',true);await conductor.start({version:3,chapter,trackIndex:Math.max(0,chapter-1),trackTime:chapter===1?AMBITION_START+1:0,elapsed:0,levelElapsed:0,introCompleted:chapter>0});starting=false;currentChapter=chapter;showChapter(chapter);playControls();return conductor.state;}};}
