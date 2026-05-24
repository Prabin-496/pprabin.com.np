var te=Object.defineProperty;var ne=(i,t,s)=>t in i?te(i,t,{enumerable:!0,configurable:!0,writable:!0,value:s}):i[t]=s;var p=(i,t,s)=>ne(i,typeof t!="symbol"?t+"":t,s);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))a(r);new MutationObserver(r=>{for(const d of r)if(d.type==="childList")for(const h of d.addedNodes)h.tagName==="LINK"&&h.rel==="modulepreload"&&a(h)}).observe(document,{childList:!0,subtree:!0});function s(r){const d={};return r.integrity&&(d.integrity=r.integrity),r.referrerPolicy&&(d.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?d.credentials="include":r.crossOrigin==="anonymous"?d.credentials="omit":d.credentials="same-origin",d}function a(r){if(r.ep)return;r.ep=!0;const d=s(r);fetch(r.href,d)}})();const se="".replace(/\/$/,"");async function b(i,t={}){const s=await fetch(`${se}${i}`,t);if(!s.ok){let a=`HTTP ${s.status}`;try{a=(await s.json()).error||a}catch{}throw new Error(a)}if(s.status!==204)return s.json()}const v={health:()=>b("/health"),list:()=>b("/api/recordings"),search:i=>b(`/api/recordings/search?q=${encodeURIComponent(i)}`),get:i=>b(`/api/recordings/${i}`),create:i=>b("/api/recordings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:i})}),uploadChunk:async(i,t,s,a)=>{const r=new FormData;return r.append("audio",s,`chunk-${t}.webm`),r.append("chunkIndex",String(t)),r.append("mimeType",a),b(`/api/recordings/${i}/chunks`,{method:"POST",body:r})},finalize:i=>b(`/api/recordings/${i}/finalize`,{method:"POST"}),remove:i=>b(`/api/recordings/${i}`,{method:"DELETE"})},z=45e3;class re{constructor(t,s){p(this,"stream",null);p(this,"recorder",null);p(this,"audioContext",null);p(this,"analyser",null);p(this,"rafId",0);p(this,"chunkIndex",0);p(this,"chunkTimer",null);p(this,"onChunk");p(this,"onLevel");p(this,"mimeType","audio/webm");p(this,"state","idle");this.onChunk=t,this.onLevel=s}async start(){if(this.state!=="idle")return;this.stream=await navigator.mediaDevices.getUserMedia({audio:!0}),this.audioContext=new AudioContext,this.analyser=this.audioContext.createAnalyser(),this.analyser.fftSize=64,this.audioContext.createMediaStreamSource(this.stream).connect(this.analyser),this.startSegment(),this.state="recording",this.drawLevels(),this.chunkTimer=setInterval(()=>this.rotateSegment(),z)}pause(){this.state!=="recording"||!this.recorder||(this.recorder.pause(),this.state="paused",this.chunkTimer&&clearInterval(this.chunkTimer),this.chunkTimer=null)}resume(){this.state!=="paused"||!this.recorder||(this.recorder.resume(),this.state="recording",this.chunkTimer=setInterval(()=>this.rotateSegment(),z))}async stop(){this.state!=="idle"&&(this.chunkTimer&&clearInterval(this.chunkTimer),this.chunkTimer=null,await this.finishSegment(),this.cleanup(),this.state="idle",this.chunkIndex=0)}startSegment(){if(!this.stream)return;const t={};MediaRecorder.isTypeSupported("audio/webm;codecs=opus")&&(t.mimeType="audio/webm;codecs=opus"),this.recorder=new MediaRecorder(this.stream,t),this.mimeType=this.recorder.mimeType||"audio/webm";const s=[];this.recorder.ondataavailable=a=>{a.data.size>0&&s.push(a.data)},this.recorder.onstop=async()=>{if(s.length){const a=new Blob(s,{type:this.mimeType}),r=this.chunkIndex++;await this.onChunk(a,r)}},this.recorder.start(1e3)}async finishSegment(){if(!(!this.recorder||this.recorder.state==="inactive"))return new Promise(t=>{const s=this.recorder;s.addEventListener("stop",()=>t(),{once:!0}),s.stop()})}async rotateSegment(){this.state==="recording"&&(await this.finishSegment(),this.startSegment())}drawLevels(){if(!this.analyser)return;const t=new Uint8Array(this.analyser.frequencyBinCount);this.analyser.getByteFrequencyData(t);const s=32,a=Math.max(1,Math.floor(t.length/s)),r=[];for(let d=0;d<s;d++)r.push(t[d*a]/255);this.onLevel(r),this.rafId=requestAnimationFrame(()=>this.drawLevels())}cleanup(){this.rafId&&cancelAnimationFrame(this.rafId),this.rafId=0,this.stream&&(this.stream.getTracks().forEach(t=>t.stop()),this.stream=null),this.audioContext&&(this.audioContext.close().catch(()=>{}),this.audioContext=null),this.analyser=null,this.recorder=null}}const ie="voice-ai-local",L="recordings";function G(){return new Promise((i,t)=>{const s=indexedDB.open(ie,1);s.onerror=()=>t(s.error),s.onsuccess=()=>i(s.result),s.onupgradeneeded=()=>{const a=s.result;a.objectStoreNames.contains(L)||a.createObjectStore(L,{keyPath:"id"})}})}async function K(i){const t=await G();return new Promise((s,a)=>{const r=t.transaction(L,"readwrite");r.objectStore(L).put(i),r.oncomplete=()=>s(),r.onerror=()=>a(r.error)})}async function ae(){const i=await G();return new Promise((t,s)=>{const r=i.transaction(L,"readonly").objectStore(L).getAll();r.onsuccess=()=>t(r.result||[]),r.onerror=()=>s(r.error)})}function oe(i){let t="record",s=[],a=null,r=!1,d=!1,h=null,x=0,$=!1,o=null,O=[];i.innerHTML=`
    <div class="shell">
      <header class="header">
        <div>
          <h1>Voice AI</h1>
          <p class="subtitle">Personal transcriber — Japanese, English, Nepali (auto-detect). Powered by Gemini on your backend. Tap record, flip through results, export anytime.</p>
        </div>
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
  `;const R=i.querySelector("#tabs"),c=i.querySelector("#main"),M=i.querySelector("#error"),q=i.querySelector("#apiPill"),Y=[{id:"record",label:"Record"},{id:"history",label:"History"},{id:"transcript",label:"Transcript"},{id:"summary",label:"Summary"},{id:"settings",label:"Settings"}],C=e=>{M.textContent=e,M.classList.remove("hidden")},Q=()=>M.classList.add("hidden"),P=()=>{R.innerHTML=Y.map(e=>`<button type="button" class="tab ${e.id===t?"active":""}" data-tab="${e.id}">${e.label}</button>`).join(""),R.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{t=e.dataset.tab,P(),A()})})},H=async e=>{e&&await navigator.clipboard.writeText(e)},N=(e,n)=>{const u=new Blob([n],{type:"text/plain"}),l=document.createElement("a");l.href=URL.createObjectURL(u),l.download=e,l.click(),URL.revokeObjectURL(l.href)},D=(e,n)=>{N(e,JSON.stringify(n,null,2))},I=async()=>{try{const{recordings:e}=await v.list();s=e;for(const n of e)await K(n)}catch{s=await ae()}},V=async e=>{try{const{recording:n}=await v.get(e);a=n,await K(n)}catch(n){C(n.message)}A()},w=()=>{var S,T,g,U,J;const e=(o==null?void 0:o.state)==="recording",n=(o==null?void 0:o.state)==="paused";c.innerHTML=`
      <section class="panel">
        <div class="record-row">
          <button type="button" class="record-btn ${e?"recording":""}" id="micBtn" aria-label="Record">🎙</button>
          <div class="waveform" id="waveform"></div>
        </div>
        <div class="btn-row">
          <button type="button" class="btn primary" id="startBtn" ${$?"disabled":""}>Record</button>
          <button type="button" class="btn" id="pauseBtn" ${e?"":"disabled"}>Pause</button>
          <button type="button" class="btn" id="resumeBtn" ${n?"":"disabled"}>Resume</button>
          <button type="button" class="btn danger" id="stopBtn" ${(o==null?void 0:o.state)==="idle"?"disabled":""}>Stop & Process</button>
        </div>
        <p class="progress" id="progress">Chunks uploaded: ${x}</p>
      </section>
    `;const u=c.querySelector("#waveform");u.innerHTML=Array.from({length:32},()=>'<div class="bar"></div>').join(""),O=Array.from(u.querySelectorAll(".bar"));const l=async()=>{Q(),$=!0,w();try{const{recording:f}=await v.create(`Session ${new Date().toLocaleString()}`);h=f.id,a=f,x=0,o=new re(async(j,E)=>{if(h)try{await v.uploadChunk(h,E,j,(o==null?void 0:o.mimeType)||"audio/webm"),x++;const k=c.querySelector("#progress");k&&(k.textContent=`Chunks uploaded: ${x}`)}catch(k){C(`Chunk ${E} failed: ${k.message}`)}},j=>{O.forEach((E,k)=>{const F=j[k]??0;E.style.height=`${Math.max(6,F*80)}px`,E.style.opacity=String(.3+F*.7)})}),await o.start()}catch(f){C(f.message),h=null,o=null}$=!1,w()},m=async()=>{if(!(!o||!h)){$=!0,w();try{await o.stop(),o=null;const{recording:f}=await v.finalize(h);a=f,h=null,await I(),t="transcript",P()}catch(f){C(f.message)}$=!1,P(),A()}};(S=c.querySelector("#startBtn"))==null||S.addEventListener("click",l),(T=c.querySelector("#micBtn"))==null||T.addEventListener("click",()=>{(o==null?void 0:o.state)==="idle"||!o?l():o.state==="recording"?o.pause():o.state==="paused"&&o.resume(),w()}),(g=c.querySelector("#pauseBtn"))==null||g.addEventListener("click",()=>{o==null||o.pause(),w()}),(U=c.querySelector("#resumeBtn"))==null||U.addEventListener("click",()=>{o==null||o.resume(),w()}),(J=c.querySelector("#stopBtn"))==null||J.addEventListener("click",m)},_=()=>{var n,u;c.innerHTML=`
      <section class="panel">
        <input type="search" class="search" id="searchInput" placeholder="Search transcripts…" />
        <ul class="list" id="histList"></ul>
        <div class="btn-row">
          <button type="button" class="btn danger" id="delBtn" ${a?"":"disabled"}>Delete selected</button>
        </div>
      </section>
    `;const e=c.querySelector("#histList");s.length?(e.innerHTML=s.map(l=>`
        <li class="${(a==null?void 0:a.id)===l.id?"active":""}" data-id="${l.id}">
          <strong>${B(l.title)}</strong><br/>
          <small>${l.status} · ${l.detected_language||"—"} · ${new Date(l.created_at).toLocaleString()}</small>
        </li>`).join(""),e.querySelectorAll("li[data-id]").forEach(l=>{l.addEventListener("click",()=>V(l.dataset.id))})):e.innerHTML='<li class="muted">No recordings yet</li>',(n=c.querySelector("#searchInput"))==null||n.addEventListener("input",async l=>{const m=l.target.value.trim();if(!m)await I();else try{const{recordings:S}=await v.search(m);s=S}catch{}_()}),(u=c.querySelector("#delBtn"))==null||u.addEventListener("click",async()=>{a&&confirm("Delete this recording permanently?")&&(await v.remove(a.id),a=null,await I(),_())})},X=()=>{var n,u,l,m;const e=a;if(c.innerHTML=`
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
    `,!e){c.querySelector(".cards").innerHTML='<p class="muted">Select a recording from History or create a new one.</p>';return}(n=c.querySelector("#copyRaw"))==null||n.addEventListener("click",()=>H(e.raw_transcript||"")),(u=c.querySelector("#copyEn"))==null||u.addEventListener("click",()=>H(e.cleaned_english||e.translated_english||"")),(l=c.querySelector("#expTxt"))==null||l.addEventListener("click",()=>{N(`transcript-${e.id}.txt`,[e.raw_transcript,e.translated_english,e.cleaned_english].filter(Boolean).join(`

---

`))}),(m=c.querySelector("#expJson"))==null||m.addEventListener("click",()=>D(`transcript-${e.id}.json`,e))},Z=()=>{var u,l,m,S,T;const e=a,n=e==null?void 0:e.summary;c.innerHTML=`
      <div class="cards">
        ${y("Quick summary",n==null?void 0:n.summary,"sum")}
        ${y("Detailed summary",n==null?void 0:n.detailed_summary,"det")}
        ${y("Key points",(u=n==null?void 0:n.key_points)==null?void 0:u.map(g=>`• ${g}`).join(`
`),"kp")}
        ${y("Action items",(l=n==null?void 0:n.action_items)==null?void 0:l.map(g=>`• ${g}`).join(`
`),"ai")}
        ${y("Important terms",(m=n==null?void 0:n.important_terms)==null?void 0:m.join(", "),"terms")}
        ${y("Follow-up questions",(S=n==null?void 0:n.follow_up_questions)==null?void 0:S.map(g=>`• ${g}`).join(`
`),"fq")}
        ${y("Meeting notes",n==null?void 0:n.meeting_notes,"notes")}
      </div>
      <div class="btn-row">
        <button type="button" class="btn" id="expSum">Export summary JSON</button>
      </div>
    `,n||c.querySelector(".cards").insertAdjacentHTML("afterbegin",'<p class="muted">Process a recording first to generate summaries.</p>'),(T=c.querySelector("#expSum"))==null||T.addEventListener("click",()=>{n&&D(`summary-${e==null?void 0:e.id}.json`,n)})},ee=()=>{var n;c.innerHTML=`
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
    `;const e="(same origin / dev proxy)";c.querySelector("#apiUrl").textContent=e,c.querySelector("#geminiStatus").textContent=d?"Yes":"No — set GEMINI_API_KEY",(n=c.querySelector("#regSw"))==null||n.addEventListener("click",async()=>{"serviceWorker"in navigator&&(await navigator.serviceWorker.register("/voice-ai/sw.js",{scope:"/voice-ai/"}),alert("Service worker registered for /voice-ai/"))})},A=()=>{t==="record"?w():t==="history"?_():t==="transcript"?X():t==="summary"?Z():ee()};(async()=>{P();try{const e=await v.health();r=e.ok,d=e.geminiConfigured,q.textContent=r?d?"API ready":"API up · no Gemini key":"API offline",q.className=`pill ${r&&d?"ok":"err"}`}catch{q.textContent="API offline",q.className="pill err"}await I(),A(),"serviceWorker"in navigator&&navigator.serviceWorker.register("/voice-ai/sw.js",{scope:"/voice-ai/"}).catch(()=>{})})()}function y(i,t,s){const a=(t==null?void 0:t.trim())||"—";return`
    <article class="card">
      <div class="card-head">
        <h3 class="card-title">${B(i)}</h3>
      </div>
      <div class="card-body ${a==="—"?"muted":""}" id="${s||""}">${B(a)}</div>
    </article>
  `}function B(i){return i.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const W=document.getElementById("app");W&&oe(W);
