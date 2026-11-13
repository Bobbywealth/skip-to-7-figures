/* Skip to 7 Figures - funnel behaviour.
   Extracted to an external file so the page can ship a Content-Security-Policy
   without 'unsafe-inline' for scripts. Keep the blocks in their original order:
   the second block reads the answers object and the render function from the first. */

document.documentElement.classList.add('js');
const API='https://skip-to-7-figures-admin.skip7figures.workers.dev';

/* ---------- Cloudflare Turnstile (bot protection) ---------- */
const TS_SITEKEY='0x4AAAAAAF-4Gnj0g3OX0_Xe';
let tsWidget=null, tsToken='', tsReady=false;
function sf7TurnstileReady(){ tsReady=true; mountTurnstile(); }
function mountTurnstile(){
  if(tsWidget!==null||!window.turnstile) return;
  const host=document.getElementById('cf-turnstile');
  if(!host||!host.isConnected) return;
  try{
    tsWidget=window.turnstile.render(host,{
      sitekey:TS_SITEKEY,
      callback:(t)=>{ tsToken=t; },
      'expired-callback':()=>{ tsToken=''; },
      'error-callback':()=>{ tsToken=''; }
    });
  }catch(e){ tsToken=''; }
}
function resetTurnstile(){
  tsToken='';
  if(window.turnstile && tsWidget!==null){ try{ window.turnstile.reset(tsWidget); }catch(e){} }
}
function destroyTurnstile(){
  tsToken='';
  if(window.turnstile && tsWidget!==null){ try{ window.turnstile.remove(tsWidget); }catch(e){} tsWidget=null; }
}
function waitForTurnstile(ms){
  const started=Date.now();
  return new Promise(resolve=>{
    const tick=()=>{
      if(tsToken) return resolve(true);
      if(Date.now()-started>ms) return resolve(false);
      setTimeout(tick,250);
    };
    tick();
  });
}

/* ---------- visitor id, UTM capture, funnel tracking ---------- */
const UID=(function(){try{let v=localStorage.getItem('sf7_vid');if(!v){v='v'+Math.random().toString(36).slice(2,10)+Date.now().toString(36);localStorage.setItem('sf7_vid',v);}return v;}catch(e){return 'v'+Math.random().toString(36).slice(2,10);}})();
const UTM=(function(){
  try{
    const q=new URLSearchParams(location.search), o={};
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid'].forEach(k=>{const v=q.get(k);if(v)o[k]=v;});
    if(Object.keys(o).length){localStorage.setItem('sf7_utm',JSON.stringify(o));return o;}
    const s=localStorage.getItem('sf7_utm');return s?JSON.parse(s):{};
  }catch(e){return {};}
})();
function trackEvent(name,data){
  try{
    const u=new URL(API+'/api/track');
    u.searchParams.set('path',location.pathname||'/');
    const body=JSON.stringify({name:name,visitor_id:UID,data:data||{}});
    if(navigator.sendBeacon) navigator.sendBeacon(u.toString(),new Blob([body],{type:'text/plain;charset=UTF-8'}));
  }catch(e){}
}
const questions=[
['capital','How much capital are you prepared to allocate?',['$5,000–$9,999','$10,000–$24,999','$25,000–$49,999','$50,000–$99,999','$100,000–$250,000','$250,000+']],
['timeline','When are you looking to get started?',['Immediately','Within 30 days','Within 1–3 months','Just researching']],
['experience','What is your current experience?',['Complete beginner','Already operating a business','Experienced entrepreneur / investor']],
['interest','What are you most interested in?',['Launching an e-commerce brand','Scaling an existing brand','Done-for-you business services','Exploring a business partnership']],
['decision','Are you the person making the financial decision?',['Yes','With a business partner or spouse','No']]
];
const form=document.querySelector('#application'),
      fields=document.querySelector('#fields'),
      back=document.querySelector('#back'),
      next=document.querySelector('#next'),
      done=document.querySelector('#done'),
      stepEl=document.querySelector('#step'),
      prog=document.querySelector('#progress'),
      rail=document.querySelector('#rail');
