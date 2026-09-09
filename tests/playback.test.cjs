const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf('function pumpStablePlayback(){'),html.indexOf('async function play(){'));
const nodes={};const calls=[];
const c={playing:true,audio:{currentTime:10},state:{bpm:120},step:0,patternSteps:64,totalSteps:768,stableTimer:null,
 stablePlayback:{nextTime:10.04,nextStep:0,queue:[],finished:false},
 $:id=>nodes[id]||(nodes[id]={style:{},checked:false}),
 allArrangedNotes:()=>[[{step:0,len:1},{step:1,len:1},{step:2,len:1}]],
 synth:(i,n,d,t)=>calls.push(t),syncPatternToPlayhead(){},format:String,currentBarFromStep:()=>1,updateArrangementHighlight(){},
 getLoopBounds:()=>({startStep:0,endStep:2}),setTimeout:()=>1,pause(){c.playing=false;}};
vm.createContext(c);vm.runInContext(source,c);c.pumpStablePlayback();
assert.equal(calls.length,2);assert.ok(Math.abs(calls[1]-calls[0]-.125)<1e-9);assert.equal(c.step,0);
c.audio.currentTime=10.17;c.pumpStablePlayback();assert.equal(c.step,1);
c.$('#loopToggle').checked=true;c.stablePlayback={nextTime:11.04,nextStep:1,queue:[],finished:false};c.audio.currentTime=11;c.pumpStablePlayback();
assert.deepEqual(Array.from(c.stablePlayback.queue,e=>e.step),[1,0]);
c.audio.currentTime=20;const before=calls.length;c.pumpStablePlayback();assert.ok(calls.length-before<=2);assert.ok(calls.at(-1)>20);
console.log('PASS: audio-clock lookahead, display timing, loop boundary and recovery without overdue bursts');
