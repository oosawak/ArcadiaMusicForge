// Dependency-free regression checks. DOM fixture checks wiring/guide logic,
// not browser layout, sound output, or end-to-end rendering.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script); // Check the complete production script, including bootstrap.
class Element {
 constructor(){this.children=[];this.dataset={};this.style={};this.value='';this.checked=false;this._classes=new Set();this.classList={add:(...c)=>c.forEach(x=>this._classes.add(x)),remove:(...c)=>c.forEach(x=>this._classes.delete(x)),contains:c=>this._classes.has(c),toggle:(c,v)=>{if(v===undefined)v=!this._classes.has(c);v?this._classes.add(c):this._classes.delete(c);return v;}};}
 set className(v){this._classes=new Set(v.split(/\s+/).filter(Boolean));}
 get className(){return [...this._classes].join(' ');}
 set innerHTML(v){this.children=[];this._html=v;}
 get innerHTML(){return this._html||'';}
 get options(){return this.children;}
 appendChild(c){c.parentElement=this;this.children.push(c);return c;}
 append(...cs){cs.forEach(c=>this.appendChild(c));}
 addEventListener(){}
 remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(c=>c!==this);}
 querySelectorAll(s){return this.children.flatMap(c=>[c,...c.querySelectorAll('*')]).filter(c=>s==='*'||s.split(',').some(x=>x.startsWith('.')&&c.classList.contains(x.slice(1))));}
 querySelector(){return new Element();}
 setAttribute(){}
 getContext(){return new Proxy({},{get:()=>()=>{}});}
 getBoundingClientRect(){return {left:0,top:0,width:1024,height:650};}
}
const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
assert.equal(ids.size,[...html.matchAll(/\bid="([^"]+)"/g)].length,'duplicate HTML IDs');
const nodes=new Map([...ids].map(id=>['#'+id,new Element()]));
const document={querySelector:s=>nodes.get(s)||null,querySelectorAll:()=>[],createElement:()=>new Element(),addEventListener(){}};
const auditionEvents=[];
class AudioFixture {
 constructor(){this.currentTime=10;this.state='running';}
 createGain(){return {gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}};}
 createOscillator(){return {frequency:{value:0},connect(){},disconnect(){},start(at){auditionEvents.push(['start',at]);},stop(at){auditionEvents.push(['stop',at]);}};}
}
const context={console,document,window:{addEventListener(){},AudioContext:AudioFixture},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},localStorage:{getItem:()=>null,setItem(){}},confirm:()=>true,crypto:require('node:crypto').webcrypto,Uint32Array,Blob,URL};
context.globalThis=context;
context.devicePixelRatio=1;
const exportsCode=`
const realRender=render;
window.smoothChordVoicings=smoothChordVoicings;
render=()=>{};renderArrangement=()=>{};refreshPatternSelect=()=>{};updateArrangementHighlight=()=>{};
window.testApi={adaptAccompaniment,rhythmChoices,resolveMelodyRhythm,applyMelodyRhythm,renderRhythmChoices,get rhythms(){return MELODY_RHYTHMS;},loadProjectPayload,songGenerationDescription,installBuiltinSamples,melodyDescription,reverseLookup,saveTheoryHistory,restoreTheoryHistory,previewTheoryChords,stopTheoryPreview,ArcadiaTheory,normalizeTheory,normalizeSongShape,createSongState,ensurePatterns,autoComposeBattle,applyChordBacking,changeTheory,renderTheoryAssist,renderTheoryGuide,initTheoryControls,initGrid,bindUi,patternProgression,theoryProgression,exportProjectPayload,normalizeProjectShape,allArrangedNotes,serializeSong,fitMidiToRoll,generateTheoryPart,renameCurrentPattern,deleteCurrentPattern,
 genres:Object.keys(GENRE_PRESETS),styles:Object.keys(STYLE_GENERATION),
 get state(){return state;},get undo(){return undoStack;},
 prepare(song){project={version:17,title:'test',activeSongIndex:0,songs:[song]};state=song;undoStack=[];selectedNotes=new Set();ensurePatterns();},
 selectPattern(p){state.selectedPattern=p;},selectTrack(t){state.selected=t;},realRender};
})();`;
vm.runInNewContext(script.slice(0,script.lastIndexOf('moveLibraryAboveComposer();'))+exportsCode,context);
const api=context.window.testApi,T=api.ArcadiaTheory,plain=v=>JSON.parse(JSON.stringify(v));
const voice=context.window.smoothChordVoicings;
assert.equal(api.normalizeTheory({},'E minor').smoothVoicing,false);
for(const root of T.NOTE_NAMES)for(const scale of Object.keys(T.SCALE_TYPES))for(const seventh of [false,true]){
 const prog=T.resolveProgression(root,scale,'minor_epic',seventh),before=plain(prog),notes=voice(prog);
 assert.deepEqual(plain(voice(prog)),plain(notes),'voicing must be deterministic');
 assert.deepEqual(plain(prog),before,'voicing must not mutate harmony');
 notes.forEach((bar,i)=>{
  assert.ok(bar.every(n=>n>=64&&n<=88));
  assert.deepEqual([...bar.map(n=>n%12)].sort((a,b)=>a-b),[...prog[i].pcs].sort((a,b)=>a-b));
 });
}
api.initTheoryControls();api.bindUi();
assert.equal(nodes.get('#rootSel').options.length,12);
assert.equal(nodes.get('#scaleSel').options.length,17);
assert.ok(!ids.has('keySel'));
assert.deepEqual(plain(T.resolveProgression('E','naturalMinor','minor_epic').map(c=>c.symbol)),['Em','C','G','D']);
assert.equal(T.diatonic('C','harmonicMinor',true)[0].symbol,'Cm(maj7)');
assert.deepEqual(plain(T.diatonic('C','major').map(c=>c.symbol)),['C','Dm','Em','F','G','Am','Bdim']);
assert.deepEqual(plain(T.diatonic('C','major',true).map(c=>c.symbol)),['Cmaj7','Dm7','Em7','Fmaj7','G7','Am7','Bm7b5']);
assert.deepEqual(plain(T.diatonic('C','major').map(c=>c.degreeName)),['I','ii','iii','IV','V','vi','vii°']);
let chordCases=0;
for(const root of T.NOTE_NAMES)for(const scale of Object.keys(T.SCALE_TYPES))for(const seventh of [false,true]){
 const pcs=T.scale(root,scale),dia=T.diatonic(root,scale,seventh);
 assert.equal(dia.length,pcs.length);
 for(const c of dia){assert.equal(new Set(c.pcs).size,seventh?4:3);assert.ok(c.pcs.every(pc=>pcs.includes(pc)));assert.ok(T.chordMidi(c).every(Number.isFinite));assert.equal(T.classifyPitch(T.chordMidi(c)[0],root,scale,c),'chord');chordCases++;}
 for(const p of T.PROGRESSIONS)assert.equal(T.resolveProgression(root,scale,p.id,seventh).length,4);
 assert.ok(T.nextChordCandidates(root,scale,7).every(c=>c.pcs.length===3));
}
for(const key of ['E minor','A minor','D minor','G minor','C major','Bb major']){
 const legacy=api.createSongState();delete legacy.theory;legacy.key=key;legacy.progression='Am-F-C-G';
 const migrated=api.normalizeSongShape(legacy);
 assert.equal(migrated.theory.scale,key.endsWith('major')?'major':'naturalMinor');
 assert.equal(migrated.theory.root,key.startsWith('Bb')?'A#':key[0]);
 assert.deepEqual(plain(migrated.tracks),plain(legacy.tracks));
 assert.deepEqual(plain(migrated.generation.progressions.A),['Am','F','C','G']);
}
function compose(scale='naturalMinor',mode='fixed',style='snes',genre='Action',root='E',sevenths=false){
 const song=api.createSongState();song.theory={...song.theory,root,scale,sevenths};api.prepare(song);
 for(const [id,value] of Object.entries({genrePresetSel:genre,styleSel:style,generationSeed:'12345',generationMode:mode,melodyContour:'legacy',melodyRhythm:'legacy'}))nodes.get('#'+id).value=value;
 nodes.get('#freshSeed').checked=false;nodes.get('#randomMelodyContour').checked=false;nodes.get('#randomProgression').checked=false;nodes.get('#adaptiveAccompaniment').checked=false;api.autoComposeBattle();return plain(api.state);
}
let generatedCases=0;
for(const scale of Object.keys(T.SCALE_TYPES))for(const mode of ['fixed','auto','develop','minimal']){
 const song=compose(scale,mode,'snes','Action','C#',true),pcs=T.scale('C#',scale);
 assert.equal(song.tracks.length,7);assert.equal(song.arrangement.length,7);assert.ok(song.arrangement.every(r=>r.length===12));
 for(let ti=0;ti<7;ti++)for(const notes of Object.values(song.tracks[ti].patterns))for(const n of notes){
  assert.ok(Number.isFinite(n.step)&&n.step>=0&&n.step<64&&n.len>0&&n.step+n.len<=64);
  assert.ok(n.velocity>0&&n.velocity<=127);
  if(ti!==6){assert.ok(pcs.includes(T.noteIndex(n.pitch.replace(/\d+$/,''))),n.pitch+' outside '+scale);assert.ok(T.midi(n.pitch.replace(/\d+$/,''),+n.pitch.at(-1))>=64);}
 }
 if(mode==='fixed')assert.deepEqual(song.generation.progressions.A,plain(T.resolveProgression('C#',scale,'minor_epic',true)));
 if(mode==='minimal')assert.equal(song.generation.progressions.A[0].symbol,song.generation.progressions.A[1].symbol);
 assert.deepEqual(song,compose(scale,mode,'snes','Action','C#',true),'same seed must reproduce');
 generatedCases++;
}
for(const genre of api.genres)for(const style of api.styles){const song=compose('dorian','develop',style,genre);assert.ok(song.tracks[0].patterns.A.length);assert.ok(song.tracks.every(t=>t.sound));generatedCases++;}
compose();
const beforeDrums=plain(api.state.tracks[6]),beforePcs=api.state.tracks[0].patterns.A.map(n=>T.noteIndex(n.pitch.replace(/\d+$/,'')));
api.changeTheory('root','F');assert.deepEqual(plain(api.state.tracks[6]),beforeDrums);
assert.deepEqual(plain(api.state.tracks[0].patterns.A.map(n=>T.noteIndex(n.pitch.replace(/\d+$/,'')))),plain(beforePcs.map(pc=>(pc+1)%12)));
api.changeTheory('scale','yo');api.changeTheory('sevenths',true);api.changeTheory('progressionId','circle');
assert.ok(api.patternProgression().every(c=>c.pcs.length===4));
const payload=plain(api.exportProjectPayload()),loaded=api.normalizeProjectShape(payload);
assert.deepEqual(plain(loaded.songs[0].theory),plain(api.state.theory));
assert.deepEqual(plain(loaded.songs[0].tracks),plain(api.state.tracks));
assert.deepEqual(plain(loaded.songs[0].generation.progressions),plain(api.state.generation.progressions));
api.prepare(loaded.songs[0]);api.selectPattern('A');
const preserved=[0,1,4,6].map(i=>plain(api.state.tracks[i]));api.applyChordBacking();
assert.deepEqual([0,1,4,6].map(i=>plain(api.state.tracks[i])),preserved);assert.ok(api.undo.length);
assert.ok(api.allArrangedNotes().flat().every(n=>n.step>=0&&n.step<768));
compose();api.selectPattern('A');api.initGrid();api.renderTheoryAssist();
const rows=nodes.get('#grid').querySelectorAll('.grid-row');assert.equal(rows.length,25);
const e=rows.find(r=>r.dataset.pitch==='E5');
assert.ok(e.querySelectorAll('.theory-bar').some(b=>b.style.left==='0%'&&b.classList.contains('theory-chord')));
api.state.theory.showScaleGuide=false;api.state.theory.showChordGuide=false;api.renderTheoryGuide();
assert.ok(rows.every(r=>!r.classList.contains('theory-scale')&&!r.classList.contains('theory-chord')&&!r.querySelectorAll('.theory-bar').length));
api.state.theory.showScaleGuide=true;api.state.theory.showChordGuide=true;api.selectTrack(6);api.renderTheoryGuide();
assert.ok(rows.every(r=>!r.querySelectorAll('.theory-bar').length));
compose('blues','develop');api.selectPattern('A');
for(const ti of [0,5,4]){
 const before=plain(api.state),arr=plain(api.state.arrangement);
 api.generateTheoryPart(ti);
 for(let i=0;i<7;i++)if(i!==ti)assert.deepEqual(plain(api.state.tracks[i]),before.tracks[i]);
 assert.deepEqual(plain(api.state.arrangement),arr);assert.equal(api.state.bpm,before.bpm);
 const notes=plain(api.state.tracks[ti].patterns.A);api.generateTheoryPart(ti);
 assert.deepEqual(plain(api.state.tracks[ti].patterns.A),notes);
}
const oldHarmony=plain(api.state.generation.progressions.A),oldNotes=plain(api.state.tracks[0].patterns.A);
api.renameCurrentPattern('VERSE');api.ensurePatterns();
assert.equal(api.state.selectedPattern,'VERSE');assert.deepEqual(plain(api.state.generation.progressions.VERSE),oldHarmony);
assert.deepEqual(plain(api.state.tracks[0].patterns.VERSE),oldNotes);assert.ok(!api.state.patternOrder.includes('A'));
api.deleteCurrentPattern();api.ensurePatterns();assert.ok(!api.state.patternOrder.includes('VERSE'));assert.ok(!api.state.generation.progressions.VERSE);
api.realRender(); // Full render functions on the DOM fixture; not visual/browser QA.
vm.runInNewContext(script,context); // Execute the unmodified production startup.
assert.equal(api.reverseLookup([]).chords.length,0);
const lookup=api.reverseLookup([0,4,7,0]);
assert.ok(lookup.chords.some(c=>c.symbol==='C'));
assert.ok(!lookup.chords.some(c=>c.symbol==='Cmaj7'));
assert.ok(lookup.scales.some(s=>s.root==='C'&&s.type==='major'));
assert.ok(!lookup.scales.some(s=>s.root==='C'&&s.type==='naturalMinor'));
compose();api.saveTheoryHistory();api.saveTheoryHistory();assert.equal(api.state.theoryHistory.length,1);
const originalSong=plain(api.state);
api.applyChordBacking();const normalBacking=plain(api.state.tracks);
api.prepare(plain(originalSong));api.state.theory.smoothVoicing=true;api.applyChordBacking();
const smoothBacking=plain(api.state.tracks);
for(const ti of [0,1,3,4,5,6])assert.deepEqual(smoothBacking[ti],normalBacking[ti],'only strings voicing changes');
assert.equal(api.normalizeProjectShape(plain(api.exportProjectPayload())).songs[0].theory.smoothVoicing,true);
api.prepare(plain(originalSong));api.state.theory.smoothVoicing=false;api.applyChordBacking();
assert.deepEqual(plain(api.state.tracks),normalBacking,'OFF keeps legacy backing');
api.prepare(plain(originalSong));
const savedHarmony=plain(api.patternProgression());api.changeTheory('progressionId','circle');
const preservedTracks=plain(api.state.tracks),preservedArrangement=plain(api.state.arrangement);
api.restoreTheoryHistory(0);
assert.deepEqual(plain(api.patternProgression()),savedHarmony);
assert.deepEqual(plain(api.state.tracks),preservedTracks);
assert.deepEqual(plain(api.state.arrangement),preservedArrangement);
const historyProject=api.normalizeProjectShape(plain(api.exportProjectPayload()));
assert.deepEqual(plain(historyProject.songs[0].theoryHistory),plain(api.state.theoryHistory));
api.bindUi();
assert.equal(api.normalizeTheory(null).phraseAssist,false);
assert.equal(api.normalizeTheory({phraseAssist:'true'}).phraseAssist,false);
const rhythm=notes=>notes.map(({pitch,...rest})=>rest);
for(const scale of Object.keys(T.SCALE_TYPES)){
 const off=compose(scale,'develop');
 api.state.theory.phraseAssist=true;api.autoComposeBattle();
 const on=plain(api.state);
 assert.notDeepEqual(on.tracks[0].patterns,off.tracks[0].patterns);
 assert.deepEqual(on.tracks.slice(1),off.tracks.slice(1),'assist must preserve every other track and sound');
 assert.deepEqual(on.arrangement,off.arrangement);
 assert.equal(on.bpm,off.bpm);
 for(const [pat,notes] of Object.entries(on.tracks[0].patterns)){
  assert.deepEqual(rhythm(notes),rhythm(off.tracks[0].patterns[pat]));
  assert.deepEqual(notes.filter(n=>n.step<16),off.tracks[0].patterns[pat].filter(n=>n.step<16));
  assert.ok(notes.every(n=>T.scale('E',scale).includes(T.noteIndex(n.pitch.replace(/\d+$/,'')))));
 }
 api.autoComposeBattle();assert.deepEqual(plain(api.state.tracks),on.tracks,'ON is deterministic');
 api.state.theory.phraseAssist=false;api.autoComposeBattle();
 assert.deepEqual(plain(api.state.tracks),off.tracks,'OFF restores original seeded output');
}
compose();api.selectPattern('A');api.generateTheoryPart(0);
const partOff=plain(api.state);
nodes.get('#phraseAssistToggle').onchange({target:{checked:true}});
assert.ok(api.undo.length);assert.equal(api.state.theory.phraseAssist,true);
nodes.get('#undoBtn').onclick();assert.equal(api.state.theory.phraseAssist,false);
nodes.get('#phraseAssistToggle').onchange({target:{checked:true}});
api.renderTheoryAssist();assert.equal(nodes.get('#phraseAssistToggle').checked,true);
api.generateTheoryPart(0);
assert.deepEqual(plain(api.state.tracks.slice(1)),partOff.tracks.slice(1));
assert.deepEqual(rhythm(plain(api.state.tracks[0].patterns.A)),rhythm(partOff.tracks[0].patterns.A));
assert.notDeepEqual(plain(api.state.tracks[0].patterns.A),partOff.tracks[0].patterns.A);
assert.equal(api.normalizeProjectShape(plain(api.exportProjectPayload())).songs[0].theory.phraseAssist,true);
nodes.get('#undoBtn').onclick();assert.deepEqual(plain(api.state.tracks),partOff.tracks,'undo restores pre-assist notes');
console.log('PASS: phrase assist default OFF, UI, undo snapshot, save/load, all scales, deterministic ON/OFF, rhythm and other-track preservation.');
console.log('PASS: full-script syntax, UI bindings, '+chordCases+' chord cases, '+generatedCases+' generator cases, deterministic seeds, migration, transpose, save/load, backing, arrangement and guide logic.');