let index=0, answers={};
const TOTAL=questions.length+1;

function renderRail(){
  rail.innerHTML=Array.from({length:TOTAL},(_,i)=>'<i class="'+(i<=index?'on':'')+'"></i>').join('');
}
function render(focus=false){
  stepEl.textContent='Step '+(index+1)+' of '+TOTAL;
  prog.value=index+1;
  renderRail();
  back.hidden=index===0;
  next.textContent=index===questions.length?'Send application':'Continue';
  if(index===questions.length){
    fields.innerHTML='<fieldset><legend tabindex="-1">How can we reach you?</legend><label class="field"><span>Your name</span><input type="text" name="name" autocomplete="name" placeholder="First and last name" required></label><label class="field"><span>Email</span><input type="email" name="email" autocomplete="email" required></label><label class="field"><span>Phone number</span><input type="tel" name="phone" autocomplete="tel" inputmode="tel" required></label></fieldset><div id="cf-turnstile" style="margin-top:18px;min-height:0"></div>';
    for(const key of ['name','email','phone']) form.elements[key].value=answers[key]||'';
    if(tsReady) mountTurnstile();
  }else{
    /* leaving the contact step destroys the host div - take the widget with it */
    destroyTurnstile();
    const [key,title,options]=questions[index];
    fields.innerHTML='<fieldset><legend tabindex="-1">'+title+'</legend>'+options.map(option=>'<label class="option"><input type="radio" required name="'+key+'" value="'+option+'" '+(answers[key]===option?'checked':'')+'>'+option+'</label>').join('')+'</fieldset>';
  }
  if(focus){
    fields.querySelector('legend').focus({preventScroll:true});
    if(matchMedia('(max-width:720px)').matches) form.scrollIntoView({block:'start'});
  }
}
function remember(){Object.assign(answers,Object.fromEntries(new FormData(form)))}
let sending=false;
form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(sending) return;
  remember();
  if(index<questions.length){
    const q=questions[index][0];
    if(!form.querySelector('input[name="'+q+'"]:checked')){
      const e0=document.querySelector('#formError');
      if(e0){e0.hidden=false;e0.textContent='Please pick an option to keep going.';}
      return;
    }
    index++;render(true);return;
  }
  sending=true; next.disabled=true; next.textContent='Sending…';
  const errEl=document.querySelector('#formError');
  const nameVal=(form.elements.name?form.elements.name.value:'').trim();
  if(nameVal.length<2){ errEl.hidden=false; errEl.textContent='Please tell us your name so we know who we are replying to.'; sending=false; next.disabled=false; next.textContent='Send application'; return; }
  const emailVal=(form.elements.email?form.elements.email.value:'').trim();
  const phoneVal=(form.elements.phone?form.elements.phone.value:'').trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailVal)){ errEl.hidden=false; errEl.textContent='Please enter a valid email address so we can reply.'; sending=false; next.disabled=false; next.textContent='Send application'; return; }
  if(phoneVal.replace(/\D/g,'').length<7){ errEl.hidden=false; errEl.textContent='Please enter a phone number we can reach you on.'; sending=false; next.disabled=false; next.textContent='Send application'; return; }
  if(window.turnstile && !tsToken){
    next.textContent='Checking…';
    const okToken=await waitForTurnstile(15000);
    if(!okToken){
      errEl.hidden=false;
      errEl.textContent='The human check did not load. Please refresh the page and try again, or email us directly.';
      sending=false; next.disabled=false; next.textContent='Send application';
      return;
    }
  }
  const payload={
    name:nameVal,
    email:emailVal,
    phone:phoneVal,
    company:form.elements.company?form.elements.company.value:'',
    capital:answers.capital,timeline:answers.timeline,experience:answers.experience,
    interest:answers.interest,decision:answers.decision,
    source:'funnel',page_url:location.href,
    visitor_id:UID, ...UTM,
    cf_turnstile_response:tsToken
  };
  try{
    const res=await fetch(API+'/api/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(25000)});
    const data=await res.json().catch(()=>({}));
    if(!res.ok||!data.ok) throw new Error(data.error||('request failed ('+res.status+')'));
    errEl.hidden=true;
    try{ localStorage.removeItem('sf7_draft'); }catch(e){}
    resetTurnstile();
    const ref=document.querySelector('#refnum');
    if(ref && data.id){ ref.hidden=false; ref.textContent='Your reference: #'+data.id; }
    const del=document.querySelector('#deletelink');
    if(del && data.delete_token){
      del.hidden=false;
      del.querySelector('a').href='/delete.html#email='+encodeURIComponent(payload.email)+'&token='+encodeURIComponent(data.delete_token);
    }
    answers={};fields.replaceChildren();form.hidden=true;done.hidden=false;done.querySelector('h3').focus();
  }catch(err){
    errEl.hidden=false;
    errEl.textContent='We couldn’t send your application — '+(err&&err.message?err.message:'network error')+'. Please try again, or email us at business@wolfpaqmarketing.com.';
    /* the token may have been spent or expired - get a fresh one for the retry */
    resetTurnstile();
    sending=false; next.disabled=false; next.textContent='Send application';
  }
});
back.addEventListener('click',()=>{remember();index--;render(true)});
document.querySelector('#reset').addEventListener('click',()=>{
  index=0;
  sending=false;
  next.disabled=false;
  next.textContent='Continue';
  form.hidden=false;
  done.hidden=true;
  resetTurnstile();
  render(true);
});
render();
/* fire the apply_start event the first time the form is actually used */
let started=false;
form.addEventListener('focusin',()=>{ if(started) return; started=true; trackEvent('apply_start',{}); },{once:true});

