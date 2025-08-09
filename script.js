// ------------------- App Data & Init -------------------
const DEFAULTS = {
  users: [
    {email:'super@fest.com', pass:'12345', role:'superadmin', name:'Super Admin'},
    {email:'admin@fest.com', pass:'12345', role:'admin', name:'Admin One'},
    {email:'member@fest.com', pass:'12345', role:'member', name:'Member One'}
  ],
  donations: [
    {name:'Sharma',amount:2000,date:Date.now()-86400000},
    {name:'Radha',amount:5000,date:Date.now()-3600000}
  ],
  events: [
    {id:1,name:'Ganesh Chaturthi',datetime: new Date(Date.now()+ (5*24*3600*1000)).toISOString(),desc:'Main celebration'},
    {id:2,name:'Pranapratishta',datetime: new Date(Date.now()+ (6*24*3600*1000)).toISOString(),desc:'Temple consecration'}
  ],
  aartis: [
    {id:1,title:'Sookshma Ganesh Aarti',src:''},
    {id:2,title:'Shri Ganesh Chalisa',src:''}
  ],
  gallery: [],
  txns: []
};
const STORAGE_KEY = 'ganapathy_data_v1';
let APP = loadApp();

// ensure defaults
function loadApp(){
  let raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){ localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULTS)); return JSON.parse(JSON.stringify(DEFAULTS)); }
  return JSON.parse(raw);
}
function saveApp(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(APP)); }

// ------------------- Auth -------------------
function currentUser(){ try{ return JSON.parse(localStorage.getItem('ganapathy_user')); }catch(e){return null} }
function setCurrentUser(u){ localStorage.setItem('ganapathy_user', JSON.stringify(u)); renderHeader(); renderNav(); renderAll(); }
function logout(){ localStorage.removeItem('ganapathy_user'); showPage('page-login'); renderHeader(); renderNav(); showToast('Logged out'); }

// login
document.getElementById('btnLogin').addEventListener('click', ()=>{
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  if(!email || !pass){ document.getElementById('loginError').innerText='Provide credentials'; return; }
  const user = APP.users.find(u=>u.email===email && u.pass===pass);
  if(!user){ document.getElementById('loginError').innerText='Invalid credentials'; return;}
  setCurrentUser({email:user.email, role:user.role, name:user.name});
  document.getElementById('loginError').innerText='';
  showPage('page-dashboard');
});
document.getElementById('btnGuest').addEventListener('click', ()=>{
  setCurrentUser({email:'guest@local',role:'member',name:'Guest'});
  showPage('page-dashboard');
});
document.getElementById('btnLogout').addEventListener('click', logout);

// header theme toggle
document.getElementById('btnTheme').addEventListener('click', ()=>{
  document.body.classList.toggle('dark');
  document.getElementById('btnTheme').innerText = document.body.classList.contains('dark')? 'Light' : 'Dark';
});

