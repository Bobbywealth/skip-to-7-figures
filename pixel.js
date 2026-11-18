/* Meta Pixel for Skip to 7 Figures (Keenan Williams) — Pixel ID 1484110030240426.
   Lives in its own file because the site CSP has no 'unsafe-inline' for scripts.
   Fires PageView on every page that includes it; Lead and Schedule are fired
   from app.js (application submit success, and a real Calendly booking).

   Every browser event carries an eventID. The matching server-side event
   (our Meta Conversions API call) reuses the same ID, so Meta counts the
   conversion ONCE instead of twice. */
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');

var SF7_PIXEL_ID='1484110030240426';
function sf7NewId(prefix){
  return (prefix||'ev')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
}
window.sf7Pixel={
  id:SF7_PIXEL_ID,
  newId:sf7NewId,
  /* fires a named event; the library queues it if it has not loaded yet.
     The de-duplication id goes in the 4th argument - passed inside the
     params object it only lands in custom data and Meta cannot match the
     browser event with the server one. */
  track:function(name,params,opts){
    try{
      if(typeof fbq!=='function') return false;
      fbq('track',name,params||{},opts||{});
      return true;
    }catch(e){ return false; }
  }
};
fbq('init',SF7_PIXEL_ID);
/* PageView once per page load */
if(!window.__sf7PageViewSent){
  window.__sf7PageViewSent=true;
  fbq('track','PageView',{},{eventID:sf7NewId('pv')});
}