/* editable site copy + page-view tracking (admin dashboard) */
(async()=>{
  try{
    const c=await (await fetch(API+'/api/content')).json();
    if(c&&c.headline){
      const h1=document.querySelector('.hero h1');
      if(h1){
        const i=c.headline.toLowerCase().indexOf('beauty brand');
        if(i>-1) h1.innerHTML=c.headline.slice(0,i)+'<em>'+c.headline.slice(i)+'</em>';
        else h1.textContent=c.headline;
      }
    }
    if(c&&c.subheadline){const el=document.querySelector('.hero .lede');if(el)el.textContent=c.subheadline;}
    if(c&&c.cta_label){document.querySelectorAll('a.btn').forEach(a=>{if(/application/i.test(a.textContent))a.textContent=c.cta_label;});}
    if(c&&c.cost_answer){
      const el=document.querySelector('[data-content="cost_answer"]');
      if(el) el.textContent=c.cost_answer;
    }
    if(c&&c.specialties){
      const parts=c.specialties.split(',').map(s=>s.trim()).filter(Boolean);
      const spans=document.querySelectorAll('.spec span');
      parts.forEach((p,i)=>{if(spans[i])spans[i].textContent=p;});
    }
  }catch(e){}
  try{
    if(!sessionStorage.getItem('sf7_seen')){
      sessionStorage.setItem('sf7_seen','1');
      /* text/plain keeps this a simple request so it never needs a CORS preflight */
      navigator.sendBeacon(API+'/api/track?path='+encodeURIComponent(location.pathname||'/'),new Blob([''],{type:'text/plain;charset=UTF-8'}));
    }
  }catch(e){}
})();

/* mobile sticky CTA */
const mobileApply=document.querySelector('.mobile-apply');
const applySection=document.querySelector('#apply');
const inlineApply=[document.querySelector('.hero .btn'),document.querySelector('.mobile-proof-cta')];
function updateMobileApply(){
  const height=window.innerHeight;
  const b=applySection.getBoundingClientRect();
  const formVisible=b.top<height-80&&b.bottom>0;
  const inlineVisible=inlineApply.some(l=>{
    if(!l) return false;
    const r=l.getBoundingClientRect();
    return r.height>0&&r.top>=0&&r.bottom<=height-74;
  });
  mobileApply.hidden=formVisible||inlineVisible;
}
window.addEventListener('scroll',updateMobileApply,{passive:true});
window.addEventListener('resize',updateMobileApply);
updateMobileApply();