// Generator contour integration: shape diversity, determinism, other-track preservation.
const baseContour=compose();
const contourResults=new Set();
for(const kind of ["rise", "fall", "arch", "valley", "wave", "leap", "stairsUp", "stairsDown", "repeat", "zigzag", "riseTurn", "fallTurn", "lateRise", "lateFall", "peak", "pendulum"]){
 nodes.get('#melodyContour').value=kind;api.autoComposeBattle();
 const result=plain(api.state);
 contourResults.add(JSON.stringify(result.tracks[0].patterns.A));
 assert.deepEqual(result.tracks.slice(1),baseContour.tracks.slice(1));
 for(const [pat,notes] of Object.entries(result.tracks[0].patterns)){
  assert.deepEqual(rhythm(notes),rhythm(baseContour.tracks[0].patterns[pat]));
  assert.ok(notes.every(n=>T.scale('E','naturalMinor').includes(T.noteIndex(n.pitch.replace(/\d+$/,'')))));
 }
 api.autoComposeBattle();assert.deepEqual(plain(api.state.tracks),result.tracks);
 assert.equal(api.normalizeProjectShape(plain(api.exportProjectPayload())).songs[0].generation.melodyContour,kind);
}
assert.equal(contourResults.size,16,'all contours must produce distinct melodies');
nodes.get('#melodyContour').value='legacy';api.autoComposeBattle();
assert.deepEqual(plain(api.state.tracks),baseContour.tracks);
nodes.get('#melodyContour').value='auto';api.autoComposeBattle();
const autoContour=plain(api.state.tracks);api.autoComposeBattle();
assert.deepEqual(plain(api.state.tracks),autoContour);
const beforeContourChange=plain(api.state);
nodes.get('#melodyContour').value='rise';nodes.get('#melodyContour').onchange();
assert.equal(api.state.generatorMelodyContour,'rise');
nodes.get('#undoBtn').onclick();assert.deepEqual(plain(api.state),beforeContourChange);
console.log('PASS: 16 melody contours, seed repeatability, legacy output, save/load and accompaniment preservation.');

