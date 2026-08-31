/* Catalogo dei progetti. Cento schede, una sola logica di montaggio.
   Ogni progetto combina un disegno sensato con nome, famiglia e colori propri. */
(function () {
  'use strict';

  function s(type, x, y, rot) { return [type, x, y, rot || 0]; }
  var R = {
    scooter: [s('beam',520,365),s('wheel',445,430),s('wheel',595,430),s('seat',535,300)],
    trike: [s('beam',515,360),s('wheel',430,430),s('wheel',530,430),s('wheel',630,430),s('seat',530,294)],
    car: [s('beam',520,405),s('wheel',445,470),s('wheel',595,470),s('cab',525,345)],
    truck: [s('beam',520,410),s('wheel',430,475),s('wheel',595,475),s('cab',595,345),s('block',455,350)],
    train: [s('beam',520,410),s('wheel',410,475),s('wheel',520,475),s('wheel',630,475),s('cab',575,345),s('chimney',470,325)],
    crane: [s('block',495,420),s('wheel',435,480),s('wheel',555,480),s('arm',500,290),s('hook',605,210,-.72)],
    dozer: [s('beam',515,420),s('wheel',440,480),s('wheel',575,480),s('cab',535,355),s('bucket',675,405,-.15)],
    flyer: [s('cab',520,340),s('wing',520,405),s('wheel',465,465),s('wheel',575,465),s('prop',665,340)],
    heli: [s('cab',520,370),s('beam',430,390),s('prop',520,255),s('arm',520,300,Math.PI/2),s('wheel',470,455),s('wheel',570,455)],
    balloon: [s('block',520,410),s('beam',520,340,Math.PI/2),s('prop',520,225),s('antenna',590,330)],
    boat: [s('beam',520,430),s('cab',500,360),s('sail',575,305),s('prop',670,420)],
    sub: [s('beam',520,400),s('cab',520,340),s('prop',665,400),s('antenna',450,320),s('wheel',430,405)],
    rocket: [s('rocket',520,330),s('wing',520,425),s('prop',520,470),s('antenna',520,205)],
    rover: [s('beam',520,405),s('wheel',410,470),s('wheel',500,470),s('wheel',590,470),s('wheel',680,470),s('cab',550,340),s('antenna',450,330)],
    tractor: [s('beam',515,405),s('wheel',420,472),s('wheel',590,472),s('cab',535,340),s('arm',680,385,Math.PI/2)],
    mill: [s('block',520,430),s('arm',520,325),s('prop',520,220),s('beam',520,480)],
    rescue: [s('beam',520,410),s('wheel',440,475),s('wheel',590,475),s('cab',535,345),s('antenna',630,330)],
    house: [s('block',470,420),s('block',570,420),s('cab',520,340),s('chimney',620,330),s('beam',520,475)],
    robot: [s('block',520,335),s('cab',520,245),s('arm',420,340,Math.PI/2),s('arm',620,340,Math.PI/2),s('wheel',475,440),s('wheel',565,440)],
    creature: [s('block',520,355),s('cab',620,330),s('arm',425,360,Math.PI/2),s('wheel',480,440),s('wheel',575,440),s('antenna',650,260)],
    music: [s('drum',520,370),s('beam',520,455),s('wheel',445,500),s('wheel',590,500),s('antenna',635,330)],
    carnival: [s('beam',520,430),s('wheel',430,470),s('wheel',520,470),s('wheel',610,470),s('seat',475,365),s('prop',625,335)],
    bus: [s('beam',520,420),s('wheel',420,480),s('wheel',620,480),s('cab',620,350),s('block',470,350),s('block',550,350)],
    motorbike: [s('beam',520,400),s('wheel',425,465),s('wheel',615,465),s('seat',520,335),s('arm',610,325,.45)],
    racer: [s('beam',520,410),s('wheel',430,470),s('wheel',610,470),s('seat',510,345),s('wing',520,390),s('prop',675,365)],
    camper: [s('beam',520,420),s('wheel',425,480),s('wheel',620,480),s('cab',610,350),s('block',490,350),s('chimney',430,315)],
    excavator: [s('beam',500,425),s('wheel',420,480),s('wheel',555,480),s('cab',500,350),s('arm',615,310,-.7),s('bucket',700,385,-.25)],
    forklift: [s('beam',500,425),s('wheel',430,480),s('wheel',560,480),s('cab',500,355),s('arm',630,365,Math.PI/2),s('bucket',710,415,-.1)],
    roller: [s('beam',520,420),s('wheel',430,480),s('drum',650,455,Math.PI/2),s('cab',520,350),s('arm',600,385,Math.PI/2)],
    drill: [s('beam',490,420),s('wheel',420,480),s('wheel',550,480),s('cab',485,350),s('arm',630,350,Math.PI/2),s('rocket',720,365,Math.PI/2)],
    platform: [s('beam',500,430),s('wheel',430,485),s('wheel',560,485),s('cab',450,365),s('arm',590,315,-.45),s('seat',660,235)],
    mixer: [s('beam',520,425),s('wheel',420,485),s('wheel',610,485),s('cab',620,355),s('drum',500,355,-.35)],
    glider: [s('cab',520,360),s('wing',520,415),s('seat',455,360),s('wheel',520,465)],
    biplane: [s('cab',520,355),s('wing',520,405),s('wing',520,300),s('prop',665,355),s('wheel',470,465),s('wheel',570,465)],
    blimp: [s('block',520,285),s('cab',520,390),s('prop',660,300),s('antenna',430,300),s('seat',520,445)],
    mailplane: [s('cab',535,355),s('wing',520,410),s('prop',665,355),s('block',435,355),s('wheel',485,465),s('wheel',585,465)],
    seaplane: [s('cab',530,350),s('wing',520,400),s('prop',665,350),s('beam',500,465),s('beam',600,465)],
    girocopter: [s('seat',520,380),s('arm',520,300),s('prop',520,220),s('beam',430,400),s('wheel',480,460),s('wheel',570,460)],
    stuntplane: [s('cab',520,350),s('wing',520,410,.12),s('wing',520,300,-.12),s('prop',665,350),s('rocket',420,350,-Math.PI/2)],
    speedboat: [s('beam',520,430),s('cab',520,365),s('prop',675,425),s('prop',390,425),s('seat',580,365)],
    ferry: [s('beam',470,445),s('beam',590,445),s('block',460,365),s('block',570,365),s('cab',650,365),s('prop',730,430)],
    catamaran: [s('beam',450,450),s('beam',600,450),s('sail',525,315),s('cab',525,390),s('prop',700,430)],
    fishing: [s('beam',520,440),s('cab',480,370),s('hook',650,325,-.5),s('arm',590,350,-.6),s('prop',700,430)],
    lighthouseBoat: [s('beam',520,440),s('cab',500,375),s('chimney',590,330),s('antenna',590,225),s('prop',700,430)],
    satellite: [s('beam',520,365),s('wing',405,365),s('wing',635,365),s('antenna',520,250),s('prop',520,455)],
    moonbase: [s('block',440,415),s('block',540,415),s('cab',490,335),s('rocket',650,365),s('antenna',390,320),s('beam',490,475)],
    probe: [s('beam',520,390),s('cab',520,320),s('antenna',440,280),s('prop',650,390),s('claw',420,420)],
    saucer: [s('beam',470,410),s('beam',580,410),s('cab',525,340),s('antenna',525,250),s('prop',420,450),s('prop',630,450)],
    orbit: [s('beam',520,365),s('block',430,365),s('block',610,365),s('wing',520,270),s('wing',520,460),s('antenna',690,320)],
    harvester: [s('beam',500,420),s('wheel',410,480),s('wheel',570,480),s('cab',500,350),s('bucket',680,420),s('prop',700,350)],
    milker: [s('block',470,395),s('block',570,395),s('drum',520,300),s('arm',650,365,Math.PI/2),s('wheel',470,470),s('wheel',570,470)],
    trailer: [s('beam',520,410),s('wheel',430,475),s('wheel',610,475),s('block',500,345),s('block',590,345)],
    seeder: [s('beam',510,420),s('wheel',420,480),s('wheel',585,480),s('block',500,350),s('bucket',680,415),s('arm',620,365,Math.PI/2)],
    barn: [s('block',455,410),s('block',565,410),s('cab',510,320),s('chimney',620,330),s('beam',510,475),s('sail',510,300)],
    scarecrow: [s('block',520,360),s('cab',520,265),s('arm',420,355,Math.PI/2),s('arm',620,355,Math.PI/2),s('beam',520,455),s('antenna',520,190)],
    waterwheel: [s('prop',560,350),s('arm',450,360),s('block',400,420),s('beam',510,465),s('bucket',650,430)],
    firetruck: [s('beam',520,420),s('wheel',420,480),s('wheel',620,480),s('cab',620,350),s('block',480,350),s('antenna',470,260),s('chimney',540,290)],
    towtruck: [s('beam',500,425),s('wheel',420,485),s('wheel',590,485),s('cab',450,355),s('arm',575,315,-.65),s('hook',680,270,-.35)],
    emergencyBridge: [s('block',410,435),s('block',630,435),s('beam',430,360),s('beam',520,330),s('beam',610,360),s('claw',700,390)],
    tower: [s('block',520,430),s('block',520,330),s('cab',520,235),s('chimney',520,155),s('beam',520,490)],
    bridge: [s('block',390,430),s('block',650,430),s('beam',430,360),s('beam',520,330),s('beam',610,360)],
    kiosk: [s('block',480,410),s('block',580,410),s('cab',530,335),s('sail',530,255),s('beam',530,475)],
    school: [s('block',455,410),s('block',565,410),s('cab',510,325),s('antenna',510,220),s('beam',510,475),s('drum',650,395)],
    garage: [s('block',450,400),s('block',590,400),s('cab',520,325),s('beam',520,475),s('wheel',480,410),s('wheel',560,410)],
    lighthouse: [s('block',520,430),s('block',520,330),s('chimney',520,235),s('antenna',520,145),s('beam',520,490)],
    station: [s('block',450,410),s('block',560,410),s('cab',505,320),s('chimney',620,315),s('beam',505,475),s('wheel',675,440)],
    cablecar: [s('cab',520,350),s('arm',520,250),s('beam',520,175,Math.PI/2),s('wheel',450,175),s('wheel',590,175)],
    ferris: [s('prop',520,300),s('arm',520,420),s('seat',400,300),s('seat',640,300),s('block',520,480)],
    robotDog: [s('block',500,350),s('cab',620,330),s('arm',400,350,Math.PI/2),s('wheel',450,440),s('wheel',560,440),s('antenna',650,250)],
    robotCook: [s('block',520,350),s('cab',520,255),s('arm',420,350,Math.PI/2),s('arm',620,350,Math.PI/2),s('drum',680,430),s('wheel',520,455)],
    robotGarden: [s('block',520,350),s('cab',520,255),s('arm',420,350,Math.PI/2),s('arm',620,350,Math.PI/2),s('bucket',690,400),s('wheel',520,455)],
    robotPost: [s('block',520,350),s('cab',520,255),s('arm',420,350,Math.PI/2),s('arm',620,350,Math.PI/2),s('block',690,400),s('wheel',520,455)],
    robotDance: [s('block',520,340),s('cab',520,245),s('arm',410,300,-.5),s('arm',630,300,.5),s('wheel',470,440),s('wheel',570,440),s('prop',520,165)],
    robotExplore: [s('block',520,350),s('cab',520,255),s('arm',420,350,Math.PI/2),s('claw',650,350,-.2),s('wheel',450,445),s('wheel',590,445),s('antenna',520,165)],
    stage: [s('block',440,420),s('block',600,420),s('beam',520,340),s('drum',520,285),s('antenna',420,260),s('antenna',620,260)],
    bubble: [s('beam',520,410),s('wheel',430,470),s('wheel',600,470),s('cab',520,345),s('prop',400,330),s('prop',650,330),s('antenna',520,250)],
    icecream: [s('beam',520,420),s('wheel',420,480),s('wheel',620,480),s('cab',620,350),s('block',490,350),s('drum',460,265),s('chimney',540,260)]
  };

  var families = [
    { id:'ruote', name:'Tutto su ruote', short:'RUOTE', color:'#48b878', icon:'wheel',
      names:['Il monopattino','Il triciclo','La macchinina','Il pulmino','Il camion dei pacchi','Il trattore veloce','Il trenino','La moto buffa','Il bolide','Il camper'],
      recipes:['scooter','trike','car','bus','truck','tractor','train','motorbike','racer','camper'], ids:['monopattino'] },
    { id:'cantiere', name:'Il cantiere', short:'CANTIERE', color:'#ffcb4c', icon:'bucket',
      names:['La gru gialla','La ruspa','L’escavatore','Il muletto','Il rullo compressore','L’autogru','La trivella','La pala gigante','La piattaforma','La betoniera'],
      recipes:['crane','dozer','excavator','forklift','roller','towtruck','drill','excavator','platform','mixer'], ids:['gru'] },
    { id:'cielo', name:'Nel cielo', short:'CIELO', color:'#4e9ed6', icon:'wing',
      names:['La macchina del vento','L’aeroplano','L’elicottero','L’aliante','Il biplano','La mongolfiera','L’aereo postale','L’idrovolante','Il girocottero','L’aereo acrobatico'],
      recipes:['flyer','flyer','heli','glider','biplane','blimp','mailplane','seaplane','girocopter','stuntplane'], ids:['vento'] },
    { id:'mare', name:'Nel mare', short:'MARE', color:'#36b7bd', icon:'sail',
      names:['La barchetta','Il motoscafo','Il veliero','Il sottomarino','Il traghetto','Il catamarano','Il peschereccio','Il battello','Il sommergibile','La barca faro'],
      recipes:['boat','speedboat','boat','sub','ferry','catamaran','fishing','speedboat','sub','lighthouseBoat'] },
    { id:'spazio', name:'Nello spazio', short:'SPAZIO', color:'#9b6dcc', icon:'rocket',
      names:['Il razzo','Il rover lunare','La navetta','Il satellite','La base lunare','Il razzo cargo','La sonda','Il robot spaziale','Il disco volante','La stazione orbitale'],
      recipes:['rocket','rover','flyer','satellite','moonbase','rocket','probe','robot','saucer','orbit'] },
    { id:'fattoria', name:'Alla fattoria', short:'FATTORIA', color:'#83b849', icon:'prop',
      names:['Il trattore','Il mulino','Il carretto','La mietitrebbia','La mungitrice','Il rimorchio','La seminatrice','Il fienile','Lo spaventapasseri','La ruota ad acqua'],
      recipes:['tractor','mill','trailer','harvester','milker','trailer','seeder','barn','scarecrow','waterwheel'] },
    { id:'soccorso', name:'Dino soccorso', short:'SOCCORSO', color:'#ef735d', icon:'antenna',
      names:['L’ambulanza','L’autopompa','L’elicottero medico','La barca di salvataggio','Il carro attrezzi','La jeep del bosco','Il faro mobile','Lo spazzaneve','Il robot soccorritore','Il ponte di emergenza'],
      recipes:['rescue','firetruck','heli','speedboat','towtruck','rescue','lighthouseBoat','dozer','robotExplore','emergencyBridge'] },
    { id:'citta', name:'In città', short:'CITTÀ', color:'#ef8b45', icon:'chimney',
      names:['La casetta','La torre','Il ponte','Il chiosco','La scuola','Il garage','Il faro','La stazione','La funivia','Il luna park'],
      recipes:['house','tower','bridge','kiosk','school','garage','lighthouse','station','cablecar','ferris'] },
    { id:'robot', name:'Robot e amici', short:'ROBOT', color:'#6e8790', icon:'claw',
      names:['Dino robot','Robo cane','Robo gatto','Il robot cuoco','Il robot giardiniere','Il robot musicista','Il robot postino','Il robot ballerino','Il robot esploratore','Il robot gigante'],
      recipes:['robot','robotDog','robotDog','robotCook','robotGarden','music','robotPost','robotDance','robotExplore','robot'] },
    { id:'festa', name:'Festa e musica', short:'FESTA', color:'#ef78a8', icon:'drum',
      names:['Il carro musicale','La giostra','La batteria mobile','Il trenino della festa','Il palco','La macchina delle bolle','Il tamburo gigante','La ruota panoramica','Il carro dei gelati','La macchina dei coriandoli'],
      recipes:['music','carnival','music','train','stage','bubble','music','ferris','icecream','racer'] }
  ];

  /* Un accessorio coerente per ciascun nome. Non serve soltanto a decorare:
     entra davvero nel vassoio, ha un aggancio e va montato per superare la prova. */
  var FEATURES = [
    ['arm','antenna','antenna','seat','claw','bucket','antenna','arm','prop','chimney'],
    ['hook','bucket','claw','arm','drum','hook','claw','bucket','hook','drum'],
    ['wing','wing','prop','wing','wing','antenna','antenna','sail','prop','wing'],
    ['sail','prop','sail','antenna','cab','sail','hook','chimney','antenna','antenna'],
    ['antenna','claw','wing','antenna','rocket','block','antenna','claw','prop','wing'],
    ['bucket','prop','seat','bucket','drum','block','bucket','chimney','arm','prop'],
    ['antenna','chimney','antenna','claw','hook','antenna','antenna','bucket','claw','beam'],
    ['chimney','antenna','beam','sail','antenna','cab','chimney','antenna','hook','prop'],
    ['claw','antenna','antenna','drum','bucket','drum','claw','prop','antenna','claw'],
    ['drum','seat','drum','antenna','drum','prop','drum','seat','chimney','prop']
  ];

  function bounds(slots) {
    var xs=slots.map(function(q){return q[1];}),ys=slots.map(function(q){return q[2];});
    return { minX:Math.min.apply(Math,xs),maxX:Math.max.apply(Math,xs),minY:Math.min.apply(Math,ys),maxY:Math.max.apply(Math,ys) };
  }

  function featureSlot(type, slots, global) {
    var b=bounds(slots),cx=(b.minX+b.maxX)/2,cy=(b.minY+b.maxY)/2,side=global%2?-1:1;
    if(type==='antenna'||type==='chimney'||type==='sail'||type==='rocket')return[type,Math.round(cx+side*24),Math.max(210,Math.round(b.minY-76)),0];
    if(type==='wing')return[type,Math.round(cx),Math.min(455,Math.round(cy+58)),global%2?Math.PI:0];
    if(type==='bucket'||type==='hook'||type==='claw'||type==='prop'||type==='arm')return[type,Math.round(side>0?b.maxX+78:b.minX-78),Math.round(cy+18),side>0?-.18:.18];
    return[type,Math.round(side>0?b.maxX+64:b.minX-64),Math.max(235,Math.round(b.minY-50)),0];
  }

  /* La ricetta è un archetipo, non la figura finale. Stiratura, specchio,
     apertura dei giunti e inclinazioni sono abbastanza ampi da cambiare la
     silhouette; il codice globale rende ogni coppia famiglia/progetto unica. */
  function individualize(base, fi, i) {
    var global=fi*10+i,sx=.82+i*.038,sy=.84+fi*.032,mirror=global%6===0?-1:1;
    var tilt=((global%7)-3)*.045,spread=10+(global%4)*4;
    var slots=base.map(function(q,k){
      var rx=(q[1]-520)*sx*mirror,ry=(q[2]-365)*sy;
      var fan=((k%3)-1)*spread,jog=(((k+global)%3)-1)*9;
      return[q[0],Math.round(520+rx+fan),Math.round(365+ry+jog),Math.round(((mirror<0?-q[3]:q[3])+(k%2?tilt:-tilt))*1000)/1000];
    });
    if(slots.length<7)slots.push(featureSlot(FEATURES[fi][i],slots,global));
    return slots;
  }

  var projects = [], byId = {}, byFamily = {};
  families.forEach(function (family, fi) {
    byFamily[family.id] = [];
    family.names.forEach(function (name, i) {
      var id = family.ids && family.ids[i] ? family.ids[i] : family.id + '-' + (i + 1);
      var base = R[family.recipes[i]], slots = individualize(base,fi,i);
      var p = { id:id, family:family.id, number:i + 1, name:name, color:G.shade(family.color,(i%5-2)*9), icon:family.icon,
        ask:'Monta ' + name.toLowerCase() + ' con ' + slots.length + ' pezzi.', slots:slots,
        tray:slots.map(function (q) { return q[0]; }) };
      projects.push(p); byId[id] = p; byFamily[family.id].push(p);
    });
  });

  function freeMission() {
    var pts=[[340,270],[460,270],[580,270],[700,270],[820,270],[400,420],[520,420],[640,420],[760,420]];
    return { id:'libera', name:'Costruzione libera', color:G.C.plum, ask:'Inventa una macchina con almeno tre pezzi!', free:true,
      slots:pts.map(function(p){return['any',p[0],p[1],0];}),
      tray:['beam','wheel','block','cab','arm','hook','prop','seat','wing'] };
  }

  G.officinaCatalog = {
    families:families, projects:projects,
    byId:function (id) { return id === 'libera' ? freeMission() : byId[id] || null; },
    inFamily:function (id) { return (byFamily[id] || []).slice(); },
    family:function (id) { return families.filter(function(f){return f.id===id;})[0] || null; },
    progress:function (done, id) { var a=byFamily[id]||[],n=0;a.forEach(function(p){if(done&&done[p.id])n++;});return{done:n,total:a.length}; },
    next:function (done) { for(var i=0;i<projects.length;i++)if(!done||!done[projects[i].id])return projects[i];return projects[0]; },
    random:function () { return projects[Math.floor(Math.random()*projects.length)]; }
  };
})();