// ------------------- Navigation -------------------
const PAGES = Array.from(document.querySelectorAll('.page'));
function showPage(id){
  PAGES.forEach(p=>p.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  window.scrollTo({top:0,behavior:'smooth'});
  renderAll();
}
function renderNav(){
  const nav = document.getElementById('mainNav');
  const u = currentUser();
  const role = u ? u.role : 'guest';
  const links = [
    {id:'page-dashboard', text:'Dashboard', show:true},
    {id:'page-aarti', text:'Aarti', show:true},
    {id:'page-events', text:'Events', show:true},
    {id:'page-gallery', text:'Gallery', show:true},
    {id:'page-donations', text:'Donations', show:true},
    {id:'page-finances', text:'Finances', show: role==='admin' || role==='superadmin' },
    {id:'page-volunteers', text:'Volunteers', show:true},
    {id:'page-store', text:'Store', show:true},
    {id:'page-contacts', text:'Contacts', show:true},
    {id:'page-checklist', text:'Checklist', show:true},
    {id:'page-suggestions', text:'Suggestions', show:true},
    {id:'page-admin', text:'Admin Panel', show: role==='admin' || role==='superadmin'},
    {id:'page-superadmin', text:'Super Admin', show: role==='superadmin'}
  ];
  nav.innerHTML = links.filter(l=>l.show).map(l=>`<a href="#" data-link="${l.id}" class="nav-link">${l.text}</a>`).join('');
  // attach clicks
  nav.querySelectorAll('.nav-link').forEach(a=>{
    a.onclick = (e)=>{ e.preventDefault(); showPage(a.getAttribute('data-link')); };
  });
}
function renderHeader(){
  const u = currentUser();
  const welcome = document.getElementById('welcomeText');
  const btnLogout = document.getElementById('btnLogout');
  if(u){ welcome.innerText = `Hello, ${u.name || u.email} (${u.role})`; btnLogout.classList.remove('hidden'); }
  else { welcome.innerText='Not signed in'; btnLogout.classList.add('hidden'); }
}

// ------------------- Render / Page functions -------------------
function renderAll(){
  renderHeader(); renderNav(); renderDashboard(); renderAarti(); renderEvents(); renderGallery(); renderDonations(); renderFinances(); renderVolunteers(); renderStore(); renderContacts(); renderChecklist(); renderSuggestions(); renderAdminMgmt();
  const u=currentUser();
  // show/hide admin forms:
  if(u && (u.role==='admin' || u.role==='superadmin')) document.getElementById('eventForm').classList.remove('hidden'); else document.getElementById('eventForm').classList.add('hidden');
  if(u && (u.role==='admin' || u.role==='superadmin')) document.getElementById('txnForm').classList.remove('hidden'); else document.getElementById('txnForm').classList.add('hidden');
}
function renderDashboard(){
  if(!document.getElementById('page-dashboard') || document.getElementById('page-dashboard').classList.contains('hidden')) return;
  // metrics drawing simple circles
  const totalDon = APP.donations.reduce((s,d)=>s+d.amount,0);
  const usersCount = APP.users.length;
  const prayers = APP.aartis.length * 10;
  drawCircle('donationCircle', Math.min(100, totalDon/1000));
  drawCircle('usersCircle', Math.min(100, usersCount));
  drawCircle('prayersCircle', Math.min(100, prayers));
  // countdown to nearest event
  const next = APP.events.slice().sort((a,b)=> new Date(a.datetime)-new Date(b.datetime))[0];
  if(next){ document.getElementById('nextEventName').innerText = next.name; startCountdown(new Date(next.datetime)); }
}
// draw simple circular progress on canvas
function drawCircle(canvasId, percent){
  const c = document.getElementById(canvasId); if(!c) return;
  const ctx = c.getContext('2d'); const w=c.width, h=c.height; ctx.clearRect(0,0,w,h);
  const center = {x:w/2,y:h/2}; const radius = Math.min(w,h)/2 - 8;
  // bg
  ctx.beginPath(); ctx.arc(center.x,center.y,radius,0,Math.PI*2); ctx.fillStyle='#fff3e6'; ctx.fill();
  // progress
  ctx.beginPath(); ctx.moveTo(center.x,center.y); ctx.arc(center.x,center.y,radius, -Math.PI/2, -Math.PI/2 + Math.PI*2*(percent/100)); ctx.closePath();
  ctx.fillStyle = '#ffd19a'; ctx.fill();
  // center text
  ctx.fillStyle='#5b3a00'; ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(Math.round(percent)+'%', center.x, center.y);
}

// ------------------- Countdown -------------------
let countdownInterval = null;
function startCountdown(dt){
  if(countdownInterval) clearInterval(countdownInterval);
  const el = document.getElementById('countdown');
  function tick(){
    const now=Date.now(); const diff = dt - now;
    if(diff<=0){ el.innerHTML = '<div>00</div><div>00</div><div>00</div>'; clearInterval(countdownInterval); return; }
    const days = Math.floor(diff/86400000); const hrs = Math.floor(diff%86400000/3600000); const mins = Math.floor(diff%3600000/60000);
    el.innerHTML = `<div>${days}d</div><div>${hrs}h</div><div>${mins}m</div>`;
  }
  tick(); countdownInterval = setInterval(tick,60000);
}

// ------------------- Aarti -------------------
function renderAarti(){
  const list = document.getElementById('aartiList'); if(!list) return; list.innerHTML='';
  APP.aartis.forEach(a=>{
    const d = document.createElement('div'); d.className='list-card';
    d.innerHTML = `<div><strong>${a.title}</strong><p class="muted">Duration: —</p></div><div><button class="btn primary" onclick="playAarti(${a.id})">Play</button></div>`;
    list.appendChild(d);
  });
}
function playAarti(id){
  const a = APP.aartis.find(x=>x.id===id); if(!a) return;
  document.getElementById('playerCard').classList.remove('hidden');
  document.getElementById('playerTitle').innerText = a.title;
  const p = document.getElementById('audioPlayer');
  if(a.src) { p.src = a.src; p.play().catch(()=>{}); } else { p.src=''; showToast('No audio file set (demo)'); }
}

// ------------------- Events -------------------
function renderEvents(){
  const el = document.getElementById('eventsList'); if(!el) return; el.innerHTML='';
  APP.events.sort((a,b)=> new Date(a.datetime)-new Date(b.datetime)).forEach(ev=>{
    const li = document.createElement('div'); li.className='list-card';
    li.innerHTML = `<div><strong>${ev.name}</strong><p class="muted">${new Date(ev.datetime).toLocaleString()} — ${ev.desc}</p></div><div><button class="btn" onclick="showToast('Open event (demo)')">Open</button></div>`;
    el.appendChild(li);
  });
}
function addEvent(){
  const name = document.getElementById('evName').value.trim(); const dt = document.getElementById('evDate').value;
  if(!name || !dt) return showToast('Provide name & date');
  const id = (APP.events.reduce((s,e)=>Math.max(s,e.id||0),0)||0)+1;
  APP.events.push({id,name,datetime:new Date(dt).toISOString(),desc:''});
  saveApp(); renderEvents(); showToast('Event added');
}

// ------------------- Gallery -------------------
document.getElementById('galleryFile').addEventListener('change',(e)=>{
  const f = e.target.files[0]; if(!f) return;
  const reader = new FileReader(); reader.onload = ()=>{ APP.gallery.push({src:reader.result,name:f.name}); saveApp(); renderGallery(); showToast('Image added (local preview)'); };
  reader.readAsDataURL(f);
});
function renderGallery(){
  const g = document.getElementById('galleryPreview'); if(!g) return; g.innerHTML='';
  APP.gallery.forEach(img=>{
    const el = document.createElement('div'); el.innerHTML=`<img src="${img.src}" style="width:100%;height:120px;object-fit:cover;border-radius:8px"/><div class="muted">${img.name}</div>`;
    g.appendChild(el);
  });
}

// ------------------- Donations -------------------
function renderDonations(){
  const l = document.getElementById('donationList'); if(!l) return; l.innerHTML='';
  APP.donations.slice().sort((a,b)=> b.amount - a.amount).forEach(d=> {
    const li = document.createElement('li'); li.textContent = `${d.name} — ₹${d.amount}`;
    l.appendChild(li);
  });
}
function simulateDonation(){
  const name = document.getElementById('donorName').value.trim() || 'Anonymous';
  const amt = +(document.getElementById('donorAmount').value || 0);
  if(amt<=0) return showToast('Enter amount');
  APP.donations.push({name,amount:amt,date:Date.now()}); saveApp(); renderDonations(); renderFinances();
  showToast('Donation recorded (demo)');
}
function copyToClipboard(id){
  const el = document.getElementById(id); el.select(); document.execCommand('copy'); showToast('Copied');
}

// ------------------- Finances -------------------
function renderFinances(){
  const income = APP.txns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0) + APP.donations.reduce((s,d)=>s + d.amount,0);
  const expense = APP.txns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  document.getElementById('totalIncome').innerText = '₹' + income;
  document.getElementById('totalExpenses').innerText = '₹' + expense;
  document.getElementById('balance').innerText = '₹' + (income-expense);
  const el = document.getElementById('txnList'); el.innerHTML='';
  const txns = APP.txns.slice().reverse();
  txns.forEach(tx => {
    const d = document.createElement('div'); d.className='list-card';
    d.innerHTML = `<div><strong>${tx.title}</strong><p class="muted">${tx.type} — ₹${tx.amount}</p></div><div><button class="btn ghost" onclick="deleteTxn('${tx.id}')">Delete</button></div>`;
    el.appendChild(d);
  });
}
function addTxn(){
  const t = document.getElementById('txnTitle').value.trim(); const amt = +document.getElementById('txnAmt').value; const type = document.getElementById('txnType').value;
  if(!t || !amt) return showToast('Add title & amount');
  const id = 'tx'+Date.now(); APP.txns.push({id,title:t,amount:amt,type}); saveApp(); renderFinances(); showToast('Recorded');
}
function deleteTxn(id){ APP.txns = APP.txns.filter(x=>x.id!==id); saveApp(); renderFinances(); }

