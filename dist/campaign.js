/* Campaign data is independent of music playback. Each level advances after its boss. */
export const CAMPAIGN_VERSION = 3;
export const REQUIRED_SCROLLS = 3;
const mission=(id,type,title,objective,total,extra={})=>({id,type,title,objective,total,...extra});
export const CAMPAIGN = [
 {chapter:0,title:'Aurora',theme:'coast',length:18000,duration:129.328,missions:[],boss:null,objective:'Recoge 3 tejidos y enciende el faro con E. Aprende a moverte por la costa.'},
 {chapter:1,title:'Ambición',theme:'extraction',length:45000,duration:270.248,missions:[
  mission('checkpoint','patrol','Despejar el control','Derrota a los tres soldados del control.',3),
  mission('extraction','sabotage','Detener la extracción','Rompe las tres máquinas de extracción.',3),
  mission('custodians','rescue','Liberar a los custodios','Derrota a sus guardias y abre las dos jaulas con E.',2)
 ],boss:{type:'goldcaptain',name:'Capitán del Oro',health:66,w:460,h:610,patterns:[['slam','charge'],['charge','sweep','fire'],['sweep','reinforcements','charge']]}},
 {chapter:2,title:'Sacrilegio',theme:'sanctuary',length:22000,duration:162.888,missions:[
  mission('banner','recover','Restituir el estandarte','Recoge dos piezas y entrégalas en el pedestal con E.',3),
  mission('symbols','sequence','Reabrir el santuario','Activa los símbolos en el orden indicado.',3,{sequence:[2,1,3]}),
  mission('keepers','rescue','Proteger a los custodios','Vence a los guardias y libera dos custodios con E.',2)
 ],boss:{type:'profanerfire',name:'Profanador de la Llama',health:70,w:440,h:640,patterns:[['fire','slam'],['fire','sweep','charge'],['volley','fire','sweep']]}},
 {chapter:3,title:'Abismo',theme:'ravine',length:47000,duration:277.920,missions:[
  mission('cornice','route','Asegurar la cornisa','Marca con E los tres pasos de la cornisa.',3),
  mission('chains','sabotage','Romper las cadenas','Destruye las tres anclas que sujetan los restos.',3),
  mission('fragments','recover','Reunir los restos','Recoge dos piezas y entrégalas en el refugio con E.',3)
 ],boss:{type:'abysscranechain',name:'Grúa del Abismo',health:76,w:510,h:670,patterns:[['chain','slam'],['chain','sweep','fire'],['volley','chain','slam']]}},
 {chapter:4,title:'E35',theme:'highway',length:68000,duration:295.488,vehicle:true,missions:[
  mission('passes','route','Abrir la carretera','Conduce, salta y marca tres puestos con E. W lanza obsidiana.',3),
  mission('roadblock','patrol','Romper el bloqueo','Derrota a los tres soldados del bloqueo.',3),
  mission('messenger','escort','Escoltar al mensajero','Habla con el mensajero y acompáñalo hasta el puesto señalado.',2)
 ],boss:{type:'warconvoyvehicle',name:'Convoy de Guerra',health:80,w:560,h:600,patterns:[['charge','fire'],['charge','sweep','volley'],['charge','reinforcements','fire']]}},
 {chapter:5,title:'Radio Comunitaria',theme:'radio',length:30000,duration:198.768,missions:[
  mission('stations','network','Restablecer las estaciones','Rompe cada interferencia y conecta las tres estaciones con E.',3),
  mission('jammers','sabotage','Silenciar los inhibidores','Destruye los tres inhibidores del valle.',3),
  mission('broadcast','defend','Proteger la emisión','Activa la radio con E y derrota las dos oleadas de tres soldados.',6)
 ],boss:{type:'jammingtower',name:'Torre de Interferencia',health:74,w:450,h:650,devices:'antennas',patterns:[['fire','chain'],['volley','reinforcements','fire'],['chain','volley','sweep']]}},
 {chapter:6,title:'Resistencia',theme:'temple',length:31000,duration:204.816,missions:[
  mission('square','patrol','Despejar la plaza','Derrota a los cuatro soldados de la plaza.',4),
  mission('temple','defend','Defender el templo','Activa la señal con E y vence dos oleadas de tres soldados.',6),
  mission('camp','sabotage','Desarmar el campamento','Destruye las tres armas de asedio.',3)
 ],boss:{type:'marshall',name:'Mariscal del Templo',health:86,w:480,h:650,patterns:[['slam','reinforcements'],['sweep','charge','reinforcements'],['volley','reinforcements','charge']]}},
 {chapter:7,title:'Cosecha',theme:'terraces',length:62000,duration:345.864,missions:[
  mission('water','irrigation','Abrir las acequias','Activa la bomba y abre las dos acequias con E.',3),
  mission('seeds','recover','Recuperar las semillas','Recoge dos sacos y entrégalos en el granero con E.',3),
  mission('fields','plant','Sembrar las terrazas','Después de recuperar las semillas, planta tres parcelas con E.',3,{requires:'seeds'})
 ],boss:{type:'ironplough',name:'Arado de Hierro',health:74,w:570,h:610,devices:'mud',patterns:[['charge','slam'],['sweep','charge','fire'],['charge','volley','slam']]}},
 {chapter:8,title:'Av. Carchi',theme:'town',length:66000,duration:364.704,missions:[
  mission('access','patrol','Vigilar los accesos','Derrota a los tres soldados que ocupan los accesos.',3),
  mission('roads','route','Restablecer las rutas','Marca tres pasos seguros con E.',3),
  mission('neighbors','rescue','Evacuar a los vecinos','Derrota a sus guardias y abre dos refugios con E.',2)
 ],boss:{type:'mountedcommander',name:'Comandante Montado',health:84,w:530,h:630,patterns:[['charge','sweep'],['charge','fire','slam'],['volley','charge','sweep']]}},
 {chapter:9,title:'Wiracocha',theme:'festival',length:38000,duration:235.248,missions:[
  mission('moorings','sabotage','Soltar los amarres','Destruye los tres amarres del fuerte.',3),
  mission('communities','network','Reunir a las comunidades','Rompe las interferencias y conecta tres comunidades con E.',3),
  mission('celebration','defend','Asegurar la plaza','Activa la señal con E y vence las dos últimas oleadas.',6)
 ],boss:{type:'flyingfortress',name:'Fortaleza del Cielo',health:110,w:600,h:680,devices:'anchors',patterns:[['volley','fire'],['chain','volley','reinforcements'],['volley','charge','sweep']]}}
];
export function getChapter(index){return CAMPAIGN[Math.max(0,Math.min(9,Math.trunc(index)))];}
export default CAMPAIGN;
