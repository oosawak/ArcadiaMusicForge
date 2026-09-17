const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const code=html.slice(html.indexOf('const GAME_PLAY_PROFILES='),html.indexOf('function generationTempo('));
const ctx={clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),makeGeneratorRandom(seed){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}};
vm.createContext(ctx);vm.runInContext(code+';globalThis.profiles=GAME_PLAY_PROFILES;',ctx);
const pats=['INTRO','A','B','BREAK','CLIMAX','TURN'];
function song(id){return {genrePreset:id,generation:{seed:123},tracks:Array.from({length:7},(_,ti)=>({sound:{voice:'original'},patterns:Object.fromEntries(pats.map(p=>[p,Array.from({length:64},(_,step)=>({step,pitch:ti===6?['C5','D5','E5'][step%3]:['C5','E5','G5'][step%3],len:Math.min(2,64-step),velocity:90}))]))}))};}
const outputs=new Set();
for(const id of Object.keys(ctx.profiles)){
 const a=song(id),b=song(id),lead=JSON.stringify(a.tracks[0]);
 ctx.applyGamePlayProfile(a,123);ctx.applyGamePlayProfile(b,123);
 assert.equal(JSON.stringify(a),JSON.stringify(b),id+' deterministic');
 assert.equal(JSON.stringify(a.tracks[0]),lead,id+' lead preserved');
 assert.equal(a.generation.gamePlayProfile.id,id);
 for(let ti=1;ti<7;ti++)for(const p of pats){
  assert.equal(a.tracks[ti].sound.voice,'original');
  for(const n of a.tracks[ti].patterns[p]){
   assert.ok(n.step>=0&&n.step+n.len<=64&&n.len>0);
   assert.ok(n.velocity>=1&&n.velocity<=127);
   assert.ok(['C5','D5','E5','G5'].includes(n.pitch));
  }
 }
 outputs.add(JSON.stringify(a.tracks.slice(1)));
}
assert.equal(outputs.size,13,'all game arrangements differ for identical input');
const scene=song('dawn'),before=JSON.stringify(scene);ctx.applyGamePlayProfile(scene,123);assert.equal(JSON.stringify(scene),before);
assert.ok(html.includes('applyGamePlayProfile(state,seed);'),'wired into generation');
console.log('PASS: 13 distinct game profiles, deterministic output, lead/sound preservation, note bounds and scene isolation');
