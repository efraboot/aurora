import { getChapter, REQUIRED_SCROLLS } from './campaign.js';

const W=58,H=100,GRAVITY=1800,JUMP=760;
const KEYS=['left','right','up','down','jump','attack','heavy','guard','dodge','magic','throw','interact'];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=(n,f)=>Number.isFinite(n)?n:f;
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function random(seed){let n=seed>>>0;return()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}

export class GameWorld{
 constructor({onEvent=()=>{}}={}){
  this.onEvent=onEvent;this.stats={rescued:0,communities:0,seeds:0,defeated:0,bosses:0};this._time=0;this._lastToast=-100;
  this._player={x:140,y:600,w:W,h:H,vx:0,vy:0,facing:1,health:5,maxHealth:5,energy:100,maxEnergy:100,ammo:20,ammoMax:20,attackTimer:0,heavyTimer:0,attackKind:'heavy',guarding:false,guardTimer:0,dodgeTimer:0,magicTimer:0,throwTimer:0,invulnerable:0,animation:'idle',grounded:true,combo:0};
  this.enterChapter(0);
 }
 enterChapter(index){
  this.chapter=clamp(Math.trunc(finite(index,0)),0,9);this._config=getChapter(this.chapter);this._unlocked=this.chapter;this.segment=0;
  this.platforms=[];this.objects=[];this.enemies=[];this.targets=[];this.puzzles=[];this.missions=[];this.projectiles=[];this.npcs=[];this.particles=[];
  this._completed=new Set();this._defeated=new Set();this._destroyed=new Set();this.boss=null;this.camera=0;this._checkpoint=140;this._serial=0;this._progress=0;
  this.campaignPhase=this.chapter===0?'opening':'missions';this.scrollCount=0;this._bossGateOpen=false;this._celebrationTime=0;
  this.worldWidth=this._config.length;this._arenaStart=this.worldWidth-3100;this._resetTimers();this.resetInput();this._makeLevel();
  Object.assign(this._player,{x:140,y:this._groundAt(140)-H,vx:0,vy:0,facing:1,attackTimer:0,heavyTimer:0,dodgeTimer:0,magicTimer:0,throwTimer:0,guarding:false,guardTimer:0,invulnerable:1,grounded:true,animation:'idle',combo:0,health:5,energy:100,ammo:20});
  this._updateGuidance();return this.snapshot;
 }
 advanceChapter(index){return this.enterChapter(index);}
 _resetTimers(){this._coyote=.1;this._jumpBuffer=0;this._heavyBuffer=0;this._attackCooldown=0;this._dodgeCooldown=0;this._magicCooldown=0;this._throwCooldown=0;this._comboTime=0;this._dropTimer=0;this._attackHits=new Set();}
 resetInput(){this._previousInput=Object.fromEntries(KEYS.map(k=>[k,false]));this._jumpBuffer=0;this._heavyBuffer=0;}
 _makeLevel(){
  const rng=random(613+this.chapter*7919);let y=700;
  for(let x=0,i=0;x<this.worldWidth;x+=560,i++){
   if(x>=this._arenaStart-560)y=700;else if(i)y=clamp(y+Math.round((rng()-.5)*(this.chapter===4?70:135)),610,800);
   this.platforms.push({id:`c${this.chapter}:ground:${i}`,x,y,w:Math.min(560,this.worldWidth-x),h:940-y,type:'ground'});
   if(x>1800&&x<this._arenaStart-1000&&i%5===0)this.platforms.push({id:`c${this.chapter}:ledge:${i}`,x:x+120,y:y-105,w:240,h:28,type:'ledge'});
  }
  this._indexTerrain();
  if(!this.chapter)this._makeOpening();
  else{
   this._config.missions.forEach((m,i)=>this._makeMission(m,Math.round(this._arenaStart*[.14,.43,.72][i]),i));
   this._bossGate={x:this._arenaStart-120,y:300,w:100,h:400};
   this._object('bossgate',this._bossGate.x-95,'bossgate',{label:'Entrar a la arena',bossGate:true,gateX:this._bossGate.x,gateY:this._bossGate.y,gateW:this._bossGate.w,gateH:this._bossGate.h});
  }
  const optionalCount=Math.floor((this._arenaStart-1800)/1500);
  for(let i=0;i<optionalCount;i++){
   const x=1800+i*1500;if(this.objects.some(o=>Math.abs(o.x-x)<140))continue;
   this._object(`textile:${i}`,x,'fragment',{label:'Recoger tejido'});
   if(this.chapter&&i%3===1)this._enemy(`patrol:${i}`,x+220,{type:this.chapter>=4&&i%2?'shield':'soldier'});
  }
  [Math.round(this.worldWidth*.34),Math.round(this.worldWidth*.64),this._arenaStart-500].forEach((base,i)=>{let x=base;while(this.objects.some(o=>Math.abs(o.x-x)<170))x+=220;this._object(`faro:${i}`,x,'lantern',{label:'Encender faro'});});
  for(let x=2200,i=0;x<this._arenaStart;x+=7500,i++)this._object(`ammo:${i}`,x,'ammo',{label:'Recargar obsidiana'});
  for(let i=0;i<5;i++){const x=1450+i*(Math.max(1000,this._arenaStart-2400)/4);if(this.targets.some(t=>Math.abs(t.x-x)<180))continue;this._target(`crate:${i}`,x,{type:i%2?'barricade':'crate'});}
 }
 _indexTerrain(){
  this._grounds=this.platforms.filter(p=>p.type==='ground').sort((a,b)=>a.x-b.x);this._terrainBuckets=new Map();
  for(const p of this.platforms)for(let b=Math.floor(p.x/560);b<=Math.floor((p.x+p.w-1)/560);b++){if(!this._terrainBuckets.has(b))this._terrainBuckets.set(b,[]);this._terrainBuckets.get(b).push(p);}
 }
 _nearPlatforms(x){const out=new Set(),b=Math.floor(x/560);for(let i=b-1;i<=b+1;i++)for(const p of this._terrainBuckets.get(i)||[])out.add(p);return[...out];}
 _groundAt(x){const a=this._grounds||[];let lo=0,hi=a.length-1;while(lo<=hi){const m=(lo+hi)>>1,p=a[m];if(x<p.x)hi=m-1;else if(x>=p.x+p.w)lo=m+1;else return p.y;}return a[clamp(hi,0,Math.max(0,a.length-1))]?.y||700;}
 _id(key){return`c${this.chapter}:${key}`;}
 _object(key,x,type,extra={}){const id=this._id(key),o={id,x,y:this._groundAt(x)-55,type,active:false,pulse:0,...extra};this.objects.push(o);return o;}
 _enemy(key,x,extra={}){const type=extra.type||'soldier',health=extra.health||(type==='shield'?4:2),e={id:this._id(key),x,y:this._groundAt(x+26)-92,w:52,h:92,vx:0,facing:-1,health,maxHealth:health,attackTimer:0,windup:0,type,alive:true,patrolMin:x-180,patrolMax:x+180,_cooldown:.65,_stun:0,fadeTimer:1,...extra};this.enemies.push(e);return e;}
 _target(key,x,extra={}){const type=extra.type||'crate',w=type==='barricade'?100:64,h=type==='barricade'?80:60,health=extra.health||2,t={id:this._id(key),zoneId:this.chapter,x,y:this._groundAt(x+w/2)-h,w,h,type,health,maxHealth:health,alive:true,...extra};this.targets.push(t);return t;}
 _makeOpening(){
  const p={id:this._id('tutorial'),type:'tutorial',x:600,y:645,gateX:1170,gateY:this._groundAt(1170)-400,w:90,h:400,open:false,progress:0,total:3,activated:[]};this.puzzles.push(p);
  [320,540,760].forEach((x,i)=>this._object(`tutorial:cloth:${i}`,x,'fragment',{puzzleId:p.id,number:i+1,label:'Recoger tejido'}));
  this._object('tutorial:faro',980,'lantern',{puzzleId:p.id,label:'Encender faro'});
  this._object('opening:exit',this.worldWidth-220,'beacon',{label:'Explorar otro sendero'});
 }
 _makeMission(def,x,index){
  const m={...def,id:this._id(`mission:${def.id}`),key:def.id,index,x,progress:0,complete:false,scrollCollected:false,items:0,activated:[],started:false,wave:0};this.missions.push(m);
  const tag={missionId:m.id};
  if(m.type==='patrol')for(let i=0;i<m.total;i++)this._enemy(`m${index}:guard:${i}`,x+320+i*280,{...tag,type:this.chapter>=4&&i===1?'shield':'soldier'});
  if(m.type==='sabotage')for(let i=0;i<m.total;i++)this._target(`m${index}:target:${i}`,x+320+i*420,{...tag,type:i%2?'barricade':'crate',variant:this.chapter===3?'chain':this.chapter===9?'anchor':'machine'});
  if(m.type==='rescue')for(let i=0;i<m.total;i++){const e=this._enemy(`m${index}:guard:${i}`,x+400+i*650,{rescueGuard:true,type:this.chapter>=4?'shield':'soldier'});this._object(`m${index}:rescue:${i}`,x+470+i*650,'rescue',{...tag,guardId:e.id,number:i+1,label:'Abrir refugio'});}
  if(m.type==='route')for(let i=0;i<m.total;i++){const o=this._object(`m${index}:route:${i}`,x+[320,780,1250][i],'route',{...tag,number:i+1,label:'Marcar paso seguro'});if(i===1){const floor=this._groundAt(o.x);o.y=floor-160;this.platforms.push({id:`${m.id}:step`,x:o.x-110,y:floor-105,w:230,h:28,type:'ledge'});this._indexTerrain();}}
  if(m.type==='recover'){[320,900].forEach((dx,i)=>this._object(`m${index}:supply:${i}`,x+dx,'supply',{...tag,number:i+1,label:this.chapter===7?'Recoger saco de semillas':'Recoger pieza'}));this._object(`m${index}:delivery`,x+1300,'delivery',{...tag,label:'Entregar piezas'});}
  if(m.type==='sequence'){
   const p={id:`${m.id}:puzzle`,missionId:m.id,type:'sequence',x:x+640,y:this._groundAt(x+640)-55,gateX:x+1420,gateY:this._groundAt(x+1420)-400,w:90,h:400,open:false,progress:0,total:3,sequence:[...m.sequence],activated:[]};this.puzzles.push(p);
   [320,640,960].forEach((dx,i)=>this._object(`m${index}:symbol:${i}`,x+dx,'symbol',{...tag,puzzleId:p.id,number:i+1,label:`Activar símbolo ${i+1}`}));
  }
  if(m.type==='network')for(let i=0;i<m.total;i++){const t=this._target(`m${index}:jammer:${i}`,x+280+i*420,{health:3,variant:'jammer'});this._object(`m${index}:radio:${i}`,x+360+i*420,'community',{...tag,targetId:t.id,number:i+1,variant:'radio',label:'Conectar estación'});}
  if(m.type==='defend')this._object(`m${index}:signal`,x+650,'lever',{...tag,label:'Activar señal de defensa',variant:'defend'});
  if(m.type==='irrigation')[320,720,1120].forEach((dx,i)=>this._object(`m${index}:water:${i}`,x+dx,'water',{...tag,number:i+1,variant:i?'channel':'pump',label:i?'Abrir acequia':'Activar bomba'}));
  if(m.type==='plant')[320,720,1120].forEach((dx,i)=>this._object(`m${index}:seed:${i}`,x+dx,'seed',{...tag,number:i+1,label:'Sembrar parcela'}));
  if(m.type==='escort'){this._object(`m${index}:escort`,x+350,'escort',{...tag,label:'Hablar con el mensajero'});this._object(`m${index}:rendezvous`,x+1900,'destination',{...tag,label:'Puesto del mensajero',decorative:true});this.npcs.push({id:`${m.id}:ally`,missionId:m.id,type:'ally',x:x+350,y:this._groundAt(x+350)-90,w:50,h:90,active:false,goalX:x+1900,variant:0});}
 }
 get snapshot(){
  const p=this._player,vehicle=this._config.vehicle?{active:true,type:'car',x:p.x-48,y:p.y+p.h-90,w:156,h:90,facing:p.facing}:null;
  return{player:p,camera:this.camera,platforms:this.platforms,enemies:this.enemies,targets:this.targets,objects:this.objects,puzzles:this.puzzles,particles:this.particles,projectiles:this.projectiles,npcs:this.npcs,boss:this.boss,vehicle,missions:this.missions,activeMission:this.activeMission,scrolls:{count:this.scrollCount,required:this.chapter?REQUIRED_SCROLLS:0},campaign:{phase:this.campaignPhase,chapter:this.chapter,title:this._config.title,objective:this.objective?.text||'',scrolls:this.scrollCount,required:this.chapter?REQUIRED_SCROLLS:0},worldWidth:this.worldWidth,chapter:this.chapter,theme:this._config.theme,segment:this.segment,stats:this.stats,hint:this.hint,objective:this.objective,interaction:this.interaction,chapterProgress:this._progress,celebration:this.campaignPhase==='celebration'};
 }
 update(dt,input={},chapterProgress=0){
  dt=clamp(finite(dt,0),0,.08);if(!dt)return;this._time+=dt;this._progress=clamp(finite(chapterProgress,0),0,1);
  const pressed={};for(const k of KEYS){pressed[k]=!!input[k]&&!this._previousInput[k];this._previousInput[k]=!!input[k];}
  if(pressed.jump||pressed.up){if(input.down&&this._player.grounded){this._dropTimer=.28;this._player.vy=90;this._player.y+=5;this._player.grounded=false;}else this._jumpBuffer=.13;}
  if(pressed.heavy||pressed.attack)this._heavyBuffer=.35;
  if(pressed.dodge)this._dodge();if(pressed.magic)this._magic(input);if(pressed.throw)this._throw(input);if(pressed.interact)this._interact();
  const steps=Math.ceil(dt/(1/90));for(let i=0;i<steps;i++)this._step(dt/steps,input);
  this._updateGuidance();this.camera+=(clamp(this._player.x-540,0,Math.max(0,this.worldWidth-1600))-this.camera)*(1-Math.exp(-dt*9));
 }
 _step(dt,input){
  const p=this._player;for(const key of ['_attackCooldown','_dodgeCooldown','_magicCooldown','_throwCooldown','_jumpBuffer','_heavyBuffer','_comboTime','_dropTimer'])this[key]=Math.max(0,this[key]-dt);
  for(const key of ['attackTimer','heavyTimer','dodgeTimer','magicTimer','throwTimer','invulnerable'])p[key]=Math.max(0,p[key]-dt);if(this._comboTime<=0)p.combo=0;
  if((this._heavyBuffer>0||input.heavy||input.attack)&&p.attackTimer<=0&&this._attackCooldown<=0&&p.dodgeTimer<=0&&!input.guard){this._heavyBuffer=0;this._attack();}
  if(input.throw&&this._throwCooldown<=0)this._throw(input);
  p.guarding=!!input.guard&&p.attackTimer<=0&&p.dodgeTimer<=0&&p.magicTimer<=0;p.guardTimer=p.guarding?.15:0;
  this._coyote=p.grounded?.1:Math.max(0,this._coyote-dt);if(this._jumpBuffer>0&&this._coyote>0&&p.dodgeTimer<=0){p.vy=-JUMP;p.grounded=false;this._jumpBuffer=0;this._coyote=0;}
  const direction=(input.right?1:0)-(input.left?1:0);if(direction&&p.dodgeTimer<=0)p.facing=direction;
  const speed=this._config.vehicle?610:450,desired=p.dodgeTimer>0?p.facing*950:direction*speed*(p.guarding?.75:1);
  p.vx=p.dodgeTimer>0?desired:p.vx+(desired-p.vx)*Math.min(1,dt*(p.grounded?36:24));if(!direction&&p.dodgeTimer<=0&&Math.abs(p.vx)<2)p.vx=0;
  const oldX=p.x;p.x=clamp(p.x+p.vx*dt,0,this.worldWidth-W);const nearby=this._nearPlatforms(p.x);
  const walls=[...nearby.filter(t=>t.type==='ground'),...this.puzzles.filter(t=>!t.open&&Math.abs(t.gateX-p.x)<800).map(t=>({x:t.gateX,y:t.gateY,w:t.w,h:t.h})),...this.targets.filter(t=>t.alive&&t.type==='barricade'&&Math.abs(t.x-p.x)<800)];
  if(this.chapter&&!this._bossGateOpen&&Math.abs(this._bossGate.x-p.x)<800)walls.push(this._bossGate);
  for(const wall of walls){if(!overlap(p,wall)||p.y+H<=wall.y+1)continue;if(oldX+W<=wall.x+1&&p.x+W>wall.x){p.x=wall.x-W;p.vx=0;}else if(oldX>=wall.x+wall.w-1&&p.x<wall.x+wall.w){p.x=wall.x+wall.w;p.vx=0;}}
  const previousBottom=p.y+H;p.vy+=GRAVITY*dt;p.y+=p.vy*dt;p.grounded=false;
  if(p.vy>=0){let surface=Infinity;const surfaces=[...nearby,...this.targets.filter(t=>t.alive&&t.type==='barricade'&&Math.abs(t.x-p.x)<800)];for(const t of surfaces){if(t.type==='ledge'&&this._dropTimer>0)continue;if(p.x+W-8>t.x&&p.x+8<t.x+t.w&&previousBottom<=t.y+3&&p.y+H>=t.y)surface=Math.min(surface,t.y);}if(surface!==Infinity){p.y=surface-H;p.vy=0;p.grounded=true;}}
  if(p.y>1150)this._respawn();if(p.grounded&&this.campaignPhase!=='boss'&&p.x>this._checkpoint+850)this._checkpoint=p.x-150;
  this._strike();this._updateEnemies(dt);this._updateBoss(dt);this._updateProjectiles(dt);this._updateNpcs(dt);
  for(const o of this.objects)if(o.pulse>0)o.pulse=Math.max(0,o.pulse-dt);
  for(let i=this.particles.length-1;i>=0;i--){const a=this.particles[i];a.life-=dt;if(a.life<=0){this.particles.splice(i,1);continue;}a.x+=a.vx*dt;a.y+=a.vy*dt;}
  if(this.campaignPhase==='celebration')this._celebrationTime+=dt;
  p.animation=p.dodgeTimer>0?'dodge':p.heavyTimer>0?'heavy':p.guarding?'guard':p.magicTimer>0?'magic':p.throwTimer>0?'throw':!p.grounded?(p.vy<0?'jump':'fall'):Math.abs(p.vx)>12?'run':'idle';
 }
 _attack(){const p=this._player;p.attackKind='heavy';p.attackTimer=.35;p.heavyTimer=.35;this._attackCooldown=.48;this._attackHits.clear();p.combo=p.combo%3+1;this._attackDamage=p.combo===3?3:2;this._comboTime=1.25;this.onEvent({type:'effect',kind:'heavy'});}
 _strike(){
  const p=this._player;if(p.attackTimer<=0)return;const box={x:p.facing>0?p.x+20:p.x-125,y:p.y+8,w:145,h:92};
  for(const e of this.enemies)if(e.alive&&!this._attackHits.has(e.id)&&Math.abs(e.x-p.x)<250&&overlap(box,e)){this._attackHits.add(e.id);const front=(p.x+29-e.x-26)*e.facing>0;this._hitEnemy(e,e.type==='shield'&&front?1:this._attackDamage,p.facing);}
  for(const t of this.targets)if(t.alive&&!this._attackHits.has(t.id)&&Math.abs(t.x-p.x)<250&&overlap(box,t)){this._attackHits.add(t.id);this._hitTarget(t,this._attackDamage);}
  const b=this.boss;if(b?.alive&&!this._attackHits.has(b.id)&&overlap(box,{x:b.weakX-65,y:b.weakY-60,w:130,h:120})){this._attackHits.add(b.id);this._hitBoss(this._attackDamage,'melee');}
 }
 _dodge(){if(this._dodgeCooldown>0)return;const p=this._player;this._dodgeCooldown=.58;p.dodgeTimer=.24;p.invulnerable=Math.max(p.invulnerable,.36);this.onEvent({type:'effect',kind:'dodge'});}
 _aim(input,baseVy=0){return{vx:this._player.facing,vy:input.up?-.4:input.down?.4:baseVy};}
 _throw(input={}){
  if(this._throwCooldown>0)return;const p=this._player;if(p.ammo<=0){this._toast('Sin obsidiana. Recarga en una caja con E.',2);this._throwCooldown=.3;return;}
  p.ammo--;p.throwTimer=.22;this._throwCooldown=.32;const aim=this._aim(input,-.17);this._projectile(p.x+29+p.facing*40,p.y+40,aim.vx*780,aim.vy*780,10,'obsidian','player',2,2.5,620);this.onEvent({type:'effect',kind:'throw'});
 }
 _magic(input={}){
  if(this._magicCooldown>0)return;if(this.chapter<2){this._toast('Bolas de fuego disponibles desde Sacrilegio.',0);return;}
  const p=this._player,collective=this.chapter>=6,cost=collective?35:25;if(p.energy<cost){this._toast('Energía insuficiente. Recoge tejidos o recarga en un faro.',0);return;}
  p.energy-=cost;p.magicTimer=.5;this._magicCooldown=.8;const aim=this._aim(input),angles=collective?[-.12,0,.12]:[0];
  for(const angle of angles)this._projectile(p.x+29+p.facing*42,p.y+43,aim.vx*720,(aim.vy+angle)*720,collective?24:18,'fireball','player',collective?10:6,2.4,0);
  this.onEvent({type:'effect',kind:collective?'collective':'magic'});
 }
 _projectile(x,y,vx,vy,r,type,team,damage,life=3,gravity=0){this.projectiles.push({id:`shot:${++this._serial}`,x,y,vx,vy,r,type,team,damage,life,gravity});}
 _updateProjectiles(dt){
  const p=this._player,shots=this.projectiles;
  for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.life-=dt;s.vy+=s.gravity*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;let hit=false;
   if(s.team==='player'){
    const rect={x:s.x-s.r,y:s.y-s.r,w:s.r*2,h:s.r*2};
    const enemy=this.enemies.find(e=>e.alive&&Math.abs(e.x-s.x)<100&&overlap(rect,e));if(enemy){this._hitEnemy(enemy,s.damage,Math.sign(s.vx));hit=true;}
    if(!hit){const target=this.targets.find(t=>t.alive&&Math.abs(t.x-s.x)<140&&overlap(rect,t));if(target){this._hitTarget(target,s.damage);hit=true;}}
    if(!hit&&this.boss?.alive&&Math.hypot(s.x-this.boss.weakX,s.y-this.boss.weakY)<65+s.r){this._hitBoss(s.damage,s.type);hit=true;}
   }else if(overlap({x:s.x-s.r,y:s.y-s.r,w:s.r*2,h:s.r*2},p)){this._damage(1,s.x-s.vx*.05);hit=true;}
   if(this.projectiles!==shots)return;
   if(!hit&&s.y+s.r>=this._groundAt(s.x)){hit=true;this._burst(s.x,s.y,5,'dust');}
   if(hit||s.life<=0||s.x<-100||s.x>this.worldWidth+100||s.y>1000){this._burst(s.x,s.y,5,s.type==='fireball'?'spark':'dust');shots.splice(i,1);}
  }
 }
 _hitEnemy(e,damage,direction){
  if(!e.alive)return;e.health=Math.max(0,e.health-damage);e._stun=.5;e.windup=0;e.attackTimer=0;e.x=clamp(e.x+direction*24,10,this.worldWidth-e.w);this._burst(e.x+26,e.y+40,8,'spark');
  if(!e.health){e.alive=false;e.fadeTimer=.7;this._defeated.add(e.id);this.stats.defeated++;this._statsChanged();const m=this.missions.find(m=>m.id===e.missionId);if(m&&(m.type==='patrol'||m.type==='defend')){m.progress++;if(m.type==='defend'&&m.progress===3)this._spawnWave(m,2);this._checkMission(m);}}
 }
 _hitTarget(t,damage){
  if(!t.alive)return;t.health=Math.max(0,t.health-damage);this._burst(t.x+t.w/2,t.y+t.h/2,10,'dust');
  if(!t.health){t.alive=false;this._destroyed.add(t.id);this._dropTarget(t);const m=this.missions.find(m=>m.id===t.missionId);if(m?.type==='sabotage'){m.progress++;this._checkMission(m);}if(t.bossAnchor)this._updateBossWeakness();this.onEvent({type:'effect',kind:'break'});}
 }
 _dropTarget(t){const id=`${t.id}:drop`;if(this.objects.some(o=>o.id===id))return;this.objects.push({id,x:t.x+t.w/2,y:this._groundAt(t.x+t.w/2)-55,type:'fragment',active:false,pulse:0,label:'Recoger tejido'});}
 _updateEnemies(dt){
  const p=this._player;
  for(const e of this.enemies){if(Math.abs(e.x-p.x)>2000)continue;if(!e.alive){e.fadeTimer=Math.max(0,e.fadeTimer-dt);continue;}e._cooldown=Math.max(0,e._cooldown-dt);e._stun=Math.max(0,e._stun-dt);e.attackTimer=Math.max(0,e.attackTimer-dt);if(e._stun>0){e.vx=0;continue;}
   const dx=p.x+29-e.x-26,closeY=Math.abs(p.y+50-e.y-46)<115,aware=Math.abs(dx)<420&&closeY;
   if(e.windup>0){e.vx=0;e.windup-=dt;if(e.windup<=0){e.attackTimer=.25;e._cooldown=1.3;if(Math.abs(dx)<105&&closeY&&p.invulnerable<=0)this._damage(1,e.x+26);}}
   else if(aware&&Math.abs(dx)<105&&e._cooldown<=0){e.facing=Math.sign(dx)||e.facing;e.windup=.5;e.vx=0;}
   else{if(aware)e.facing=Math.sign(dx)||e.facing;else if(e.x<=e.patrolMin)e.facing=1;else if(e.x>=e.patrolMax)e.facing=-1;e.vx=aware&&Math.abs(dx)<75?0:e.facing*(aware?(e.type==='shield'?100:145):60);const nx=clamp(e.x+e.vx*dt,10,this.worldWidth-e.w),floor=this._groundAt(nx+26);if(Math.abs(floor-e.y-e.h)>100){e.facing*=-1;e.vx=0;}else{e.x=nx;e.y=floor-e.h;}}
  }
 }
 _damage(amount,sourceX){const p=this._player;if(p.invulnerable>0)return;const front=Number.isFinite(sourceX)&&(sourceX-p.x-29)*p.facing>0;if(p.guarding&&front){p.invulnerable=.22;this._burst(p.x+29,p.y+45,7,'spark');this.onEvent({type:'effect',kind:'block'});return;}p.health=Math.max(0,p.health-amount);p.invulnerable=1.3;this.onEvent({type:'effect',kind:'hurt'});if(!p.health)this._respawn();}
 _respawn(){const p=this._player,x=clamp(this._checkpoint,100,this.worldWidth-W);Object.assign(p,{x,y:this._groundAt(x+29)-H,vx:0,vy:0,health:5,invulnerable:2.5,dodgeTimer:0,grounded:true});this.projectiles=[];if(this.campaignPhase==='boss')this._resetBossAttempt();this._toast('Reaparición en el punto seguro. Conservas los pergaminos.',0);}
 _spawnWave(m,wave){m.wave=wave;for(let i=0;i<3;i++)this._enemy(`m${m.index}:wave${wave}:${i}`,m.x+420+i*320,{missionId:m.id,health:wave===2?3:2,type:this.chapter>=6&&i===1?'shield':'soldier'});}
 _checkMission(m){
  m.progress=clamp(m.progress,0,m.total);if(m.complete||m.progress<m.total)return;m.complete=true;
  const x=m.type==='escort'?m.x+2010:m.x+1550;this._object(`mission:${m.key}:scroll`,x,'scroll',{missionId:m.id,label:'Recoger pergamino'});
  const puzzle=this.puzzles.find(p=>p.missionId===m.id);if(puzzle)puzzle.open=true;
  this._toast('Misión completada. Recoge el pergamino con E.',0);this.onEvent({type:'mission',id:m.id,title:m.title,complete:true,scrollCollected:false});
 }
 _updateNpcs(dt){for(const n of this.npcs){if(n.type==='ally'&&n.active){const m=this.missions.find(m=>m.id===n.missionId);if(m?.complete)continue;const p=this._player,blocked=this.enemies.some(e=>e.alive&&Math.abs(e.x-n.x)<220);if(!blocked&&p.x>n.x&&p.x-n.x<1200)n.x=Math.min(n.goalX,n.x+dt*(p.x-n.x>650?520:320));n.y=this._groundAt(n.x+25)-n.h;if(n.x>=n.goalX-15){m.progress=2;this._checkMission(m);}}}}
 _nearObject(){const p=this._player;let closest=null,distance=145;for(const o of this.objects){if(o.decorative||Math.abs(o.x-p.x)>195)continue;if(o.type==='route'&&Math.abs(o.y-p.y-50)>90)continue;const m=this.missions.find(m=>m.id===o.missionId);if(o.active&&!['lantern','ammo','symbol','antenna','water'].includes(o.type))continue;if(o.active&&o.type==='symbol'&&m?.complete)continue;const d=Math.hypot(o.x-p.x-29,o.y-p.y-50);if(d<distance){distance=d;closest=o;}}return closest;}
 _lockedReason(o){
  const m=this.missions.find(m=>m.id===o.missionId),p=this.puzzles.find(p=>p.id===o.puzzleId);
  if(o.type==='bossgate'&&this.scrollCount<3)return`Faltan ${3-this.scrollCount} pergaminos. Regresa a las misiones pendientes.`;
  if(o.type==='lantern'&&p&&!p.open&&p.progress<p.total)return`Recoge 3 tejidos (${p.progress}/3).`;
  if(o.guardId&&this.enemies.find(e=>e.id===o.guardId)?.alive)return'Derrota al guardia antes de abrir el refugio.';
  if(o.targetId&&this.targets.find(t=>t.id===o.targetId)?.alive)return'Destruye la interferencia antes de conectar la estación.';
  if(o.type==='delivery'&&m?.items<2)return`Recoge las dos piezas (${m.items}/2).`;
  if(m?.type==='irrigation'&&o.number>1&&!m.activated.includes(1))return'Activa primero la bomba de agua.';
  if(m?.requires&&!this.missions.find(p=>p.key===m.requires)?.complete)return'Recupera y entrega las semillas antes de sembrar.';
  return null;
 }
 _interact(){
  const o=this._nearObject();if(!o)return;const reason=this._lockedReason(o);if(reason){this._toast(reason,0);return;}const m=this.missions.find(m=>m.id===o.missionId),p=this.puzzles.find(p=>p.id===o.puzzleId);o.pulse=.8;
  if(o.type==='bossgate'){if(this.campaignPhase==='missions')this._enterBoss();return;}
  if(o.type==='scroll'){if(!o.active&&m?.complete){this._completeObject(o);m.scrollCollected=true;this.scrollCount++;this._toast(`Pergamino recogido (${this.scrollCount}/3).`,0);this.onEvent({type:'mission',id:m.id,title:m.title,complete:true,scrollCollected:true,scrolls:this.scrollCount});}return;}
  if(o.type==='lantern'){this._completeObject(o);if(p&&!p.open){p.open=true;this._toast('Faro encendido. Paso habilitado.',0);}else this._toast('Energía recargada.',0);return;}
  if(o.type==='ammo'){this._completeObject(o);this._toast('Obsidiana recargada (20).',0);return;}
  if(o.bossDevice){this._activateBossDevice(o);return;}
  if(o.type==='beacon'&&!this.chapter){this._extendOpening();return;}
  if(!m){if(!o.active){this._completeObject(o);if(o.type==='fragment'){this.stats.rescued++;if(p&&!p.activated.includes(o.number)){p.activated.push(o.number);p.progress++;}this._statsChanged();this._toast(p?`Tejido recogido (${p.progress}/3).`:'Tejido recogido.',0);}}return;}
  if(m.complete)return;
  if(m.type==='sequence'){
   if(o.number!==m.sequence[m.progress]){m.progress=0;m.activated=[];if(p){p.progress=0;p.activated=[];}for(const a of this.objects.filter(a=>a.missionId===m.id&&a.type==='symbol')){a.active=false;this._completed.delete(a.id);}this._toast('Secuencia incorrecta. Empieza de nuevo.',0);return;}
   this._completeObject(o);m.activated.push(o.number);m.progress++;if(p){p.progress=m.progress;p.activated=[...m.activated];}
  }else if(m.type==='defend'){if(!m.started){m.started=true;this._completeObject(o);this._spawnWave(m,1);this._toast('Defiende la señal. Oleada 1 de 2.',0);}return;}
  else if(m.type==='escort'){if(!m.started){m.started=true;m.progress=1;this._completeObject(o);this.npcs.find(n=>n.missionId===m.id).active=true;this._toast('Acompaña al mensajero hasta el puesto.',0);}return;}
  else if(m.type==='recover'){if(o.type==='supply'&&!o.active){this._completeObject(o);m.items++;m.progress=m.items;}else if(o.type==='delivery'){this._completeObject(o);m.progress=3;}}
  else if(!o.active){this._completeObject(o);m.activated.push(o.number);m.progress++;if(o.type==='community')this.stats.communities++;if(o.type==='seed')this.stats.seeds++;this._statsChanged();}
  this._toast(`Objetivo completado (${m.progress}/${m.total}).`,0);this._checkMission(m);
 }
 _completeObject(o){o.active=true;this._completed.add(o.id);if(o.type==='fragment')this._player.energy=Math.min(100,this._player.energy+20);if(o.type==='lantern')this._player.energy=100;if(o.type==='ammo')this._player.ammo=20;this._burst(o.x,o.y,10,o.type==='seed'?'leaf':'spark');this.onEvent({type:'effect',kind:'interact'});}
 _extendOpening(){const old=this.worldWidth;this.segment++;let y=this._groundAt(old-1);for(let x=old;x<old+12000;x+=560)this.platforms.push({id:`opening:${this.segment}:${x}`,x,y,w:Math.min(560,old+12000-x),h:940-y,type:'ground'});this.worldWidth+=12000;this._indexTerrain();for(const o of this.objects.filter(o=>o.type==='beacon'))o.active=true;this._object(`opening:exit:${this.segment}`,this.worldWidth-220,'beacon',{label:'Explorar otro sendero'});this.onEvent({type:'segment',segment:this.segment,chapter:0,text:'Nuevo sendero disponible.'});}
 _enterBoss(){
  this.campaignPhase='boss';this._bossGateOpen=true;this._checkpoint=this._arenaStart+140;const gate=this.objects.find(o=>o.bossGate);if(gate){gate.active=true;this._completed.add(gate.id);}this._createBoss();this._toast(`${this.boss.name}: observa la señal y esquiva el ataque.`,0);this.onEvent({type:'bossStarted',chapter:this.chapter,name:this.boss.name});
 }
 _createBoss(){
  const d=this._config.boss;if(!d)return;const x=this._arenaStart+1350;
  this.boss={id:this._id('boss'),type:d.type,name:d.name,x,y:700-d.h,w:d.w,h:d.h,health:d.health,maxHealth:d.health,phase:1,telegraph:0,telegraphMax:1.05,attack:'',alive:true,defeated:false,weakX:x+d.w*.22,weakY:605,weakOpen:!d.devices,weakTimer:0,deviceProgress:0,facing:-1,_cooldown:1.6,_attackIndex:0,_chargeTimer:0,_clock:0,_baseX:x,_stun:0};
  this._createBossDevices(1);
 }
 _createBossDevices(phase){
  const type=this._config.boss?.devices;if(!type)return;const b=this.boss;
  if(type==='anchors')for(let i=0;i<3;i++)this._target(`boss:anchor:p${phase}:${i}`,this._arenaStart+470+i*680,{type:'barricade',variant:'anchor',health:4,bossAnchor:true,bossPhase:phase});
  else for(let i=0;i<(type==='antennas'?3:1);i++)this._object(`boss:device:p${phase}:${i}`,this._arenaStart+400+i*710,type==='antennas'?'antenna':'water',{bossDevice:true,bossPhase:phase,number:i+1,label:type==='antennas'?'Desactivar antena':'Activar riego: debilitar blindaje'});
  b.deviceProgress=0;
 }
 _activateBossDevice(o){const b=this.boss;if(!b?.alive||o.bossPhase!==b.phase)return;if(!o.active){this._completeObject(o);b.deviceProgress++;}if(this._config.boss.devices==='mud'||b.deviceProgress>=3){b.weakOpen=true;b.weakTimer=9;b._stun=1.2;this._toast('Blindaje debilitado. Ataca el punto señalado.',0);}}
 _updateBossWeakness(){const b=this.boss;if(!b?.alive)return;const anchors=this.targets.filter(t=>t.bossAnchor&&t.bossPhase===b.phase);b.deviceProgress=anchors.filter(t=>!t.alive).length;if(anchors.length===3&&b.deviceProgress===3){b.weakOpen=true;b.weakTimer=10;b._stun=1.3;this._toast('Anclas destruidas. Punto débil expuesto.',0);}}
 _hitBoss(damage,kind){
  const b=this.boss;if(!b?.alive||this.campaignPhase!=='boss')return;
  const armored=this._config.boss.devices&&!b.weakOpen,amount=armored?Math.max(1,Math.floor(damage*.45)):damage;b.health=Math.max(0,b.health-amount);this._burst(b.weakX,b.weakY,10,'spark');
  if(!b.health){this.stats.bosses++;b.alive=false;b.defeated=true;b.telegraph=0;b.attack='';this.projectiles=this.projectiles.filter(s=>s.team==='player');for(const e of this.enemies)if(e.bossMinion)e.alive=false;const final=this.chapter===9;this.campaignPhase=final?'celebration':'cleared';if(final)this._makeCelebration();this.onEvent({type:'bossDefeated',chapter:this.chapter,final});return;}
  const phase=b.health/b.maxHealth>.66?1:b.health/b.maxHealth>.33?2:3;
  if(phase!==b.phase){b.phase=phase;b._cooldown=.8;b.telegraph=0;b._chargeTimer=0;b.weakOpen=!this._config.boss.devices;b.weakTimer=0;this._createBossDevices(phase);this.onEvent({type:'bossPhase',chapter:this.chapter,phase});}
 }
 _updateBoss(dt){
  const b=this.boss;if(!b?.alive||this.campaignPhase!=='boss')return;const p=this._player;b._clock+=dt;b._stun=Math.max(0,b._stun-dt);b.weakTimer=Math.max(0,b.weakTimer-dt);if(this._config.boss.devices&&b.weakTimer<=0)b.weakOpen=false;
  b.facing=p.x+29<b.x+b.w/2?-1:1;
  if(b._chargeTimer>0){b._chargeTimer-=dt;b.x=clamp(b.x+b._chargeDirection*(b.type==='warconvoyvehicle'?760:640)*dt,this._arenaStart+350,this.worldWidth-b.w-180);if(Math.abs(p.x+29-(b.x+b.w/2))<b.w*.5&&Math.abs(p.y+50-640)<110)this._damage(1,b.x+b.w/2);}
  else if(b.telegraph<=0&&b._stun<=0){
   let target=b.x;
   if(['goldcaptain','warconvoyvehicle','mountedcommander','ironplough','marshall'].includes(b.type))target=b._baseX+Math.sin(b._clock*(b.type==='warconvoyvehicle'?1.1:.65))*(b.phase===3?330:210);
   else if(b.type==='abysscranechain')target=b._baseX+Math.sin(b._clock*.8)*180;
   else if(b.type==='flyingfortress'){target=b._baseX+Math.sin(b._clock*.7)*330;b.y=700-b.h-35+Math.sin(b._clock*1.3)*30;}
   else if(b.type==='profanerfire'){target=b._baseX+Math.sin(b._clock*.5)*150;b.y=700-b.h+Math.sin(b._clock)*18;}
   b.x+=clamp(target-b.x,-220*dt,220*dt);
  }
  b.weakX=b.x+b.w*(b.facing<0?.22:.78);b.weakY=605;
  if(b._stun>0)return;
  if(b.telegraph>0){b.telegraph=Math.max(0,b.telegraph-dt);if(!b.telegraph)this._bossAction();}
  else{b._cooldown-=dt;if(b._cooldown<=0&&b._chargeTimer<=0){const patterns=this._config.boss.patterns[b.phase-1];b.attack=patterns[b._attackIndex++%patterns.length];b.telegraphMax=b.attack==='charge'?.95:b.attack==='volley'?1.25:1.05;b.telegraph=b.telegraphMax;b.dangerX=p.x-150;b.dangerW=360;b.dangerY=600;}}
 }
 _bossAction(){
  const b=this.boss,p=this._player;if(!b?.alive)return;b._cooldown=2.1-b.phase*.24;
  if(b.attack==='charge'){b._chargeDirection=p.x+29<b.x+b.w/2?-1:1;b._chargeTimer=.65;}
  if(b.attack==='slam'||b.attack==='sweep'){const range=b.attack==='slam'?310:440;if(Math.abs(p.x+29-b.weakX)<range&&(b.attack==='sweep'||p.grounded))this._damage(1,b.weakX);this._burst(b.weakX,680,25,'dust');}
  if(b.attack==='fire'){const dx=p.x+29-b.weakX,dy=p.y+50-b.weakY,angle=Math.atan2(dy,dx);for(const offset of [-.16,0,.16])this._projectile(b.weakX,b.weakY,Math.cos(angle+offset)*430,Math.sin(angle+offset)*430,18,'enemyfire','enemy',1,4);}
  if(b.attack==='chain'){const dir=p.x<b.weakX?-1:1;this._projectile(b.weakX,650,dir*460,0,22,'chain','enemy',1,4);if(b.phase>1)this._projectile(b.weakX,570,dir*410,0,18,'chain','enemy',1,4);}
  if(b.attack==='volley')for(const dx of [-170,0,170])this._projectile(p.x+29+dx,160,0,120,22,'enemyfire','enemy',1,4,480);
  if(b.attack==='reinforcements')for(let i=0;i<3;i++)this._enemy(`boss:minion:${++this._serial}`,clamp(p.x+300+i*160,this._arenaStart+250,this.worldWidth-150),{bossMinion:true,type:b.phase>1&&i===1?'shield':'soldier'});
 }
 _resetBossAttempt(){for(const e of this.enemies)if(e.bossMinion)e.alive=false;this.objects=this.objects.filter(o=>!o.bossDevice);this.targets=this.targets.filter(t=>!t.bossAnchor);this._createBoss();}
 _makeCelebration(){this._celebrationTime=0;for(let i=0;i<18;i++)this.npcs.push({id:`celebrant:${i}`,type:'celebrant',x:this._arenaStart+320+i*125,y:610,w:50,h:90,active:true,variant:i%4});this._toast('Fortaleza vencida. La celebración comienza.',0);}
 _updateGuidance(){
  const near=this._nearObject(),reason=near?this._lockedReason(near):null;this.activeMission=null;
  this.interaction=near?{id:near.id,x:near.x,y:near.y,label:reason||((near.type==='lantern'&&near.active)?'Recargar energía':near.label||'Interactuar'),key:'E',available:!reason,locked:!!reason}:null;
  if(!this.chapter){const p=this.puzzles[0];this.objective={text:p&&!p.open?(p.progress<3?`Recoge 3 tejidos con E (${p.progress}/3).`:'Enciende el faro con E.'):this._config.objective,progress:p?.progress||0,total:3};}
  else if(this.campaignPhase==='boss')this.objective={text:`${this.boss.name}: ataca el punto señalado y esquiva la señal.`,progress:this.boss.maxHealth-this.boss.health,total:this.boss.maxHealth};
  else if(['cleared','celebration'].includes(this.campaignPhase))this.objective={text:this.campaignPhase==='celebration'?'Celebra la liberación.':'Jefe derrotado. Nivel completado.',progress:3,total:3};
  else{
   const pending=this.missions.filter(m=>!m.scrollCollected).sort((a,b)=>Math.abs(a.x-this._player.x)-Math.abs(b.x-this._player.x))[0];
   this.activeMission=pending||null;this.objective=pending?{text:pending.complete?`${pending.title}: recoge el pergamino con E.`:`${pending.title}: ${pending.objective} (${pending.progress}/${pending.total}).`,progress:pending.progress,total:pending.total,missionId:pending.id}:{text:'Tienes 3 pergaminos. Regresa a la puerta y entra con E.',progress:3,total:3};
  }
  this.hint=this.interaction?`${this.interaction.label} · E`:this.objective.text;
 }
 _toast(text,cooldown=2){if(this._time-this._lastToast<cooldown)return;this._lastToast=this._time;this.onEvent({type:'toast',text});}
 _statsChanged(){this.onEvent({type:'stats',stats:{...this.stats}});}
 _particle(x,y,vx,vy,life,type){if(this.particles.length>420)this.particles.splice(0,40);this.particles.push({x,y,vx,vy,life,maxLife:life,type});}
 _burst(x,y,count,type){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=25+Math.random()*120;this._particle(x,y,Math.cos(a)*s,Math.sin(a)*s-20,.35+Math.random()*.6,type);}}
 teleport(x,y){const p=this._player;p.x=clamp(finite(x,140),0,this.worldWidth-W);p.y=finite(y,this._groundAt(p.x+29)-H);p.vx=0;p.vy=0;p.grounded=true;this.camera=clamp(p.x-540,0,Math.max(0,this.worldWidth-1600));this._updateGuidance();}
 solvePuzzle(id){const p=this.puzzles.find(p=>p.id===id);if(!p)return false;p.open=true;p.progress=p.total;p.activated=[1,2,3];const m=this.missions.find(m=>m.id===p.missionId);if(m){m.progress=m.total;this._checkMission(m);}return true;}
 exportState(){return{version:4,chapter:this.chapter,phase:this.campaignPhase,segment:this.segment,worldWidth:this.worldWidth,checkpoint:this._checkpoint,serial:this._serial,bossGateOpen:this._bossGateOpen,scrollCount:this.scrollCount,celebrationTime:this._celebrationTime,player:{...this._player},stats:{...this.stats},completed:[...this._completed],defeated:[...this._defeated],destroyed:[...this._destroyed],missions:this.missions.map(m=>({...m,activated:[...m.activated]})),objects:this.objects.map(o=>({...o})),targets:this.targets.map(t=>({...t})),enemies:this.enemies.map(e=>({...e})),puzzles:this.puzzles.map(p=>({...p,activated:[...p.activated]})),npcs:this.npcs.map(n=>({...n})),boss:this.boss?{...this.boss}:null,projectiles:this.projectiles.map(s=>({...s})),extraPlatforms:this.platforms.filter(p=>p.id.startsWith('opening:'))};}
 restoreState(data){
  if(!data||typeof data!=='object')return false;this.enterChapter(finite(data.chapter,0));if(data.version!==4)return true;
  const array=(v,max=600)=>Array.isArray(v)?v.filter(x=>x&&typeof x==='object').slice(0,max).map(x=>({...x})):[];
  const ids=v=>new Set(Array.isArray(v)?v.filter(x=>typeof x==='string'&&x.length<150).slice(0,2000):[]);
  this._completed=ids(data.completed);this._defeated=ids(data.defeated);this._destroyed=ids(data.destroyed);
  this.objects=array(data.objects);this.targets=array(data.targets);this.enemies=array(data.enemies);this.puzzles=array(data.puzzles);this.npcs=array(data.npcs);this.projectiles=array(data.projectiles,100);
  for(const saved of array(data.missions,3)){const m=this.missions.find(m=>m.id===saved.id);if(m)Object.assign(m,saved);}
  const phases=['opening','missions','boss','cleared','celebration'];this.campaignPhase=phases.includes(data.phase)?data.phase:this.campaignPhase;this.scrollCount=clamp(Math.trunc(finite(data.scrollCount,0)),0,3);this._bossGateOpen=!!data.bossGateOpen;this.segment=Math.max(0,Math.trunc(finite(data.segment,0)));this._serial=Math.max(0,Math.trunc(finite(data.serial,0)));this._celebrationTime=Math.max(0,finite(data.celebrationTime,0));
  if(data.boss&&this._config.boss)this.boss={...data.boss};
  this.platforms.push(...array(data.extraPlatforms,500));this.worldWidth=clamp(finite(data.worldWidth,this.worldWidth),this._config.length,500000);this._indexTerrain();
  const saved=data.player||{},p=this._player;this.teleport(finite(saved.x,140),finite(saved.y,this._groundAt(140)-H));p.health=clamp(finite(saved.health,5),1,5);p.energy=clamp(finite(saved.energy,100),0,100);p.ammo=clamp(Math.trunc(finite(saved.ammo,20)),0,20);p.facing=saved.facing===-1?-1:1;p.invulnerable=1.5;
  for(const k of Object.keys(this.stats))this.stats[k]=clamp(Math.trunc(finite(data.stats?.[k],0)),0,100000);this._checkpoint=clamp(finite(data.checkpoint,140),100,this.worldWidth-W);this._updateGuidance();return true;
 }
}