// Built-ins are installed once; existing songs and active selection are retained.
const beforeBuiltinSong=plain(api.state);
api.installBuiltinSamples();
let sampleProject=plain(api.exportProjectPayload());
assert.equal(sampleProject.songs.length,11);
assert.deepEqual(sampleProject.songs[0],plain(api.serializeSong(api.state)));
assert.deepEqual(plain(api.state),beforeBuiltinSong);
assert.equal(new Set(sampleProject.songs.slice(1).map(s=>s.generation.melodyContour)).size,10);
for(const song of sampleProject.songs.slice(1)){
 assert.ok(song.tracks[0].patterns.A.length>0);
 assert.ok(api.melodyDescription(song).startsWith('主旋律: '));
 assert.equal(song.generation.melodyContour,song.generation.resolvedMelodyContour);
 assert.ok(song.tracks.every(t=>Object.values(t.patterns).every(ns=>ns.every(n=>n.step>=0&&n.step+n.len<=64))));
}
api.installBuiltinSamples();assert.equal(api.exportProjectPayload().songs.length,11);
assert.equal(api.normalizeProjectShape(sampleProject).builtinSamplesVersion,4);
const generatedInfo=plain(api.state.generation);
nodes.get('#melodyContour').value='fall';nodes.get('#melodyContour').onchange();
assert.deepEqual(plain(api.state.generation),generatedInfo,'selection changes must not rewrite generation history');
console.log('PASS: ten built-in samples, distinct contours, no duplicate install, retained user song and generation history');

