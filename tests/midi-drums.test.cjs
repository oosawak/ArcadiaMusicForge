const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
let bytes;
const tracks=Array.from({length:7},()=>[{pitch:'C5',step:0,len:1,velocity:100},{pitch:'D5',step:2,len:1,velocity:90},{pitch:'E5',step:4,len:1,velocity:80}]);
const c={state:{bpm:120,tracks},allArrangedNotes:()=>tracks,midiOf:p=>({C5:72,D5:74,E5:76}[p]),clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),Uint8Array,Blob:class{constructor(parts){bytes=Buffer.from(parts[0]);}},URL:{createObjectURL:()=>'',revokeObjectURL(){}},document:{createElement:()=>({click(){}})},setTimeout(){},toast(){}};
vm.createContext(c);vm.runInContext(html.slice(html.indexOf('function writeVarLen('),html.indexOf('async function exportWav(')),c);c.exportMidi();
assert.equal(bytes.toString('ascii',0,4),'MThd');assert.equal(bytes.readUInt16BE(10),7);
let pos=14;
for(let track=0;track<7;track++){
 assert.equal(bytes.toString('ascii',pos,pos+4),'MTrk');const end=pos+8+bytes.readUInt32BE(pos+4);pos+=8;const events=[];
 while(pos<end){while(bytes[pos++]&128){} const status=bytes[pos++];if(status===255){pos++;const len=bytes[pos++];pos+=len;}else{events.push([status,bytes[pos++],bytes[pos++]]);}}
 const ch=track===6?9:track,notes=track===6?[36,38,42]:[72,74,76];
 assert.deepEqual(events,notes.flatMap((n,i)=>[[144|ch,n,100-i*10],[128|ch,n,0]]));
}
assert.equal(c.drumDisplayName('C5'),'KICK');assert.equal(c.drumDisplayName('D5'),'SNARE');assert.equal(c.drumDisplayName('E5'),'HAT');
console.log('PASS: exported MIDI drum channel 10 and GM 36/38/42, matched note-offs, unchanged melodic tracks');