// ------------------- Volunteers -------------------
function volunteerSignup(){
  const name = document.getElementById('volName').value.trim(); const phone = document.getElementById('volPhone').value.trim();
  if(!name || !phone) return showToast('Fill name & phone');
  APP.volunteers = APP.volunteers || [];
  APP.volunteers.push({name,phone}); saveApp(); renderVolunteers(); showToast('Thank you for volunteering');
}
function renderVolunteers(){
  const el = document.getElementById('volList'); if(!el) return; el.innerHTML='';
  (APP.volunteers||[]).forEach(v=>{ const li=document.createElement('div'); li.className='list-card'; li.innerHTML=`<div>${v.name}<div class="muted">${v.phone}</div></div>`; el.appendChild(li); });
}

// ------------------- Store -------------------
function renderStore(){
  const items = APP.store || [
    {id:1,title:'Festival T-Shirt',price:299},
    {id:2,title:'Prasad Packet',price:49},
    {id:3,title:'Ganesha Idol (small)',price:499}
  ];
  APP.store = items;
  const el = document.getElementById('storeList'); if(!el) return; el.innerHTML='';
  items.forEach(it=>{
    const d=document.createElement('div'); d.className='card';
    d.innerHTML = `<div><strong>${it.title}</strong><p class="muted">₹${it.price}</p></div><div><button class="btn" onclick="addToCart(${it.id})">Add</button></div>`;
    el.appendChild(d);
  });
  renderCart();
}
function addToCart(id){
  APP.cart = APP.cart || [];
  const it = APP.store.find(s=>s.id===id); if(!it) return;
  APP.cart.push(it); saveApp(); renderCart(); showToast('Added to cart');
}
function renderCart(){
  const el = document.getElementById('cartList'); if(!el) return; el.innerHTML='';
  (APP.cart||[]).forEach((c,idx)=>{ const d=document.createElement('div'); d.className='list-card'; d.innerHTML=`<div>${c.title}</div><div><button class="btn ghost" onclick="removeFromCart(${idx})">Remove</button></div>`; el.appendChild(d); });
}
function removeFromCart(i){ APP.cart.splice(i,1); saveApp(); renderCart(); }