for(const [mode,label] of Object.entries({fixed:'指定進行',auto:'おまかせ',develop:'展開あり',minimal:'コード少なめ'})){
 const sample=compose('naturalMinor',mode);
 const description=api.songGenerationDescription(sample);
 assert.ok(description.includes('進行モード: '+label));
 assert.ok(description.includes('進行: '));
 const saved=api.normalizeProjectShape(plain(api.exportProjectPayload())).songs[0];
 assert.equal(api.songGenerationDescription(saved),description);
 sample.generation.progressions.A=['C','C','C','C'];
 assert.equal(api.songGenerationDescription(sample),description,'preserve generated progression history');
}
assert.ok(api.songGenerationDescription({progression:'Am-F-C-G'}).includes('Am → F → C → G'));
console.log('PASS: progression and mode metadata, section progressions, save/load and legacy display');

// Replace obsolete sample libraries and default song; keep personal songs.
assert.equal(new Set(sampleProject.songs.slice(1).map(s=>s.style)).size,10);
assert.equal(new Set(sampleProject.songs.slice(1).map(s=>s.bpm)).size,10);
assert.equal(new Set(sampleProject.songs.slice(1).map(s=>s.generation.mode)).size,4);
assert.equal(new Set(sampleProject.songs.slice(1).map(s=>s.generation.resolvedMelodyRhythm)).size,10);
assert.equal(new Set(sampleProject.songs.slice(1).map(s=>JSON.stringify(rhythm(s.tracks[0].patterns.A)))).size,10);
const personalSong=plain(sampleProject.songs[0]);personalSong.name='自分の曲';
const obsoleteProject={builtinSamplesVersion:2,activeSongIndex:3,songs:[{name:'曲 1'},{name:'旧決戦',demoId:'demo-boss'},{name:'旧サンプル',demoId:'builtin-contour-v1-0'},personalSong]};
api.loadProjectPayload(obsoleteProject);api.installBuiltinSamples();
const refreshedSamples=plain(api.exportProjectPayload());
assert.equal(refreshedSamples.songs.length,11);
assert.equal(refreshedSamples.activeSongIndex,0);
assert.equal(api.state.name,'自分の曲');
assert.deepEqual(refreshedSamples.songs[0],personalSong);
assert.ok(!refreshedSamples.songs.some(s=>s.name==='曲 1'||s.demoId==='demo-boss'));
api.state.bpm=151;api.installBuiltinSamples();assert.equal(api.state.bpm,151);
const justDefault={songs:[{name:'曲1'}]};api.loadProjectPayload(justDefault);api.installBuiltinSamples();
assert.equal(api.exportProjectPayload().songs.length,10);assert.equal(api.state.demoId,'builtin-rhythm-v3-0');
const deletedSample=plain(api.exportProjectPayload());deletedSample.songs.pop();
api.loadProjectPayload(deletedSample);api.installBuiltinSamples();assert.equal(api.exportProjectPayload().songs.length,9);
console.log('PASS: ten new rhythm samples, removal of old samples/default, preservation of personal songs and later deletions');