/* hero video: muted autoplay, then sound on automatically at the first visitor interaction.
   Browsers block audible autoplay on a fresh landing (Chrome pauses the element and
   play() rejects with NotAllowedError), so the video starts muted and the audio is
   armed the moment the visitor clicks, taps, presses a key or scrolls. */
/* the hero video is 6.7MB - the poster is the LCP, so the video is only
   fetched once the page has painted. A visitor on a slow connection or with
   reduced motion keeps the poster and never downloads it. */
(function lazyHeroVideo(){
  const v=document.getElementById('herovideo');
  if(!v) return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const conn=navigator.connection||{};
  if(reduce||conn.saveData||/2g/.test(String(conn.effectiveType||''))) return;
  const load=()=>{
    if(!v.querySelector('source[data-src]')) return;
    v.querySelectorAll('source[data-src]').forEach(s=>{s.src=s.dataset.src;s.removeAttribute('data-src');});
    v.load();
    const p=v.play();
    if(p&&p.catch) p.catch(()=>{});
  };
  if('requestIdleCallback' in window) requestIdleCallback(load,{timeout:2500});
  else setTimeout(load,1500);
})();

const heroVideo=document.getElementById('herovideo');
const soundToggle=document.getElementById('soundToggle');
let soundWanted=true, audioArmed=false, pendingAudio=false, fadeTimer=null;

function fadeVolumeTo(target,duration){
  if(fadeTimer){clearInterval(fadeTimer);fadeTimer=null;}
  const from=heroVideo.volume, started=performance.now();
  fadeTimer=setInterval(()=>{
    const p=Math.min(1,(performance.now()-started)/duration);
    heroVideo.volume=from+(target-from)*p;
    if(p>=1){clearInterval(fadeTimer);fadeTimer=null;}
  },40);
}
function paintSound(on){
  if(!soundToggle) return;
  soundToggle.classList.toggle('is-on',on);
  soundToggle.setAttribute('aria-pressed',String(on));
  soundToggle.setAttribute('aria-label',on?'Mute video':'Turn sound on');
}
function armAudio(){
  if(audioArmed) return;
  if(!soundWanted) return;
  /* the video may not have loaded yet - remember the tap, do not swallow it */
  pendingAudio=true;
  tryPlayWithSound();
}
/* the audio counts as armed only once the browser has actually played it */
function tryPlayWithSound(){
  if(audioArmed) return;
  heroVideo.volume=0;
  heroVideo.muted=false;
  const p=heroVideo.play();
  if(p&&p.then){
    p.then(()=>{audioArmed=true;pendingAudio=false;fadeVolumeTo(1,1400);paintSound(true);})
     .catch(()=>{heroVideo.muted=true;heroVideo.volume=1;paintSound(false);});
  }else{
    heroVideo.muted=true;heroVideo.volume=1;
  }
}
if(heroVideo){
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduceMotion){
    heroVideo.removeAttribute('autoplay');
    heroVideo.pause();
  }else{
    heroVideo.play().catch(()=>{});
  }
  heroVideo.addEventListener('canplay',()=>{
    if(!reduceMotion) heroVideo.play().catch(()=>{});
    /* a tap that arrived before the video loaded still counts */
    if(pendingAudio&&!audioArmed) tryPlayWithSound();
  });
  if(soundToggle){
    soundToggle.addEventListener('click',()=>{
      audioArmed=true;
      if(heroVideo.muted){
        soundWanted=true;
        heroVideo.volume=0;
        heroVideo.muted=false;
        const p=heroVideo.play();
        if(p&&p.then) p.then(()=>fadeVolumeTo(1,900)).catch(()=>{heroVideo.muted=true;heroVideo.volume=1;});
        else {heroVideo.muted=true;heroVideo.volume=1;}
        paintSound(true);
      }else{
        soundWanted=false;
        heroVideo.muted=true;
        heroVideo.volume=1;
        paintSound(false);
      }
    });
  }
  ['pointerdown','touchstart','keydown','click'].forEach(evt=>{
    window.addEventListener(evt,armAudio,{once:true,passive:true});
  });
}

