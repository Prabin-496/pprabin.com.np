var ne=Object.defineProperty;var se=(n,t,r)=>t in n?ne(n,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):n[t]=r;var p=(n,t,r)=>se(n,typeof t!="symbol"?t+"":t,r);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))a(i);new MutationObserver(i=>{for(const d of i)if(d.type==="childList")for(const h of d.addedNodes)h.tagName==="LINK"&&h.rel==="modulepreload"&&a(h)}).observe(document,{childList:!0,subtree:!0});function r(i){const d={};return i.integrity&&(d.integrity=i.integrity),i.referrerPolicy&&(d.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?d.credentials="include":i.crossOrigin==="anonymous"?d.credentials="omit":d.credentials="same-origin",d}function a(i){if(i.ep)return;i.ep=!0;const d=r(i);fetch(i.href,d)}})();const re="http://ec2-3-25-210-9.ap-southeast-2.compute.amazonaws.com",ie="https://api.pprabin.com.np";function ae(){if(typeof window>"u")return!1;const n=window.location.hostname;return n==="localhost"||n==="127.0.0.1"}function G(n){const t=n==null?void 0:n.trim().replace(/\/$/,"");return t||(ae()?re:ie)}function oe(n){return G(n)||"(same origin)"}const ce=G("http://ec2-3-25-210-9.ap-southeast-2.compute.amazonaws.com");async function b(n,t={}){const r=await fetch(`${ce}${n}`,t);if(!r.ok){let a=`HTTP ${r.status}`;try{a=(await r.json()).error||a}catch{}throw new Error(a)}if(r.status!==204)return r.json()}const v={health:()=>b("/health"),list:()=>b("/api/recordings"),search:n=>b(`/api/recordings/search?q=${encodeURIComponent(n)}`),get:n=>b(`/api/recordings/${n}`),create:n=>b("/api/recordings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:n})}),uploadChunk:async(n,t,r,a)=>{const i=new FormData;return i.append("audio",r,`chunk-${t}.webm`),i.append("chunkIndex",String(t)),i.append("mimeType",a),b(`/api/recordings/${n}/chunks`,{method:"POST",body:i})},finalize:n=>b(`/api/recordings/${n}/finalize`,{method:"POST"}),remove:n=>b(`/api/recordings/${n}`,{method:"DELETE"})},F=45e3;class le{constructor(t,r){p(this,"stream",null);p(this,"recorder",null);p(this,"audioContext",null);p(this,"analyser",null);p(this,"rafId",0);p(this,"chunkIndex",0);p(this,"chunkTimer",null);p(this,"onChunk");p(this,"onLevel");p(this,"mimeType","audio/webm");p(this,"state","idle");this.onChunk=t,this.onLevel=r}async start(){if(this.state!=="idle")return;this.stream=await navigator.mediaDevices.getUserMedia({audio:!0}),this.audioContext=new AudioContext,this.analyser=this.audioContext.createAnalyser(),this.analyser.fftSize=64,this.audioContext.createMediaStreamSource(this.stream).connect(this.analyser),this.startSegment(),this.state="recording",this.drawLevels(),this.chunkTimer=setInterval(()=>this.rotateSegment(),F)}pause(){this.state!=="recording"||!this.recorder||(this.recorder.pause(),this.state="paused",this.chunkTimer&&clearInterval(this.chunkTimer),this.chunkTimer=null)}resume(){this.state!=="paused"||!this.recorder||(this.recorder.resume(),this.state="recording",this.chunkTimer=setInterval(()=>this.rotateSegment(),F))}async stop(){this.state!=="idle"&&(this.chunkTimer&&clearInterval(this.chunkTimer),this.chunkTimer=null,await this.finishSegment(),this.cleanup(),this.state="idle",this.chunkIndex=0)}startSegment(){if(!this.stream)return;const t={};MediaRecorder.isTypeSupported("audio/webm;codecs=opus")&&(t.mimeType="audio/webm;codecs=opus"),this.recorder=new MediaRecorder(this.stream,t),this.mimeType=this.recorder.mimeType||"audio/webm";const r=[];this.recorder.ondataavailable=a=>{a.data.size>0&&r.push(a.data)},this.recorder.onstop=async()=>{if(r.length){const a=new Blob(r,{type:this.mimeType}),i=this.chunkIndex++;await this.onChunk(a,i)}},this.recorder.start(1e3)}async finishSegment(){if(!(!this.recorder||this.recorder.state==="inactive"))return new Promise(t=>{const r=this.recorder;r.addEventListener("stop",()=>t(),{once:!0}),r.stop()})}async rotateSegment(){this.state==="recording"&&(await this.finishSegment(),this.startSegment())}drawLevels(){if(!this.analyser)return;const t=new Uint8Array(this.analyser.frequencyBinCount);this.analyser.getByteFrequencyData(t);const r=32,a=Math.max(1,Math.floor(t.length/r)),i=[];for(let d=0;d<r;d++)i.push(t[d*a]/255);this.onLevel(i),this.rafId=requestAnimationFrame(()=>this.drawLevels())}cleanup(){this.rafId&&cancelAnimationFrame(this.rafId),this.rafId=0,this.stream&&(this.stream.getTracks().forEach(t=>t.stop()),this.stream=null),this.audioContext&&(this.audioContext.close().catch(()=>{}),this.audioContext=null),this.analyser=null,this.recorder=null}}const de="voice-ai-local",L="recordings";function Y(){return new Promise((n,t)=>{const r=indexedDB.open(de,1);r.onerror=()=>t(r.error),r.onsuccess=()=>n(r.result),r.onupgradeneeded=()=>{const a=r.result;a.objectStoreNames.contains(L)||a.createObjectStore(L,{keyPath:"id"})}})}async function K(n){const t=await Y();return new Promise((r,a)=>{const i=t.transaction(L,"readwrite");i.objectStore(L).put(n),i.oncomplete=()=>r(),i.onerror=()=>a(i.error)})}async function ue(){const n=await Y();return new Promise((t,r)=>{const i=n.transaction(L,"readonly").objectStore(L).getAll();i.onsuccess=()=>t(i.result||[]),i.onerror=()=>r(i.error)})}function pe(n){let t="record",r=[],a=null,i=!1,d=!1,h=null,q=0,$=!1,o=null,O=[];n.innerHTML=`
    <div class="shell">
      <header class="header">
        {/* <div>
          <h1>Voice AI</h1>
          <p class="subtitle">Personal transcriber — Japanese, English, Nepali (auto-detect). Powered by Gemini on your backend. Tap record, flip through results, export anytime.</p>
        </div> */}
        <div id="apiPill" class="pill">Connecting…</div>
      </header>

      <div class="banner warn">
        <strong>iPhone note:</strong> Safari cannot record indefinitely in the background. Keep the screen on while recording; chunks save every ~45s so you won't lose progress if you pause or stop.
      </div>

      <nav class="tabs" id="tabs"></nav>
      <div id="error" class="banner err hidden"></div>
      <main id="main"></main>
      <p class="footer-note">Isolated module · API key stays on server · Data in <code>voice-ai-data/</code> on your backend host</p>
    </div>
  `;const R=n.querySelector("#tabs"),c=n.querySelector("#main"),M=n.querySelector("#error"),x=n.querySelector("#apiPill"),Q=[{id:"record",label:"Record"},{id:"history",label:"History"},{id:"transcript",label:"Transcript"},{id:"summary",label:"Summary"},{id:"settings",label:"Settings"}],P=e=>{M.textContent=e,M.classList.remove("hidden")},V=()=>M.classList.add("hidden"),C=()=>{R.innerHTML=Q.map(e=>`<button type="button" class="tab ${e.id===t?"active":""}" data-tab="${e.id}">${e.label}</button>`).join(""),R.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{t=e.dataset.tab,C(),A()})})},H=async e=>{e&&await navigator.clipboard.writeText(e)},N=(e,s)=>{const u=new Blob([s],{type:"text/plain"}),l=document.createElement("a");l.href=URL.createObjectURL(u),l.download=e,l.click(),URL.revokeObjectURL(l.href)},D=(e,s)=>{N(e,JSON.stringify(s,null,2))},I=async()=>{try{const{recordings:e}=await v.list();r=e;for(const s of e)await K(s)}catch{r=await ue()}},X=async e=>{try{const{recording:s}=await v.get(e);a=s,await K(s)}catch(s){P(s.message)}A()},w=()=>{var S,T,f,U,J;const e=(o==null?void 0:o.state)==="recording",s=(o==null?void 0:o.state)==="paused";c.innerHTML=`
      <section class="panel">
        <div class="record-row">
          <button type="button" class="record-btn ${e?"recording":""}" id="micBtn" aria-label="Record">🎙</button>
          <div class="waveform" id="waveform"></div>
        </div>
        <div class="btn-row">
          <button type="button" class="btn primary" id="startBtn" ${$?"disabled":""}>Record</button>
          <button type="button" class="btn" id="pauseBtn" ${e?"":"disabled"}>Pause</button>
          <button type="button" class="btn" id="resumeBtn" ${s?"":"disabled"}>Resume</button>
          <button type="button" class="btn danger" id="stopBtn" ${(o==null?void 0:o.state)==="idle"?"disabled":""}>Stop & Process</button>
        </div>
        <p class="progress" id="progress">Chunks uploaded: ${q}</p>
      </section>
    `;const u=c.querySelector("#waveform");u.innerHTML=Array.from({length:32},()=>'<div class="bar"></div>').join(""),O=Array.from(u.querySelectorAll(".bar"));const l=async()=>{V(),$=!0,w();try{const{recording:g}=await v.create(`Session ${new Date().toLocaleString()}`);h=g.id,a=g,q=0,o=new le(async(B,E)=>{if(h)try{await v.uploadChunk(h,E,B,(o==null?void 0:o.mimeType)||"audio/webm"),q++;const k=c.querySelector("#progress");k&&(k.textContent=`Chunks uploaded: ${q}`)}catch(k){P(`Chunk ${E} failed: ${k.message}`)}},B=>{O.forEach((E,k)=>{const z=B[k]??0;E.style.height=`${Math.max(6,z*80)}px`,E.style.opacity=String(.3+z*.7)})}),await o.start()}catch(g){P(g.message),h=null,o=null}$=!1,w()},m=async()=>{if(!(!o||!h)){$=!0,w();try{await o.stop(),o=null;const{recording:g}=await v.finalize(h);a=g,h=null,await I(),t="transcript",C()}catch(g){P(g.message)}$=!1,C(),A()}};(S=c.querySelector("#startBtn"))==null||S.addEventListener("click",l),(T=c.querySelector("#micBtn"))==null||T.addEventListener("click",()=>{(o==null?void 0:o.state)==="idle"||!o?l():o.state==="recording"?o.pause():o.state==="paused"&&o.resume(),w()}),(f=c.querySelector("#pauseBtn"))==null||f.addEventListener("click",()=>{o==null||o.pause(),w()}),(U=c.querySelector("#resumeBtn"))==null||U.addEventListener("click",()=>{o==null||o.resume(),w()}),(J=c.querySelector("#stopBtn"))==null||J.addEventListener("click",m)},_=()=>{var s,u;c.innerHTML=`
      <section class="panel">
        <input type="search" class="search" id="searchInput" placeholder="Search transcripts…" />
        <ul class="list" id="histList"></ul>
        <div class="btn-row">
          <button type="button" class="btn danger" id="delBtn" ${a?"":"disabled"}>Delete selected</button>
        </div>
      </section>
    `;const e=c.querySelector("#histList");r.length?(e.innerHTML=r.map(l=>`
        <li class="${(a==null?void 0:a.id)===l.id?"active":""}" data-id="${l.id}">
          <strong>${j(l.title)}</strong><br/>
          <small>${l.status} · ${l.detected_language||"—"} · ${new Date(l.created_at).toLocaleString()}</small>
        </li>`).join(""),e.querySelectorAll("li[data-id]").forEach(l=>{l.addEventListener("click",()=>X(l.dataset.id))})):e.innerHTML='<li class="muted">No recordings yet</li>',(s=c.querySelector("#searchInput"))==null||s.addEventListener("input",async l=>{const m=l.target.value.trim();if(!m)await I();else try{const{recordings:S}=await v.search(m);r=S}catch{}_()}),(u=c.querySelector("#delBtn"))==null||u.addEventListener("click",async()=>{a&&confirm("Delete this recording permanently?")&&(await v.remove(a.id),a=null,await I(),_())})},Z=()=>{var s,u,l,m;const e=a;if(c.innerHTML=`
      <div class="cards">
        ${y("Full transcript (original)",e==null?void 0:e.raw_transcript,"raw")}
        ${y("English translation",e==null?void 0:e.translated_english,"en")}
        ${y("Cleaned English",e==null?void 0:e.cleaned_english,"clean")}
      </div>
      <div class="btn-row">
        <button type="button" class="btn" id="copyRaw">Copy original</button>
        <button type="button" class="btn" id="copyEn">Copy English</button>
        <button type="button" class="btn" id="expTxt">Export TXT</button>
        <button type="button" class="btn" id="expJson">Export JSON</button>
      </div>
    `,!e){c.querySelector(".cards").innerHTML='<p class="muted">Select a recording from History or create a new one.</p>';return}(s=c.querySelector("#copyRaw"))==null||s.addEventListener("click",()=>H(e.raw_transcript||"")),(u=c.querySelector("#copyEn"))==null||u.addEventListener("click",()=>H(e.cleaned_english||e.translated_english||"")),(l=c.querySelector("#expTxt"))==null||l.addEventListener("click",()=>{N(`transcript-${e.id}.txt`,[e.raw_transcript,e.translated_english,e.cleaned_english].filter(Boolean).join(`

---

`))}),(m=c.querySelector("#expJson"))==null||m.addEventListener("click",()=>D(`transcript-${e.id}.json`,e))},ee=()=>{var u,l,m,S,T;const e=a,s=e==null?void 0:e.summary;c.innerHTML=`
      <div class="cards">
        ${y("Quick summary",s==null?void 0:s.summary,"sum")}
        ${y("Detailed summary",s==null?void 0:s.detailed_summary,"det")}
        ${y("Key points",(u=s==null?void 0:s.key_points)==null?void 0:u.map(f=>`• ${f}`).join(`
`),"kp")}
        ${y("Action items",(l=s==null?void 0:s.action_items)==null?void 0:l.map(f=>`• ${f}`).join(`
`),"ai")}
        ${y("Important terms",(m=s==null?void 0:s.important_terms)==null?void 0:m.join(", "),"terms")}
        ${y("Follow-up questions",(S=s==null?void 0:s.follow_up_questions)==null?void 0:S.map(f=>`• ${f}`).join(`
`),"fq")}
        ${y("Meeting notes",s==null?void 0:s.meeting_notes,"notes")}
      </div>
      <div class="btn-row">
        <button type="button" class="btn" id="expSum">Export summary JSON</button>
      </div>
    `,s||c.querySelector(".cards").insertAdjacentHTML("afterbegin",'<p class="muted">Process a recording first to generate summaries.</p>'),(T=c.querySelector("#expSum"))==null||T.addEventListener("click",()=>{s&&D(`summary-${e==null?void 0:e.id}.json`,s)})},te=()=>{var s;c.innerHTML=`
      <section class="panel">
        <h3 style="margin-top:0">Settings</h3>
        <p class="muted">API: <code id="apiUrl"></code></p>
        <p class="muted">Gemini configured: <strong id="geminiStatus"></strong></p>
        <p class="muted">Chunk interval: ~45 seconds (auto-save)</p>
        <p class="muted">Languages: Japanese, English, Nepali — automatic detection</p>
        <h4>Install as app (PWA)</h4>
        <p class="muted">On iPhone: Share → Add to Home Screen. On desktop: install icon in address bar.</p>
        <button type="button" class="btn" id="regSw">Enable offline shell</button>
      </section>
    `;const e=oe("http://ec2-3-25-210-9.ap-southeast-2.compute.amazonaws.com");c.querySelector("#apiUrl").textContent=e,c.querySelector("#geminiStatus").textContent=d?"Yes":"No — set GEMINI_API_KEY",(s=c.querySelector("#regSw"))==null||s.addEventListener("click",async()=>{"serviceWorker"in navigator&&(await navigator.serviceWorker.register("/voice-ai/sw.js",{scope:"/voice-ai/"}),alert("Service worker registered for /voice-ai/"))})},A=()=>{t==="record"?w():t==="history"?_():t==="transcript"?Z():t==="summary"?ee():te()};(async()=>{C();try{const e=await v.health();i=e.ok,d=e.geminiConfigured,x.textContent=i?d?"API ready":"API up · no Gemini key":"API offline",x.className=`pill ${i&&d?"ok":"err"}`}catch{x.textContent="API offline",x.className="pill err"}await I(),A(),"serviceWorker"in navigator&&navigator.serviceWorker.register("/voice-ai/sw.js",{scope:"/voice-ai/"}).catch(()=>{})})()}function y(n,t,r){const a=(t==null?void 0:t.trim())||"—";return`
    <article class="card">
      <div class="card-head">
        <h3 class="card-title">${j(n)}</h3>
      </div>
      <div class="card-body ${a==="—"?"muted":""}" id="${r||""}">${j(a)}</div>
    </article>
  `}function j(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const W=document.getElementById("app");W&&pe(W);