// Rhythm changes actual onset/duration patterns; legacy output is recoverable.
const rhythmBaseline=compose();const rhythmVariants=new Set();
for(const kind of ['quarter','eighth','mixed','dotted','offbeat','syncopated','sparse','rush']){
 nodes.get('#melodyRhythm').value=kind;api.autoComposeBattle();const song=plain(api.state);
 rhythmVariants.add(JSON.stringify(rhythm(song.tracks[0].patterns.A)));
 assert.equal(song.generation.resolvedMelodyRhythm,kind);
 for(const ns of Object.values(song.tracks[0].patterns))ns.forEach((n,i)=>{
  assert.ok(Number.isInteger(n.step)&&n.len>=1&&n.step+n.len<=64);
  if(i)assert.ok(ns[i-1].step+ns[i-1].len<=n.step);
 });
 api.autoComposeBattle();assert.deepEqual(plain(api.state.tracks),song.tracks);
 assert.equal(api.normalizeProjectShape(plain(api.exportProjectPayload())).songs[0].generation.melodyRhythm,kind);
 assert.ok(api.songGenerationDescription(song).includes('リズム: '));
}
assert.equal(rhythmVariants.size,8);
nodes.get('#melodyRhythm').value='legacy';api.autoComposeBattle();assert.deepEqual(plain(api.state.tracks),rhythmBaseline.tracks);
nodes.get('#melodyRhythm').value='auto';api.autoComposeBattle();const autoRhythm=plain(api.state);api.autoComposeBattle();assert.deepEqual(plain(api.state.tracks),autoRhythm.tracks);
nodes.get('#melodyRhythm').value='sparse';nodes.get('#melodyRhythm').onchange();assert.deepEqual(plain(api.state.generation),autoRhythm.generation);
nodes.get('#undoBtn').onclick();assert.deepEqual(plain(api.state),autoRhythm);
console.log('PASS: eight rhythm patterns, actual timing changes, deterministic selection, legacy recovery, save/load and undo');

