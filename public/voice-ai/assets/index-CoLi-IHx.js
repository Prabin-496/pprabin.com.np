var ne=Object.defineProperty;var se=(r,t,n)=>t in r?ne(r,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):r[t]=n;var p=(r,t,n)=>se(r,typeof t!="symbol"?t+"":t,n);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))i(a);new MutationObserver(a=>{for(const d of a)if(d.type==="childList")for(const h of d.addedNodes)h.tagName==="LINK"&&h.rel==="modulepreload"&&i(h)}).observe(document,{childList:!0,subtree:!0});function n(a){const d={};return a.integrity&&(d.integrity=a.integrity),a.referrerPolicy&&(d.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?d.credentials="include":a.crossOrigin==="anonymous"?d.credentials="omit":d.credentials="same-origin",d}function i(a){if(a.ep)return;a.ep=!0;const d=n(a);fetch(a.href,d)}})();function G(r){return(r==null?void 0:r.trim().replace(/\/$/,""))||""}function re(r){return G(r)||"(same origin)"}const ie=G("");async function b(r,t={}){const n=await fetch(`${ie}${r}`,t);if(!n.ok){let i=`HTTP ${n.status}`;try{i=(await n.json()).error||i}catch{}throw new Error(i)}if(n.status!==204)return n.json()}function ae(r){return new Promise((t,n)=>{const i=new FileReader;i.onerror=()=>n(new Error("Could not read audio chunk")),i.onload=()=>{const a=String(i.result||"");t(a.slice(a.indexOf(",")+1))},i.readAsDataURL(r)})}const v={health:()=>b("/api/voice/health"),list:()=>b("/api/recordings"),search:r=>b(`/api/recordings/search?q=${encodeURIComponent(r)}`),get:r=>b(`/api/recordings/${r}`),create:r=>b("/api/recordings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:r})}),uploadChunk:async(r,t,n,i)=>{const a=await ae(n);return b(`/api/recordings/${r}/chunks`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chunkIndex:t,mimeType:i,audio:a})})},finalize:r=>b(`/api/recordings/${r}/finalize`,{method:"POST"}),remove:r=>b(`/api/recordings/${r}`,{method:"DELETE"})},z=45e3;class oe{constructor(t,n){p(this,"stream",null);p(this,"recorder",null);p(this,"audioContext",null);p(this,"analyser",null);p(this,"rafId",0);p(this,"chunkIndex",0);p(this,"chunkTimer",null);p(this,"onChunk");p(this,"onLevel");p(this,"mimeType","audio/webm");p(this,"state","idle");this.onChunk=t,this.onLevel=n}async start(){if(this.state!=="idle")return;this.stream=await navigator.mediaDevices.getUserMedia({audio:!0}),this.audioContext=new AudioContext,this.analyser=this.audioContext.createAnalyser(),this.analyser.fftSize=64,this.audioContext.createMediaStreamSource(this.stream).connect(this.analyser),this.startSegment(),this.state="recording",this.drawLevels(),this.chunkTimer=setInterval(()=>this.rotateSegment(),z)}pause(){this.state!=="recording"||!this.recorder||(this.recorder.pause(),this.state="paused",this.chunkTimer&&clearInterval(this.chunkTimer),this.chunkTimer=null)}resume(){this.state!=="paused"||!this.recorder||(this.recorder.resume(),this.state="recording",this.chunkTimer=setInterval(()=>this.rotateSegment(),z))}async stop(){this.state!=="idle"&&(this.chunkTimer&&clearInterval(this.chunkTimer),this.chunkTimer=null,await this.finishSegment(),this.cleanup(),this.state="idle",this.chunkIndex=0)}startSegment(){if(!this.stream)return;const t={};MediaRecorder.isTypeSupported("audio/webm;codecs=opus")&&(t.mimeType="audio/webm;codecs=opus"),this.recorder=new MediaRecorder(this.stream,t),this.mimeType=this.recorder.mimeType||"audio/webm";const n=[];this.recorder.ondataavailable=i=>{i.data.size>0&&n.push(i.data)},this.recorder.onstop=async()=>{if(n.length){const i=new Blob(n,{type:this.mimeType}),a=this.chunkIndex++;await this.onChunk(i,a)}},this.recorder.start(1e3)}async finishSegment(){if(!(!this.recorder||this.recorder.state==="inactive"))return new Promise(t=>{const n=this.recorder;n.addEventListener("stop",()=>t(),{once:!0}),n.stop()})}async rotateSegment(){this.state==="recording"&&(await this.finishSegment(),this.startSegment())}drawLevels(){if(!this.analyser)return;const t=new Uint8Array(this.analyser.frequencyBinCount);this.analyser.getByteFrequencyData(t);const n=32,i=Math.max(1,Math.floor(t.length/n)),a=[];for(let d=0;d<n;d++)a.push(t[d*i]/255);this.onLevel(a),this.rafId=requestAnimationFrame(()=>this.drawLevels())}cleanup(){this.rafId&&cancelAnimationFrame(this.rafId),this.rafId=0,this.stream&&(this.stream.getTracks().forEach(t=>t.stop()),this.stream=null),this.audioContext&&(this.audioContext.close().catch(()=>{}),this.audioContext=null),this.analyser=null,this.recorder=null}}const ce="voice-ai-local",L="recordings";function Y(){return new Promise((r,t)=>{const n=indexedDB.open(ce,1);n.onerror=()=>t(n.error),n.onsuccess=()=>r(n.result),n.onupgradeneeded=()=>{const i=n.result;i.objectStoreNames.contains(L)||i.createObjectStore(L,{keyPath:"id"})}})}async function K(r){const t=await Y();return new Promise((n,i)=>{const a=t.transaction(L,"readwrite");a.objectStore(L).put(r),a.oncomplete=()=>n(),a.onerror=()=>i(a.error)})}async function le(){const r=await Y();return new Promise((t,n)=>{const a=r.transaction(L,"readonly").objectStore(L).getAll();a.onsuccess=()=>t(a.result||[]),a.onerror=()=>n(a.error)})}function de(r){let t="record",n=[],i=null,a=!1,d=!1,h=null,q=0,T=!1,o=null,_=[];r.innerHTML=`
    <div class="shell">
      <header class="header">
        <div>
      
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
  `;const R=r.querySelector("#tabs"),c=r.querySelector("#main"),B=r.querySelector("#error"),x=r.querySelector("#apiPill"),Q=[{id:"record",label:"Record"},{id:"history",label:"History"},{id:"transcript",label:"Transcript"},{id:"summary",label:"Summary"},{id:"settings",label:"Settings"}],C=e=>{B.textContent=e,B.classList.remove("hidden")},X=()=>B.classList.add("hidden"),P=()=>{R.innerHTML=Q.map(e=>`<button type="button" class="tab ${e.id===t?"active":""}" data-tab="${e.id}">${e.label}</button>`).join(""),R.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{t=e.dataset.tab,P(),A()})})},H=async e=>{e&&await navigator.clipboard.writeText(e)},N=(e,s)=>{const u=new Blob([s],{type:"text/plain"}),l=document.createElement("a");l.href=URL.createObjectURL(u),l.download=e,l.click(),URL.revokeObjectURL(l.href)},U=(e,s)=>{N(e,JSON.stringify(s,null,2))},I=async()=>{try{const{recordings:e}=await v.list();n=e;for(const s of e)await K(s)}catch{n=await le()}},V=async e=>{try{const{recording:s}=await v.get(e);i=s,await K(s)}catch(s){C(s.message)}A()},w=()=>{var S,$,g,D,J;const e=(o==null?void 0:o.state)==="recording",s=(o==null?void 0:o.state)==="paused";c.innerHTML=`
      <section class="panel">
        <div class="record-row">
          <button type="button" class="record-btn ${e?"recording":""}" id="micBtn" aria-label="Record">🎙</button>
          <div class="waveform" id="waveform"></div>
        </div>
        <div class="btn-row">
          <button type="button" class="btn primary" id="startBtn" ${T?"disabled":""}>Record</button>
          <button type="button" class="btn" id="pauseBtn" ${e?"":"disabled"}>Pause</button>
          <button type="button" class="btn" id="resumeBtn" ${s?"":"disabled"}>Resume</button>
          <button type="button" class="btn danger" id="stopBtn" ${(o==null?void 0:o.state)==="idle"?"disabled":""}>Stop & Process</button>
        </div>
        <p class="progress" id="progress">Chunks uploaded: ${q}</p>
      </section>
    `;const u=c.querySelector("#waveform");u.innerHTML=Array.from({length:32},()=>'<div class="bar"></div>').join(""),_=Array.from(u.querySelectorAll(".bar"));const l=async()=>{X(),T=!0,w();try{const{recording:f}=await v.create(`Session ${new Date().toLocaleString()}`);h=f.id,i=f,q=0,o=new oe(async(j,E)=>{if(h)try{await v.uploadChunk(h,E,j,(o==null?void 0:o.mimeType)||"audio/webm"),q++;const k=c.querySelector("#progress");k&&(k.textContent=`Chunks uploaded: ${q}`)}catch(k){C(`Chunk ${E} failed: ${k.message}`)}},j=>{_.forEach((E,k)=>{const F=j[k]??0;E.style.height=`${Math.max(6,F*80)}px`,E.style.opacity=String(.3+F*.7)})}),await o.start()}catch(f){C(f.message),h=null,o=null}T=!1,w()},m=async()=>{if(!(!o||!h)){T=!0,w();try{await o.stop(),o=null;const{recording:f}=await v.finalize(h);i=f,h=null,await I(),t="transcript",P()}catch(f){C(f.message)}T=!1,P(),A()}};(S=c.querySelector("#startBtn"))==null||S.addEventListener("click",l),($=c.querySelector("#micBtn"))==null||$.addEventListener("click",()=>{(o==null?void 0:o.state)==="idle"||!o?l():o.state==="recording"?o.pause():o.state==="paused"&&o.resume(),w()}),(g=c.querySelector("#pauseBtn"))==null||g.addEventListener("click",()=>{o==null||o.pause(),w()}),(D=c.querySelector("#resumeBtn"))==null||D.addEventListener("click",()=>{o==null||o.resume(),w()}),(J=c.querySelector("#stopBtn"))==null||J.addEventListener("click",m)},M=()=>{var s,u;c.innerHTML=`
      <section class="panel">
        <input type="search" class="search" id="searchInput" placeholder="Search transcripts…" />
        <ul class="list" id="histList"></ul>
        <div class="btn-row">
          <button type="button" class="btn danger" id="delBtn" ${i?"":"disabled"}>Delete selected</button>
        </div>
      </section>
    `;const e=c.querySelector("#histList");n.length?(e.innerHTML=n.map(l=>`
        <li class="${(i==null?void 0:i.id)===l.id?"active":""}" data-id="${l.id}">
          <strong>${O(l.title)}</strong><br/>
          <small>${l.status} · ${l.detected_language||"—"} · ${new Date(l.created_at).toLocaleString()}</small>
        </li>`).join(""),e.querySelectorAll("li[data-id]").forEach(l=>{l.addEventListener("click",()=>V(l.dataset.id))})):e.innerHTML='<li class="muted">No recordings yet</li>',(s=c.querySelector("#searchInput"))==null||s.addEventListener("input",async l=>{const m=l.target.value.trim();if(!m)await I();else try{const{recordings:S}=await v.search(m);n=S}catch{}M()}),(u=c.querySelector("#delBtn"))==null||u.addEventListener("click",async()=>{i&&confirm("Delete this recording permanently?")&&(await v.remove(i.id),i=null,await I(),M())})},Z=()=>{var s,u,l,m;const e=i;if(c.innerHTML=`
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

`))}),(m=c.querySelector("#expJson"))==null||m.addEventListener("click",()=>U(`transcript-${e.id}.json`,e))},ee=()=>{var u,l,m,S,$;const e=i,s=e==null?void 0:e.summary;c.innerHTML=`
      <div class="cards">
        ${y("Quick summary",s==null?void 0:s.summary,"sum")}
        ${y("Detailed summary",s==null?void 0:s.detailed_summary,"det")}
        ${y("Key points",(u=s==null?void 0:s.key_points)==null?void 0:u.map(g=>`• ${g}`).join(`
`),"kp")}
        ${y("Action items",(l=s==null?void 0:s.action_items)==null?void 0:l.map(g=>`• ${g}`).join(`
`),"ai")}
        ${y("Important terms",(m=s==null?void 0:s.important_terms)==null?void 0:m.join(", "),"terms")}
        ${y("Follow-up questions",(S=s==null?void 0:s.follow_up_questions)==null?void 0:S.map(g=>`• ${g}`).join(`
`),"fq")}
        ${y("Meeting notes",s==null?void 0:s.meeting_notes,"notes")}
      </div>
      <div class="btn-row">
        <button type="button" class="btn" id="expSum">Export summary JSON</button>
      </div>
    `,s||c.querySelector(".cards").insertAdjacentHTML("afterbegin",'<p class="muted">Process a recording first to generate summaries.</p>'),($=c.querySelector("#expSum"))==null||$.addEventListener("click",()=>{s&&U(`summary-${e==null?void 0:e.id}.json`,s)})},te=()=>{var s;c.innerHTML=`
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
    `;const e=re("");c.querySelector("#apiUrl").textContent=e,c.querySelector("#geminiStatus").textContent=d?"Yes":"No — set GEMINI_API_KEY",(s=c.querySelector("#regSw"))==null||s.addEventListener("click",async()=>{"serviceWorker"in navigator&&(await navigator.serviceWorker.register("/voice-ai/sw.js",{scope:"/voice-ai/"}),alert("Service worker registered for /voice-ai/"))})},A=()=>{t==="record"?w():t==="history"?M():t==="transcript"?Z():t==="summary"?ee():te()};(async()=>{P();try{const e=await v.health();a=e.ok,d=e.geminiConfigured,x.textContent=a?d?"API ready":"API up · no Gemini key":"API offline",x.className=`pill ${a&&d?"ok":"err"}`}catch{x.textContent="API offline",x.className="pill err"}await I(),A(),"serviceWorker"in navigator&&navigator.serviceWorker.register("/voice-ai/sw.js",{scope:"/voice-ai/"}).catch(()=>{})})()}function y(r,t,n){const i=(t==null?void 0:t.trim())||"—";return`
    <article class="card">
      <div class="card-head">
        <h3 class="card-title">${O(r)}</h3>
      </div>
      <div class="card-body ${i==="—"?"muted":""}" id="${n||""}">${O(i)}</div>
    </article>
  `}function O(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const W=document.getElementById("app");W&&de(W);