/* header state */
const head=document.querySelector('#head');
function updateHead(){head.classList.toggle('is-scrolled',window.scrollY>24)}
window.addEventListener('scroll',updateHead,{passive:true});
updateHead();

/* scroll reveal */
const io=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}});
},{threshold:0,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* testimonial carousel controls */
const track=document.querySelector('#track');
const tprev=document.querySelector('#tprev');
const tnext=document.querySelector('#tnext');
const tcount=document.querySelector('#tcount');
const cards=()=>Array.from(track.querySelectorAll('.tcard'));
function currentIndex(){
  const c=cards(); if(!c.length) return 0;
  const x=track.scrollLeft;
  let best=0,bd=Infinity;
  c.forEach((el,i)=>{const d=Math.abs(el.offsetLeft-x);if(d<bd){bd=d;best=i}});
  return best;
}
function updateCount(){
  const i=currentIndex(),n=cards().length;
  tcount.textContent=String(i+1).padStart(2,'0')+' / '+String(n).padStart(2,'0');
}
function step(dir){
  const c=cards(); if(!c.length) return;
  const i=Math.max(0,Math.min(c.length-1,currentIndex()+dir));
  c[i].scrollIntoView({behavior:'smooth',inline:'start',block:'nearest'});
}
tprev.addEventListener('click',()=>step(-1));
tnext.addEventListener('click',()=>step(1));
track.addEventListener('scroll',()=>{clearTimeout(window.__tc);window.__tc=setTimeout(updateCount,120)},{passive:true});
window.addEventListener('resize',updateCount);
updateCount();



/* ---------- resume a saved application, share, back to top ---------- */
(function(){
  const bar=document.getElementById('resumeBar');
  if(bar){
    let draft=null;
    try{ draft=JSON.parse(localStorage.getItem('sf7_draft')||'null'); }catch(e){}
    if(draft&&draft.answers&&Object.keys(draft.answers).length){
      bar.hidden=false;
      document.getElementById('resumeYes').addEventListener('click',()=>{
        try{ Object.assign(answers,draft.answers); }catch(e){}
        bar.hidden=true;
        try{
          if(typeof draft.index==='number'){ index=Math.min(draft.index,questions.length); }
          render(true);
        }catch(e){}
      });
      document.getElementById('resumeNo').addEventListener('click',()=>{
        try{ localStorage.removeItem('sf7_draft'); }catch(e){}
        bar.hidden=true;
      });
    }
    setInterval(()=>{
      try{
        if(typeof answers!=='undefined'&&Object.keys(answers).length) localStorage.setItem('sf7_draft',JSON.stringify({answers:answers,index:(typeof index!=='undefined'?index:0),at:Date.now()}));
      }catch(e){}
    },1500);
  }
  const top=document.getElementById('toTop');
  if(top){
    const onScroll=()=>{ top.classList.toggle('show',window.scrollY>700); };
    window.addEventListener('scroll',onScroll,{passive:true});
    onScroll();
    top.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  }
  const share=document.getElementById('shareBtn');
  if(share){
    share.addEventListener('click',async()=>{
      const data={title:document.title,text:'Build your own beauty brand - Skip to 7 Figures',url:location.href};
      try{
        if(navigator.share){ await navigator.share(data); return; }
        await navigator.clipboard.writeText(location.href);
        share.textContent='Link copied';
        setTimeout(()=>{share.textContent='Share this page ↗';},2200);
      }catch(e){}
    });
  }
})();