const catalog=Object.entries(api.rhythms);
assert.ok(catalog.length>900);
assert.equal(new Set(catalog.map(([,r])=>JSON.stringify(r.events))).size,catalog.length);
for(const [id,r] of catalog){
 r.events.forEach(([step,len],i)=>{assert.ok(Number.isInteger(step)&&Number.isInteger(len)&&step>=0&&len>0&&step+len<=16);if(i)assert.ok(r.events[i-1][0]+r.events[i-1][1]<=step);});
 const notes=api.applyMelodyRhythm([{pitch:'E5',step:0,len:1,velocity:100}],id);
 assert.equal(notes.length,r.events.length);
}
for(const category of ['all','sparse','balanced','dense','accent']){
 const choices=api.rhythmChoices(category),chosen=new Set();
 for(let seed=1;seed<=100;seed++){
  const id=api.resolveMelodyRhythm('auto',seed,category);assert.ok(choices.includes(id));
  assert.equal(api.resolveMelodyRhythm('auto',seed,category),id);chosen.add(id);
 }
 assert.ok(chosen.size>1);
}
const categoryBefore=plain(api.state);
nodes.get('#rhythmCategory').value='dense';nodes.get('#rhythmCategory').onchange();
assert.equal(api.state.generatorRhythmCategory,'dense');assert.equal(nodes.get('#melodyRhythm').value,'auto');
assert.deepEqual(plain(api.state.generation),categoryBefore.generation);
nodes.get('#undoBtn').onclick();assert.deepEqual(plain(api.state),categoryBefore);
console.log('PASS: '+catalog.length+' unique rhythms, grid bounds, category filtering and seeded diversity');

