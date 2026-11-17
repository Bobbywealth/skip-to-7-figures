/* Meta Pixel for Skip to 7 Figures (Keenan Williams) — Pixel ID 1484110030240426.
   Lives in its own file because the site CSP has no 'unsafe-inline' for scripts.
   Fires PageView on every page that includes it; Lead and Schedule are fired
   from app.js (application submit success, and a real Calendly booking). */
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','1484110030240426');
fbq('track','PageView');