// ------------------- Contacts -------------------
function renderContacts(){
  const defaults = APP.contacts || [
    {name:'Temple Office', phone:'0123456789'}, {name:'Emergency', phone:'100'}
  ];
  APP.contacts = defaults;
  const el = document.getElementById('contactsList'); el.innerHTML='';
  APP.contacts.forEach(c=>{ const d=document.createElement('div'); d.className='list-card'; d.innerHTML=`<div><strong>${c.name}</strong><div class="muted">${c.phone}</div></div>`; el.appendChild(d); });
}

// ------------------- Checklist -------------------
function renderChecklist(){
  APP.checklist = APP.checklist || [{text:'Stage setup',done:false},{text:'Sound check',done:false}];
  const el = document.getElementById('checklist'); el.innerHTML='';
  APP.checklist.forEach((c,idx)=>{ const li=document.createElement('div'); li.className='list-card'; li.innerHTML = `<div><input type="checkbox" ${c.done? 'checked':''} onchange="toggleChecklist(${idx})"/> ${c.text}</div><div><button class="btn ghost" onclick="removeChecklist(${idx})">Delete</button></div>`; el.appendChild(li);});
}
function addChecklist(){ const t=document.getElementById('checkText').value.trim(); if(!t) return; APP.checklist.push({text:t,done:false}); saveApp(); renderChecklist(); }
function toggleChecklist(i){ APP.checklist[i].done=!APP.checklist[i].done; saveApp(); renderChecklist(); }
function removeChecklist(i){ APP.checklist.splice(i,1); saveApp(); renderChecklist(); }