const randomBaseline=compose();
nodes.get('#randomMelodyContour').checked=true;nodes.get('#randomProgression').checked=true;
api.autoComposeBattle();const randomized=plain(api.state);
assert.equal(randomized.generation.randomProgression,true);assert.equal(randomized.generation.randomMelodyContour,true);
assert.equal(randomized.generation.mode,'fixed');
api.autoComposeBattle();assert.deepEqual(plain(api.state.tracks),randomized.tracks);
const savedRandom=api.normalizeProjectShape(plain(api.exportProjectPayload())).songs[0];
assert.deepEqual(plain(savedRandom.generation),randomized.generation);
const randomProgressions=new Set(),randomContours=new Set();
for(let seed=1;seed<=20;seed++){
 nodes.get('#generationSeed').value=String(seed);api.autoComposeBattle();
 randomProgressions.add(api.state.progression);randomContours.add(api.state.generation.resolvedMelodyContour);
}
assert.ok(randomProgressions.size>1);assert.ok(randomContours.size>1);
nodes.get('#generationSeed').value='12345';nodes.get('#randomMelodyContour').checked=false;nodes.get('#randomProgression').checked=false;
api.autoComposeBattle();assert.deepEqual(plain(api.state.tracks),randomBaseline.tracks);
const beforeRandomToggle=plain(api.state);nodes.get('#randomProgression').checked=true;nodes.get('#randomProgression').onchange();
assert.equal(api.state.randomProgression,true);assert.deepEqual(plain(api.state.generation),beforeRandomToggle.generation);
nodes.get('#undoBtn').onclick();assert.deepEqual(plain(api.state),beforeRandomToggle);
console.log('PASS: independent seeded random melody/progression, mode preservation, save/load, undo and OFF recovery');

