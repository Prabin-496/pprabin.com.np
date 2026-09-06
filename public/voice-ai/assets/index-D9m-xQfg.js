var ce=Object.defineProperty;var le=(e,t,n)=>t in e?ce(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n;var $=(e,t,n)=>le(e,typeof t!="symbol"?t+"":t,n);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const o of s)if(o.type==="childList")for(const i of o.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&a(i)}).observe(document,{childList:!0,subtree:!0});function n(s){const o={};return s.integrity&&(o.integrity=s.integrity),s.referrerPolicy&&(o.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?o.credentials="include":s.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function a(s){if(s.ep)return;s.ep=!0;const o=n(s);fetch(s.href,o)}})();const ue="voice-ai",de=2,y={sessions:"sessions",chunks:"chunks",segments:"segments",audio:"audio",chunkAudio:"chunkAudio",settings:"settings"};let H=null;function qt(){return H||(H=new Promise((e,t)=>{const n=indexedDB.open(ue,de);n.onupgradeneeded=()=>{const a=n.result;a.objectStoreNames.contains(y.sessions)||a.createObjectStore(y.sessions,{keyPath:"id"}).createIndex("createdAt","createdAt"),a.objectStoreNames.contains(y.chunks)||a.createObjectStore(y.chunks,{keyPath:"id"}).createIndex("sessionId","sessionId"),a.objectStoreNames.contains(y.segments)||a.createObjectStore(y.segments,{keyPath:"id"}).createIndex("sessionId","sessionId"),a.objectStoreNames.contains(y.audio)||a.createObjectStore(y.audio,{keyPath:"sessionId"}),a.objectStoreNames.contains(y.chunkAudio)||a.createObjectStore(y.chunkAudio,{keyPath:"id"}).createIndex("sessionId","sessionId"),a.objectStoreNames.contains(y.settings)||a.createObjectStore(y.settings,{keyPath:"key"})},n.onsuccess=()=>e(n.result),n.onerror=()=>t(n.error)}),H)}function E(e,t,n){return qt().then(a=>new Promise((s,o)=>{const i=a.transaction(e,t),c=n(i.objectStore(e));let l;c&&(c.onsuccess=()=>l=c.result),i.oncomplete=()=>s(l),i.onerror=()=>o(i.error),i.onabort=()=>o(i.error)}))}async function K(e,t){await E(e,"readwrite",n=>{t(n)})}async function bt(e,t,n){const a=await qt();return new Promise((s,o)=>{const i=a.transaction(e,"readonly").objectStore(e).index(t).getAll(n);i.onsuccess=()=>s(i.result),i.onerror=()=>o(i.error)})}async function St(e){const t={...e,updatedAt:Date.now()};return await E(y.sessions,"readwrite",n=>n.put(t)),t}function X(e){return E(y.sessions,"readonly",t=>t.get(e))}async function mt(){return(await E(y.sessions,"readonly",t=>t.getAll())||[]).sort((t,n)=>n.createdAt-t.createdAt)}async function D(e,t){const n=await X(e);if(n)return St({...n,...t})}async function gt(e){const[t,n]=await Promise.all([Z(e),Vt(e)]);await E(y.sessions,"readwrite",a=>a.delete(e)),await E(y.audio,"readwrite",a=>a.delete(e)),await kt(e),await E(y.chunks,"readwrite",a=>{t.forEach(s=>a.delete(s.id))}),await E(y.segments,"readwrite",a=>{n.forEach(s=>a.delete(s.id))})}const Q=(e,t)=>`${e}:${t}`;function he(e){return E(y.chunks,"readwrite",t=>{e.forEach(n=>t.put(n))})}function Wt(e){return K(y.chunks,t=>t.put(e))}async function Z(e){return(await bt(y.chunks,"sessionId",e)).sort((n,a)=>n.index-a.index)}function pe(e,t,n){const a=n.map((s,o)=>({...s,id:`${e}:${t}:${o}`,sessionId:e,chunkIndex:t}));return E(y.segments,"readwrite",s=>{a.forEach(o=>s.put(o))})}async function Vt(e){return(await bt(y.segments,"sessionId",e)).sort((n,a)=>n.chunkIndex-a.chunkIndex||n.atSec-a.atSec)}function fe(e,t){return K(y.audio,n=>n.put({sessionId:e,file:t,storedAt:Date.now()}))}async function me(e){const t=await E(y.audio,"readonly",n=>n.get(e));return(t==null?void 0:t.file)||null}function Kt(e){return K(y.audio,t=>t.delete(e))}function ge(e,t,n){return K(y.chunkAudio,a=>a.put({id:Q(e,t),sessionId:e,index:t,blob:n}))}async function ye(e,t){const n=await E(y.chunkAudio,"readonly",a=>a.get(Q(e,t)));return(n==null?void 0:n.blob)||null}async function kt(e){const t=await bt(y.chunkAudio,"sessionId",e);await E(y.chunkAudio,"readwrite",n=>{t.forEach(a=>n.delete(a.id))})}const Ht={apiKey:"",model:"gemini-2.5-flash",chunkSeconds:300,retentionDays:7,profileName:"",profileRole:"",assumeNoJapanese:!0};async function we(){const e=await E(y.settings,"readonly",t=>t.get("settings"));return{...Ht,...(e==null?void 0:e.value)||{}}}function be(e){return K(y.settings,t=>t.put({key:"settings",value:e}))}async function Se(e){const t=await mt(),n=Date.now()-e*24*60*60*1e3;let a=0;for(const s of t){if(e>0&&s.createdAt<n){await gt(s.id),a++;continue}s.status==="done"&&!s.audioDropped&&(await Kt(s.id),await kt(s.id),await D(s.id,{audioDropped:!0}))}return a}async function ke(){var n;if(!((n=navigator.storage)!=null&&n.estimate))return null;const{usage:e=0,quota:t=0}=await navigator.storage.estimate();return{usage:e,quota:t}}function $e(e){return(e==null?void 0:e.trim().replace(/\/$/,""))||""}const ve=$e("");function tt(e,t={}){const n=new URLSearchParams({path:e});for(const[a,s]of Object.entries(t))s!==""&&s!==void 0&&s!==null&&n.set(a,String(s));return`${ve}/api/voice?${n}`}class W extends Error{constructor(n,a,s){super(n);$(this,"status");$(this,"code");this.status=a,this.code=s}get retryable(){return this.status===429||this.status>=500||this.status===0}get fatal(){return this.status===401||this.code==="NO_API_KEY"}}async function et(e){if(!e.ok){let t=`HTTP ${e.status}`,n;try{const a=await e.json();t=a.error||t,n=a.code}catch{}throw new W(t,e.status,n)}return e.json()}function nt(e){throw e instanceof W?e:new W(e instanceof Error&&e.name==="AbortError"?"Request timed out":"No connection to the server",0)}async function Ae(){try{return await et(await fetch(tt("health")))}catch(e){return nt(e)}}async function Jt(e){try{const t=await fetch(tt("transcribe",{model:e.model,mime:e.mimeType,offset:Math.round(e.offsetSeconds),context:e.context||""}),{method:"POST",headers:{"Content-Type":e.mimeType,"x-gemini-key":e.apiKey},body:e.blob,signal:e.signal});return(await et(t)).chunk}catch(t){return nt(t)}}async function Te(e){try{const t=await fetch(tt("digest"),{method:"POST",headers:{"Content-Type":"application/json","x-gemini-key":e.apiKey},body:JSON.stringify({model:e.model,transcript:e.transcript})});return(await et(t)).digest}catch(t){return nt(t)}}async function xe(e){try{const t=await fetch(tt("analyze"),{method:"POST",headers:{"Content-Type":"application/json","x-gemini-key":e.apiKey},body:JSON.stringify({model:e.model,digests:e.digests,profile:e.profile,assumeNoJapanese:e.assumeNoJapanese})});return(await et(t)).analysis}catch(t){return nt(t)}}function Ee(e,t){const a=String(e||"").split(":").map(s=>Number(s.trim())||0).reduce((s,o)=>s*60+o,0);return t+a}function De(e,t){return e.segments.map(n=>({speaker:n.speaker,speakerRole:n.speaker_role,atSec:Ee(n.at,t),original:n.original,english:n.english}))}const Mt=[96e3,88200,64e3,48e3,44100,32e3,24e3,22050,16e3,12e3,11025,8e3,7350];class P extends Error{}function Ce(e){if(e.length<2)throw new P("Audio config is too short to read");const t=e[0]<<8|e[1];let n=t>>11&31,a=t>>7&15,s=t>>3&15;if(n===31)throw new P("Escaped AAC object types are not supported");if(n===5||n===29){if(a===15)throw new P("Explicit sample rates are not supported");a=Math.min(a+3,Mt.length-1);const i=((e[1]&7)<<8|(e.length>2?e[2]:0))>>4&15;i&&(s=i),n=2}if(a===15)throw new P("Explicit sample rates are not supported");if(n<1||n>4)throw new P(`AAC object type ${n} cannot be written as ADTS`);if(s<1||s>7)throw new P("Unusual channel layout — cannot write an ADTS header");return{profileMinusOne:n-1,samplingFrequencyIndex:a,channelConfiguration:s,sampleRate:Mt[a]}}const yt=7;function Me(e,t,n,a){const s=a+yt;e[t]=255,e[t+1]=241,e[t+2]=n.profileMinusOne<<6|n.samplingFrequencyIndex<<2|n.channelConfiguration>>2&1,e[t+3]=(n.channelConfiguration&3)<<6|s>>11&3,e[t+4]=s>>3&255,e[t+5]=(s&7)<<5|31,e[t+6]=252}function Ue(e){return e.length>=7&&e[0]===255&&(e[1]&240)===240}class Ut extends Error{}class B extends Error{}const Re=32;async function Gt(e,t,n){const a=await e.slice(t,Math.min(n,e.size)).arrayBuffer();return new DataView(a)}function at(e,t){return String.fromCharCode(e.getUint8(t),e.getUint8(t+1),e.getUint8(t+2),e.getUint8(t+3))}async function Rt(e,t){let n=0;for(;n+8<=e.size;){const a=await Gt(e,n,n+Re);if(a.byteLength<8)return null;let s=a.getUint32(0);const o=at(a,4);let i=8;if(s===1){if(a.byteLength<16)return null;s=Number(a.getBigUint64(8)),i=16}else s===0&&(s=e.size-n);if(s<i)return null;if(o===t)return{type:o,start:n,size:s,headerSize:i};n+=s}return null}function*$t(e,t,n){let a=t;for(;a+8<=n;){let s=e.getUint32(a);const o=at(e,a+4);let i=8;if(s===1){if(a+16>n)return;s=Number(e.getBigUint64(a+8)),i=16}else s===0&&(s=n-a);if(s<i||a+s>n)return;yield{type:o,start:a,size:s,headerSize:i},a+=s}}function N(e,t,n){for(const a of $t(e,t.start+t.headerSize,t.start+t.size))if(a.type===n)return a;return null}function it(e,t,n){let a=t;for(const s of n){if(!a)return null;a=N(e,a,s)}return a}function Ne(e,t){const n=t.start+t.headerSize+4,a=e.getUint32(n),s=[];for(let o=0;o<a;o++){const i=n+4+o*8;s.push({count:e.getUint32(i),delta:e.getUint32(i+4)})}return s}function _e(e,t){const n=t.start+t.headerSize+4,a=e.getUint32(n),s=e.getUint32(n+4),o=new Uint32Array(s);if(a!==0)return o.fill(a),o;for(let i=0;i<s;i++)o[i]=e.getUint32(n+8+i*4);return o}function Ie(e,t){const n=t.start+t.headerSize+4,a=e.getUint32(n),s=[];for(let o=0;o<a;o++){const i=n+4+o*12;s.push({firstChunk:e.getUint32(i),samplesPerChunk:e.getUint32(i+4)})}return s}function je(e,t){const n=N(e,t,"stco"),a=n?null:N(e,t,"co64"),s=n||a;if(!s)throw new B("Track has no chunk offset table");const o=s.start+s.headerSize+4,i=e.getUint32(o),c=new Float64Array(i);for(let l=0;l<i;l++)c[l]=n?e.getUint32(o+4+l*4):Number(e.getBigUint64(o+4+l*8));return c}function Le(e,t,n){const a=new Float64Array(e.length);let s=0;for(let o=0;o<t.length&&s<e.length;o++){const{firstChunk:i,samplesPerChunk:c}=t[o],l=o+1<t.length?t[o+1].firstChunk-1:n.length;for(let u=i;u<=l&&s<e.length;u++){let m=n[u-1];if(m===void 0)break;for(let p=0;p<c&&s<e.length;p++)a[s]=m,m+=e[s],s++}}if(s<e.length)throw new B("Sample table is incomplete or inconsistent");return a}function Pe(e,t,n){const a=new Float64Array(t);let s=0,o=0;for(const{count:c,delta:l}of e)for(let u=0;u<c&&s<t;u++)a[s++]=o/n,o+=l;const i=e.length?e[e.length-1].delta:1024;for(;s<t;)a[s++]=o/n,o+=i;return a}function Be(e,t){let n=t.start+t.headerSize+4;const a=t.start+t.size,s=()=>{let o=0;for(let i=0;i<4&&n<a;i++){const c=e.getUint8(n++);if(o=o<<7|c&127,!(c&128))break}return o};for(;n<a;){const o=e.getUint8(n++),i=s(),c=n;if(o===3){n+=2;const l=e.getUint8(n++);l&128&&(n+=2),l&64&&(n+=1+e.getUint8(n)),l&32&&(n+=2);continue}if(o===4){n+=13;continue}if(o===5){const l=new Uint8Array(i);for(let u=0;u<i;u++)l[u]=e.getUint8(c+u);return l}n=c+i}return null}function Oe(e,t){const n=N(e,t,"stsd");if(!n)throw new B("Track has no sample description");const a=n.start+n.headerSize+4;if(!e.getUint32(a))throw new B("Empty sample description");const o=a+4,i=e.getUint32(o),c=at(e,o+4),l=e.getUint16(o+16),u=e.getUint16(o+24),m=e.getUint16(o+32),p=o+36+(l===1?16:0);let g=null;for(const b of $t(e,p,o+i))if(b.type==="esds"){g=Be(e,b);break}return{format:c,channels:u,sampleRate:m,asc:g}}async function ze(e){const t=await Rt(e,"ftyp"),n=await Rt(e,"moov");if(!t&&!n)throw new Ut("Not an MP4/M4A file");if(!n)throw new Ut("MP4 has no moov box (file may be truncated)");const a=await Gt(e,n.start,n.start+n.size),s={...n};for(const o of $t(a,s.headerSize,s.size)){if(o.type!=="trak")continue;const i=it(a,o,["mdia","hdlr"]);if(!i||at(a,i.start+i.headerSize+8)!=="soun")continue;const c=it(a,o,["mdia","mdhd"]),l=it(a,o,["mdia","minf","stbl"]);if(!c||!l)continue;const u=a.getUint8(c.start+c.headerSize),m=c.start+c.headerSize+4,p=u===1?a.getUint32(m+16):a.getUint32(m+8),g=u===1?Number(a.getBigUint64(m+20)):a.getUint32(m+12),{format:b,channels:S,sampleRate:M,asc:k}=Oe(a,l),A=N(a,l,"stts"),_=N(a,l,"stsz"),I=N(a,l,"stsc");if(!A||!_||!I)throw new B("Audio track is missing its sample table");const v=_e(a,_),ot=Le(v,Ie(a,I),je(a,l)),O=Pe(Ne(a,A),v.length,p||1);return{format:b,timescale:p||1,durationSec:p?g/p:0,asc:k,sampleRate:M,channels:S,sampleCount:v.length,offsets:ot,sizes:v,startTimes:O}}throw new B("No audio track found in this file")}class ct extends Error{}async function Fe(e){const t=new DataView(await e.slice(0,Math.min(65536,e.size)).arrayBuffer());if(t.byteLength<12)throw new ct("File is too short to be a WAV");const n=o=>String.fromCharCode(t.getUint8(o),t.getUint8(o+1),t.getUint8(o+2),t.getUint8(o+3));if(n(0)!=="RIFF"||n(8)!=="WAVE")throw new ct("Not a RIFF/WAVE file");let a=12,s={};for(;a+8<=t.byteLength;){const o=n(a),i=t.getUint32(a+4,!0);if(o==="fmt ")s={...s,channels:t.getUint16(a+10,!0),sampleRate:t.getUint32(a+12,!0),byteRate:t.getUint32(a+16,!0),blockAlign:t.getUint16(a+20,!0),bitsPerSample:t.getUint16(a+22,!0)};else if(o==="data"){s.dataStart=a+8,s.dataLength=i>0&&i!==4294967295?i:e.size-(a+8);break}a+=8+i+i%2}if(s.dataStart===void 0||!s.blockAlign)throw new ct("WAV file is missing its fmt or data chunk");return s}function vt(e,t){const n=new Uint8Array(new ArrayBuffer(44)),a=new DataView(n.buffer),s=e.channels*e.bitsPerSample/8,o=(i,c)=>{for(let l=0;l<c.length;l++)n[i+l]=c.charCodeAt(l)};return o(0,"RIFF"),a.setUint32(4,36+t,!0),o(8,"WAVE"),o(12,"fmt "),a.setUint32(16,16,!0),a.setUint16(20,1,!0),a.setUint16(22,e.channels,!0),a.setUint32(24,e.sampleRate,!0),a.setUint32(28,e.sampleRate*s,!0),a.setUint16(32,s,!0),a.setUint16(34,e.bitsPerSample,!0),o(36,"data"),a.setUint32(40,t,!0),n}function qe(e,t){const n=new Uint8Array(new ArrayBuffer(e.length*2)),a=new DataView(n.buffer);for(let s=0;s<e.length;s++){const o=Math.max(-1,Math.min(1,e[s]));a.setInt16(s*2,o<0?o*32768:o*32767,!0)}return new Blob([vt({channels:1,sampleRate:t,bitsPerSample:16},n.length),n],{type:"audio/wav"})}const We=300,Ve=7200,Ke=16e3,He=8*1024*1024;class U extends Error{}async function Yt(e){const t=new Uint8Array(await e.slice(0,12).arrayBuffer());if(t.length<12)throw new U("That file is too small to contain audio.");const n=(a,s)=>String.fromCharCode(...t.subarray(a,a+s));return n(4,4)==="ftyp"?"mp4":n(0,4)==="RIFF"&&n(8,4)==="WAVE"?"wav":"other"}const lt=3,Xt=2,Je=-58,Ge=28;let J;function Qt(){if(J!==void 0)return J;const e=typeof window>"u"?null:window.AudioContext||window.webkitAudioContext||null;return J=e?new e:null,J}function At(e,t){const n=Math.max(1,Math.floor(t*.25)),a=[];for(let o=0;o+n<=e.length;o+=n){let i=0;for(let c=o;c<o+n;c++)i+=e[c]*e[c];a.push(Math.sqrt(i/n))}if(!a.length)return-1/0;a.sort((o,i)=>o-i);const s=a[Math.min(a.length-1,Math.floor(a.length*.9))];return s>0?20*Math.log10(s):-1/0}function Zt(e,t,n){if(t<=n*lt)return[[e,e+t]];const a=[];for(let s=0;s<lt;s++){const o=e+Math.floor((s+.5)/lt*t)-Math.floor(n/2);a.push([Math.max(e,o),Math.min(e+t,Math.max(e,o)+n)])}return a}async function te(e){const t=Qt();if(!t)return null;try{const n=await t.decodeAudioData(await e.arrayBuffer());return At(n.getChannelData(0),n.sampleRate)}catch{return null}}function Ye(e){const t=e.filter(s=>s!==null&&isFinite(s));if(!t.length)return-1/0;const n=[...t].sort((s,o)=>s-o),a=n[Math.min(n.length-1,Math.floor(n.length*.9))];return Math.max(Je,a-Ge)}function Xe(e,t){const n=[],a=[];let s=0;for(let o=1;o<=e.sampleCount;o++){const i=o===e.sampleCount,c=i?1/0:e.startTimes[o]-e.startTimes[s];if(!i&&c<t)continue;const l=e.startTimes[s],u=i?e.durationSec||e.startTimes[o-1]:e.startTimes[o];n.push({index:n.length,startSec:l,durationSec:Math.max(0,u-l)}),a.push({first:s,last:o-1}),s=o}return{specs:n,ranges:a}}async function Nt(e,t,n,a){let s=0;for(let l=a.first;l<=a.last;l++)s+=t.sizes[l]+yt;const o=new Uint8Array(new ArrayBuffer(s));let i=0,c=a.first;for(;c<=a.last;){const l=t.offsets[c];let u=l+t.sizes[c],m=c;for(;m+1<=a.last&&t.offsets[m+1]===u&&u-l+t.sizes[m+1]<=He;)m++,u+=t.sizes[m];const p=new Uint8Array(await e.slice(l,u).arrayBuffer());let g=0;for(let b=c;b<=m;b++){const S=t.sizes[b];Me(o,i,n,S),i+=yt,o.set(p.subarray(g,g+S),i),i+=S,g+=S}c=m+1}return new Blob([o],{type:"audio/aac"})}async function ee(e,t){const n=await ze(e);if(n.format!=="mp4a"||!n.asc)throw new U(`Track is ${n.format}, not AAC`);const a=Ce(n.asc),{specs:s,ranges:o}=Xe(n,t);if(!s.length)throw new U("Recording contains no audio frames");const i=n.sampleCount/Math.max(1,n.durationSec),c=Math.max(8,Math.round(i*Xt));return{strategy:"aac-remux",mimeType:"audio/aac",totalDurationSec:n.durationSec||s[s.length-1].startSec,specs:s,read:l=>Nt(e,n,a,o[l.index]),async measureLevel(l){const u=o[l.index],m=Zt(u.first,u.last-u.first+1,c);let p=-1/0;for(const[g,b]of m){const S=await te(await Nt(e,n,a,{first:g,last:b-1}));if(S===null)return null;p=Math.max(p,S)}return p}}}async function Qe(e){const t=await e.read(e.specs[0]),n=new Uint8Array(await t.slice(0,16).arrayBuffer());if(!Ue(n))throw new U("Remuxed audio has no ADTS syncword");const a=Qt();if(a)try{await a.decodeAudioData(await t.slice(0,Math.min(t.size,256*1024)).arrayBuffer())}catch{}}async function Ze(e,t){const n=await Fe(e),a=n.sampleRate*n.blockAlign;if(!a)throw new U("WAV header has no usable sample rate");const s=n.dataLength/a,o=[];for(let c=0;c<s;c+=t)o.push({index:o.length,startSec:c,durationSec:Math.min(t,s-c)});const i=async c=>{const l=Math.floor(c.startSec*a),u=n.dataStart+l-l%n.blockAlign,m=Math.min(n.dataStart+n.dataLength,u+Math.ceil(c.durationSec*a)),p=e.slice(u,m);return new Blob([vt(n,p.size),p],{type:"audio/wav"})};return{strategy:"wav-slice",mimeType:"audio/wav",totalDurationSec:s,specs:o,read:i,async measureLevel(c){if(n.bitsPerSample!==16)return te(await i(c));const l=n.sampleRate*n.blockAlign*Xt,u=n.dataStart+Math.floor(c.startSec*a),m=Math.floor(c.durationSec*a);let p=-1/0;for(const[g,b]of Zt(u,m,l)){const S=new DataView(await e.slice(g,b).arrayBuffer()),M=Math.floor(S.byteLength/2/n.channels),k=new Float32Array(M);for(let A=0;A<M;A++)k[A]=S.getInt16(A*n.blockAlign,!0)/32768;p=Math.max(p,At(k,n.sampleRate))}return p}}}async function tn(e,t){const n=new(window.AudioContext||window.webkitAudioContext)({sampleRate:Ke});let a;try{a=await n.decodeAudioData(await e.arrayBuffer())}catch{throw new U("This audio format could not be read by your browser.")}finally{n.close()}if(a.duration>Ve)throw new U(`This ${Math.round(a.duration/60)} minute file is in a format that has to be decoded in full, which will not fit in memory. Re-record with Voice Memos set to Compressed (Settings → Voice Memos → Audio Quality), or convert it to .m4a first.`);const s=en(a),o=a.sampleRate,i=[];for(let c=0;c<a.duration;c+=t)i.push({index:i.length,startSec:c,durationSec:Math.min(t,a.duration-c)});return{strategy:"decode",mimeType:"audio/wav",totalDurationSec:a.duration,specs:i,async read(c){const l=Math.floor(c.startSec*o),u=Math.min(s.length,Math.ceil((c.startSec+c.durationSec)*o));return qe(s.subarray(l,u),o)},async measureLevel(c){const l=Math.floor(c.startSec*o),u=Math.min(s.length,Math.ceil((c.startSec+c.durationSec)*o));return At(s.subarray(l,u),o)}}}function en(e){if(e.numberOfChannels===1)return e.getChannelData(0);const t=new Float32Array(e.length);for(let n=0;n<e.numberOfChannels;n++){const a=e.getChannelData(n);for(let s=0;s<a.length;s++)t[s]+=a[s]}for(let n=0;n<t.length;n++)t[n]/=e.numberOfChannels;return t}async function nn(e,t){if(await Yt(e)!=="mp4")return{blob:e,mimeType:t||e.type||"audio/webm"};try{const n=await ee(e,Number.MAX_SAFE_INTEGER);return{blob:await n.read(n.specs[0]),mimeType:"audio/aac"}}catch(n){return console.warn("[split] could not remux recorded segment, sending as captured:",n),{blob:e,mimeType:t||"audio/mp4"}}}async function ne(e,t=We){const n=await Yt(e);if(n==="mp4")try{const a=await ee(e,t);return await Qe(a),a}catch(a){if(a instanceof U&&/no audio frames/.test(a.message))throw a;console.warn("[split] AAC remux unavailable, decoding instead:",a)}if(n==="wav")try{return await Ze(e,t)}catch(a){console.warn("[split] WAV slicing unavailable, decoding instead:",a)}return tn(e,t)}const _t=8,It=7e3,ut=4;class jt extends Error{}let C=null;function Lt(){return(C==null?void 0:C.sessionId)??null}function Pt(){C==null||C.cancel()}const Bt=e=>new Promise(t=>{setTimeout(t,e)});class an{constructor(){$(this,"last",0)}async wait(){const t=Date.now()-this.last;t<It&&await Bt(It-t),this.last=Date.now()}penalise(t){return Bt(Math.min(6e4,5e3*2**t))}}async function sn(e,t,n){const a=crypto.randomUUID(),s=Date.now(),o={id:a,title:e.name.replace(/\.[^.]+$/,"")||"Imported recording",source:"import",status:"planning",createdAt:s,updatedAt:s,chunkSeconds:t.chunkSeconds,totalDurationSec:0,chunkTotal:0,chunkDone:0,languages:[],digests:[],analysis:null};await St(o),n==null||n({sessionId:a,phase:"planning",chunkDone:0,chunkTotal:0,message:"Reading the recording…"}),await rn(a,e);const i=await ne(e,t.chunkSeconds),c=await on(i,(u,m)=>n==null?void 0:n({sessionId:a,phase:"scanning",chunkDone:u,chunkTotal:m,message:"Checking which stretches have speech in them"})),l=i.specs.map(u=>({id:Q(a,u.index),sessionId:a,index:u.index,startSec:u.startSec,durationSec:u.durationSec,status:c.has(u.index)?"skipped":"pending",attempts:0}));return await he(l),await D(a,{status:"transcribing",strategy:i.strategy,mimeType:i.mimeType,totalDurationSec:i.totalDurationSec,chunkTotal:l.length,chunkDone:l.filter(u=>u.status==="skipped").length}),a}async function on(e,t){const n=[];for(const o of e.specs){t(o.index,e.specs.length);try{n.push(await e.measureLevel(o))}catch{n.push(null)}}const a=Ye(n),s=new Set;return n.forEach((o,i)=>{o!==null&&isFinite(a)&&o<a&&s.add(i)}),s.size===e.specs.length?new Set:s}async function rn(e,t){try{await fe(e,t)}catch(n){console.warn("[pipeline] could not store source audio; run will not be resumable",n)}}async function cn(e,t){const n=crypto.randomUUID(),a=Date.now();return await St({id:n,title:`Recording ${new Date().toLocaleString()}`,source:"live",status:"transcribing",createdAt:a,updatedAt:a,chunkSeconds:e.chunkSeconds,totalDurationSec:0,chunkTotal:0,chunkDone:0,languages:[],digests:[],analysis:null}),n}async function ln(e,t){const n=await nn(t.blob,t.mimeType);await ge(e,t.index,n.blob),await Wt({id:Q(e,t.index),sessionId:e,index:t.index,startSec:t.startSec,durationSec:t.durationSec,status:"pending",attempts:0,mimeType:n.mimeType,gapBefore:t.gapBefore});const a=await X(e);await D(e,{chunkTotal:Math.max((a==null?void 0:a.chunkTotal)||0,t.index+1),totalDurationSec:t.startSec+t.durationSec})}async function un(e,t,n){var i,c;if(C)throw new Error("Another recording is already being processed.");if(!t.apiKey.trim())throw new jt("Add your Gemini API key in Settings before processing.");let a=!1;C={sessionId:e,cancel:()=>a=!0};const s=new an,o=l=>n==null?void 0:n({sessionId:e,...l});try{const l=await X(e);if(!l)throw new Error("That session no longer exists.");const u=await Z(e),m=u.filter(k=>k.status==="pending"||k.status==="error").map(k=>k.status==="error"?{...k,attempts:0}:k),p=m.length?await dn(l):null;let g=u.filter(k=>k.status!=="pending"&&k.status!=="error").length,b="",S=0;const M=Date.now();for(const k of m){if(a){await D(e,{status:"paused"}),o({phase:"paused",chunkDone:g,chunkTotal:u.length,message:"Paused"});return}const A=p.locate(k);if(!A)continue;const _=(Date.now()-M)/1e3,I=m.length-S;o({phase:"transcribing",chunkDone:g,chunkTotal:u.length,message:`Transcribing ${wt(A.startSec)}–${wt(A.startSec+A.durationSec)}`,etaSeconds:S?Math.round(_/S*I):void 0});const v=await hn({chunk:k,spec:A,read:()=>p.read(k),settings:t,context:b,pacer:s,isCancelled:()=>a});if(S++,await Wt(v),v.status==="done"&&((i=v.segments)!=null&&i.length)&&(await pe(e,v.index,v.segments),b=pn(v.segments,b)),(v.status==="done"||v.status==="skipped")&&g++,await D(e,{chunkDone:g}),v.status==="error"&&((c=v.error)!=null&&c.startsWith("KEY:")))throw new jt(v.error.slice(4))}await fn(e,t,s,o,()=>a)}catch(l){const u=l instanceof Error?l.message:String(l);throw await D(e,{status:"error",error:u}),o({phase:"error",chunkDone:0,chunkTotal:0,message:u}),l}finally{C=null}}async function dn(e){if(e.source==="live")return{locate:a=>({startSec:a.startSec,durationSec:a.durationSec}),async read(a){const s=await ye(e.id,a.index);if(!s)throw new Error(`Segment ${a.index+1} is missing from storage`);return{blob:s,mimeType:a.mimeType||"audio/aac"}}};const t=await me(e.id);if(!t)throw new Error("The source audio for this session is gone, so the remaining chunks cannot be transcribed. Import the file again to finish it.");const n=await ne(t,e.chunkSeconds);return{locate:a=>n.specs[a.index]||null,async read(a){const s=n.specs[a.index];return{blob:await n.read(s),mimeType:n.mimeType}}}}async function hn(e){const{chunk:t,spec:n,read:a,settings:s,context:o,pacer:i,isCancelled:c}=e;let l=t.attempts;for(;l<ut;){if(c())return{...t,attempts:l};try{await i.wait();const{blob:u,mimeType:m}=await a(),p=await Jt({apiKey:s.apiKey,model:s.model,blob:u,mimeType:m,offsetSeconds:n.startSec,context:o}),g=De(p,n.startSec);return{...t,attempts:l+1,status:g.length?"done":"skipped",error:void 0,segments:g,languages:p.detected_languages,confidence:p.confidence}}catch(u){if(l++,u instanceof W&&u.fatal)return{...t,attempts:l,status:"error",error:`KEY:${u.message}`};if(u instanceof W&&u.retryable&&l<ut){await i.penalise(l);continue}if(l>=ut)return{...t,attempts:l,status:"error",error:u instanceof Error?u.message:String(u)}}}return{...t,attempts:l,status:"error",error:"Gave up after repeated failures"}}function pn(e,t){const n=e.map(s=>s.speakerRole).filter(Boolean);return[...new Set([...t.split(" · ").filter(Boolean),...n])].join(" · ").slice(0,500)}async function fn(e,t,n,a,s){const o=await Z(e),i=o.filter(g=>{var b;return(b=g.segments)==null?void 0:b.length});if(!i.length){await D(e,{status:"done",error:"No speech was found in this recording."}),a({phase:"done",chunkDone:o.length,chunkTotal:o.length,message:"No speech found"});return}await D(e,{status:"summarising"});const c=[];for(let g=0;g<i.length;g+=_t)c.push(i.slice(g,g+_t));const l=[];for(const[g,b]of c.entries()){if(s()){await D(e,{status:"paused"}),a({phase:"paused",chunkDone:0,chunkTotal:0,message:"Paused"});return}a({phase:"summarising",chunkDone:g,chunkTotal:c.length,message:`Condensing section ${g+1} of ${c.length}`}),await n.wait();try{l.push(await Te({apiKey:t.apiKey,model:t.model,transcript:mn(b)}))}catch(S){console.warn("[pipeline] digest failed for section",g,S),l.push({period:`Section ${g+1}`,notes:"(this section could not be condensed)"})}}await D(e,{digests:l}),a({phase:"summarising",chunkDone:c.length,chunkTotal:c.length,message:"Writing the summary and reading the room…"}),await n.wait();const u=await xe({apiKey:t.apiKey,model:t.model,digests:gn(l),profile:{name:t.profileName,role:t.profileRole},assumeNoJapanese:t.assumeNoJapanese}),m=[...new Set(o.flatMap(g=>g.languages||[]))],p=await X(e);await D(e,{status:"done",analysis:u,languages:m,error:void 0,title:u.title||(p==null?void 0:p.title)||"Recording",audioDropped:!0}),await Kt(e),await kt(e),a({phase:"done",chunkDone:o.length,chunkTotal:o.length,message:"Finished"})}function mn(e){return e.flatMap(t=>t.segments||[]).map(t=>`[${wt(t.atSec)}] ${t.speaker}${t.speakerRole?` (${t.speakerRole})`:""}: ${t.original}${t.english?`
    EN: ${t.english}`:""}`).join(`
`)}function gn(e){return e.map((t,n)=>{var s,o,i;const a=[`## Section ${n+1}${t.period?` — ${t.period}`:""}`];return t.notes&&a.push(t.notes),(s=t.decisions)!=null&&s.length&&a.push(`Decisions: ${t.decisions.join("; ")}`),(o=t.commitments)!=null&&o.length&&a.push(`Commitments: ${t.commitments.map(c=>`${c.who||"?"} — ${c.what||""}${c.when?` (${c.when})`:""}`).join("; ")}`),(i=t.japanese_terms)!=null&&i.length&&a.push(`Japanese: ${t.japanese_terms.map(c=>`${c.term}${c.reading?`(${c.reading})`:""} = ${c.meaning}`).join("; ")}`),t.tone_notes&&a.push(`Tone: ${t.tone_notes}`),a.join(`
`)}).join(`

`)}function wt(e){const t=Math.max(0,Math.round(e||0)),n=Math.floor(t/3600),a=Math.floor(t%3600/60),s=t%60;return n?`${n}:${String(a).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${a}:${String(s).padStart(2,"0")}`}const yn=300,wn=32e3;class bn{constructor(t,n=yn){$(this,"state","idle");$(this,"mimeType","audio/mp4");$(this,"stream",null);$(this,"recorder",null);$(this,"context",null);$(this,"clock",null);$(this,"fallbackTimer",null);$(this,"wakeLock",null);$(this,"segmentIndex",0);$(this,"segmentHandled",Promise.resolve());$(this,"elapsedSec",0);$(this,"segmentStartedAt",0);$(this,"pendingGap",!1);$(this,"segmentSeconds");$(this,"events");this.events=t,this.segmentSeconds=n,this.handleVisibility=this.handleVisibility.bind(this)}get elapsedSeconds(){return this.elapsedSec+(this.segmentStartedAt?(Date.now()-this.segmentStartedAt)/1e3:0)}async start(){this.state==="idle"&&(this.stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:!0,noiseSuppression:!0,autoGainControl:!0}}),await this.startClock(),this.startSegment(),this.setState("recording"),document.addEventListener("visibilitychange",this.handleVisibility),this.watchTrack(),this.acquireWakeLock())}pause(){this.state!=="recording"||!this.recorder||(this.recorder.pause(),this.setState("paused"))}resume(){this.state!=="paused"||!this.recorder||(this.recorder.resume(),this.setState("recording"))}async stop(){this.state!=="idle"&&(document.removeEventListener("visibilitychange",this.handleVisibility),await this.finishSegment(),await this.segmentHandled,await this.teardown(),this.setState("idle"))}async startClock(){const t=window.AudioContext||window.webkitAudioContext;this.context=new t,this.context.state==="suspended"&&await this.context.resume();const n=this.context.createMediaStreamSource(this.stream);try{await this.context.audioWorklet.addModule("/voice-ai/segment-clock.js"),this.clock=new AudioWorkletNode(this.context,"segment-clock",{numberOfOutputs:1,processorOptions:{segmentSeconds:this.segmentSeconds}}),this.clock.port.onmessage=s=>this.onClockMessage(s.data);const a=this.context.createGain();a.gain.value=0,n.connect(this.clock).connect(a).connect(this.context.destination)}catch(a){console.warn("[recorder] AudioWorklet unavailable, using a timer",a),this.fallbackTimer=setInterval(()=>void this.rotate(),this.segmentSeconds*1e3)}}onClockMessage(t){if(t.type==="level"){this.events.onLevel(t.rms||0,t.peak||0);return}t.type==="segment"&&this.state==="recording"&&this.rotate()}startSegment(){var c;if(!this.stream)return;const t={audioBitsPerSecond:wn};for(const l of["audio/mp4","audio/webm;codecs=opus","audio/webm"])if((c=MediaRecorder.isTypeSupported)!=null&&c.call(MediaRecorder,l)){t.mimeType=l;break}const n=new MediaRecorder(this.stream,t);this.recorder=n,this.mimeType=n.mimeType||t.mimeType||"audio/mp4";const a=[],s=this.segmentIndex++,o=this.elapsedSec,i=this.pendingGap;this.pendingGap=!1,this.segmentStartedAt=Date.now(),n.ondataavailable=l=>{l.data.size>0&&a.push(l.data)},n.onstop=()=>{const l=(Date.now()-this.segmentStartedAt)/1e3;this.elapsedSec+=l,this.segmentStartedAt=0,a.length&&(this.segmentHandled=Promise.resolve(this.events.onSegment({index:s,blob:new Blob(a,{type:this.mimeType}),mimeType:this.mimeType,startSec:o,durationSec:l,gapBefore:i})).catch(u=>{console.error("[recorder] segment handler failed",u)}))},n.start(1e3)}finishSegment(){const t=this.recorder;return!t||t.state==="inactive"?Promise.resolve():new Promise(n=>{t.addEventListener("stop",()=>n(),{once:!0});try{t.stop()}catch{n()}})}async rotate(){this.state==="recording"&&(await this.finishSegment(),this.state==="recording"&&this.startSegment())}async flush(){await this.segmentHandled}watchTrack(){var n;const t=(n=this.stream)==null?void 0:n.getAudioTracks()[0];t&&t.addEventListener("ended",()=>{this.state!=="idle"&&(this.pendingGap=!0,this.setState("interrupted","The microphone was cut off — probably the screen locked."),this.finishSegment())})}async handleVisibility(){var t,n,a;if(document.visibilityState==="visible"){if(await this.acquireWakeLock(),this.state!=="interrupted"){((t=this.context)==null?void 0:t.state)==="suspended"&&await this.context.resume();return}try{(n=this.stream)==null||n.getTracks().forEach(s=>s.stop()),this.stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1}}),await((a=this.context)==null?void 0:a.resume()),this.watchTrack(),this.startSegment(),this.setState("recording","Recording resumed. The time you were away was not captured.")}catch(s){this.setState("interrupted",`Could not restart the microphone: ${s.message}`)}}}async acquireWakeLock(){if(!(!("wakeLock"in navigator)||this.state==="idle"))try{this.wakeLock=await navigator.wakeLock.request("screen")}catch{}}async teardown(){var t,n,a,s;this.fallbackTimer&&clearInterval(this.fallbackTimer),this.fallbackTimer=null;try{await((t=this.wakeLock)==null?void 0:t.release())}catch{}this.wakeLock=null,(n=this.clock)==null||n.port.close(),this.clock=null,(a=this.stream)==null||a.getTracks().forEach(o=>o.stop()),this.stream=null,await((s=this.context)==null?void 0:s.close().catch(()=>{})),this.context=null,this.recorder=null,this.segmentIndex=0,this.elapsedSec=0,this.segmentStartedAt=0}setState(t,n){this.state=t,this.events.onStateChange(t,n)}}function dt(){return/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1}function h(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function G(e){const t=Math.max(0,Math.round(e||0)),n=Math.floor(t/3600),a=Math.floor(t%3600/60),s=t%60;return n?`${n}:${String(a).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${a}:${String(s).padStart(2,"0")}`}function Y(e){const t=Math.round((e||0)/60);if(t<1)return"under a minute";if(t<60)return`${t} min`;const n=Math.floor(t/60),a=t%60;return a?`${n} h ${a} min`:`${n} h`}function ae(e){const t=new Date(e),n=Math.floor((Date.now()-e)/864e5),a=t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});return n===0?`Today ${a}`:n===1?`Yesterday ${a}`:n<7?`${t.toLocaleDateString([],{weekday:"long"})} ${a}`:t.toLocaleDateString([],{month:"short",day:"numeric"})}function Ot(e){return e<1024?`${e} B`:e<1024**2?`${(e/1024).toFixed(0)} KB`:e<1024**3?`${(e/1024**2).toFixed(1)} MB`:`${(e/1024**3).toFixed(2)} GB`}function V(e,t="Nothing noted."){const n=(e||[]).map(a=>String(a||"").trim()).filter(Boolean);return n.length?`<ul class="bullets">${n.map(a=>`<li>${h(a)}</li>`).join("")}</ul>`:`<p class="muted">${h(t)}</p>`}function T(e,t){return`<section class="block"><h3>${h(e)}</h3>${t}</section>`}function q(e,t="Not available."){const n=String(e||"").trim();return n?n.split(/\n{2,}/).map(a=>`<p>${h(a).replace(/\n/g,"<br/>")}</p>`).join(""):`<p class="muted">${h(t)}</p>`}function w(e,t,n,a){e.querySelectorAll(t).forEach(s=>{s.addEventListener(n,o=>a(s,o))})}function ht(e,t,n="text/plain"){const a=URL.createObjectURL(new Blob([t],{type:`${n};charset=utf-8`})),s=document.createElement("a");s.href=a,s.download=e,s.click(),setTimeout(()=>URL.revokeObjectURL(a),1e3)}async function Sn(e){try{return await navigator.clipboard.writeText(e),!0}catch{return!1}}const kn=[{id:"overview",label:"Overview"},{id:"transcript",label:"Transcript"},{id:"summary",label:"Summary"},{id:"reading",label:"Reading"},{id:"japanese",label:"日本語"},{id:"actions",label:"Actions"}];function $n(e){var a;const{session:t,tab:n}=e;return`
    <header class="session-head">
      <button type="button" class="link-btn" data-action="back">← All recordings</button>
      <h2>${h(((a=t.analysis)==null?void 0:a.title)||t.title)}</h2>
      <p class="meta">
        ${h(ae(t.createdAt))}
        · ${h(Y(t.totalDurationSec))}
        · ${h(t.languages.join(", ")||"language not detected yet")}
      </p>
      ${vn(t)}
    </header>

    <nav class="tabs">
      ${kn.map(s=>`<button type="button" class="tab ${s.id===n?"active":""}" data-tab="${s.id}">${h(s.label)}</button>`).join("")}
    </nav>

    <div class="tab-body">${An(e)}</div>
  `}function vn(e){if(e.status==="done"&&!e.error)return"";if(e.status==="error")return`<div class="banner err">
      <strong>Stopped:</strong> ${h(e.error||"Something went wrong.")}
      <button type="button" class="btn small" data-action="resume">Try again</button>
    </div>`;if(e.status==="paused"){const t=e.chunkTotal-e.chunkDone;return`<div class="banner warn">
      Paused with ${t} chunk${t===1?"":"s"} left.
      <button type="button" class="btn small" data-action="resume">Continue</button>
    </div>`}return e.status==="done"&&e.error?`<div class="banner warn">${h(e.error)}</div>`:`<div class="banner info">
    Working — ${e.chunkDone} of ${e.chunkTotal} chunks done.
    <button type="button" class="btn small" data-action="resume">Resume</button>
  </div>`}function An(e){const t=e.session.analysis;switch(e.tab){case"transcript":return xn(e);case"summary":return En(t);case"reading":return Dn(t);case"japanese":return Cn(t);case"actions":return Mn(t);default:return Tn(e)}}function Tn(e){var i;const{session:t,chunks:n}=e,a=t.analysis,s=n.filter(c=>c.status==="error"),o=n.filter(c=>c.status==="skipped");return`
    ${T("What this was",q(a==null?void 0:a.summary,"The summary appears once processing finishes."))}
    ${T("Where the project stands",q(a==null?void 0:a.project_status,"Not available yet."))}
    ${T("Key points",V(a==null?void 0:a.key_points))}
    ${T("Decisions",V(a==null?void 0:a.decisions,"Nothing was settled."))}
    ${(i=a==null?void 0:a.timeline)!=null&&i.length?T("How it unfolded",`<ol class="timeline">${a.timeline.map(c=>`<li><span class="at">${h(c.at||"")}</span> ${h(c.what||"")}</li>`).join("")}</ol>`):""}
    ${o.length||s.length?T("Coverage",`<p class="muted">
              ${o.length} quiet stretch${o.length===1?"":"es"} skipped without being sent.
              ${s.length?`${s.length} chunk${s.length===1?"":"s"} could not be transcribed.`:""}
            </p>`):""}
    ${a!=null&&a.caveats?T("Where to be careful",q(a.caveats)):""}
  `}function xn(e){const{segments:t,showOriginal:n}=e;return t.length?`
    <div class="toolbar">
      <button type="button" class="btn small ${n?"active":""}" data-action="toggle-original">
        ${n?"Hide original":"Show original"}
      </button>
      <button type="button" class="btn small" data-action="copy-transcript">Copy</button>
      <button type="button" class="btn small" data-action="export-txt">Export .txt</button>
    </div>
    <div class="transcript">
      ${t.map(a=>`
        <div class="line">
          <div class="line-head">
            <span class="at">${h(G(a.atSec))}</span>
            <span class="who">${h(a.speaker)}${a.speakerRole?` · ${h(a.speakerRole)}`:""}</span>
          </div>
          ${n&&a.original?`<p class="original">${h(a.original)}</p>`:""}
          <p class="english">${h(a.english||a.original)}</p>
        </div>`).join("")}
    </div>
  `:'<p class="muted">No transcript yet. It fills in chunk by chunk as processing runs.</p>'}function En(e){return e?`
    ${T("Summary",q(e.summary))}
    ${T("In detail",q(e.detailed_summary))}
    ${T("Open questions",V(e.open_questions,"Nothing left hanging."))}
    ${T("Risks worth knowing about",V(e.risks,"None flagged."))}
    <div class="toolbar">
      <button type="button" class="btn small" data-action="export-json">Export everything as JSON</button>
    </div>
  `:st()}function Dn(e){var t;return e?(t=e.speakers)!=null&&t.length?`
    <p class="note">
      This is interpretation, not transcript. Every point below shows what it was inferred from,
      so you can weigh it yourself.
    </p>
    ${e.speakers.map(n=>{var a;return`
      <section class="speaker">
        <h3>${h(n.speaker||"Speaker")}${n.likely_role?` <span class="role">${h(n.likely_role)}</span>`:""}</h3>
        <dl class="facets">
          ${pt("Tone",n.tone)}
          ${pt("What they wanted",n.intent)}
          ${pt("What they did not say outright",n.subtext)}
        </dl>
        ${(a=n.psychology)!=null&&a.length?`<div class="patterns">${n.psychology.map(s=>`
              <article class="pattern conf-${h(s.confidence||"medium")}">
                <h4>${h(s.pattern||"Pattern")}
                  <span class="conf">${h(s.confidence||"medium")} confidence</span>
                </h4>
                ${s.evidence?`<blockquote>${h(s.evidence)}</blockquote>`:""}
                <p>${h(s.reading||"")}</p>
              </article>`).join("")}</div>`:""}
      </section>`}).join("")}
  `:'<p class="muted">No per-speaker read was produced for this recording.</p>':st()}function pt(e,t){return t?`<dt>${h(e)}</dt><dd>${h(t)}</dd>`:""}function Cn(e){if(!e)return st();const t=e.japanese_glossary||[];return t.length?`
    <p class="note">Terms that carried weight in this conversation, with what they signalled.</p>
    <div class="glossary">
      ${t.map(n=>`
        <article class="term">
          <h3 lang="ja">${h(n.term||"")}</h3>
          ${n.reading?`<p class="reading" lang="ja">${h(n.reading)}</p>`:""}
          <p class="meaning">${h(n.meaning||"")}</p>
          ${n.politeness?`<span class="chip">${h(n.politeness)}</span>`:""}
          ${n.why_it_mattered?`<p class="why">${h(n.why_it_mattered)}</p>`:""}
        </article>`).join("")}
    </div>
    <div class="toolbar">
      <button type="button" class="btn small" data-action="export-glossary">Export for flashcards (CSV)</button>
    </div>
  `:'<p class="muted">No Japanese terms were picked out of this recording.</p>'}function Mn(e){if(!e)return st();const t=e.action_items_for_me||[],n=e.action_items_for_others||[],a=e.what_you_should_do||[];return`
    ${T("What you should do",a.length?`<ul class="advice">${a.map(s=>`
          <li class="urgency-${h((s.urgency||"").split(" ")[0]||"later")}">
            <strong>${h(s.do||"")}</strong>
            ${s.urgency?`<span class="chip">${h(s.urgency)}</span>`:""}
            ${s.why?`<p class="why">${h(s.why)}</p>`:""}
          </li>`).join("")}</ul>`:'<p class="muted">No next steps were identified.</p>')}
    ${T("On you",t.length?`<ul class="tasks">${t.map(s=>`
          <li>
            <strong>${h(s.what||"")}</strong>
            ${s.by_when?`<span class="chip">${h(s.by_when)}</span>`:""}
            ${s.why?`<p class="why">${h(s.why)}</p>`:""}
          </li>`).join("")}</ul>`:'<p class="muted">Nothing was assigned to you.</p>')}
    ${T("On other people",n.length?`<ul class="tasks">${n.map(s=>`
          <li>
            <strong>${h(s.who||"Someone")}</strong> — ${h(s.what||"")}
            ${s.by_when?`<span class="chip">${h(s.by_when)}</span>`:""}
          </li>`).join("")}</ul>`:'<p class="muted">Nothing tracked for others.</p>')}
    ${T("Worth asking next time",V(e.questions_to_ask,"No follow-up questions suggested."))}
  `}function st(){return'<p class="muted">This appears once the recording has been processed.</p>'}function zt(e,t){var s;const n=[((s=e.analysis)==null?void 0:s.title)||e.title,new Date(e.createdAt).toLocaleString(),`${Y(e.totalDurationSec)} · ${e.languages.join(", ")}`,""].join(`
`),a=t.map(o=>{const i=`${o.speaker}${o.speakerRole?` (${o.speakerRole})`:""}`,c=o.original?`
    ${o.original}`:"";return`[${G(o.atSec)}] ${i}:${c}
    EN: ${o.english||o.original}`}).join(`

`);return`${n}
${a}
`}function Un(e){return["Term,Reading,Meaning,Context",...((e==null?void 0:e.japanese_glossary)||[]).map(n=>[n.term,n.reading,n.meaning,n.why_it_mattered].map(a=>`"${String(a||"").replace(/"/g,'""')}"`).join(","))].join(`
`)}function Rn(e){const t={route:"home",sessionId:null,tab:"overview",showOriginal:!0,sessions:[],settings:Ht,health:null,progress:null,error:"",notice:"",recorderState:"idle",recorderDetail:"",recorderElapsed:0,level:0};let n=null,a=null,s=null;const o=()=>{e.innerHTML=`
      <div class="shell">
        ${i()}
        ${t.error?`<div class="banner err">${h(t.error)}<button type="button" class="link-btn" data-action="dismiss-error">Dismiss</button></div>`:""}
        ${t.notice?`<div class="banner ok">${h(t.notice)}</div>`:""}
        ${t.progress?c(t.progress):""}
        <main>${l()}</main>
      </div>
    `,k()},i=()=>{var d;const r=!!(t.settings.apiKey||(d=t.health)!=null&&d.geminiConfigured);return`
      <header class="app-head">
        <button type="button" class="brand" data-action="home">
          <span class="dot"></span> Voice AI
        </button>
        <div class="head-actions">
          <span class="pill ${r?"ok":"err"}" data-action="settings">
            ${r?"Ready":"Add API key"}
          </span>
          <button type="button" class="icon-btn" data-action="settings" aria-label="Settings">⚙</button>
        </div>
      </header>
    `},c=r=>{const d=r.chunkTotal?Math.round(r.chunkDone/r.chunkTotal*100):0,f=r.etaSeconds&&r.phase==="transcribing"?` · about ${Y(r.etaSeconds)} left`:"";return`
      <div class="progress-bar ${r.phase}">
        <div class="fill" style="width:${d}%"></div>
        <div class="progress-text">
          ${h(r.message)}${h(f)}
          ${r.chunkTotal?` · ${r.chunkDone}/${r.chunkTotal}`:""}
          ${r.phase==="transcribing"||r.phase==="summarising"?'<button type="button" class="link-btn" data-action="pause-run">Pause</button>':""}
        </div>
      </div>
    `},l=()=>t.route==="settings"?M():t.route==="record"?b():t.route==="session"?g():u(),u=()=>`
    <div class="actions-grid">
      <button type="button" class="big-action primary" data-action="import">
        <span class="big-icon">↑</span>
        <strong>Import a recording</strong>
        <small>Voice Memos, or any audio file. Handles a full 8-hour day.</small>
      </button>
      <button type="button" class="big-action" data-action="go-record">
        <span class="big-icon">●</span>
        <strong>Record now</strong>
        <small>${dt()?"Screen must stay on — see the note inside.":"Records while this tab stays open."}</small>
      </button>
    </div>
    <input type="file" id="fileInput" accept="audio/*,.m4a,.mp3,.wav,.aac,.mp4" hidden />

    ${dt()?`<div class="banner info how-to">
            <strong>For a whole workday:</strong> record with the iPhone's own Voice Memos app —
            it keeps running in your pocket with the screen locked — then come back here and
            import the file. Safari cannot hold the microphone in the background, so that is the
            only way to capture eight hours.
          </div>`:""}

    <h2 class="section-title">Recordings</h2>
    ${t.sessions.length?`<ul class="sessions">${t.sessions.map(m).join("")}</ul>`:'<p class="muted empty">Nothing yet. Import a recording to get started.</p>'}
  `,m=r=>{var f,x;const d=r.status==="done"?"":`<span class="chip ${r.status==="error"?"err":"warn"}">${h(r.status)}</span>`;return`
      <li class="session-card" data-id="${h(r.id)}">
        <div class="card-main" data-action="open-session">
          <strong>${h(((f=r.analysis)==null?void 0:f.title)||r.title)}</strong>
          <p class="meta">
            ${h(ae(r.createdAt))} · ${h(Y(r.totalDurationSec))}
            ${r.languages.length?` · ${h(r.languages.join(", "))}`:""}
            ${d}
          </p>
          ${(x=r.analysis)!=null&&x.summary?`<p class="snippet">${h(r.analysis.summary)}</p>`:""}
        </div>
        <button type="button" class="icon-btn danger" data-action="delete-session" aria-label="Delete">×</button>
      </li>
    `};let p={chunks:[],segments:[]};const g=()=>{const r=t.sessions.find(d=>d.id===t.sessionId);return r?$n({session:r,chunks:p.chunks,segments:p.segments,tab:t.tab,showOriginal:t.showOriginal}):'<p class="muted">That recording is gone.</p>'},b=()=>{const r=t.recorderState!=="idle";return`
      <button type="button" class="link-btn" data-action="home">← All recordings</button>

      <div class="recorder ${t.recorderState}">
        <div class="level-ring" style="--level:${t.level.toFixed(3)}">
          <button type="button" class="record-btn" data-action="${r?"stop-record":"start-record"}">
            ${r?"■":"●"}
          </button>
        </div>
        <p class="timer">${h(G(t.recorderElapsed))}</p>
        <p class="recorder-state">${h(S(t.recorderState))}</p>
        ${t.recorderDetail?`<p class="note">${h(t.recorderDetail)}</p>`:""}
        ${r?`<div class="btn-row">
                 <button type="button" class="btn" data-action="${t.recorderState==="paused"?"resume-record":"pause-record"}">${t.recorderState==="paused"?"Resume":"Pause"}</button>
                 <button type="button" class="btn danger" data-action="stop-record">Stop &amp; process</button>
               </div>`:""}
      </div>

      <div class="banner warn">
        <strong>Before you rely on this:</strong> your phone shows a recording indicator while the
        microphone is live, and that cannot be turned off — it is enforced by iOS, not by this app.
        Recording colleagues is also governed by your company's policy, so it is worth a look
        before this becomes a daily habit.
      </div>

      ${dt()?`<div class="banner info">
              iOS ends the microphone as soon as Safari is backgrounded or the screen locks, so
              this screen has to stay open and awake. The app holds a wake lock and picks recording
              back up automatically if it gets interrupted, but the time it was away is lost.
              For a full day, use Voice Memos and import instead.
            </div>`:""}
    `},S=r=>({idle:"Ready",recording:"Recording",paused:"Paused",interrupted:"Interrupted — reopen this screen to continue"})[r],M=()=>{const{settings:r,health:d}=t;return`
      <button type="button" class="link-btn" data-action="home">← All recordings</button>
      <h2 class="section-title">Settings</h2>

      <section class="block">
        <h3>Gemini API key</h3>
        ${d!=null&&d.geminiConfigured?`<p class="muted">A key is configured on the server, so you don't need one here.</p>`:`<p class="muted">
                 Free, no card needed: open
                 <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a>,
                 create a key, and paste it below. It is stored only on this device and sent with
                 each request — it is never saved on the server.
               </p>`}
        <input type="password" class="input" id="apiKey" placeholder="AIza…"
               value="${h(r.apiKey)}" autocomplete="off" spellcheck="false" />
        <div class="btn-row">
          <button type="button" class="btn primary" data-action="save-key">Save key</button>
          <button type="button" class="btn" data-action="test-key">Test it</button>
        </div>
      </section>

      <section class="block">
        <h3>Model</h3>
        <select class="input" id="model">
          ${((d==null?void 0:d.models)||[r.model]).map(f=>`<option value="${h(f)}" ${f===r.model?"selected":""}>${h(f)}</option>`).join("")}
        </select>
        <p class="muted">
          <code>gemini-2.5-flash</code> is the right default. <code>flash-lite</code> stretches the
          free daily quota further on a very long day; <code>pro</code> reads tone more carefully
          but has a much smaller free allowance.
        </p>
      </section>

      <section class="block">
        <h3>About you</h3>
        <p class="muted">Used to judge which parts are aimed at you and what you should do next.</p>
        <input type="text" class="input" id="profileName" placeholder="Your name as colleagues say it"
               value="${h(r.profileName)}" />
        <input type="text" class="input" id="profileRole" placeholder="Your role, e.g. backend engineer"
               value="${h(r.profileRole)}" />
        <label class="check">
          <input type="checkbox" id="assumeNoJapanese" ${r.assumeNoJapanese?"checked":""} />
          Explain Japanese as if I barely know any
        </label>
      </section>

      <section class="block">
        <h3>Processing</h3>
        <label class="field">
          <span>Chunk length</span>
          <select class="input" id="chunkSeconds">
            ${[180,300,420,600].map(f=>`<option value="${f}" ${f===r.chunkSeconds?"selected":""}>${f/60} minutes</option>`).join("")}
          </select>
        </label>
        <p class="muted">
          Longer chunks mean fewer requests against the free daily quota; shorter ones give tighter
          timestamps. Five minutes is a good balance for an all-day recording.
        </p>
        <label class="field">
          <span>Keep recordings for</span>
          <select class="input" id="retentionDays">
            ${[3,7,14,30,0].map(f=>`<option value="${f}" ${f===r.retentionDays?"selected":""}>${f?`${f} days`:"Until I delete them"}</option>`).join("")}
          </select>
        </label>
        <div class="btn-row">
          <button type="button" class="btn primary" data-action="save-settings">Save settings</button>
        </div>
      </section>

      <section class="block">
        <h3>Storage</h3>
        <p class="muted" id="storageLine">Checking…</p>
        <p class="muted">
          Transcripts and summaries stay on this device. Audio is deleted as soon as a recording
          has been processed, and whole sessions are removed once they pass the retention window.
        </p>
        <div class="btn-row">
          <button type="button" class="btn danger" data-action="delete-all">Delete everything</button>
        </div>
      </section>
    `},k=()=>{w(e,'[data-action="home"], .brand',"click",()=>z("home")),w(e,'[data-action="settings"]',"click",()=>z("settings")),w(e,'[data-action="go-record"]',"click",()=>z("record")),w(e,'[data-action="dismiss-error"]',"click",()=>{t.error="",o()}),w(e,'[data-action="back"]',"click",()=>z("home")),w(e,'[data-action="import"]',"click",()=>{var d;(d=e.querySelector("#fileInput"))==null||d.click()});const r=e.querySelector("#fileInput");r==null||r.addEventListener("change",()=>{var f;const d=(f=r.files)==null?void 0:f[0];d&&ot(d)}),w(e,'[data-action="open-session"]',"click",d=>{var x;const f=(x=d.closest("[data-id]"))==null?void 0:x.dataset.id;f&&rt(f)}),w(e,'[data-action="delete-session"]',"click",(d,f)=>{var F;f.stopPropagation();const x=(F=d.closest("[data-id]"))==null?void 0:F.dataset.id;x&&re(x)}),w(e,"[data-tab]","click",d=>{t.tab=d.dataset.tab,o()}),w(e,'[data-action="toggle-original"]',"click",()=>{t.showOriginal=!t.showOriginal,o()}),w(e,'[data-action="resume"]',"click",()=>{t.sessionId&&O(t.sessionId)}),w(e,'[data-action="pause-run"]',"click",()=>Pt()),A(),_(),I()},A=()=>{const r=t.sessions.find(d=>d.id===t.sessionId);r&&(w(e,'[data-action="copy-transcript"]',"click",async()=>{const d=await Sn(zt(r,p.segments));j(d?"Transcript copied.":"Could not reach the clipboard.")}),w(e,'[data-action="export-txt"]',"click",()=>{ht(`${ft(r.title)}-transcript.txt`,zt(r,p.segments))}),w(e,'[data-action="export-json"]',"click",()=>{ht(`${ft(r.title)}.json`,JSON.stringify({session:r,segments:p.segments},null,2),"application/json")}),w(e,'[data-action="export-glossary"]',"click",()=>{ht(`${ft(r.title)}-japanese.csv`,Un(r.analysis),"text/csv")}))},_=()=>{w(e,'[data-action="start-record"]',"click",()=>void se()),w(e,'[data-action="stop-record"]',"click",()=>void oe()),w(e,'[data-action="pause-record"]',"click",()=>{n==null||n.pause(),o()}),w(e,'[data-action="resume-record"]',"click",()=>{n==null||n.resume(),o()})},I=()=>{w(e,'[data-action="save-key"]',"click",async()=>{var d;const r=((d=e.querySelector("#apiKey"))==null?void 0:d.value.trim())||"";await Et({apiKey:r}),j(r?"Key saved on this device.":"Key cleared.")}),w(e,'[data-action="test-key"]',"click",async()=>{var d,f;const r=((d=e.querySelector("#apiKey"))==null?void 0:d.value.trim())||"";if(!r&&!((f=t.health)!=null&&f.geminiConfigured))return R("Paste a key first.");j("Checking the key…");try{await Jt({apiKey:r,model:t.settings.model,blob:Nn(),mimeType:"audio/wav",offsetSeconds:0}),j("The key works.")}catch(x){R(x instanceof Error?x.message:"The key could not be verified.")}}),w(e,'[data-action="save-settings"]',"click",async()=>{var d,f,x,F,Dt,Ct;const r=ie=>e.querySelector(`#${ie}`);await Et({model:((d=r("model"))==null?void 0:d.value)||t.settings.model,profileName:((f=r("profileName"))==null?void 0:f.value.trim())||"",profileRole:((x=r("profileRole"))==null?void 0:x.value.trim())||"",assumeNoJapanese:((F=r("assumeNoJapanese"))==null?void 0:F.checked)??!0,chunkSeconds:Number((Dt=r("chunkSeconds"))==null?void 0:Dt.value)||300,retentionDays:Number(((Ct=r("retentionDays"))==null?void 0:Ct.value)??7)}),j("Settings saved.")}),w(e,'[data-action="delete-all"]',"click",async()=>{if(confirm("Delete every recording, transcript and summary on this device?")){for(const r of t.sessions)await gt(r.id);await L(),j("Everything deleted.")}}),v()},v=async()=>{const r=e.querySelector("#storageLine");if(!r)return;const d=await ke();r.textContent=d?`${Ot(d.usage)} used of about ${Ot(d.quota)} available.`:"This browser does not report storage usage."},ot=async r=>{t.error="";try{const d=await sn(r,t.settings,Tt);await L(),await rt(d),await O(d)}catch(d){R(d instanceof Error?d.message:String(d))}},O=async r=>{var d;if(Lt())return R("Something else is already being processed.");if(!t.settings.apiKey&&!((d=t.health)!=null&&d.geminiConfigured))return z("settings"),R("Add your Gemini API key first.");try{await un(r,t.settings,Tt)}catch(f){R(f instanceof Error?f.message:String(f))}finally{t.progress=null,await L(),t.sessionId&&await xt(t.sessionId),o()}},Tt=r=>{t.progress=r.phase==="done"?null:r;const d=e.querySelector(".progress-bar");if(d&&t.progress){d.outerHTML=c(t.progress),w(e,'[data-action="pause-run"]',"click",()=>Pt());return}o()},se=async()=>{try{a=await cn(t.settings),n=new bn({onSegment:async r=>{if(a)try{await ln(a,r)}catch(d){console.error("[app] could not store segment",d)}},onLevel:r=>{t.level=Math.min(1,r*6);const d=e.querySelector(".level-ring");d&&d.style.setProperty("--level",t.level.toFixed(3))},onStateChange:(r,d)=>{t.recorderState=r,t.recorderDetail=d||"",o()}},t.settings.chunkSeconds),await n.start(),s=setInterval(()=>{t.recorderElapsed=(n==null?void 0:n.elapsedSeconds)||0;const r=e.querySelector(".timer");r&&(r.textContent=G(t.recorderElapsed))},1e3),await L()}catch(r){R(r instanceof Error&&r.name==="NotAllowedError"?"Microphone access was refused. Allow it in your browser settings and try again.":`Could not start recording: ${r instanceof Error?r.message:String(r)}`)}},oe=async()=>{if(!n||!a)return;const r=a;s&&clearInterval(s),s=null,await n.stop(),n=null,a=null,t.recorderElapsed=0,await L(),await rt(r),await O(r)},rt=async r=>{t.sessionId=r,t.route="session",t.tab="overview",await xt(r),o()},xt=async r=>{const[d,f]=await Promise.all([Z(r),Vt(r)]);p={chunks:d,segments:f}},re=async r=>{confirm("Delete this recording and everything derived from it?")&&(await gt(r),t.sessionId===r&&(t.sessionId=null,t.route="home"),await L())},z=r=>{t.route=r,t.error="",o()},R=r=>{t.error=r,o()},j=r=>{t.notice=r,o(),setTimeout(()=>{t.notice===r&&(t.notice="",o())},3e3)},Et=async r=>{t.settings={...t.settings,...r},await be(t.settings),o()},L=async()=>{t.sessions=await mt(),o()};(async()=>{t.settings=await we(),o(),await Se(t.settings.retentionDays),t.sessions=await mt();try{t.health=await Ae()}catch{t.health=null}o(),"serviceWorker"in navigator&&navigator.serviceWorker.register("/voice-ai/sw.js",{scope:"/voice-ai/"}).catch(()=>{}),window.addEventListener("beforeunload",r=>{!Lt()&&!n||(r.preventDefault(),r.returnValue="")})})()}const ft=e=>e.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48)||"recording";function Nn(){const t=new Uint8Array(new ArrayBuffer(16e3));return new Blob([vt({channels:1,sampleRate:8e3,bitsPerSample:16},t.length),t],{type:"audio/wav"})}const Ft=document.getElementById("app");Ft&&Rn(Ft);
