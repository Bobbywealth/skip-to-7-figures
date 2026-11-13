const API='https://skip-to-7-figures-admin.skip7figures.workers.dev';
/* the delete code travels in the URL fragment so it never reaches the server logs */
const q=new URLSearchParams(location.hash.replace(/^#/,''));
if(q.get('email')) document.getElementById('email').value=q.get('email');
if(q.get('token')) document.getElementById('token').value=q.get('token');
const msg=document.getElementById('msg'), btn=document.getElementById('delBtn');
document.getElementById('delForm').addEventListener('submit',async e=>{
  e.preventDefault();
  btn.disabled=true; btn.textContent='Deleting…';
  msg.className='msg';
  try{
    const r=await fetch(API+'/api/delete-my-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      email:document.getElementById('email').value.trim(),
      token:document.getElementById('token').value.trim()
    })});
    const d=await r.json().catch(()=>({}));
    if(r.ok&&d.ok){ msg.className='msg ok'; msg.textContent='Your information has been deleted. ('+(d.removed||1)+' application'+(d.removed===1?'':'s')+' removed)'; }
    else { msg.className='msg bad'; msg.textContent=d.error||'We could not delete that. Check the email and delete code and try again.'; }
  }catch(err){ msg.className='msg bad'; msg.textContent='Network error — please try again in a moment.'; }
  btn.disabled=false; btn.textContent='Delete my information';
});