nodes.get('#randomProgression').checked=false;nodes.get('#randomMelodyContour').checked=false;
const accompanimentOff=compose();
nodes.get('#adaptiveAccompaniment').checked=true;nodes.get('#adaptiveAccompaniment').onchange();
api.autoComposeBattle();const accompanimentOn=plain(api.state);
assert.deepEqual(accompanimentOn.tracks[0],accompanimentOff.tracks[0],'preserve final melody');
assert.notDeepEqual(accompanimentOn.tracks.slice(1),accompanimentOff.tracks.slice(1));
assert.deepEqual(accompanimentOn.arrangement,accompanimentOff.arrangement);
assert.equal(accompanimentOn.bpm,accompanimentOff.bpm);
for(let ti=0;ti<7;ti++)assert.deepEqual(accompanimentOn.tracks[ti].sound,accompanimentOff.tracks[ti].sound);
for(const [pat,ns] of Object.entries(accompanimentOn.tracks[1].patterns)){
 assert.ok(ns.every(n=>!accompanimentOn.tracks[0].patterns[pat].some(m=>n.step<m.step+m.len&&m.step<n.step+n.len)));
}
for(const tr of accompanimentOn.tracks)for(const [pat,ns] of Object.entries(tr.patterns))ns.forEach(n=>assert.ok(n.len>0&&n.step>=0&&n.step+n.len<=(pat==='TURN'?60:64)));
api.autoComposeBattle();assert.deepEqual(plain(api.state.tracks),accompanimentOn.tracks);
assert.equal(api.normalizeProjectShape(plain(api.exportProjectPayload())).songs[0].generation.adaptiveAccompaniment,true);
nodes.get('#adaptiveAccompaniment').checked=false;nodes.get('#adaptiveAccompaniment').onchange();api.autoComposeBattle();
assert.deepEqual(plain(api.state.tracks),accompanimentOff.tracks,'OFF recovers seeded output');
const parts=accompanimentOff.tracks.map(t=>t.patterns.A),originalParts=plain(parts);
const prog=accompanimentOff.generation.progressions.A;
const pool=Array.from({length:25},(_,i)=>64+i).filter(n=>T.scale('E','naturalMinor').includes(n%12));
const sparse=plain(parts);sparse[0]=[0,16,32,48].map(step=>({pitch:'E5',step,len:2,velocity:100}));
const dense=plain(parts);dense[0]=Array.from({length:32},(_,i)=>({pitch:'E5',step:i*2,len:2,velocity:100}));
const sparseResult=plain(api.adaptAccompaniment(sparse,prog,'A',pool));
const denseResult=plain(api.adaptAccompaniment(dense,prog,'A',pool));
assert.notDeepEqual(sparseResult.slice(1),denseResult.slice(1),'accompaniment responds to rhythm');
assert.ok(sparseResult[1].length>0);assert.equal(denseResult[1].length,0);
for(const output of [sparseResult,denseResult]){
 assert.deepEqual(output[5].map(n=>n.step),output[6].filter(n=>n.pitch==='C5').map(n=>n.step));
}
assert.deepEqual(parts,originalParts);
const beforeAdaptiveToggle=plain(api.state);nodes.get('#adaptiveAccompaniment').checked=true;nodes.get('#adaptiveAccompaniment').onchange();nodes.get('#undoBtn').onclick();assert.deepEqual(plain(api.state),beforeAdaptiveToggle);
console.log('PASS: adaptive accompaniment responds to melody, preserves lead/sound, aligns bass/kick, save/load, undo and OFF recovery');

(async()=>{
 const before=plain(api.state);await api.previewTheoryChords(api.patternProgression());
 const starts=auditionEvents.filter(e=>e[0]==='start');assert.equal(starts.length,12);
 assert.ok(starts.every(e=>Number.isFinite(e[1])));
 assert.ok(starts[3][1]>starts[0][1]);
 api.stopTheoryPreview();assert.deepEqual(plain(api.state),before);
 assert.ok(auditionEvents.some(e=>e[0]==='stop'&&e[1]===undefined));
 console.log('PASS: reverse lookup, history deduplication/restore/serialization, preview scheduling/stop and non-destructive audition.');
})().catch(error=>{console.error(error);process.exitCode=1;});