// ------------------- Suggestions -------------------
function addSuggestion(){ const t=document.getElementById('suggestText').value.trim(); if(!t) return; APP.suggestions = APP.suggestions||[]; APP.suggestions.push({text:t,at:Date.now(),by:currentUser()?currentUser().name:'Guest'}); saveApp(); renderSuggestions(); document.getElementById('suggestText').value=''; }
function renderSuggestions(){ const el=document.getElementById('suggestionsList'); el.innerHTML=''; (APP.suggestions||[]).slice().reverse().forEach(s=>{ const d=document.createElement('div'); d.className='list-card'; d.innerHTML=`<div><strong>${s.by}</strong><p class="muted">${new Date(s.at).toLocaleString()}</p><div>${s.text}</div></div>`; el.appendChild(d); }); }

// ------------------- Admin & Superadmin management -------------------
function renderAdminMgmt(){
  const adminEl = document.getElementById('adminMgmt'); const memEl = document.getElementById('memberMgmt');
  if(adminEl){ adminEl.innerHTML=''; APP.users.filter(u=>u.role==='admin').forEach(u=>{ const li=document.createElement('div'); li.className='list-card'; li.innerHTML=`<div>${u.email}</div><div><button class="btn ghost" onclick="deleteUser('${u.email}')">Delete</button></div>`; adminEl.appendChild(li); }); }
  if(memEl){ memEl.innerHTML=''; APP.users.filter(u=>u.role==='member').forEach(u=>{ const li=document.createElement('div'); li.className='list-card'; li.innerHTML=`<div>${u.email}</div><div><button class="btn ghost" onclick="deleteUser('${u.email}')">Delete</button></div>`; memEl.appendChild(li); }); }
}
function createAdmin(){
  const email=document.getElementById('newAdminEmail').value.trim(); const pass=document.getElementById('newAdminPass').value.trim();
  if(!email||!pass) return showToast('Provide email & pass');
  if(APP.users.find(u=>u.email===email)) return showToast('User exists');
  APP.users.push({email,pass,role:'admin',name:email.split('@')[0]}); saveApp(); renderAdminMgmt(); showToast('Admin created');
}
function createMember(){
  const email=document.getElementById('newMemberEmail').value.trim(); const pass=document.getElementById('newMemberPass').value.trim();
  if(!email||!pass) return showToast('Provide email & pass');
  if(APP.users.find(u=>u.email===email)) return showToast('User exists');
  APP.users.push({email,pass,role:'member',name:email.split('@')[0]}); saveApp(); renderAdminMgmt(); showToast('Member added');
}
function deleteUser(email){
  if(!confirm('Delete user '+email+'?')) return;
  APP.users = APP.users.filter(u=>u.email!==email); saveApp(); renderAdminMgmt(); showToast('Deleted');
}

// ------------------- Txn delete & misc -------------------
function deleteTxn(id){ APP.txns = APP.txns.filter(x=>x.id!==id); saveApp(); renderFinances(); }
function showToast(msg,timeout=2200){ const t=document.getElementById('toast'); t.innerText=msg; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),timeout); }

// ------------------- Init UI binding -------------------
document.getElementById('year').innerText = new Date().getFullYear();
renderNav(); renderHeader(); renderAll();
// show dashboard if already logged in
if(currentUser()){ showPage('page-dashboard'); } else { showPage('page-login'); }
