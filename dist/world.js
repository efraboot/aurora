/* AURORA · original canvas scenery and articulated character illustration. */
const W = 1600, H = 900, TAU = Math.PI * 2;
const V3_SCENES=['aurora','ambicion','sacrilegio','abismo','e35','radio','resistencia','cosecha','carchi','wiracocha'];
const V3_BOSSES=['goldcaptain','profaner','abysscrane','warconvoy','jammingtower','marshall','ironplough','mountedcommander','flyingfortress'];
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const rand = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return s - Math.floor(s); };
const palettes = [
  {sky:'#1a526d',light:'#f4d898',far:'#477a88',mid:'#35677b',rock:'#26444f',grass:'#7a9f5b'},
  {sky:'#155878',light:'#f6d79e',far:'#7390a0',mid:'#355e77',rock:'#294b54',grass:'#91ad54'},
  {sky:'#283c52',light:'#e9ad6e',far:'#6d7482',mid:'#3b5360',rock:'#35464d',grass:'#7b8050'},
  {sky:'#252f49',light:'#d4a77b',far:'#687084',mid:'#414759',rock:'#3b3c49',grass:'#67725b'},
  {sky:'#101d36',light:'#8fe1d8',far:'#3e536c',mid:'#25364d',rock:'#252d40',grass:'#4d706b'},
  {sky:'#125d7b',light:'#efd49c',far:'#769dab',mid:'#3f7189',rock:'#2e4b59',grass:'#8aac56'},
  {sky:'#1c4b71',light:'#ecbc78',far:'#6d859e',mid:'#3c657d',rock:'#354c5d',grass:'#81a45b'},
  {sky:'#354651',light:'#eac07c',far:'#788382',mid:'#536b70',rock:'#394950',grass:'#7d8a54'},
  {sky:'#286b77',light:'#f3d798',far:'#83a7a6',mid:'#4f8290',rock:'#3c5c59',grass:'#96b956'},
  {sky:'#245774',light:'#eac088',far:'#7a90a2',mid:'#4e7184',rock:'#40585a',grass:'#90a95b'},
  {sky:'#3b6579',light:'#ffdda0',far:'#8e9aaf',mid:'#5a7e8b',rock:'#435951',grass:'#9ab55e'},
  {sky:'#254960',light:'#e8c692',far:'#667c90',mid:'#3d677a',rock:'#344f55',grass:'#8ca45e'}
];
function path(ctx, points, fill, stroke, line = 2) {
  if (!points.length) return;
  ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
  for (let i=1;i<points.length;i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle=fill; ctx.fill(); }
  if (stroke) {ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.lineJoin='round';ctx.stroke();}
}
function ellipse(ctx,x,y,rx,ry,fill,stroke,line=2) {
  ctx.beginPath();ctx.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),0,0,TAU);
  if(fill){ctx.fillStyle=fill;ctx.fill();} if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}
}
function line(ctx,points,color,width=2) {
  ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
}
function glow(ctx,x,y,r,color='255,211,127',strength=.3) {
  const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${color},${strength})`);g.addColorStop(.3,`rgba(${color},${strength*.5})`);g.addColorStop(1,`rgba(${color},0)`);
  ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
}
function diamond(ctx,x,y,size,fill,stroke='#fae6ae',lw=2) {
  path(ctx,[[x,y-size],[x+size*.68,y],[x,y+size],[x-size*.68,y]],fill,stroke,lw);
}

export class WorldPainter {
  constructor() {
    this.images={};this.fallbacks=new Map();this.paper=null;this.preloaded=false;this.staticIndexes=new WeakMap();this.pendingImages=new Map();this.retryImages=new Map();
    this.makePaper();
  }
  async preload() {
    const names=['valley','ruins','abyss','village','hero'];
    const requests=names.map(name=>this.loadImage(name,`./assets/art/${name}.png`));
    for(const name of V3_SCENES)requests.push(this.loadImage(`v3-bg-${name}`,`./assets/art/v3/bg-${name}.png`));
    for(const name of V3_BOSSES)requests.push(this.loadImage(`v3-boss-${name}`,`./assets/art/v3/boss-${name}.png`));
    await Promise.all(requests);
    this.preloaded=true;
  }
  loadImage(key,path) {
    if(this.images[key])return Promise.resolve(this.images[key]);
    if(this.pendingImages.has(key))return this.pendingImages.get(key);
    if((this.retryImages.get(key)||0)>Date.now())return Promise.resolve(null);
    const retry=this.retryImages.has(key);
    const promise=new Promise(resolve=>{
      const img=new Image();img.decoding='async';
      img.onload=()=>{this.images[key]=img;this.retryImages.delete(key);this.pendingImages.delete(key);resolve(img);};
      img.onerror=()=>{this.retryImages.set(key,Date.now()+3200);this.pendingImages.delete(key);resolve(null);};
      const url=new URL(path,import.meta.url);if(retry)url.searchParams.set('retry',String(Math.floor(Date.now()/3200)));img.src=url.href;
    });
    this.pendingImages.set(key,promise);return promise;
  }
  sceneImage(chapter) {
    const name=V3_SCENES[clamp(chapter,0,9)],key=`v3-bg-${name}`;
    if(!this.images[key])this.loadImage(key,`./assets/art/v3/bg-${name}.png`);
    return this.images[key];
  }
  bossImage(boss,chapter) {
    let name=String(boss.sprite||boss.asset||boss.type||'').replace(/^boss[-_]?/,'').replace(/\.png$/,'').replace(/[^a-z]/gi,'').toLowerCase();
    if(!V3_BOSSES.includes(name))name=V3_BOSSES[clamp(chapter-1,0,8)];
    const key=`v3-boss-${name}`;if(!this.images[key])this.loadImage(key,`./assets/art/v3/boss-${name}.png`);
    return this.images[key];
  }
  makePaper() {
    const c=document.createElement('canvas');c.width=c.height=256;
    const ctx=c.getContext('2d');const d=ctx.createImageData(256,256);
    for(let i=0;i<d.data.length;i+=4){const n=rand(i*.25);d.data[i]=d.data[i+1]=d.data[i+2]=n>.5?245:12;d.data[i+3]=Math.round(4+n*14);}
    ctx.putImageData(d,0,0);this.paper=c;
  }
  backgroundKey(chapter) {
    if(chapter===3)return 'abyss';
    if(chapter===2||chapter===6)return 'ruins';
    if(chapter===5||chapter>=8)return 'village';
    return 'valley';
  }
  visibleStatic(items,left,right,kind='object') {
    if(!Array.isArray(items)||!items.length)return [];
    let index=this.staticIndexes.get(items);
    if(!index||index.length!==items.length||index.kind!==kind){
      const entries=items.map(item=>{
        const x=kind==='puzzle'?Math.min(item.x||0,item.gateX??item.x??0):(item.x||0);
        const end=kind==='puzzle'?Math.max((item.x||0)+200,(item.gateX??item.x??0)+(item.w||90)+60):x+(item.w||0)+(item.type==='bossgate'?300:0);
        return {item,x,end};
      }).sort((a,b)=>a.x-b.x);
      index={entries,length:items.length,kind,extent:entries.reduce((n,e)=>Math.max(n,e.end-e.x),0)};
      this.staticIndexes.set(items,index);
    }
    let lo=0,hi=index.entries.length;
    while(lo<hi){const m=(lo+hi)>>1;if(index.entries[m].x<left-index.extent)lo=m+1;else hi=m;}
    const result=[];
    for(let i=lo;i<index.entries.length&&index.entries[i].x<=right;i++){const e=index.entries[i];if(e.end>=left)result.push(e.item);}
    return result;
  }
  render(ctx,snapshot={}, {time=0,progress=0,width=W,height=H}={}) {
    const s=snapshot||{},chapter=Number.isFinite(s.chapter)?s.chapter:-1;
    const pal=palettes[clamp(chapter+1,0,palettes.length-1)],camera=Number.isFinite(s.camera)?s.camera:0;
    const platforms=s.platforms||[],objects=s.objects||[],enemies=s.enemies||[],particles=s.particles||[];
    const visiblePlatforms=this.visibleStatic(platforms,camera-100,camera+W+100,'platform');
    const visibleObjects=this.visibleStatic(objects,camera-120,camera+W+120);
    const visiblePuzzles=this.visibleStatic(s.puzzles||[],camera-220,camera+W+220,'puzzle');
    const visibleTargets=this.visibleStatic(s.targets||[],camera-120,camera+W+120,'target');
    const puzzleById=new Map(visiblePuzzles.map(p=>[p.id,p]));
    ctx.save();ctx.scale(width/W,height/H);ctx.lineJoin='round';ctx.lineCap='round';ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    this.drawBackdrop(ctx,chapter,pal,camera,time);
    this.drawAtmosphere(ctx,chapter,time,camera,pal);
    this.drawDistantDetails(ctx,chapter,camera,time,visiblePlatforms,pal);
    ctx.save();ctx.translate(-camera,0);
    this.drawConnections(ctx,this.visibleStatic(objects,camera-700,camera+W+700),chapter,time,camera);
    for(const p of visiblePlatforms)this.drawPlatform(ctx,p,pal,chapter,camera,time);
    for(const p of visiblePuzzles)this.drawPuzzle(ctx,p,time,pal,camera,visibleObjects);
    for(const t of visibleTargets)this.drawTarget(ctx,t,chapter);
    if(s.boss&&(s.boss.alive!==false||s.boss.defeated)&&s.boss.x+(s.boss.w||480)>=camera-200&&s.boss.x<=camera+W+200)this.drawBoss(ctx,s.boss,chapter,time,s.player);
    for(const o of visibleObjects)this.drawObject(ctx,o,chapter,time,puzzleById.get(o.puzzleId),s.campaign,camera);
    for(const npc of s.npcs||[])if(npc.x+(npc.w||50)>=camera-100&&npc.x<=camera+W+100)this.drawNpc(ctx,npc,time,chapter,s.campaign?.phase==='celebration'||chapter===10);
    for(const e of enemies)if(e.alive!==false&&e.health>0&&e.x+e.w>=camera-120&&e.x<=camera+W+120)this.drawEnemy(ctx,e,time);
    if(s.vehicle?.active)this.drawVehicle(ctx,s.vehicle,s.player,time);
    else if(s.player)this.drawPlayer(ctx,s.player,time,chapter);
    for(const projectile of s.projectiles||[])if(projectile.x>=camera-180&&projectile.x<=camera+W+180)this.drawProjectile(ctx,projectile,time);
    for(const p of particles)if(p.x>=camera-60&&p.x<=camera+W+60)this.drawParticle(ctx,p);
    ctx.restore();
    this.drawFrontLeaves(ctx,time,camera,chapter);
    const shade=ctx.createLinearGradient(0,H-110,0,H);shade.addColorStop(0,'rgba(4,19,28,0)');shade.addColorStop(1,'rgba(4,19,28,.20)');ctx.fillStyle=shade;ctx.fillRect(0,H-110,W,110);
    if(this.paper){ctx.globalAlpha=.34;ctx.fillStyle=ctx.createPattern(this.paper,'repeat');ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
    ctx.restore();
  }
  drawBackdrop(ctx,chapter,pal,camera,time) {
    const name=this.backgroundKey(chapter),image=this.sceneImage(chapter)||this.images[name];
    if(image){
      const scale=Math.max(W/image.width,H/image.height)*1.06;
      const iw=image.width*scale,ih=image.height*scale;
      const slack=Math.max(0,iw-W),travel=.5+.5*Math.sin(camera*.00012);
      const x=-(iw-W)*.44-(travel-.5)*Math.min(slack*.48,76);
      ctx.drawImage(image,x,(H-ih)*.46,iw,ih);
      // Narrow atmospheric wash separates interactive foreground from the painted distance.
      const mist=ctx.createLinearGradient(0,470,0,H);
      mist.addColorStop(0,'rgba(23,68,78,0)');mist.addColorStop(.58,'rgba(15,47,57,.02)');mist.addColorStop(1,'rgba(10,32,42,.28)');ctx.fillStyle=mist;ctx.fillRect(0,470,W,H-470);
      if(chapter===1||chapter===2||chapter===6){ctx.fillStyle='rgba(28,22,37,.10)';ctx.fillRect(0,0,W,H);}
    } else {
      const id=chapter===3?'abyss':chapter>=8?'town':`mountain${chapter}`;
      if(!this.fallbacks.has(id))this.fallbacks.set(id,this.buildFallback(chapter,pal));
      ctx.drawImage(this.fallbacks.get(id),0,0);
    }
  }
  buildFallback(chapter,pal) {
    const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const c=canvas.getContext('2d');
    const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,pal.sky);sky.addColorStop(.6,chapter===3?'#364864':'#76a8ae');sky.addColorStop(1,chapter===3?'#1a263b':'#c7d1aa');c.fillStyle=sky;c.fillRect(0,0,W,H);
    if(chapter!==3){
      glow(c,1030,210,390,'255,223,158',.5);ellipse(c,1050,185,42,42,'#f8dfac');
      for(let i=0;i<12;i++)this.cloud(c,i*160-60,110+rand(i)*215,60+rand(i+50)*120,'#e5d9b8',.12+rand(i)*.15);
    }
    for(let layer=0;layer<4;layer++){
      const base=450+layer*84,amplitude=layer===0?330:220-layer*25;
      const pts=[[-100,H],[-100,base+20]];
      for(let i=0;i<=24;i++){const x=i*76-100,y=base-amplitude*rand(i+layer*33);pts.push([x,y]);}
      pts.push([W+100,H]);path(c,pts,layer===0?pal.far:layer===1?pal.mid:layer===2?'#315e6b':'#264c59');
      for(let i=1;i<pts.length-2;i++){
        const [x,y]=pts[i],n=pts[i+1];if(y<n[1]-35){path(c,[[x,y],[x+12,y+25],[x+32,y+19],[x+52,y+78],[n[0],n[1]],[x+23,y+47]],layer<2?'rgba(238,238,212,.54)':'rgba(108,158,148,.21)');
        path(c,[[x,y],[x-9,y+110],[x+25,y+48],[n[0],n[1]]],'rgba(10,36,53,.16)');}
      }
    }
    if(chapter===3){
      path(c,[[0,0],[280,0],[240,100],[330,280],[245,422],[340,590],[226,900],[0,900]],'#152a3c','#102330',5);
      path(c,[[W,0],[1340,0],[1280,155],[1370,335],[1285,450],[1370,600],[1250,900],[W,900]],'#1a2c3e','#0d2231',5);
      for(let i=0;i<17;i++){const x=rand(i+88)*W,y=rand(i+21)*H;path(c,[[x,y],[x+25,y-10],[x+48,y+17],[x+31,y+52],[x+4,y+31]],'#405568','#22374b',3);}
      glow(c,820,520,280,'105,233,220',.15);
    } else {
      const lake=c.createLinearGradient(0,620,0,H);lake.addColorStop(0,'#77b7b5');lake.addColorStop(1,'#215a73');path(c,[[600,610],[1030,610],[1420,H],[350,H]],lake);
      for(let i=0;i<35;i++)line(c,[[500+rand(i)*690,660+rand(i+66)*240],[540+rand(i)*690,660+rand(i+66)*240]],'rgba(231,226,169,.23)',2);
      this.ruin(c,1150,565,1.8,pal.mid);this.ruin(c,295,515,1.2,'#2f6371');
      for(let i=0;i<23;i++)this.pine(c,i*86-30,660+rand(i+55)*70,.7+rand(i+78)*.7,'#214751',i);
      if(chapter>=8||chapter===5){for(let i=0;i<7;i++)this.house(c,190+i*184,690+rand(i)*35,.76+rand(i)*.35,i,chapter);}
    }
    const fog=c.createLinearGradient(0,530,0,H);fog.addColorStop(0,'rgba(122,175,173,0)');fog.addColorStop(.5,'rgba(122,175,173,.08)');fog.addColorStop(1,'rgba(14,52,64,.42)');c.fillStyle=fog;c.fillRect(0,530,W,H-530);
    return canvas;
  }
  cloud(ctx,x,y,size,color,alpha) {
    ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x-size,y+12);ctx.bezierCurveTo(x-size*1.1,y-12,x-size*.66,y-23,x-size*.5,y-15);ctx.bezierCurveTo(x-size*.55,y-size*.56,x+size*.08,y-size*.6,x+size*.22,y-18);ctx.bezierCurveTo(x+size*.65,y-35,x+size*.66,y+1,x+size,y+12);ctx.closePath();ctx.fill();ctx.restore();
  }
  ruin(ctx,x,base,scale,color) {
    ctx.save();ctx.translate(x,base);ctx.scale(scale,scale);
    path(ctx,[[-60,0],[-60,-120],[-45,-125],[-45,-145],[-33,-145],[-33,-121],[-8,-121],[-8,-210],[0,-226],[14,-207],[14,-143],[43,-140],[43,-172],[61,-172],[61,0]],color);
    path(ctx,[[-67,-6],[-59,-11],[-38,-7],[-14,-9],[6,-5],[59,-12],[75,-4],[83,20],[-78,20]],'#345d62');
    for(let i=0;i<9;i++){const xx=-40+(i%3)*33,yy=-31-Math.floor(i/3)*35;path(ctx,[[xx,yy],[xx,yy-17],[xx+6,yy-22],[xx+12,yy-16],[xx+12,yy]],'#162f40');}
    line(ctx,[[-48,-86],[-12,-86]],'rgba(165,196,167,.2)',3);ctx.restore();
  }
  pine(ctx,x,y,scale,color,seed=0) {
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    path(ctx,[[-5,0],[-4,-117],[2,-131],[6,0]],'#253740');
    for(let j=0;j<5;j++){const yy=-115+j*20,spread=15+j*8;path(ctx,[[0,yy-26],[spread*.4,yy],[spread,yy+16],[8,yy+11],[spread*.65,yy+26],[-spread*.88,yy+19],[-spread*.5,yy+4],[-spread*.76,yy+6]],color);}
    line(ctx,[[-8,-70],[0,-110],[10,-71]],'rgba(153,184,119,.12)',2);ctx.restore();
  }
  house(ctx,x,base,scale,seed,chapter) {
    ctx.save();ctx.translate(x,base);ctx.scale(scale,scale);
    path(ctx,[[-58,0],[-54,-79],[45,-76],[56,0]],'#b39b76','#233c47',3);
    path(ctx,[[45,-76],[75,-66],[80,2],[56,0]],'#806e61','#233c47',3);
    path(ctx,[[-73,-77],[-15,-121],[61,-91],[46,-75]],'#b26042','#273743',4);
    path(ctx,[[-15,-121],[20,-116],[90,-74],[62,-72]],'#823f37','#273743',3);
    for(let i=0;i<6;i++)line(ctx,[[-58+i*17,-80-i*3],[0+i*10,-111+i*3]],'rgba(248,162,101,.3)',2);
    path(ctx,[[-14,0],[-13,-43],[-6,-54],[7,-53],[16,-43],[17,0]],'#233e47','#725d49',3);
    path(ctx,[[-42,-34],[-42,-59],[-26,-59],[-25,-34]],chapter>=8?'#eac385':'#5c6965','#4f554d',2);
    line(ctx,[[-34,-57],[-34,-35]],'#534f42',2);line(ctx,[[-41,-46],[-27,-46]],'#534f42',2);
    line(ctx,[[25,-27],[25,-52],[41,-52],[42,-28]],'#634f41',3);
    line(ctx,[[-50,-12],[-20,-12]],'#8a775e',3);
    if(chapter>=9){glow(ctx,-33,-46,34,'255,187,89',.14);}
    ctx.restore();
  }
  drawAtmosphere(ctx,chapter,time,camera,pal) {
    if(chapter!==3&&chapter!==6){
      for(let i=0;i<4;i++)this.cloud(ctx,(i*510+time*3-camera*.025)%2100-230,90+i*78,85+i*14,'#e2dcc1',.035);
      for(let i=0;i<3;i++){const x=480+i*258+Math.sin(time*.18+i)*180,y=160+Math.sin(time*.32+i*2)*28;line(ctx,[[x-6,y+2],[x,y],[x+6,y+2]],'rgba(20,48,64,.42)',1.6);}
    }
    const dust=chapter===1||chapter===2||chapter===6;
    const motes=chapter===9?48:chapter===3?30:19;
    for(let i=0;i<motes;i++){
      const x=((rand(i+421)*W-time*(dust?7:2+i%4)-camera*.075)%W+W)%W;
      const y=240+rand(i+48)*600+Math.sin(time*.58+i*2.1)*19;
      const opacity=(.2+.35*Math.sin(time*1.7+i))* (dust?.5:1);
      ctx.globalAlpha=Math.max(.03,opacity);
      if(dust)path(ctx,[[x,y],[x+3,y-2],[x+5,y+2],[x+2,y+4]],'#d6b79a');
      else if(chapter===9&&i%3===0)path(ctx,[[x,y],[x+6,y+2],[x+4,y+8],[x-2,y+6]],i%2?'#dd7252':'#e4b459');
      else {ellipse(ctx,x,y,i%4===0?2:1.15,i%4===0?2:1.15,chapter===3?'#a5f3df':'#ffe0a0');}
    }
    ctx.globalAlpha=1;
  }
  drawDistantDetails(ctx,chapter,camera,time,platforms,pal) {
    if(this.images[`v3-bg-${V3_SCENES[clamp(chapter,0,9)]}`])return;
    if(chapter>=8||chapter===5){
      const base=742;
      for(let i=-1;i<9;i++){
        const world=i*260;const x=((world-camera*.35)%2340+2340)%2340-360;
        this.house(ctx,x,base+rand(i+77)*30,.55+rand(i+101)*.22,i,chapter);
      }
      if(chapter===9){
        ctx.save();ctx.globalAlpha=.85;
        for(let i=0;i<8;i++){const x=i*245-(camera*.23%245);const y=430+Math.sin(i*1.5)*35;
          ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+120,y+58,x+245,y+10);ctx.strokeStyle='#4a4b4e';ctx.lineWidth=2;ctx.stroke();
          for(let k=1;k<6;k++){const xx=x+k*40,yy=y+Math.sin(k/6*Math.PI)*26;path(ctx,[[xx-10,yy],[xx+10,yy+2],[xx+Math.sin(time*2+k)*3,yy+22]],['#d46c4a','#e1b65c','#4d9f99'][k%3],'#604940',1);}
        }ctx.restore();
      }
    }
    if(chapter===2||chapter===6){
      const x=1300-(camera*.16%1950);this.ruin(ctx,x,700,1.06,'rgba(28,53,65,.75)');
      for(let i=0;i<6;i++){const xx=i*370-(camera*.24%370);line(ctx,[[xx,705],[xx+4,568]],'#31434a',5);path(ctx,[[xx+4,570],[xx+51,585+Math.sin(time+i)*5],[xx+40,617],[xx+3,609]],'#723c40','#2a3b46',2);}
    }
    // Trees remain behind the actual collidable platforms.
    if(chapter!==3){
      for(let i=0;i<6;i++){const x=i*420-(camera*.21%420)-140;this.pine(ctx,x,777+rand(i+511)*40,.7+rand(i+22)*.55,'rgba(22,55,62,.48)',i);}
    }
  }
  drawPlatform(ctx,p,pal,chapter,camera,time) {
    const x=p.x,y=p.y,w=p.w,h=Math.max(12,p.h||40);
    const start=Math.max(x,camera-100),end=Math.min(x+w,camera+W+100);
    const floating=h<100||p.type==='floating'||p.type==='ledge'||p.type==='bridge';
    if(p.type==='bridge'){
      path(ctx,[[start,y],[end,y],[end,y+18],[start,y+18]],'#786450','#213942',3);
      for(let i=Math.floor(start/26);i<end/26;i++)line(ctx,[[i*26,y+2],[i*26+2,y+15]],'#322f2d',2);
      line(ctx,[[start,y+21],[end,y+21]],'#443f34',4);
      return;
    }
    const bottom=floating?y+h:Math.max(H+35,y+h);
    const top=[[start,y+3]];
    const k0=Math.floor(start/28);
    for(let k=k0;k<=Math.ceil(end/28);k++){
      const xx=clamp(k*28,start,end);top.push([xx,y+rand(k+67)*4-2]);
    }
    top.push([end,y+2],[end,bottom-5]);
    if(floating){for(let xx=end;xx>start;xx-=35)top.push([xx, bottom-3-rand(xx+18)*13]);}
    top.push([start,bottom]);
    const rock=ctx.createLinearGradient(0,y,0,bottom);rock.addColorStop(0,chapter===0||chapter===1?'#82765c':chapter===4?'#3b4a52':chapter===6?'#5c625c':pal.rock);rock.addColorStop(.3,chapter===3?'#263646':chapter===0||chapter===1?'#495451':'#29404b');rock.addColorStop(1,chapter===3?'#142536':'#182e3b');
    path(ctx,top,rock,'#152f3a',2.5);
    ctx.save();ctx.beginPath();ctx.moveTo(...top[0]);for(let i=1;i<top.length;i++)ctx.lineTo(...top[i]);ctx.closePath();ctx.clip();
    const facets=['#466369','#314e5a','#527074','#34515b','#28424e'];
    for(let k=Math.floor(start/95);k<=Math.ceil(end/95);k++){
      const xx=k*95,rr=rand(k+827),dy=23+rr*35;
      path(ctx,[[xx,y+14],[xx+54,y+dy],[xx+83,y+16],[xx+93,y+90+rr*60],[xx+33,y+104],[xx+4,y+68]],facets[Math.abs(k)%facets.length]);
      line(ctx,[[xx+12,y+15],[xx+44,y+dy],[xx+27,y+71]],'rgba(13,31,41,.47)',1.8);
      line(ctx,[[xx+55,y+dy],[xx+78,y+21]],'rgba(155,171,147,.15)',2);
      if(!floating&&rand(k+345)>.42)path(ctx,[[xx+20,y+140],[xx+53,y+153],[xx+61,y+241],[xx+33,y+219]],'#233a47');
    }
    ctx.restore();
    // A broken ochre stone rim and painted grass tufts avoid a rectangular ledge.
    const rim=chapter===0||chapter===1?'#d4c190':chapter===3?'#657880':chapter===2?'#9a9275':chapter===4?'#747f7f':chapter===6?'#aea275':'#bdad79';
    line(ctx,[[start,y+4],[end,y+4]],rim,floating?7:10);
    if(chapter===4&&!floating){
      line(ctx,[[start,y+7],[end,y+7]],'#293c46',7);
      for(let k=Math.floor(start/90);k<end/90;k++){const xx=k*90;line(ctx,[[xx,y+8],[xx+38,y+8]],'#d4c494',2.7);}
    }else if(chapter===6||chapter===8||chapter===9){
      for(let k=Math.floor(start/45);k<end/45;k++){const xx=k*45;line(ctx,[[xx,y+3],[xx+1,y+13]],'#434d4c',2);line(ctx,[[xx+4,y+13],[xx+42,y+13]],'#8c9480',1.3);}
    }else if(chapter===0||chapter===1){
      for(let k=Math.floor(start/80);k<end/80;k++){const xx=k*80;ellipse(ctx,xx+rand(k)*40,y-1,2.1,1.5,'#eee0ad');if(rand(k+11)>.7)line(ctx,[[xx,y+2],[xx-6,y-6],[xx+1,y-4],[xx+6,y-10]],'#798769',2);}
    }else if(chapter!==3){
      line(ctx,[[start,y-1],[end,y-1]],pal.grass,4);
      for(let k=Math.floor(start/18);k<Math.ceil(end/18);k++){
        const xx=k*18,seed=rand(k+221),height=4+seed*12;
        if(seed>.23){path(ctx,[[xx-5,y+1],[xx-9,y-height],[xx-1,y-4],[xx+3,y-height-2],[xx+4,y-1],[xx+10,y-height*.6],[xx+7,y+2]],seed>.66?'#a4b75f':pal.grass);}
        if(chapter===7&&seed>.81)this.crop(ctx,xx,y,time,k);
        if(chapter===0&&seed>.92){ellipse(ctx,xx,y-8,2.3,3.3,'#e9bb72');ellipse(ctx,xx+3,y-10,2,2,'#f4d4a0');}
      }
    } else {
      for(let k=Math.floor(start/47);k<end/47;k++)if(rand(k+231)>.6){const xx=k*47;line(ctx,[[xx,y+5],[xx+2,y+26]],'#368f94',2);ellipse(ctx,xx+2,y+24,2.3,2.3,'#8acbc6');}
    }
  }
  crop(ctx,x,y,time,seed) {
    const sway=Math.sin(time*1.7+seed)*3;
    line(ctx,[[x,y],[x+sway,y-38]],'#83a954',3);
    path(ctx,[[x,y-16],[x-17,y-30],[x-9,y-30],[x+sway,y-20]],'#72a455','#263e40',1);
    path(ctx,[[x+1,y-22],[x+16,y-39],[x+20,y-38],[x+sway,y-15]],'#a0bc58','#263e40',1);
    ellipse(ctx,x+sway,y-34,4,9,'#d8bd68','#5d7250',1);
  }
  drawConnections(ctx,objects,chapter,time,camera) {
    if(chapter<5)return;
    const lit=objects.filter(o=>(o.type==='community'||o.type==='beacon')&&o.active===true).sort((a,b)=>a.x-b.x);
    if(lit.length<2)return;
    ctx.save();ctx.globalAlpha=.35+.12*Math.sin(time*.6);
    for(let i=1;i<lit.length;i++){
      const a=lit[i-1],b=lit[i];if(b.x<camera-200||a.x>camera+W+200)continue;
      ctx.beginPath();ctx.moveTo(a.x,a.y+20);ctx.bezierCurveTo(a.x+(b.x-a.x)*.3,Math.min(a.y,b.y)-115,b.x-(b.x-a.x)*.25,Math.min(a.y,b.y)-130,b.x,b.y+20);
      ctx.strokeStyle='#fbd382';ctx.lineWidth=2;ctx.shadowColor='#fec971';ctx.shadowBlur=12;ctx.stroke();
    }ctx.restore();
  }
  drawPuzzle(ctx,p,time,pal,camera,objects) {
    const gx=p.gateX??p.x,gy=p.gateY??p.y-345,w=p.w||90,h=p.h||400;
    if(p.type==='switches'&&gx+w+190>=camera&&gx-190<=camera+W){
      const floor=gy+h;
      ctx.save();
      const bx=gx-150,bw=w+300;
      line(ctx,[[bx,floor-27],[bx+bw*.5,floor-13],[bx+bw,floor-27]],'#34464b',4);
      for(const xx of [bx,bx+bw]){line(ctx,[[xx,floor+5],[xx,floor-54]],'#374345',6);line(ctx,[[xx,floor-51],[xx,floor-43]],'#bfaa79',3);}
      if(p.open){
        path(ctx,[[bx,floor],[bx+bw,floor],[bx+bw,floor+14],[bx,floor+14]],'#8f7957','#203b43',2.5);
        for(let i=0;i<16;i++){const xx=bx+i*bw/16;line(ctx,[[xx,floor+2],[xx+3,floor+11]],'#3f4139',2);}
        line(ctx,[[bx,floor+15],[bx+bw,floor+15]],'#cab384',2.2);
      }else{
        for(const side of [-1,1]){const x=side<0?bx:bx+bw;path(ctx,[[x-9,floor],[x+9,floor],[x+side*9,floor-86],[x+side*22,floor-85]],'#8b7354','#293e43',2.3);}
      }
      ctx.restore();
    }
    if(p.type==='irrigation'){
      const a=p.x,b=gx+20,start=Math.max(Math.min(a,b),camera-40),end=Math.min(Math.max(a,b),camera+W+40);
      const y0=p.y+53,y1=gy+h-9,slope=(y1-y0)/Math.max(1,b-a),yy=x=>y0+(x-a)*slope;
      if(end>start){
        path(ctx,[[start,yy(start)-2],[end,yy(end)-2],[end,yy(end)+13],[start,yy(start)+13]],'#172f3b','#9c9b74',2.5);
        if(p.open||p.progress>0){
          path(ctx,[[start,yy(start)+3],[end,yy(end)+3],[end,yy(end)+10],[start,yy(start)+10]],'#4aa6ae');
          for(let x=Math.floor(start/70)*70;x<end;x+=70)line(ctx,[[x+Math.sin(time*3+x*.05)*9,yy(x)+5],[x+26,yy(x)+5]],'#b5e4ca',1.7);
        }
        for(let x=Math.floor(start/160)*160;x<end;x+=160)path(ctx,[[x,yy(x)-4],[x+18,yy(x)-4],[x+17,yy(x)+17],[x-2,yy(x)+15]],'#87917a','#354d4c',1.5);
      }
    }
    if(p.type==='sequence'&&p.x>camera-300&&p.x<camera+W+300){
      const sequence=Array.isArray(p.sequence)?p.sequence:[2,1,3],count=Math.min(5,sequence.length);
      const plaqueW=count*43+30,px=p.x-22,py=p.y-112;
      ctx.save();ctx.translate(px,py);
      path(ctx,[[-10,5],[plaqueW+7,5],[plaqueW+12,56],[plaqueW-4,64],[-13,59]],'#314c57','#172f3c',3);
      path(ctx,[[-8,4],[plaqueW+6,4],[plaqueW+7,12],[-9,13]],'#b4aa7b','#3b4b4a',1.3);
      line(ctx,[[4,55],[plaqueW-4,55]],'#8b9574',1.2);
      for(let i=0;i<count;i++){
        const value=sequence[i],number=typeof value==='number'?value:parseInt(String(value).match(/\d+/)?.[0]||String(i+1),10);
        const done=p.open||(Array.isArray(p.activated)&&i<(p.progress||p.activated.length));
        const xx=26+i*43;
        diamond(ctx,xx,33,18,done?'#626f58':'#263e49',done?'#f3d496':'#738d85',1.5);
        ctx.font='700 21px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=done?'#ffedba':'#e2dac0';ctx.fillText(String(number),xx,34);
        if(i<count-1)path(ctx,[[xx+22,30],[xx+28,34],[xx+22,38]],'#c0ad80');
      }
      ctx.restore();
    }
    if(gx+w<camera-150||gx>camera+W+150)return;
    ctx.save();ctx.translate(gx,gy);
    // Carved stone pillars frame an actual timber gate, with a clear empty opening when raised.
    ellipse(ctx,w*.5,h+5,w*.91,9,'rgba(6,25,33,.28)');
    for(const side of [-1,1]){
      const px=side===-1?-26:w+7;
      path(ctx,[[px-3,h],[px-2,28],[px+4,9],[px+22,9],[px+30,27],[px+28,h]],'#566d72','#1a3340',3);
      for(let j=0;j<7;j++){
        const yy=31+j*(h-31)/7;
        path(ctx,[[px+1,yy],[px+25,yy+2],[px+24,yy+43],[px,yy+42]],j%2?'#52686c':'#718177','#2d4650',1.7);
        line(ctx,[[px+2,yy+4],[px+23,yy+5]],'#a5aa87',1.3);
        if(j===1||j===4)diamond(ctx,px+13,yy+24,8,null,p.open?'#e9ce8f':'#a8a784',1.5);
      }
      path(ctx,[[px-7,h-6],[px+34,h-7],[px+37,h+7],[px-10,h+7]],'#7d8776','#213d45',2.3);
    }
    path(ctx,[[-29,37],[-22,7],[w*.5-16,-14],[w*.5,-25],[w*.5+19,-14],[w+29,7],[w+36,37]],'#87937e','#1c3640',3);
    path(ctx,[[-18,30],[-10,14],[w*.5,-7],[w+17,14],[w+23,30]],'#657b75','#314b51',1.8);
    line(ctx,[[-19,32],[w+26,32]],'#c0b78a',2);
    diamond(ctx,w*.5,7,10,p.open?'#e3cb85':'#36535d','#b9b894',1.5);
    if(p.open){
      path(ctx,[[1,35],[w-1,35],[w-1,75],[1,75]],'#63574b','#203841',2.4);
      for(let i=0;i<5;i++){const x=3+i*(w-6)/5;line(ctx,[[x,38],[x+2,73]],'#ac9568',2);path(ctx,[[x,70],[x+12,70],[x+6,85]],'#6d6051','#263c43',1.3);}
      line(ctx,[[2,h-2],[w-1,h-2]],'#d8bf83',3);
      glow(ctx,w*.5,h-20,90,'247,218,132',.12);
      for(let i=0;i<5;i++)diamond(ctx,10+i*18,h-10+Math.sin(time*2+i)*3,2,'#ead39b',null);
    } else {
      const wood=ctx.createLinearGradient(0,38,w,h);wood.addColorStop(0,'#897459');wood.addColorStop(.5,'#70624f');wood.addColorStop(1,'#514b43');
      path(ctx,[[1,36],[w-1,36],[w-1,h-1],[1,h-1]],wood,'#182f3b',3);
      for(let i=0;i<6;i++){
        const x=2+i*(w-4)/6;
        line(ctx,[[x,40],[x+1,h-3]],i%2?'#ad9267':'#453f39',2.3);
        for(let j=0;j<3;j++){const yy=67+j*92+rand(i+j+91)*31;line(ctx,[[x+6,yy],[x+7,yy+25],[x+5,yy+48]],'#9f8764',1.1);}
      }
      path(ctx,[[4,94],[w-4,99],[w-4,116],[4,111]],'#473f39','#22353d',2);
      path(ctx,[[4,h-88],[w-4,h-81],[w-4,h-65],[4,h-72]],'#473f39','#22353d',2);
      line(ctx,[[10,115],[w-11,h-87]],'#493f36',13);line(ctx,[[10,115],[w-11,h-87]],'#9b805a',7);
      line(ctx,[[w-10,115],[11,h-87]],'#463e37',12);line(ctx,[[w-10,115],[11,h-87]],'#877355',6);
      for(const x of [13,w-13])for(const yy of [104,h-78])ellipse(ctx,x,yy,3.5,3.5,'#c7b388','#253b42',1);
      ellipse(ctx,w*.5,h*.53,18,21,'#314a51','#b29c70',2.5);diamond(ctx,w*.5,h*.53,10,'#754c42','#dec08a',1.5);
    }
    const total=Math.max(1,p.total||p.sequence?.length||3),completed=p.open?total:Math.min(total,p.progress||0);
    for(let i=0;i<Math.min(total,7);i++){
      const x=w*.5+(i-(Math.min(total,7)-1)*.5)*13;
      ellipse(ctx,x,52,3.5,3.5,i<completed?'#f9dea0':'#263e47','#b9ac7b',1);
    }
    ctx.restore();
  }
  drawBoss(ctx,b,chapter,time,player) {
    const w=b.w||480,h=b.h||620,foot=b.y+h,cx=b.x+w*.5;
    const image=this.bossImage(b,chapter),alive=b.alive!==false&&!b.defeated;
    ellipse(ctx,cx,foot+8,w*.48,19,'rgba(5,17,26,.43)');
    if(!alive){
      ctx.save();ctx.translate(cx,foot);
      for(let i=0;i<7;i++){const x=-95+i*30,yy=-8-rand(i+17)*25;path(ctx,[[x,0],[x-12,yy],[x+5,yy-9],[x+23,-7]],i%2?'#566876':'#8d6f5c','#253c47',2);}
      path(ctx,[[-65,-8],[-65,-67],[16,-59],[6,-31],[-64,-41]],'#784044','#253b45',2.5);line(ctx,[[-65,-8],[-65,-70]],'#b09b77',3);ctx.restore();return;
    }
    const phase=clamp(Number(b.phase)||1,1,3),remaining=Math.max(0,b.telegraph||0),charging=remaining>0;
    if(charging){
      const pressure=1-clamp(remaining/(b.telegraphMax||1)),attack=b.attack||'slam';
      ctx.save();ctx.globalAlpha=.30+pressure*.3;
      const contactX=Number.isFinite(b.weakX)?b.weakX:b.x+50;
      const direction=player&&player.x+player.w*.5>cx?1:-1;
      const targetX=Number.isFinite(b.dangerX)?b.dangerX+(b.dangerW||360)*.5:player?player.x+player.w*.5:b.x-120;
      const dangerX=attack==='slam'||attack==='sweep'?contactX:attack==='charge'?contactX+direction*245:targetX;
      const spread=attack==='sweep'?440:attack==='slam'?310:attack==='charge'?330:attack==='volley'?245:145;
      ellipse(ctx,dangerX,foot-2,spread,18,'rgba(211,93,52,.36)','#efb078',2.5);
      for(let i=0;i<5;i++){
        const xx=dangerX-spread+i*spread*.5;
        path(ctx,[[xx-5,foot-13],[xx+6,foot-13],[xx+1,foot-22-pressure*7]],'#f4b77e','#763c3b',1);
      }
      if(attack==='fire'||attack==='volley')glow(ctx,cx,foot-h*.53,145,'244,107,48',.18+pressure*.25);
      ctx.restore();
    }
    ctx.save();ctx.translate(cx,foot);
    const sway=Math.sin(time*(phase===3?2:1.1)+chapter)*(.009+phase*.002);
    ctx.rotate(sway+(charging?Math.sin(time*16)*.002:0));
    if(image){
      const lift=chapter===9?70+Math.sin(time*.8)*6:0;
      const ratio=Math.min(w/image.width,(h-lift)/image.height),iw=image.width*ratio,ih=image.height*ratio;
      if(b.facing>0)ctx.scale(-1,1);
      ctx.drawImage(image,-iw*.5,-ih-lift,iw,ih);
      if(lift){for(const x of [-w*.26,w*.25]){ctx.beginPath();ctx.moveTo(x,-lift-25);ctx.quadraticCurveTo(x-15,-45,x-7,-12);ctx.strokeStyle='#8eaa9e';ctx.lineWidth=2.5;ctx.stroke();}}
    }else this.drawBossFallback(ctx,b,chapter,w,h,time);
    if(charging){
      ctx.globalAlpha=.22;
      glow(ctx,-w*.2,-h*.68,120,'238,124,65',.35);glow(ctx,w*.17,-h*.67,95,'238,124,65',.28);ctx.globalAlpha=1;
    }
    ctx.restore();
    const weakX=Number.isFinite(b.weakX)?b.weakX:b.x+35,weakY=Number.isFinite(b.weakY)?b.weakY:foot-80;
    const exposed=b.weakOpen===true||(b.weakTimer||0)>0;
    glow(ctx,weakX,weakY,exposed?87:39,exposed?'255,220,127':'147,225,209',exposed?.30:.12);
    ellipse(ctx,weakX,weakY,18,21,exposed?'#866145':'#2d5260',exposed?'#ffdf9a':'#8abbb3',2.8);
    if(exposed){diamond(ctx,weakX,weakY,10,'#fae6ac','#fff3d0',1.7);diamond(ctx,weakX,weakY,4,'#fffbea',null);}
    else {path(ctx,[[weakX-9,weakY-8],[weakX+9,weakY-8],[weakX+8,weakY+5],[weakX,weakY+11],[weakX-8,weakY+5]],'#688d90','#c4c8a8',1.5);line(ctx,[[weakX,weakY-5],[weakX,weakY+5]],'#bdc8aa',1.7);}
  }
  drawBossFallback(ctx,b,chapter,w,h,time) {
    // These temporary painted silhouettes disappear as soon as each transparent portrait is ready.
    const machine=[3,4,5,7,9].includes(chapter),unit=w/480;
    ctx.save();ctx.scale(unit,h/620);
    if(machine){
      if(chapter===3){
        path(ctx,[[-137,0],[-111,-460],[-62,-545],[30,-560],[60,-503],[168,-300],[129,-283],[4,-472],[-62,-443],[-77,0]],'#596870','#1c303e',6);
        for(let i=0;i<8;i++){const yy=-30-i*53;line(ctx,[[-95,yy],[-82,yy-43]],'#ad9c7c',5);}
        ellipse(ctx,-35,-493,51,51,'#334f5d','#aa9c7a',5);ellipse(ctx,-35,-493,22,22,'#8e7558','#1d3542',3);
        for(let i=0;i<11;i++){const yy=-440+i*29;ellipse(ctx,125+Math.sin(time*.9)*11,yy,8,15,null,'#829999',3);}
        path(ctx,[[107,-111],[144,-117],[163,-73],[146,-55],[111,-62]],'#714641','#caa071',3);
      }else if(chapter===5){
        path(ctx,[[-139,0],[-90,-84],[-66,-500],[0,-570],[65,-498],[90,-84],[136,0]],'#3a5261','#182e3d',6);
        for(let i=0;i<6;i++){const yy=-420+i*61;line(ctx,[[-55,yy],[60,yy+31]],'#8c6f54',10);line(ctx,[[-55,yy+31],[60,yy]],'#a29474',6);}
        for(const x of [-72,72]){line(ctx,[[x,-400],[x*1.7,-525]],'#7c9695',7);ellipse(ctx,x*1.7,-525,60,23,'#768e8d','#223c49',5);}
        path(ctx,[[-45,-119],[-39,-259],[46,-253],[51,-121]],'#80664f','#a99d77',4);ellipse(ctx,0,-192,25,25,'#bd8051','#233d46',4);
      }else if(chapter===9){
        ellipse(ctx,0,-423,214,131,'#8c6856','#243645',6);path(ctx,[[-170,-464],[-139,-513],[23,-547],[166,-459],[154,-364],[-146,-353]],'#ae865c','#1c3542',5);
        for(let i=-2;i<=2;i++)line(ctx,[[i*68,-530],[i*69,-315]],'#41505a',5);
        path(ctx,[[-148,-288],[-107,-365],[131,-367],[173,-287],[150,-171],[-126,-174]],'#4f626a','#20313f',6);
        path(ctx,[[-218,-240],[-137,-275],[-137,-223],[-219,-198]],'#785744','#233b47',4);path(ctx,[[135,-274],[226,-231],[228,-194],[133,-221]],'#785744','#233b47',4);
        for(let i=-2;i<3;i++)path(ctx,[[i*45-12,-239],[i*45-12,-281],[i*45+10,-281],[i*45+10,-238]],'#283e4a','#b29367',2);
      }else {
        const bodyY=chapter===4?-211:-170;
        for(const x of [-133,122]){ellipse(ctx,x,-53,52,52,'#273943','#81928b',6);ellipse(ctx,x,-53,22,22,'#b4986c','#334b53',4);}
        path(ctx,[[-206,-68],[-192,bodyY],[-126,bodyY-61],[124,bodyY-58],[194,bodyY+8],[209,-70]],'#62777a','#192f3e',6);
        path(ctx,[[-126,bodyY-60],[-120,bodyY-226],[31,bodyY-264],[102,bodyY-166],[128,bodyY-61]],'#75634f','#253b46',5);
        for(let i=-2;i<3;i++)line(ctx,[[i*53,bodyY-50],[i*54,-82]],'#ac9b75',7);
        if(chapter===7)for(let i=-3;i<=3;i++)path(ctx,[[i*47-13,-99],[i*47+13,-100],[i*47+29,-5],[i*47+5,0]],'#8f9d97','#263b46',4);
        else {line(ctx,[[0,bodyY-185],[-145,bodyY-251]],'#263944',18);line(ctx,[[0,bodyY-185],[-145,bodyY-251]],'#aab4a8',10);}
      }
    }else if(chapter===8){
      path(ctx,[[-174,-69],[-178,-161],[-121,-209],[85,-210],[133,-284],[184,-273],[207,-180],[149,-149],[119,-76]],'#444a51','#1a303d',6);
      for(const x of [-134,-78,87,140]){line(ctx,[[x,-97],[x-10,-40],[x+7,0]],'#243745',26);line(ctx,[[x,-97],[x-10,-40],[x+7,0]],'#677379',17);}
      path(ctx,[[-70,-202],[-82,-449],[-15,-474],[60,-449],[70,-251]],'#6a7477','#1d3340',5);ellipse(ctx,-6,-507,40,47,'#a6aba1','#203541',5);
      path(ctx,[[-80,-435],[-135,-271],[-96,-182],[-43,-237],[-6,-449]],'#984c48','#233743',5);
      line(ctx,[[61,-272],[69,-570]],'#b9a47b',8);path(ctx,[[45,-555],[70,-615],[94,-555]],'#d2c8aa','#263a45',4);
    }else {
      path(ctx,[[-112,-476],[-180,-335],[-188,-102],[-86,-20],[31,-46],[110,-281],[91,-489]],chapter===2?'#543e47':'#934e48','#1c3040',6);
      for(const x of [-45,64]){line(ctx,[[x,-212],[x-8,-100],[x+1,-23]],'#203545',49);line(ctx,[[x,-212],[x-8,-100],[x+1,-23]],'#687b80',35);path(ctx,[[x-23,-28],[x+25,-27],[x+40,-6],[x+35,7],[x-26,5]],'#716a5c','#1f3440',4);}
      path(ctx,[[-83,-493],[79,-493],[113,-350],[72,-210],[-63,-210],[-104,-344]],'#728386','#1b3341',6);
      path(ctx,[[-33,-490],[14,-490],[16,-219],[-29,-219]],chapter===2?'#704147':'#b69a62','#314753',3);
      ellipse(ctx,0,-551,46,52,'#c4baa0','#233b47',5);path(ctx,[[-59,-551],[-47,-599],[-3,-620],[47,-596],[58,-551]],'#6c8188','#1d3442',5);line(ctx,[[-66,-548],[66,-548]],'#cbb387',7);
      this.limb(ctx,[85,-455],[150,-350],[135,-237],'#687c83',33);line(ctx,[[140,-15],[142,-552]],'#233844',15);line(ctx,[[140,-15],[142,-552]],'#b79b6f',8);
      if(chapter===2){glow(ctx,140,-508,90,'248,145,53',.4);path(ctx,[[117,-503],[143,-570],[166,-504],[151,-475]],'#d58b4f','#ecd49b',3);}
      else path(ctx,[[116,-525],[143,-596],[169,-525]],'#c2c6b1','#263d49',4);
    }
    ctx.restore();
  }
  drawProjectile(ctx,p,time) {
    if((p.life??1)<=0)return;
    const r=Math.max(4,p.r||10),angle=Math.atan2(p.vy||0,p.vx||1),enemy=p.team==='enemy';
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);
    if(p.type==='obsidian'){
      line(ctx,[[-r*3,0],[-r,0]],enemy?'#d7a481':'#91dcca',r*.48);
      path(ctx,[[-r*.9,-r*.3],[0,-r],[r,.1*r],[r*.4,r*.65],[-r*.7,r*.7]],'#374555',enemy?'#e0b789':'#c2e9d1',1.8);
      path(ctx,[[-r*.6,-r*.25],[0,-r],[r*.38,0],[-r*.1,r*.4]],'#657388');line(ctx,[[-r*.3,-r*.2],[r*.2,0]],'#afc4be',1.2);
    }else if(p.type==='chain'){
      for(let i=0;i<4;i++)ellipse(ctx,-i*r*1.25,0,r*.58,r*.35,null,'#b7b59c',2.4);
      path(ctx,[[r,-r],[r*1.6,0],[r,r],[0,r*.7],[r*.5,0],[0,-r*.7]],'#8c9994','#283f48',2);
    }else{
      const color=enemy?'#f1a666':'#f8d48a';glow(ctx,0,0,r*4,enemy?'244,118,60':'255,207,116',.33);
      path(ctx,[[-r*3,-r*.15],[-r*1.5,-r*.68],[-r*1.9,-r*1.05],[-r*.35,-r*.85],[r*.48,-r*.7],[r,0],[r*.46,r*.8],[-r*.3,r*.9],[-r*1.8,r*.72],[-r*1.18,r*.26]],enemy?'#b55540':'#cf925a','#593d3c',1.4);
      ellipse(ctx,0,0,r*.69,r*.72,color);ellipse(ctx,r*.2,0,r*.34,r*.4,'#fff1ba');
      line(ctx,[[-r*3.6,r*.38],[-r*2.5,r*.29]],color,1.8);
    }
    ctx.restore();
  }
  drawNpc(ctx,n,time,chapter,celebrating=false) {
    const w=n.w||50,h=n.h||90,phase=time*(celebrating?3.3:2.2)+(n.x||0)*.011,variant=Number.isFinite(n.variant)?n.variant:String(n.variant||n.id||'').length;
    const woman=variant%3===1,color=['#b5684d','#468b87','#a88954','#596d8b'][variant%4],foot=n.y+h;
    const bounce=celebrating?Math.abs(Math.sin(phase))*5:Math.sin(phase)*.6;
    ellipse(ctx,n.x+w*.5,foot+3,20,5,'rgba(8,26,35,.22)');
    ctx.save();ctx.translate(n.x+w*.5,foot-bounce);ctx.scale(h/100,h/100);
    const step=celebrating?Math.sin(phase)*6:n.type==='ally'&&n.active?Math.sin(time*8+n.x*.01)*8:Math.sin(phase*.7)*2;
    this.limb(ctx,[-8,-29],[-8-step,-16],[-10-step,0],'#3f4b54',8);this.boot(ctx,-10-step,0,0,'#886749');
    this.limb(ctx,[8,-29],[8+step,-16],[9+step,0],'#46585b',8);this.boot(ctx,9+step,0,0,'#9b7851');
    if(woman)path(ctx,[[-12,-46],[12,-46],[25,-7],[-23,-8]],'#6c7a73','#263f47',2); 
    path(ctx,[[-14,-61],[13,-62],[20,-35],[10,-25],[-17,-28],[-21,-45]],color,'#213b46',2.5);
    line(ctx,[[-16,-39],[15,-39]],'#dec08a',2.4);line(ctx,[[-17,-34],[12,-33]],'#244750',1.2);diamond(ctx,-2,-48,6,null,'#e3c28c',1.5);
    const left=celebrating?[-27,-69+Math.sin(phase)*4]:[-22,-35],right=celebrating?[29,-70+Math.sin(phase+1)*5]:[24,-36];
    this.limb(ctx,[-15,-57],[-23,-49],left,color,7);this.limb(ctx,[15,-56],[23,-48],right,color,7);
    ellipse(ctx,...left,4,4,'#cea47e','#243c44',1.2);ellipse(ctx,...right,4,4,'#cea47e','#243c44',1.2);
    ellipse(ctx,0,-75,11,14,'#d0a47b','#223a45',2);path(ctx,[[-11,-74],[-14,-84],[-7,-90],[7,-89],[14,-80],[9,-79],[3,-84],[-6,-77]],'#263644','#1d313e',2);
    if(woman){path(ctx,[[-11,-79],[-15,-59],[-12,-49],[-9,-54],[-8,-78]],'#253641','#1d313e',1.5);}
    else if(variant%2===0){path(ctx,[[-14,-85],[-10,-95],[9,-95],[15,-84]],'#85745c','#253b44',1.6);line(ctx,[[-21,-83],[22,-83]],'#bcaa7b',4);}
    ellipse(ctx,5,-75,1.5,2,'#273740');line(ctx,[[3,-68],[7,-68]],'#79564b',1.2);
    if(celebrating&&variant%4===0){line(ctx,[[left[0],left[1]], [left[0]-3,left[1]-22]],'#936842',4);ellipse(ctx,left[0]-4,left[1]-24,6,8,'#dfb27a','#344148',1.5);}
    ctx.restore();
  }
  drawVehicle(ctx,v,p,time) {
    const w=v.w||156,h=v.h||90,foot=p?p.y+p.h:v.y+h,cx=v.x+w*.5,facing=v.facing<0?-1:1;
    ellipse(ctx,cx,foot+4,w*.55,9,'rgba(6,23,32,.34)');
    ctx.save();ctx.translate(cx,foot);ctx.scale(facing*w/156,h/90);
    const moving=Math.abs(p?.vx||0)>12,wheel=time*(moving?13:.2);
    for(const x of [-48,49]){
      ellipse(ctx,x,-16,18,18,'#1e333e','#718b88',3);ellipse(ctx,x,-16,10,10,'#7a877d','#233c46',2);
      for(let i=0;i<4;i++){const angle=wheel+i*Math.PI*.5;line(ctx,[[x,-16],[x+Math.cos(angle)*8,-16+Math.sin(angle)*8]],'#c1b793',2);}
    }
    path(ctx,[[-77,-28],[-75,-54],[-34,-57],[-21,-48],[54,-49],[75,-39],[76,-21],[-73,-20]],'#4d8786','#1b3441',3);
    path(ctx,[[-75,-55],[-35,-58],[-35,-39],[-75,-38]],'#a88759','#253b43',2);line(ctx,[[-70,-48],[-40,-48]],'#dac190',2);
    path(ctx,[[-8,-48],[-10,-75],[28,-77],[42,-47]],'#496d76','#223b48',2.5);
    path(ctx,[[-5,-50],[-7,-69],[25,-70],[34,-49]],'#94b7ad','#d0c49e',1.5);
    path(ctx,[[39,-45],[57,-44],[69,-37],[42,-35]],'#87a7a0','#283f46',1.4);
    line(ctx,[[-68,-24],[70,-24]],'#c4b787',2.3);ellipse(ctx,70,-37,4,6,'#f7d59b','#30434a',1.4);
    // Open cab keeps the chasqui and his red woven cape visible while driving.
    path(ctx,[[-7,-51],[9,-56],[19,-40],[-5,-37]],'#bb5b48','#203b46',1.8);
    ellipse(ctx,6,-67,8,10,'#d8af82','#253943',1.7);path(ctx,[[-2,-67],[-6,-75],[1,-80],[10,-78],[16,-71],[11,-70],[5,-74]],'#24364a','#1b303d',1.7);
    line(ctx,[[14,-52],[24,-49]],'#d4b084',4);ellipse(ctx,26,-48,7,7,null,'#263e48',2);
    const flutter=Math.sin(time*5)*4+(moving?7:0);
    path(ctx,[[-6,-60],[-26,-60],[-39-flutter,-50],[-26,-39],[-8,-47]],'#a84f44','#213a44',1.7);diamond(ctx,-22-flutter*.4,-50,5,null,'#e0be82',1.4);
    if((p?.heavyTimer||0)>0){line(ctx,[[16,-54],[42,-79]],'#233947',5);line(ctx,[[16,-54],[42,-79]],'#c4aa79',2.5);ctx.beginPath();ctx.arc(10,-58,51,-1,.4);ctx.strokeStyle='#edd8a3';ctx.lineWidth=3;ctx.stroke();}
    if(p?.guarding){line(ctx,[[-4,-63],[45,-51]],'#233c47',5);line(ctx,[[-4,-63],[45,-51]],'#ccb486',2.5);}
    if((p?.magicTimer||0)>0){glow(ctx,4,-48,85,'255,219,133',.35);ctx.beginPath();ctx.ellipse(0,-38,77,42,0,0,TAU);ctx.strokeStyle='#f3dca1';ctx.lineWidth=2.3;ctx.stroke();}
    ctx.restore();
  }
  drawRadio(ctx,o,time) {
    const active=o.active===true,bob=Math.sin(time*2.5+o.x*.01)*2;
    ctx.save();ctx.translate(o.x,o.y+55);
    ellipse(ctx,0,4,41,7,'rgba(7,26,33,.32)');
    path(ctx,[[-38,0],[-34,-16],[33,-17],[39,0]],'#6c7c71','#1c3640',2.5);
    path(ctx,[[-29,-18],[-29,-66],[26,-69],[33,-60],[32,-18]],'#8d7557','#213945',2.5);
    path(ctx,[[-26,-63],[25,-64],[26,-25],[-27,-26]],'#3d6267','#b4a078',1.6);
    for(let i=0;i<5;i++)line(ctx,[[-22,-54+i*5],[-2,-54+i*5]],'#233d48',2.2);
    ellipse(ctx,14,-46,8,8,active?'#e3bc78':'#798e84','#233d46',2);
    line(ctx,[[14,-46],[active?18:10,-51]],'#f6dfaa',1.3);
    ellipse(ctx,-9,-31,3,3,active?'#ffe2a5':'#859c8b');ellipse(ctx,10,-31,2.5,2.5,'#263f47');
    line(ctx,[[-25,-63],[-30,-131]],'#1b3543',5);line(ctx,[[-25,-63],[-30,-131]],'#adc1ad',2);
    line(ctx,[[-43,-118],[-18,-121]],'#91afa5',2);line(ctx,[[-41,-105],[-19,-108]],'#91afa5',2);
    diamond(ctx,-30,-135+bob,6,active?'#ffe5a6':'#90beb0','#d3d7b1',1.5);
    if(active){
      glow(ctx,-30,-130,74,'252,207,116',.22);
      ctx.save();ctx.strokeStyle='#eed39a';ctx.lineWidth=1.6;
      for(let i=0;i<2;i++){ctx.globalAlpha=.34+.1*Math.sin(time*3-i);ctx.beginPath();ctx.arc(-30,-132,18+i*13,-.72,.72);ctx.stroke();ctx.beginPath();ctx.arc(-30,-132,18+i*13,Math.PI-.72,Math.PI+.72);ctx.stroke();}
      ctx.restore();
    }
    if(o.number!=null){ctx.font='700 16px Georgia';ctx.textAlign='center';ctx.fillStyle='#ecdbb1';ctx.fillText(String(o.number),0,-78);}
    ctx.restore();
  }
  drawObject(ctx,o,chapter,time,puzzle,campaign,camera=0) {
    const type=o.type||'fragment',active=o.active===true,bob=Math.sin(time*2.5+(o.x||0)*.013)*5;
    if(active&&['fragment','memory','scroll'].includes(type))return;
    if(type==='bossgate'){
      const scrolls=typeof campaign?.scrolls==='number'?campaign.scrolls:campaign?.scrolls?.length||0;
      this.drawPuzzle(ctx,{x:o.x-580,y:o.y,gateX:o.gateX??o.x+95,gateY:o.gateY??300,w:o.gateW||100,h:o.gateH||400,type:'campaign',open:active||['boss','cleared','celebration'].includes(campaign?.phase),progress:scrolls,total:3},time,palettes[clamp(chapter+1,0,palettes.length-1)],camera,[]);return;
    }
    if(type==='antenna'){this.drawRadio(ctx,{...o,variant:'radio'},time);return;}
    if(type==='rescue'){
      ctx.save();ctx.translate(o.x,o.y+55);
      line(ctx,[[-30,0],[-30,-99],[30,-99],[30,0]],'#51656b',5);line(ctx,[[-34,-99],[34,-99]],'#abb18e',2.3);line(ctx,[[-33,0],[34,0]],'#9a9471',4);
      if(active)line(ctx,[[-29,0],[-41,-8],[-43,-95],[-29,-99]],'#a4b2a6',2.3);
      ctx.restore();
      this.drawNpc(ctx,{id:o.id,x:o.x-25,y:o.y+55-90,w:50,h:90,variant:o.number||1},time,chapter,active);
      if(!active){ctx.save();ctx.translate(o.x,o.y+55);for(const xx of [-17,0,17])line(ctx,[[xx,-95],[xx,-3]],'rgba(144,162,151,.8)',2.5);ellipse(ctx,0,-44,4,5,'#c3aa78','#30464c',1.4);diamond(ctx,0,-125+bob,5,'#f8dfa0','#fff2ce',1.4);ctx.restore();}
      return;
    }
    if(type==='community'&&(o.variant==='radio'||puzzle?.type==='radio')){this.drawRadio(ctx,o,time);return;}
    const y=o.y,x=o.x;
    ctx.save();ctx.translate(x,y);
    if(type==='scroll'){
      glow(ctx,0,bob,76,'249,219,149',.22);ctx.translate(0,bob);ctx.rotate(Math.sin(time*.8+x*.01)*.06);
      path(ctx,[[-15,-24],[16,-24],[16,26],[-15,26]],'#ecd6a2','#714f3b',2.3);
      path(ctx,[[8,-22],[16,-24],[16,26],[8,24]],'#cfb98c');
      for(const yy of [-23,25]){ellipse(ctx,0,yy,19,5,'#a4774c','#253c45',1.8);ellipse(ctx,16,yy,3,4,'#dfbe80','#634f3e',1);}
      line(ctx,[[-8,-13],[8,-13]],'#9f7855',1.5);line(ctx,[[-8,-7],[9,-7]],'#9f7855',1.5);line(ctx,[[-8,10],[9,10]],'#9f7855',1.5);
      diamond(ctx,0,1,7,'#4b9188','#6b8065',1.3);
      if(o.number!=null){ctx.font='700 16px Georgia';ctx.fillStyle='#6b5743';ctx.textAlign='center';ctx.fillText(String(o.number),0,21);}
      diamond(ctx,0,-47,4,'#fae7b4','#fff5d0',1.3);
    }else if(type==='escort'){
      if(!active){
        const yy=-61+bob*.3;
        path(ctx,[[-19,yy-12],[16,yy-12],[21,yy-6],[17,yy+9],[1,yy+10],[-5,yy+17],[-9,yy+10],[-19,yy+8]],'#dfcd9c','#30454b',1.8);
        for(const xx of [-8,0,8])ellipse(ctx,xx,yy,2,2,'#4b6e6d');
      }
    }else if(type==='delivery'){
      ctx.translate(0,55);
      path(ctx,[[-37,0],[-29,-14],[28,-14],[36,0]],'#8b977e','#263e46',2.5);
      path(ctx,[[-20,-14],[-17,-47],[17,-47],[20,-14]],'#658580','#2b444b',2.3);
      path(ctx,[[-28,-47],[-25,-56],[26,-56],[29,-47]],'#b9b28a','#2c4449',2);
      if(active){path(ctx,[[-18,-53],[20,-53],[26,-27],[-22,-23]],'#a95b49','#2b4248',1.8);diamond(ctx,1,-38,7,null,'#e4c68b',1.5);glow(ctx,0,-38,51,'241,211,134',.16);}
      else {ellipse(ctx,0,-59,15,5,'#3f636c','#cbc49c',1.5);diamond(ctx,0,-85+bob,4,'#ecdba4','#fff0c4',1.5);}
    }else if(type==='destination'){
      ctx.translate(0,55);
      for(const xx of [-32,33])line(ctx,[[xx,1],[xx,-93]],'#52685e',6);
      path(ctx,[[-39,-99],[40,-98],[45,-83],[-44,-84]],'#a3946b','#31494a',2.3);
      path(ctx,[[-34,-83],[33,-83],[29,-66],[-30,-66]],'#518d88','#2c4248',1.5);
      for(let i=-1;i<=1;i++)diamond(ctx,i*20,-74,5,null,'#ecd198',1.1);
      line(ctx,[[-32,0],[33,0]],'#b3a883',3);
    }else if(type==='ammo'){
      ctx.translate(0,55);
      path(ctx,[[-19,-3],[-23,-21],[-15,-39],[16,-38],[23,-17],[18,-3]],'#8f7351','#253c45',2.3);
      path(ctx,[[-17,-33],[-12,-45],[10,-47],[20,-32],[12,-21],[-14,-20]],'#67707d','#263c48',2);
      path(ctx,[[-14,-31],[-5,-41],[1,-25]],'#394b59','#a3b8af',1.2);path(ctx,[[3,-41],[13,-40],[16,-28],[3,-29]],'#394959','#afc0b4',1.2);
      line(ctx,[[-17,-19],[16,-19]],'#d4b78a',3);diamond(ctx,0,-65+bob,4,'#ccead0','#fff0b9',1.3);
    }else if(type==='supply'){
      ctx.translate(0,55);
      ellipse(ctx,-4,-23,22,24,'#99764f','#253c43',2.5);path(ctx,[[-23,-43],[-20,-49],[13,-48],[18,-43]],'#c1a372','#263c43',1.7);
      line(ctx,[[-25,-33],[15,-34]],'#344951',4);line(ctx,[[-23,-12],[16,-12]],'#354a51',4);
      path(ctx,[[9,-2],[4,-21],[14,-35],[31,-31],[40,-11],[34,-1]],'#b39867','#31444a',2.1);line(ctx,[[13,-24],[28,-22]],'#d8c18a',2);
      line(ctx,[[-24,-42],[-25,-70]],'#6f5943',3);path(ctx,[[-25,-68],[-3,-63],[-7,-50],[-25,-54]],active?'#5a9d8b':'#bd6951','#31444b',1.5);
      if(!active)diamond(ctx,0,-85+bob,4,'#f3dca3','#fff0c3',1.3);
    }else if(type==='route'){
      ctx.translate(0,55);
      path(ctx,[[-20,0],[-15,-13],[15,-14],[23,0]],'#6d8378','#263f46',2.2);line(ctx,[[0,-4],[0,-78]],'#8d7656',6);
      path(ctx,[[1,-75],[31,-66],[25,-40],[1,-46]],active?'#4a9b8c':'#ba614b','#263e48',2);diamond(ctx,14,-58,7,null,'#e8c891',1.5);
      if(!active)diamond(ctx,0,-99+bob,4,'#f0dba0','#fff0bf',1.4);
    }else if(type==='anchor'||type==='anchors'){
      ctx.translate(0,55);path(ctx,[[-32,0],[-22,-14],[22,-13],[30,0]],'#687979','#2a414b',2.3);
      for(let i=0;i<4;i++)ellipse(ctx,-25+i*16,-15+i%2*5,9,5,null,active?'#7b9d91':'#a6aea2',3.2);
      line(ctx,[[0,-9],[0,-61]],'#2b414b',9);line(ctx,[[0,-9],[0,-61]],'#829490',5);
      ellipse(ctx,0,-66,11,12,null,'#aabbad',4);line(ctx,[[-21,-25],[21,-25]],'#adbaa8',5);
      path(ctx,[[-19,-17],[-29,-32],[-17,-35]],'#91a39a','#2a404a',1.5);path(ctx,[[20,-18],[29,-33],[17,-35]],'#91a39a','#2a404a',1.5);
      if(active)glow(ctx,0,-24,50,'141,222,195',.16);else diamond(ctx,0,-94+bob,4,'#eddba3','#fff0c4',1.4);
    }else if(type==='water'||type==='mud'){
      ctx.translate(0,55);path(ctx,[[-32,1],[-28,-13],[27,-13],[33,2]],'#77867b','#253e47',2.3);
      path(ctx,[[-22,-10],[-22,-45],[21,-45],[23,-9]],'#5c7879','#263f48',2.2);ellipse(ctx,0,-44,18,18,'#40636d','#b2b48e',3);
      for(let i=0;i<4;i++){const a=i*Math.PI*.5+(active?.75:0);line(ctx,[[Math.cos(a)*6,-44+Math.sin(a)*6],[Math.cos(a)*14,-44+Math.sin(a)*14]],'#c6be91',3);}
      ellipse(ctx,0,-44,5,5,'#bfaa78','#30494e',1.3);
      path(ctx,[[-15,-8],[15,-8],[26,1],[-26,1]],active?'#5cbbb5':'#3a5d66','#263e46',1.5);
      if(active){line(ctx,[[-21,-1],[-5,-2],[11,0],[24,-2]],'#bdddc0',2);glow(ctx,0,-9,38,'132,224,201',.15);}
      else diamond(ctx,0,-82+bob,4,'#e9dca9','#fff0c4',1.4);
    }else if(type==='lever'){
      ctx.translate(0,55);
      ellipse(ctx,0,3,29,6,'rgba(6,28,35,.35)');
      path(ctx,[[-27,0],[-22,-17],[20,-18],[29,0]],'#81917a','#233e46',2.5);
      path(ctx,[[-17,-17],[-17,-41],[18,-43],[22,-17]],'#697c75','#243c45',2);
      ellipse(ctx,0,-37,12,12,puzzle?.type==='irrigation'?'#4d9192':'#9d7b59','#253f48',2.5);
      const endX=active?26:-28,endY=active?-68:-73;
      line(ctx,[[0,-37],[endX,endY]],'#162f3d',10);line(ctx,[[0,-37],[endX,endY]],'#c4b08a',5);
      ellipse(ctx,endX,endY,10,10,active?'#d7b66d':'#c7694a','#233c46',2.5);ellipse(ctx,endX-2,endY-3,3,2,'#f5d6a0');
      ellipse(ctx,0,-37,4,4,'#dbc089','#2b444a',1.3);
      if(active)glow(ctx,endX,endY,45,'253,210,121',.17);
      else diamond(ctx,endX,endY-25+bob*.4,4,'#f5dfa0','#fff2ce',1.4);
      if(o.number!=null){ctx.font='700 16px Georgia';ctx.textAlign='center';ctx.fillStyle='#eee1bb';ctx.fillText(String(o.number),1,-4);}
    } else if(type==='symbol'){
      ctx.translate(0,55);
      ellipse(ctx,0,4,30,6,'rgba(8,27,35,.28)');
      path(ctx,[[-25,0],[-23,-79],[-12,-98],[13,-97],[26,-79],[24,0]],active?'#597d76':'#50676e','#1c3743',3);
      path(ctx,[[-13,-91],[13,-91],[19,-79],[15,-6],[-16,-7],[-19,-77]],'#345761','#a2ac8b',1.3);
      diamond(ctx,0,-49,17,active?'#d3bb7c':'#466f76',active?'#ffe3aa':'#9fc0ad',2.3);
      const n=Number(o.number)||1;
      if(n===2)line(ctx,[[-10,-48],[0,-57],[10,-48],[0,-40],[-10,-48]],active?'#fff0c2':'#a6c5b5',1.5);
      else if(n===3){line(ctx,[[-9,-50],[9,-50]],active?'#fff0c2':'#a6c5b5',1.5);line(ctx,[[0,-62],[0,-37]],active?'#fff0c2':'#a6c5b5',1.5);}
      else diamond(ctx,0,-49,7,null,active?'#fff0c2':'#a6c5b5',1.5);
      ellipse(ctx,0,-80,9.5,10,active?'#b29f6d':'#284651','#b9bf94',1.3);
      ctx.font='700 16px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f9e5b4';ctx.fillText(String(n),0,-79);
      if(active)glow(ctx,0,-49,74,'250,218,135',.23);
      else diamond(ctx,0,-123+bob*.5,4,'#e8ddb5','#fff0c3',1.3);
    } else if(type==='community'||type==='beacon'){
      ctx.translate(0,58);
      const lit=active;
      ellipse(ctx,0,4,27,6,'rgba(10,30,37,.35)');
      path(ctx,[[-24,0],[-20,-12],[18,-12],[26,0]],'#788681','#243d46',2);
      path(ctx,[[-15,-12],[-12,-51],[11,-54],[15,-12]],'#537176','#263d49',2);
      path(ctx,[[-24,-50],[0,-70],[25,-51]],'#809a85','#293f47',3);
      diamond(ctx,0,-38,9,lit?'#ffe5a0':'#547e84',lit?'#fff0c4':'#849b90',2);
      if(lit){glow(ctx,0,-39,90,'255,202,112',.32);diamond(ctx,0,-38,4,'#fff8df','#fff0c4',1);}
      else {glow(ctx,0,-39,55,'139,224,214',.13);diamond(ctx,0,-90+bob,5,'#cce3bc','#f3dfa4',1.7);}
      line(ctx,[[-20,-4],[18,-4]],'#c0b690',2);
    } else if(type==='lantern'){
      ctx.translate(0,58);
      line(ctx,[[0,5],[0,-80]],'#544943',4);line(ctx,[[0,-80],[20,-86]],'#534743',3);
      const yy=-64+bob*.2;
      path(ctx,[[10,yy-17],[26,yy-17],[29,yy+6],[7,yy+6]],active?'#e2b777':'#77908c','#2c4349',2);line(ctx,[[9,yy-16],[28,yy+5]],'#9d734c',1.4);ellipse(ctx,18,yy-6,4,7,active?'#ffe6ab':'#bfdfcf');glow(ctx,18,yy-6,active?78:42,active?'255,201,112':'141,228,206',active?.27:.10);
      if(puzzle?.type==='tutorial'&&!puzzle.open&&puzzle.progress<puzzle.total){
        ctx.beginPath();ctx.arc(18,yy-6,4,Math.PI,TAU);ctx.strokeStyle='#d8c094';ctx.lineWidth=2.2;ctx.stroke();path(ctx,[[12,yy-6],[24,yy-6],[24,yy+3],[12,yy+3]],'#544a43','#d8c094',1.5);
      }
      if(!active)diamond(ctx,18,yy-40+bob,4,'#e3dfb0','#f8e4af',1.5);
    } else if(type==='celebration'){
      ctx.translate(0,58);
      const shift=Math.sin(time*2+x)*5;
      line(ctx,[[-4,0],[-4,-73]],'#66564d',4);
      path(ctx,[[-4,-73],[36,-67+shift],[31,-38+shift],[-4,-46]],'#bb5747','#283e43',2);
      diamond(ctx,13,-57+shift*.5,7,'#dda360','#efc682',1.5);
      if(active){glow(ctx,10,-55,53,'255,214,117',.13);}
    } else if(type==='seed'){
      if(active){ctx.translate(0,58);this.crop(ctx,0,0,time,o.x);this.crop(ctx,-14,0,time,o.x+1);this.crop(ctx,17,0,time,o.x+2);glow(ctx,0,-23,50,'185,238,138',.14);}
      else {
        glow(ctx,0,bob,48,'185,238,138',.21);
        ellipse(ctx,0,bob,6,10,'#d2bb79','#f3dda3',2);
        path(ctx,[[0,-7+bob],[-9,-16+bob],[-7,-22+bob],[0,-16+bob]],'#99c476','#dae2ab',1.5);
        path(ctx,[[0,-8+bob],[8,-18+bob],[12,-20+bob],[8,-11+bob]],'#71b49b','#dae2ab',1.5);
      }
    } else if(type==='assist'){
      ctx.translate(0,55);
      path(ctx,[[-11,0],[-7,-68],[8,-68],[12,0]],'#677a75','#233f48',2);
      path(ctx,[[-6,-65],[22,-62],[19,-37],[-6,-40]],'#599c92','#223e46',2);diamond(ctx,7,-50,6,null,'#e1ce94',1.5);
      diamond(ctx,1,-78+bob*.4,8,'#a5dfc5','#f9e6a5',1.8);glow(ctx,1,-78,45,'160,231,202',.15);
    } else {
      glow(ctx,0,bob,65,'252,200,106',.20);
      const yy=bob;
      ctx.rotate(Math.sin(time+o.x)*.11);
      path(ctx,[[-12,yy-13],[11,yy-18],[15,yy+13],[-10,yy+18]],'#bb5148','#efd093',2);
      line(ctx,[[-10,yy-8],[12,yy-11]],'#c9986f',2);line(ctx,[[-10,yy+10],[13,yy+5]],'#deb579',2);
      diamond(ctx,1,yy,7,'#4f8f87','#f1d08e',1.7);
      for(let i=0;i<5;i++)line(ctx,[[-9+i*5,yy+16],[-10+i*5,yy+23+Math.sin(time*3+i)*2]],'#ceab7d',1);
      diamond(ctx,0,yy-39,4,'#ffe1a0','#fff0ba',1);
    }
    ctx.restore();
  }
  limb(ctx,start,knee,end,color,width=10) {
    line(ctx,[start,knee,end],'#19303b',width+4);line(ctx,[start,knee,end],color,width);
  }
  drawTarget(ctx,t,chapter=0) {
    const w=t.w||(t.type==='barricade'?100:64),h=t.h||(t.type==='barricade'?80:60);
    const intact=t.alive!==false&&t.health>0,health=clamp((t.health??t.maxHealth??2)/(t.maxHealth||2));
    ctx.save();ctx.translate(t.x,t.y);
    ellipse(ctx,w*.5,h+4,w*.59,7,'rgba(7,25,32,.33)');
    if(!intact){
      // Splintered timber stays low on the trail; the dropped textile is rendered independently.
      path(ctx,[[-7,h-1],[w*.44,h-12],[w*.51,h-4],[6,h+6]],'#997955','#253a42',2);
      path(ctx,[[w*.38,h-7],[w+7,h-13],[w+13,h-6],[w*.43,h+4]],'#775e47','#253a42',2);
      path(ctx,[[w*.23,h-8],[w*.31,h-23],[w*.48,h-5],[w*.35,h+2]],'#b18a59','#293c42',1.7);
      path(ctx,[[w*.72,h-4],[w*.75,h-17],[w*.91,h-1],[w*.83,h+5]],'#c09a67','#293c42',1.7);
      line(ctx,[[w*.1,h],[w*.36,h-6]],'#d1ad76',1.5);ellipse(ctx,w*.61,h-3,2.5,2.5,'#6f8b8d','#263d43',1);
      if(t.variant){ellipse(ctx,w*.6,h-7,9,9,null,'#8d9d97',3);path(ctx,[[w*.3,h-6],[w*.35,h-22],[w*.46,h-16],[w*.43,h+1]],'#607c83','#263f48',1.7);}
      ctx.restore();return;
    }
    if(t.variant==='jammer'){
      path(ctx,[[4,h],[4,19],[w-8,13],[w,24],[w-1,h]],'#6b756f','#233943',2.6);
      path(ctx,[[10,25],[w-10,22],[w-8,h-10],[10,h-10]],'#344f5b','#c2ad78',1.5);
      for(let i=0;i<4;i++)line(ctx,[[15,35+i*5],[w-15,33+i*5]],'#81928a',1.7);
      line(ctx,[[w*.45,19],[w*.43,-24]],'#263c47',5);line(ctx,[[w*.45,19],[w*.43,-24]],'#acb5a1',2.3);
      line(ctx,[[w*.15,-17],[w*.75,-21]],'#8c9e99',3);line(ctx,[[w*.21,-5],[w*.66,-8]],'#8c9e99',2.5);
      ellipse(ctx,w*.43,-26,5,6,'#df9764','#31464b',1.7);glow(ctx,w*.43,-25,30,'236,143,75',.13);
      for(const x of [9,w-11])ellipse(ctx,x,h-6,2.5,2.5,'#cab78e','#2b4148',1.3);
    }else if(t.variant==='chain'||t.variant==='anchor'){
      path(ctx,[[2,h],[9,h-20],[w-9,h-19],[w+1,h]],'#6c837d','#263e48',2.5);
      path(ctx,[[w*.41,h-15],[w*.43,13],[w*.56,4],[w*.66,17],[w*.64,h-15]],'#66818a','#223b48',3);
      ellipse(ctx,w*.55,17,11,13,null,'#b6beb0',4);
      for(let i=0;i<5;i++)ellipse(ctx,w*.13+i*w*.18,h-30+(i%2)*7,w*.095,6,null,'#97a79f',3.5);
      path(ctx,[[w*.15,h-29],[w*.09,h-44],[w*.23,h-44]],'#91a39b','#263e47',1.5);
      path(ctx,[[w*.87,h-29],[w*.93,h-44],[w*.79,h-44]],'#91a39b','#263e47',1.5);
      if(t.bossAnchor){line(ctx,[[w*.55,6],[w+80,-60]],'#a4b1a4',3.5);ellipse(ctx,w*.55,17,4,5,'#e4bd82');}
    }else if(t.variant==='machine'){
      path(ctx,[[1,h],[5,h-17],[w-5,h-17],[w,h]],'#566c74','#213b46',2.5);
      for(const x of [12,w-12])ellipse(ctx,x,h-4,8,8,'#2b4350','#9fa78b',2);
      if(chapter===6){
        path(ctx,[[16,h-17],[w*.42,12],[w*.75,17],[w-14,h-17]],'#7d806e','#263e47',2.5);
        line(ctx,[[w*.69,25],[5,5]],'#253b46',18);line(ctx,[[w*.69,25],[5,5]],'#97a494',11);ellipse(ctx,5,5,6,8,'#213d48','#c7ba91',2);
        ellipse(ctx,w*.61,30,9,9,'#b29a6c','#293f49',2);
      }else{
        path(ctx,[[10,h-17],[8,11],[w-11,10],[w-6,h-17]],'#82694f','#263d46',2.5);
        line(ctx,[[12,16],[w-14,16]],'#c4ad7b',3);line(ctx,[[14,18],[14,h-22]],'#ad986c',2);
        ellipse(ctx,w*.56,h*.52,15,15,'#3c5b65','#b7aa7c',3);ellipse(ctx,w*.56,h*.52,6,6,'#b19d70','#213d47',1.5);
        for(let i=0;i<6;i++){const a=i*Math.PI/3;line(ctx,[[w*.56+Math.cos(a)*9,h*.52+Math.sin(a)*9],[w*.56+Math.cos(a)*14,h*.52+Math.sin(a)*14]],'#cab581',2.2);}
        line(ctx,[[w-9,33],[w+5,30],[w+5,8]],'#516975',6);line(ctx,[[w-9,33],[w+5,30],[w+5,8]],'#b0b69a',2.3);
      }
    }else if(t.type==='barricade'){
      for(const x of [13,w-17]){
        path(ctx,[[x-7,h+1],[x-8,12],[x-3,2],[x+1,9],[x+6,0],[x+9,12],[x+9,h]],'#8b694d','#203942',2.5);
        line(ctx,[[x+2,14],[x+2,h-5]],'#c19b67',2);
      }
      for(let i=0;i<3;i++){
        const yy=15+i*22,tilt=i===1?-5:4;
        path(ctx,[[-2,yy],[w+3,yy+tilt],[w+1,yy+tilt+15],[-4,yy+14]],i===1?'#c09461':'#a87c52','#263b41',2.5);
        line(ctx,[[4,yy+4],[w-3,yy+tilt+4]],'#d3ad79',1.7);
        line(ctx,[[10,yy+10],[w*.45,yy+tilt*.5+10]],'#7c5c44',1.2);
        for(const xx of [13,w-16])ellipse(ctx,xx,yy+7+tilt*(xx/w),3,3,'#879595','#233b43',1.3);
      }
      // Unpainted, nailed wood differentiates this breakable obstacle from glowing puzzle stones.
      line(ctx,[[w*.46,18],[w*.51,25],[w*.45,31]],'#685040',1.7);
    } else {
      const wood=ctx.createLinearGradient(0,0,w,h);wood.addColorStop(0,'#c69967');wood.addColorStop(1,'#8a664d');
      path(ctx,[[1,5],[w-8,0],[w,8],[w-1,h],[0,h-2]],wood,'#203841',3);
      path(ctx,[[2,6],[w-8,0],[w-1,8],[7,13]],'#ddba83','#354443',1.8);
      path(ctx,[[w-7,13],[w,8],[w-1,h],[w-8,h-4]],'#735b47','#263b43',1.5);
      for(let i=1;i<4;i++){const yy=12+i*(h-15)/4;line(ctx,[[4,yy],[w-9,yy-1]],'#785942',1.8);line(ctx,[[7,yy+3],[w-12,yy+2]],'#ceaa74',1.1);}
      path(ctx,[[5,12],[13,11],[w-11,h-5],[w-19,h-5]],'#b38b5c','#614e3e',1.6);
      path(ctx,[[w-16,11],[w-8,11],[13,h-6],[5,h-6]],'#c7a16a','#6b5340',1.6);
      for(const x of [4,w-15])for(const yy of [12,h-12]){
        path(ctx,[[x,yy-5],[x+10,yy-5],[x+10,yy+5],[x,yy+5]],'#586d73','#223a43',1.3);ellipse(ctx,x+5,yy,1.7,1.7,'#bac0ab');
      }
      line(ctx,[[w*.5,21],[w*.47,28],[w*.53,33]],'#856146',1.4);
    }
    if(health<1){
      const crack=t.type==='barricade'?[[w*.52,13],[w*.4,30],[w*.56,39],[w*.44,55],[w*.52,h-3]]:[[w*.46,7],[w*.58,19],[w*.43,31],[w*.62,42],[w*.49,h-2]];
      line(ctx,crack,'#2a3032',3.4);line(ctx,crack.map(([x,y])=>[x+2,y]),'#e6c796',1);
      const bx=(w-42)*.5;path(ctx,[[bx,-14],[bx+42,-14],[bx+42,-9],[bx,-9]],'#233a44','#a98c67',1);
      ctx.fillStyle='#e2b67a';ctx.fillRect(bx+1,-13,40*health,3);
    }
    ctx.restore();
  }
  boot(ctx,x,y,angle=0,color='#735442') {
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    path(ctx,[[-5,-12],[7,-12],[7,-2],[14,1],[14,6],[-6,6]],color,'#162c36',2.5);
    line(ctx,[[-4,-8],[6,-8]],'#d2b082',2);line(ctx,[[-4,4],[12,4]],'#312d2a',2);ctx.restore();
  }
  drawPlayer(ctx,p,time,chapter) {
    const h=p.h||100,w=p.w||58,foot=p.y+h,cx=p.x+w*.5;
    const running=Math.abs(p.vx||0)>18&&p.grounded!==false;
    const airborne=p.grounded===false;
    const step=running?Math.sin(time*11):Math.sin(time*2)*.05;
    const bounce=running?Math.abs(Math.sin(time*11))*2:Math.sin(time*2.5)*.7;
    const heavy=(p.heavyTimer||0)>0||((p.attackTimer||0)>0&&p.attackKind==='heavy');
    const attack=(p.attackTimer||0)>0||heavy,magic=(p.magicTimer||0)>0,dodge=(p.dodgeTimer||0)>0;
    const guarding=p.guarding===true||(p.guardTimer||0)>0;
    const throwing=(p.throwTimer||0)>0||p.animation==='throw';
    const face=p.facing<0?-1:1,scale=h/112;
    ellipse(ctx,cx,foot+4,w*.47*(airborne?.7:1),7,'rgba(6,23,32,.34)');
    if(dodge){
      for(let i=4;i>=1;i--){ctx.save();ctx.globalAlpha=.045*(5-i);ctx.translate(cx-face*i*22,foot);ctx.scale(face*scale,scale);path(ctx,[[-18,-78],[7,-102],[20,-71],[19,-44],[-10,-19],[-33,-25],[-43,-50]],'#63ceba');ctx.restore();}
      glow(ctx,cx-face*30,foot-42,90,'109,239,210',.24);
    }
    if(magic){glow(ctx,cx,foot-58,140,'255,208,113',.32);ctx.save();ctx.strokeStyle='#f4d99a';ctx.lineWidth=2;ctx.globalAlpha=.7;
      for(let i=0;i<2;i++){ctx.beginPath();ctx.ellipse(cx,foot-56,56+i*17,53+i*13,Math.sin(time*5)*.2,0,TAU);ctx.stroke();}
      ctx.beginPath();ctx.ellipse(cx,foot-2,85,18,0,0,TAU);ctx.strokeStyle='#a4e6c9';ctx.lineWidth=2.5;ctx.stroke();ctx.restore();}
    ctx.save();ctx.translate(cx,foot-bounce);ctx.scale(face*scale,scale);
    if((p.invulnerable||0)>0&&Math.sin(time*38)>.5)ctx.globalAlpha=.62;
    if(dodge){ctx.translate(0,7);ctx.rotate(.22);}
    const sway=Math.sin(time*4)*3+Math.min(18,Math.abs(p.vx||0)*.025)+(airborne?9:0);
    const capePoints=[[-14,-79],[-35,-76],[-43-sway,-40],[-50-sway,-30],[-34,-22],[-10,-35],[5,-48],[0,-74]];
    path(ctx,capePoints,'#a94840','#192f3a',3);
    path(ctx,[[-27,-73],[-37-sway,-35],[-27,-30],[-12,-39],[-4,-66]],'#c8644d');
    path(ctx,[[-37-sway,-37],[-35-sway,-31],[-21,-32],[-12,-38]],'#78403c');
    // A small embroidered stepped diamond remains visible during movement.
    ctx.save();ctx.translate(-26-sway*.4,-48);ctx.rotate(-.28);diamond(ctx,0,0,9,null,'#e3b977',2);diamond(ctx,0,0,4,'#dab378',null);line(ctx,[[-10,10],[7,10]],'#e0b879',1.5);ctx.restore();
    for(let i=0;i<5;i++)line(ctx,[[-47-sway+i*5,-30],[-47-sway+i*5,-25+Math.sin(time*5+i)*2]],'#c49467',1.1);
    let bk=[-9,-28],be=[-13,0],fk=[10,-28],fe=[10,0];
    if(running){bk=[-8-step*9,-24];be=[-10-step*17,-3-Math.max(0,step)*9];fk=[8+step*9,-24];fe=[10+step*17,-3-Math.max(0,-step)*9];}
    if(guarding&&!airborne){bk=[-12,-26];be=[-17,0];fk=[13,-25];fe=[19,0];}
    if(airborne){bk=[-16,-22];be=[-24,-15];fk=[14,-32];fe=[22,-22];}
    this.limb(ctx,[-9,-47],bk,be,'#334851',11);this.boot(ctx,be[0],be[1],running?step*.2:airborne?.2:0);
    this.limb(ctx,[8,-47],fk,fe,'#3d5359',12);this.boot(ctx,fe[0],fe[1],running?-step*.15:airborne?-.22:0,'#956b4c');
    // Teal woven tunic, warm poncho shoulders and sash.
    path(ctx,[[-14,-76],[10,-79],[20,-58],[15,-41],[-15,-42],[-21,-59]],'#4b8b87','#152f3b',3);
    path(ctx,[[0,-73],[10,-73],[14,-48],[5,-43],[-2,-51]],'#60a394');
    path(ctx,[[-21,-73],[-7,-82],[12,-77],[22,-64],[9,-61],[-1,-69],[-13,-61],[-23,-64]],'#be6049','#1d343f',2.5);
    line(ctx,[[-17,-69],[-5,-75],[12,-68]],'#e8b479',2.3);
    path(ctx,[[-16,-49],[16,-48],[15,-42],[-15,-43]],'#9a7048','#253642',1.5);
    path(ctx,[[-6,-48],[0,-48],[0,-43],[-6,-43]],'#dfbd79','#383b37',1);
    // Back hand moves with stride; the crossbody satchel follows the body.
    if(guarding){this.limb(ctx,[-17,-66],[-3,-60],[7,-69],'#507d7b',8);ellipse(ctx,7,-69,4.5,5,'#d1a375','#213842',1.7);}
    else {this.limb(ctx,[-17,-66],[-22,-54+step*4],[-19-step*5,-44+step*2],'#507d7b',8);ellipse(ctx,-19-step*5,-44+step*2,4.5,5,'#d1a375','#213842',1.7);}
    line(ctx,[[9,-75],[-14,-44]],'#263541',5);line(ctx,[[9,-75],[-14,-44]],'#b78a5d',2.4);
    path(ctx,[[-22,-45],[-10,-43],[-7,-26],[-25,-27],[-29,-38]],'#8c684a','#1c333e',2.5);
    path(ctx,[[-27,-40],[-10,-40],[-14,-33],[-24,-33]],'#bc9261','#39403c',1.3);ellipse(ctx,-19,-34,1.5,1.5,'#e8c585');
    // Neck, face and hand-drawn hair silhouette.
    path(ctx,[[-6,-87],[7,-86],[8,-78],[-3,-77]],'#bd8c65','#243440',1.5);
    ellipse(ctx,0,-95,12.7,14.5,'#d8b185','#1d343e',2.4);
    ellipse(ctx,-11,-94,3.5,5,'#c89870','#233741',1.4);
    path(ctx,[[-12,-90],[-18,-98],[-12,-104],[-17,-111],[-6,-109],[-3,-118],[3,-112],[11,-117],[10,-110],[19,-110],[14,-104],[15,-100],[9,-100],[6,-104],[3,-96],[-3,-98],[-9,-93]],'#233548','#152b39',2.6);
    path(ctx,[[-8,-108],[-1,-114],[5,-110],[9,-113],[5,-106],[-5,-102]],'#3a4559');
    const blink=Math.sin(time*.6)>.993;
    ellipse(ctx,8,-94,blink?2:2.3,blink?.5:3,'#f2dfb2');ellipse(ctx,8.6,-94,1.15,blink?.5:2.1,'#24323a');
    line(ctx,[[5,-99],[11,-100]],'#423b3a',1.3);path(ctx,[[11,-92],[15,-89],[11,-88]],'#b98d66');line(ctx,[[7,-85],[11,-86]],'#7c5848',1.1);
    path(ctx,[[-11,-82],[3,-83],[10,-77],[4,-72],[-12,-75]],'#397b80','#203b45',1.5);line(ctx,[[-10,-79],[3,-78]],'#69a799',1.7);
    // Crystal staff and forward hand are a single articulated action.
    const armLift=magic?-10:heavy?-14:throwing?-5:attack?-4:guarding?-4:0;
    const handX=guarding?23:throwing?37:heavy?25:29;
    this.limb(ctx,[14,-66],[24,-59+armLift],[handX,-60+armLift],'#558f87',8);
    ctx.save();ctx.translate(handX,-60+armLift);
    const swingProgress=heavy?1-clamp((p.heavyTimer||p.attackTimer||0)/.35):1-clamp((p.attackTimer||0)/.19);
    const strike=guarding?-1.17:heavy?.30-Math.sin(swingProgress*Math.PI)*2.10:attack?-.10-Math.sin(swingProgress*Math.PI)*1.34:throwing?-.45:magic?-.2:running?.05*Math.sin(time*11):-.07;
    ctx.rotate(strike);
    line(ctx,[[0,56],[0,-25]],'#122c39',6);line(ctx,[[0,56],[0,-25]],'#8e7352',3.5);
    line(ctx,[[-4,-20],[4,-20]],'#d4bd81',3);
    const light=chapter>=2?'#fce2a2':'#a8ded3';
    glow(ctx,0,-34,magic?85:37,chapter>=2?'255,217,130':'158,237,217',magic?.45:.19);
    diamond(ctx,0,-34,10,light,'#fff1c8',1.8);diamond(ctx,0,-34,4,'#fff7db',null);
    path(ctx,[[-5,-24],[0,-20],[5,-24]],'#b99558','#233a42',1.5);ctx.restore();
    ellipse(ctx,handX,-60+armLift,4.5,5,'#dfb888','#203642',1.7);
    if(attack){ctx.save();ctx.globalAlpha=heavy?.56:.38;ctx.beginPath();ctx.arc(13,heavy?-74:-65,heavy?72:52,heavy?-1.7:-1.12,heavy?1.2:.85);ctx.strokeStyle=heavy?'#e1d5ae':'#eee0b8';ctx.lineWidth=heavy?5:3;ctx.stroke();ctx.restore();}
    if(guarding){line(ctx,[[39,-91],[47,-89]],'#e5d9b0',1.5);line(ctx,[[43,-80],[50,-80]],'#e5d9b0',1.5);}
    ctx.restore();
  }
  drawEnemy(ctx,e,time) {
    const h=e.h||100,w=e.w||55,cx=e.x+w*.5,base=e.y+h,facing=e.facing<0?-1:1,scale=h/111;
    const motion=Math.abs(e.vx||0)>8?Math.sin(time*7+e.x*.016):Math.sin(time*2+e.x)*.03;
    const shield=e.type==='shield',attack=(e.attackTimer||0)>0;
    ellipse(ctx,cx,base+3,w*.46,7,'rgba(5,20,28,.35)');
    ctx.save();ctx.translate(cx,base-Math.abs(motion)*1.1);ctx.scale(facing*scale,scale);
    path(ctx,[[-13,-80],[-34,-73],[-36-motion*4,-30],[-17,-26],[-5,-48]],'#713d44','#192d37',3);
    path(ctx,[[-20,-68],[-29,-35],[-23,-34],[-12,-50]],'#974647');
    this.limb(ctx,[-8,-43],[-10-motion*7,-22],[-11-motion*12,0],'#4c5a63',11);this.boot(ctx,-11-motion*12,-1,motion*.12,'#45454a');
    this.limb(ctx,[9,-43],[10+motion*7,-22],[12+motion*12,0],'#68727a',12);this.boot(ctx,12+motion*12,-1,-motion*.1,'#626065');
    path(ctx,[[-17,-77],[12,-80],[23,-60],[15,-41],[-17,-42],[-23,-63]],'#7a878b','#1c303b',3);
    path(ctx,[[0,-76],[11,-75],[17,-62],[10,-44],[-1,-44]],'#a4a6a2');
    path(ctx,[[-5,-76],[4,-76],[4,-43],[-5,-43]],'#7c4248','#465159',1.3);
    line(ctx,[[-16,-47],[15,-47]],'#514748',5);path(ctx,[[-4,-49],[3,-49],[3,-45],[-4,-45]],'#b6a479','#243943',1.2);
    path(ctx,[[-24,-75],[-14,-83],[-8,-78],[-15,-65],[-27,-68]],'#889598','#243a45',2);
    path(ctx,[[10,-79],[18,-81],[29,-68],[22,-64],[14,-68]],'#a5aaa3','#233744',2);
    this.limb(ctx,[-19,-66],[-22,-51],[-17,-44],'#697b81',9);ellipse(ctx,-17,-44,4,4.5,'#b89a7b','#263843',1.5);
    ellipse(ctx,0,-92,12,13,'#ba9a7c','#253744',2);
    path(ctx,[[-15,-93],[-13,-106],[-5,-112],[7,-111],[15,-101],[15,-95]],'#9aa7a7','#1f3541',2.5);
    path(ctx,[[1,-113],[3,-119],[7,-118],[8,-108],[15,-99],[1,-100]],'#677985','#263c47',2);
    line(ctx,[[-18,-94],[18,-94]],'#b7bbb0',4);line(ctx,[[-17,-96],[18,-96]],'#253b47',1.5);
    path(ctx,[[-11,-92],[-5,-86],[2,-87],[7,-91],[12,-91],[11,-77],[3,-76],[-8,-79]],'#55575b','#243540',1.4);
    line(ctx,[[5,-90],[10,-90]],'#e0cbaa',1.8);
    if(shield){
      this.limb(ctx,[18,-67],[26,-56],[28,-44],'#77888a',9);
      path(ctx,[[17,-65],[40,-62],[42,-39],[31,-18],[17,-35]],'#586d75','#1b3440',3);
      path(ctx,[[29,-62],[38,-60],[39,-39],[30,-23],[29,-46]],'#79868b');
      line(ctx,[[22,-57],[36,-55]],'#b6b093',2);diamond(ctx,29,-43,8,'#8d524a','#bdad83',1.8);
    } else {
      const ang=attack?-.92:-.13;
      this.limb(ctx,[18,-67],[27,-53],[32,-57],'#7c8c8d',9);
      ctx.save();ctx.translate(32,-57);ctx.rotate(ang);
      line(ctx,[[0,59],[0,-47]],'#233b46',6);line(ctx,[[0,59],[0,-47]],'#997b58',3);
      path(ctx,[[-5,-47],[0,-67],[6,-47],[1,-40]],'#b6c0b3','#253a45',1.8);
      path(ctx,[[0,-63],[0,-43],[5,-48]],'#78959d');ctx.restore();ellipse(ctx,32,-57,4,4,'#c1a17f','#273a43',1.6);
    }
    if(attack){ctx.globalAlpha=.25;ctx.beginPath();ctx.arc(23,-58,56,-1,.5);ctx.strokeStyle='#d88c68';ctx.lineWidth=4;ctx.stroke();ctx.globalAlpha=1;}
    ctx.restore();
    if(e.health<e.maxHealth){const length=38,f=clamp(e.health/e.maxHealth);ctx.fillStyle='rgba(15,33,42,.75)';ctx.fillRect(cx-length*.5,e.y-14,length,4);ctx.fillStyle='#d2a56c';ctx.fillRect(cx-length*.5,e.y-14,length*f,4);}
  }
  drawParticle(ctx,p) {
    const life=clamp((p.life||0)/(p.maxLife||1));if(life<=0)return;
    ctx.save();ctx.globalAlpha=life;
    const size=(p.size||3)*(1+(1-life)*.5);
    if(p.type==='dust'||p.type==='smoke'||p.type==='shadow')ellipse(ctx,p.x,p.y,size*1.7,size,p.type==='shadow'?'#1b2c3a':'#b5ac88');
    else if(p.type==='leaf')path(ctx,[[p.x-size,p.y],[p.x,p.y-size],[p.x+size,p.y],[p.x,p.y+size*.6]],'#b9bb6e');
    else if(p.type==='hit'){line(ctx,[[p.x-size*2,p.y],[p.x+size*2,p.y]],'#ffe3a9',2);line(ctx,[[p.x,p.y-size*2],[p.x,p.y+size*2]],'#ffe3a9',2);}
    else if(p.type==='confetti')path(ctx,[[p.x-3,p.y-3],[p.x+5,p.y-1],[p.x+3,p.y+5],[p.x-4,p.y+2]],rand(p.x)> .5?'#d36f4f':'#efc267');
    else if(p.type==='thread'){line(ctx,[[p.x-8,p.y+2],[p.x+9,p.y-2]],'#89e5d0',2);}
    else {const col=p.type==='magic'||p.type==='light'?'#aff4d6':'#fbe0a0';ellipse(ctx,p.x,p.y,size,size,col);}
    ctx.restore();
  }
  drawFrontLeaves(ctx,time,camera,chapter) {
    if(chapter===3||chapter===4||chapter===6||chapter===8||chapter===9)return;
    ctx.save();ctx.globalAlpha=.85;
    for(const side of [0,1]){
      const origin=side===0?-16:W+14,sign=side===0?1:-1;
      const sway=Math.sin(time*.7+side)*5;
      line(ctx,[[origin,H+15],[origin+sign*(64+sway),H-108]],'#122e38',5);
      for(let i=0;i<4;i++){
        const y=H-15-i*22,x=origin+sign*(i*12),dx=sign*(48-i*6+sway);
        path(ctx,[[x,y],[x+dx*.43,y-26],[x+dx,y-32],[x+dx*.64,y-8]],'#163b43','#13333d',1.5);
        path(ctx,[[x,y+3],[x-sign*22,y-21],[x-sign*34,y-26],[x-sign*29,y-3]],'#1d4548');
      }
    }
    ctx.restore();
  }
}
