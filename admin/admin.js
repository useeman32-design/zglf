/* ZGLF Admin Dashboard — professional admin panel */
const API=window.location.pathname.replace(/\/admin\/.*$/,'/api');
let TOKEN=localStorage.getItem('zglf_token')||'';
let ME=null;
const faIcons=['fa-crown','fa-hands-helping','fa-pen-fancy','fa-file-alt','fa-coins','fa-calculator','fa-bullhorn','fa-heart','fa-star','fa-user-tie','fa-user','fa-user-friends','fa-users','fa-user-shield','fa-user-check','fa-user-graduate','fa-graduation-cap','fa-book','fa-book-open','fa-school','fa-chalkboard-teacher','fa-heartbeat','fa-stethoscope','fa-notes-medical','fa-pills','fa-hospital','fa-hand-holding-medical','fa-hands-usd','fa-money-bill-wave','fa-piggy-bank','fa-hand-holding-usd','fa-briefcase','fa-tools','fa-seedling','fa-tractor','fa-truck','fa-tint','fa-home','fa-place-of-worship','fa-utensils','fa-apple-alt','fa-bread-slice','fa-hands','fa-dove','fa-globe-africa','fa-flag','fa-award','fa-trophy','fa-medal','fa-ribbon','fa-gem','fa-bullhorn','fa-newspaper','fa-microphone','fa-camera','fa-video','fa-share-alt','fa-envelope','fa-phone','fa-map-marker-alt','fa-paper-plane','fa-gift','fa-donate','fa-hand-holding-heart','fa-praying-hands','fa-leaf','fa-tree','fa-sun','fa-fist-raised','fa-balance-scale','fa-gavel','fa-landmark','fa-shield-alt','fa-key','fa-lock','fa-unlock','fa-cog','fa-sliders-h','fa-wrench','fa-chart-line','fa-chart-bar','fa-chart-pie','fa-tasks','fa-clipboard-list','fa-list-alt','fa-calendar-alt','fa-calendar-check','fa-clock','fa-map-marked-alt','fa-compass','fa-route','fa-flag-checkered','fa-rocket','fa-lightbulb','fa-eye','fa-smile','fa-handshake','fa-link','fa-puzzle-piece','fa-futbol','fa-palette','fa-music','fa-theater-masks','fa-pray','fa-mosque','fa-church','fa-university'];
const state={currentPage:'dashboard',pageData:{}};
const $=s=>document.querySelector(s);const $$=s=>document.querySelectorAll(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate=d=>d?new Date(d+' UTC').toLocaleDateString('en-NG',{year:'numeric',month:'short',day:'numeric'}):'';
const fmtMoney=n=>'₦'+Number(n||0).toLocaleString('en-NG',{minimumFractionDigits:2,maximumFractionDigits:2});

function authHeaders(){const h={'Content-Type':'application/json'};if(TOKEN)h['Authorization']='Bearer '+TOKEN;return h;}
async function api(path,opts={}){opts.headers=opts.headers||{};if(!(opts.body instanceof FormData)&&!opts.headers['Content-Type'])opts.headers['Content-Type']='application/json';if(TOKEN)opts.headers['Authorization']='Bearer '+TOKEN;const r=await fetch(API+path,opts);if(r.status===401){localStorage.removeItem('zglf_token');TOKEN='';if(!location.hash.includes('login'))location.hash='login';throw new Error('Unauthorized');}const ct=r.headers.get('content-type')||'';const data=ct.includes('json')?await r.json():await r.text();if(!r.ok)throw new Error(data.error||data||'Error '+r.status);return data;}
async function uploadFile(file,subdir='images'){const fd=new FormData();fd.append('file',file);fd.append('subdir',subdir);const r=await fetch(API+'/upload',{method:'POST',headers:{Authorization:'Bearer '+TOKEN},body:fd});const d=await r.json();if(!r.ok)throw new Error(d.error||'Upload failed');return d.media;}
function can(p){return ME&&(ME.role==='admin'||(ME.perms&&ME.perms[p]));}
function toast(m,type='ok'){const t=document.createElement('div');t.className='toast toast-'+type;t.textContent=m;$('#toasts').appendChild(t);setTimeout(()=>t.remove(),4000);}
function overlay(content){$('#overlayContent').innerHTML=content;$('#overlay').classList.add('open');}
function closeOverlay(){$('#overlay').classList.remove('open');$('#overlayContent').innerHTML='';}

/* ==================== WYSIWYG EDITOR ==================== */
function initWysiwyg(containerId, initialHtml, onChange) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = `
    <div class="wysiwyg-toolbar">
      <button type="button" data-cmd="bold" title="Bold"><i class="fas fa-bold"></i></button>
      <button type="button" data-cmd="italic" title="Italic"><i class="fas fa-italic"></i></button>
      <button type="button" data-cmd="underline" title="Underline"><i class="fas fa-underline"></i></button>
      <span class="tb-sep"></span>
      <button type="button" data-cmd="formatBlock" data-val="h2" title="Heading">H</button>
      <button type="button" data-cmd="formatBlock" data-val="h3" title="Subheading">h</button>
      <button type="button" data-cmd="formatBlock" data-val="p" title="Paragraph">P</button>
      <span class="tb-sep"></span>
      <button type="button" data-cmd="insertUnorderedList" title="Bullet list"><i class="fas fa-list-ul"></i></button>
      <button type="button" data-cmd="insertOrderedList" title="Numbered list"><i class="fas fa-list-ol"></i></button>
      <span class="tb-sep"></span>
      <button type="button" data-cmd="justifyLeft" title="Align left"><i class="fas fa-align-left"></i></button>
      <button type="button" data-cmd="justifyCenter" title="Align center"><i class="fas fa-align-center"></i></button>
      <button type="button" data-cmd="justifyRight" title="Align right"><i class="fas fa-align-right"></i></button>
      <span class="tb-sep"></span>
      <button type="button" data-cmd="createLink" title="Link"><i class="fas fa-link"></i></button>
      <button type="button" data-cmd="removeFormat" title="Clear formatting"><i class="fas fa-eraser"></i></button>
    </div>
    <div class="wysiwyg-area" contenteditable="true"></div>`;
  const area = c.querySelector('.wysiwyg-area');
  area.innerHTML = initialHtml || '';
  c.querySelectorAll('.wysiwyg-toolbar button').forEach(b=>{
    b.addEventListener('mousedown',e=>{e.preventDefault();});
    b.addEventListener('click',e=>{
      e.preventDefault();
      const cmd=b.dataset.cmd, val=b.dataset.val||null;
      if(cmd==='createLink'){const u=prompt('Enter URL:','https://');if(u)document.execCommand('createLink',false,u);}
      else document.execCommand(cmd,false,val);
      area.focus();
      if(onChange)onChange(area.innerHTML);
    });
  });
  area.addEventListener('input',()=>{if(onChange)onChange(area.innerHTML);});
  area.addEventListener('blur',()=>{if(onChange)onChange(area.innerHTML);});
  return area;
}
function getWysiwyg(id){const a=document.querySelector('#'+id+' .wysiwyg-area');return a?a.innerHTML:'';}
function setWysiwyg(id,html){const a=document.querySelector('#'+id+' .wysiwyg-area');if(a)a.innerHTML=html||'';}

/* ==================== ICON PICKER ==================== */
function iconPicker(selectedIcon,onPick){
  const grid=faIcons.map(ic=>`<button type="button" class="ipick ${ic===selectedIcon?'sel':''}" data-icon="${ic}" title="${ic}"><i class="fas ${ic}"></i></button>`).join('');
  return `<div class="icon-picker">
    <div class="ipick-sel"><i class="fas ${selectedIcon||'fa-star'}"></i> <span>${selectedIcon||'choose'}</span></div>
    <div class="ipick-grid">${grid}</div>
    <input type="hidden" class="ipick-value" value="${esc(selectedIcon||'')}">
  </div>`;
}
function bindIconPicker(root,onPick){
  root.querySelectorAll('.icon-picker').forEach(picker=>{
    const selBtn=picker.querySelector('.ipick-sel');
    const grid=picker.querySelector('.ipick-grid');
    selBtn.addEventListener('click',e=>{e.stopPropagation();document.querySelectorAll('.ipick-grid.open').forEach(g=>{if(g!==grid)g.classList.remove('open');});grid.classList.toggle('open');});
    grid.querySelectorAll('.ipick').forEach(b=>{
      b.addEventListener('click',e=>{
        e.stopPropagation();
        grid.querySelectorAll('.ipick.sel').forEach(x=>x.classList.remove('sel'));
        b.classList.add('sel');
        const ic=b.dataset.icon;
        picker.querySelector('.ipick-value').value=ic;
        selBtn.innerHTML=`<i class="fas ${ic}"></i> <span>${ic}</span>`;
        grid.classList.remove('open');
        if(onPick)onPick(ic);
      });
    });
  });
  document.addEventListener('click',()=>{root.querySelectorAll('.ipick-grid.open').forEach(g=>g.classList.remove('open'));});
}
function getIconPicker(root){const i=root.querySelector('.ipick-value');return i?i.value:'';}

/* ==================== MEDIA UPLOADER (local only, shows preview) ==================== */
function mediaUploader(name,currentUrl,opts={}){
  const accept=opts.accept||'image/*';
  const label=opts.label||'Image';
  return `<div class="media-uploader" data-name="${name}">
    <label class="mu-label">${label}</label>
    <div class="mu-wrap">
      <div class="mu-preview ${currentUrl?'has':''}">
        ${currentUrl?(/\.mp4|\.webm|\.mov/i.test(currentUrl)?`<video src="${esc(currentUrl)}" controls></video>`:`<img src="${esc(currentUrl)}" alt="">`):`<i class="fas fa-image"></i><span>No image selected</span>`}
      </div>
      <div class="mu-actions">
        <button type="button" class="btn-secondary mu-browse"><i class="fas fa-upload"></i> Choose file</button>
        <button type="button" class="btn-ghost mu-clear" ${currentUrl?'':'style=display:none'}><i class="fas fa-times"></i> Remove</button>
        <input type="file" class="mu-file" accept="${accept}" hidden>
        <input type="hidden" class="mu-url" value="${esc(currentUrl||'')}">
        <div class="mu-status"></div>
      </div>
    </div>
  </div>`;
}
function bindMediaUploader(root,onChange){
  root.querySelectorAll('.media-uploader').forEach(mu=>{
    const preview=mu.querySelector('.mu-preview');
    const fileInp=mu.querySelector('.mu-file');
    const urlInp=mu.querySelector('.mu-url');
    const clearBtn=mu.querySelector('.mu-clear');
    const browse=mu.querySelector('.mu-browse');
    const status=mu.querySelector('.mu-status');
    const showPreview=(url)=>{
      if(!url){preview.innerHTML=`<i class="fas fa-image"></i><span>No image selected</span>`;preview.classList.remove('has');clearBtn.style.display='none';return;}
      preview.classList.add('has');clearBtn.style.display='';
      if(/\.(mp4|webm|mov)/i.test(url))preview.innerHTML=`<video src="${esc(url)}" controls></video>`;
      else preview.innerHTML=`<img src="${esc(url)}" alt="">`;
    };
    browse.onclick=()=>fileInp.click();
    fileInp.onchange=async()=>{
      const f=fileInp.files[0];if(!f)return;
      status.textContent='Uploading…';browse.disabled=true;
      try{
        const subdir=mu.dataset.subdir||(/video/i.test(f.type)?'events':'images');
        const m=await uploadFile(f,subdir);
        urlInp.value=m.url;showPreview(m.url);status.textContent='';if(onChange)onChange(m.url);
      }catch(e){status.textContent='Upload failed: '+e.message;}
      browse.disabled=false;
    };
    clearBtn.onclick=()=>{urlInp.value='';fileInp.value='';showPreview('');if(onChange)onChange('');};
  });
}
function getMU(root,name){const i=root.querySelector(`.media-uploader[data-name="${name}"] .mu-url`);return i?i.value:'';}

/* ==================== ROUTING ==================== */
function navigate(){
  const h=(location.hash||'#dashboard').replace('#','');
  state.currentPage=h;
  $$('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.page===h));
  renderPage(h);
}
window.addEventListener('hashchange',navigate);

/* ==================== LOGIN ==================== */
async function doLogin(e){
  e.preventDefault();
  const u=$('#loginUser').value,p=$('#loginPass').value;
  try{const d=await api('/auth/login',{method:'POST',body:JSON.stringify({username:u,password:p})});
  TOKEN=d.token;ME=d.user;localStorage.setItem('zglf_token',TOKEN);location.hash='dashboard';
  }catch(e){$('#loginErr').textContent=e.message;}
}
async function boot(){
  $('#toasts').innerHTML='';
  if(!TOKEN){renderLogin();return;}
  try{ME=await api('/auth/me');}catch(e){renderLogin();return;}
  renderShell();navigate();
}
function logout(){localStorage.removeItem('zglf_token');TOKEN='';ME=null;location.hash='login';renderLogin();}

function renderLogin(){
  document.body.classList.add('on-login');
  $('#shell').style.display='none';
  $('#loginScreen').style.display='flex';
}
function renderShell(){
  document.body.classList.remove('on-login');
  $('#shell').style.display='grid';
  $('#loginScreen').style.display='none';
  const pages=[
    {id:'dashboard',label:'Dashboard',icon:'fa-tachometer-alt'},
    {id:'hero',label:'Homepage Hero',icon:'fa-image'},
    {id:'site',label:'Site Info',icon:'fa-cog'},
    {id:'footer',label:'Footer Content',icon:'fa-shoe-prints'},
    {id:'donations',label:'Donations & Payments',icon:'fa-hand-holding-heart'},
    {id:'programs',label:'Programs',icon:'fa-book'},
    {id:'events',label:'Events',icon:'fa-calendar'},
    {id:'nec',label:'NEC / Leadership',icon:'fa-users-cog'},
    {id:'photos',label:'Media Library',icon:'fa-images'},
    {id:'members',label:'Members',icon:'fa-user-friends'},
    {id:'messages',label:'Messages',icon:'fa-envelope'},
    ...(can('users')?[{id:'users',label:'Users & Permissions',icon:'fa-user-shield'}]:[]),
    {id:'settings',label:'Settings',icon:'fa-sliders-h'},
  ];
  const navHtml=pages.map(p=>`<div class="nav-item ${can(p.id)||['dashboard','settings'].includes(p.id)?'':'nav-disabled'}" data-page="${p.id}"><i class="fas ${p.icon}"></i><span>${p.label}</span></div>`).join('');
  $('#sideNav').innerHTML=navHtml+`<div class="nav-item nav-logout" data-action="logout"><i class="fas fa-sign-out-alt"></i><span>Logout (${esc(ME.username)})</span></div>`;
  $$('.nav-item').forEach(n=>{
    n.onclick=()=>{if(n.dataset.action==='logout')logout();else location.hash=n.dataset.page;};
  });
  $('#brandLogo').innerHTML=`<img src="${API.replace('/api','/images/zglf-logo.png')}" alt="ZGLF" onerror="this.style.display='none'">ZGLF Admin`;
}

/* ==================== PAGES ==================== */
async function renderPage(p){
  const main=$('#pageMain');
  main.innerHTML='<div class="loading">Loading…</div>';
  try{
    switch(p){
      case 'dashboard':await renderDashboard(main);break;
      case 'hero':await renderHero(main);break;
      case 'site':await renderSite(main);break;
      case 'footer':await renderFooter(main);break;
      case 'donations':await renderDonations(main);break;
      case 'programs':await renderPrograms(main);break;
      case 'events':await renderEvents(main);break;
      case 'nec':await renderNEC(main);break;
      case 'photos':await renderPhotos(main);break;
      case 'members':await renderMembers(main);break;
      case 'messages':await renderMessages(main);break;
      case 'users':await renderUsers(main);break;
      case 'settings':await renderSettings(main);break;
      default:main.innerHTML=`<p>Page "${p}" coming soon.</p>`;
    }
  }catch(e){main.innerHTML=`<div class="error"><i class="fas fa-exclamation-triangle"></i> ${esc(e.message)}</div>`;}
}

/* ---------- Dashboard ---------- */
async function renderDashboard(main){
  const s=await api('/stats');
  state.pageData.stats=s;
  const monthMax=Math.max(1,...(s.monthly_donations||[]).map(m=>Number(m.total)));
  const bars=(s.monthly_donations||[]).map(m=>`<div class="bar" title="${m.month}: ₦${Number(m.total).toLocaleString()}"><div class="bar-fill" style="height:${(Number(m.total)/monthMax)*100}%"></div><div class="bar-lab">${m.month.slice(5)}</div></div>`).join('');
  main.innerHTML=`
    <div class="page-head"><h1>Dashboard</h1><p class="sub">Welcome back, ${esc(ME.name||ME.username)}. Here's what's happening today.</p></div>
    <div class="kpi-grid">
      <div class="kpi kpi-azure"><div class="kpi-val">${fmtMoney(s.donations_total)}</div><div class="kpi-lab">Verified Donations (${s.donations_count})</div></div>
      <div class="kpi kpi-gold"><div class="kpi-val">${s.members_active}</div><div class="kpi-lab">Active Members</div></div>
      <div class="kpi kpi-green"><div class="kpi-val">${s.events_upcoming}</div><div class="kpi-lab">Upcoming Events</div></div>
      <div class="kpi kpi-coral"><div class="kpi-val">${s.messages_unread}</div><div class="kpi-lab">Unread Messages</div></div>
    </div>
    <div class="grid-2">
      <div class="card"><h3>Monthly Donations</h3><div class="chart">${bars||'<p class="muted">No data yet</p>'}</div></div>
      <div class="card"><h3>Pending Donations (${s.donations_pending})</h3><div id="pendList"></div></div>
    </div>
    <div class="card"><h3>Recent Activity</h3><div class="act-list">${(s.activity||[]).map(a=>`<div class="act-row"><i class="fas fa-clock"></i><div><b>${esc(a.user_name||'System')}</b> ${esc(a.action)} ${a.detail?`<span class="muted">— ${esc(a.detail)}</span>`:''}<div class="muted small">${fmtDate(a.created_at)}</div></div></div>`).join('')}</div>`;
  renderPendingList();
}
async function renderPendingList(){
  try{const dons=await api('/donations?status=pending');
    const pending=dons.filter(d=>d.status==='pending');
    $('#pendList').innerHTML=pending.length?pending.slice(0,6).map(d=>`<div class="pend-row"><div><b>${esc(d.donor)}</b> <span class="muted">${esc(d.campaign)}</span><br><span class="small">${esc(d.email||'')} · ${fmtDate(d.created_at)}</span></div><div class="pend-amts"><div class="amt">${fmtMoney(d.amount)}</div><button class="btn-primary small" onclick="verifyDon(${d.id})">Verify</button></div></div>`).join(''):'<p class="muted">No pending donations.</p>';
  }catch(e){$('#pendList').innerHTML='<p class="muted">—</p>';}
}
async function verifyDon(id){try{await api('/donations/'+id+'/verify',{method:'POST',body:JSON.stringify({status:'verified'})});toast('Verified');navigate();}catch(e){toast(e.message,'err');}}

/* ---------- Hero ---------- */
async function renderHero(main){
  const data=await api('/hero');state.pageData.hero=data;
  main.innerHTML=`<div class="page-head"><h1>Homepage Hero</h1><p class="sub">Manage the top banner slides and headline text.</p></div>
  <div class="card"><h3>Hero Text</h3>
    <form id="heroTextForm" class="form-grid">
      <div class="field col2"><label>Headline</label><input id="ht-head" value="${esc(data.text.headline||'')}"></div>
      <div class="field col2"><label>Subheadline</label><input id="ht-sub" value="${esc(data.text.subhead||'')}"></div>
      <div class="field col2"><label>Vision quote (side panel)</label><textarea id="ht-quote" rows="2">${esc(data.text.visionquote||'')}</textarea></div>
      <div class="field col2"><label>Body (welcome paragraph)</label><div id="ht-body-w"></div></div>
      <div class="field"><label>Primary CTA button</label><input id="ht-cta1" value="${esc(data.text.cta1||'')}"></div>
      <div class="field"><label>Secondary CTA button</label><input id="ht-cta2" value="${esc(data.text.cta2||'')}"></div>
      <div class="col2"><button class="btn-primary" type="submit"><i class="fas fa-save"></i> Save Hero Text</button></div>
    </form>
  </div>
  <div class="card"><h3>Slides <button class="btn-primary small" onclick="newSlide()"><i class="fas fa-plus"></i> Add slide</button></h3>
    <div class="slides-list" id="slidesList"></div>
  </div>`;
  initWysiwyg('ht-body-w', data.text.body||'', ()=>{});
  $('#heroTextForm').onsubmit=async e=>{e.preventDefault();try{await api('/hero',{method:'POST',body:JSON.stringify({headline:$('#ht-head').value,subhead:$('#ht-sub').value,visionquote:$('#ht-quote').value,body:getWysiwyg('ht-body-w'),cta1:$('#ht-cta1').value,cta2:$('#ht-cta2').value})});toast('Saved');}catch(e){toast(e.message,'err');}};
  renderSlides();
}
function renderSlides(){
  const s=state.pageData.hero;
  $('#slidesList').innerHTML=(s.slides||[]).map((sl,i)=>`<div class="slide-row" data-id="${sl.id}"><div class="slide-thumb">${sl.type==='video'?`<i class="fas fa-video"></i>`:`<img src="${esc(sl.url)}" onerror="this.outerHTML='<i class=&quot;fas fa-image&quot;></i>'">`}</div><div class="slide-meta"><b>${sl.type}</b> · ${esc(sl.caption||sl.alt_text||'')}<br><span class="small muted">${esc(sl.url)}</span></div><div class="slide-acts"><button class="btn-ghost small" onclick="mvSlide(${sl.id},-1)" ${i===0?'disabled':''}><i class="fas fa-arrow-up"></i></button><button class="btn-ghost small" onclick="mvSlide(${sl.id},1)" ${i===s.slides.length-1?'disabled':''}><i class="fas fa-arrow-down"></i></button><button class="btn-secondary small" onclick="editSlide(${sl.id})"><i class="fas fa-edit"></i></button><button class="btn-danger small" onclick="delSlide(${sl.id})"><i class="fas fa-trash"></i></button></div></div>`).join('')||'<p class="muted">No slides yet. Add one!</p>';
}
async function mvSlide(id,dir){try{await api('/hero/'+id+'/move',{method:'PUT',body:JSON.stringify({dir:dir<0?'up':'down'})});state.pageData.hero=await api('/hero');renderSlides();}catch(e){toast(e.message,'err');}}
function newSlide(){slideForm(null);}
function editSlide(id){const sl=state.pageData.hero.slides.find(s=>s.id===id);slideForm(sl);}
function slideForm(sl){
  const isEdit=!!sl;
  overlay(`<h3>${isEdit?'Edit':'Add'} Slide</h3>
    <form id="slideForm" class="form-grid">
      <div class="field col2"><label>Type</label><select id="sl-type"><option value="image" ${sl?.type==='image'?'selected':''}>Image</option><option value="video" ${sl?.type==='video'?'selected':''}>Video</option></select></div>
      <div class="col2">${mediaUploader('sl-media',sl?.url||'',{label:'Slide media (local upload only)',accept:sl?.type==='video'?'video/*':'image/*'})}</div>
      <div class="field"><label>Alt text</label><input id="sl-alt" value="${esc(sl?.alt_text||'')}"></div>
      <div class="field"><label>Caption</label><input id="sl-cap" value="${esc(sl?.caption||'')}"></div>
      <div class="col2 flex gap"><button type="button" class="btn-secondary" onclick="closeOverlay()">Cancel</button><button class="btn-primary" type="submit"><i class="fas fa-save"></i> Save</button></div>
    </form>`);
  setTimeout(()=>{
    bindMediaUploader($('#slideForm'));
    $('#slideForm').onsubmit=async e=>{e.preventDefault();
      const payload={type:$('#sl-type').value,url:getMU($('#slideForm'),'sl-media'),alt:$('#sl-alt').value,caption:$('#sl-cap').value};
      try{if(isEdit){await api('/hero/'+sl.id,{method:'PUT',body:JSON.stringify(payload)});}else{await api('/hero/slides',{method:'POST',body:JSON.stringify(payload)});}
      closeOverlay();toast('Saved');state.pageData.hero=await api('/hero');renderSlides();}catch(e){toast(e.message,'err');}};
  },10);
}
async function delSlide(id){if(!confirm('Delete this slide?'))return;try{await api('/hero/'+id,{method:'DELETE'});state.pageData.hero=await api('/hero');renderSlides();toast('Deleted');}catch(e){toast(e.message,'err');}}

/* ---------- Site Info ---------- */
async function renderSite(main){
  const s=await api('/site');
  main.innerHTML=`<div class="page-head"><h1>Site Info</h1><p class="sub">Organization identity, contact info, and branding.</p></div>
  <div class="card"><form id="siteForm" class="form-grid">
    <div class="field col2"><label>Organization name</label><input name="site_name" value="${esc(s.site_name||'')}"></div>
    <div class="field col2"><label>Tagline</label><input name="site_tagline" value="${esc(s.site_tagline||'')}"></div>
    <div class="field"><label>Org type badge</label><input name="org_type" value="${esc(s.org_type||'')}"></div>
    <div class="field"><label>HQ Address</label><input name="hq_address" value="${esc(s.hq_address||'')}"></div>
    <div class="field"><label>Phone</label><input name="phone" value="${esc(s.phone||'')}"></div>
    <div class="field"><label>Email</label><input name="email" value="${esc(s.email||'')}"></div>
    <div class="field"><label>Facebook URL</label><input name="facebook" value="${esc(s.facebook||'')}"></div>
    <div class="field"><label>Twitter/X URL</label><input name="twitter" value="${esc(s.twitter||'')}"></div>
    <div class="field"><label>Instagram URL</label><input name="instagram" value="${esc(s.instagram||'')}"></div>
    <div class="field"><label>LinkedIn URL</label><input name="linkedin" value="${esc(s.linkedin||'')}"></div>
    <div class="field"><label>YouTube URL</label><input name="youtube" value="${esc(s.youtube||'')}"></div>
    <div class="field"><label>Primary color</label><input type="color" name="primary_color" value="${esc(s.primary_color||'#1a37b8')}"></div>
    <div class="field"><label>Accent (gold) color</label><input type="color" name="accent_color" value="${esc(s.accent_color||'#d4a84b')}"></div>
    <div class="col2">${mediaUploader('logo',s.logo_url||'',{label:'Logo'})}${mediaUploader('favicon',s.favicon_url||'',{label:'Favicon'})}</div>
    <div class="field col2"><label>About section title</label><input name="about_title" value="${esc(s.about_title||'')}"></div>
    <div class="field col2"><label>About body (rich text)</label><div id="about-body-w"></div></div>
    <div class="field"><label>About CTA text</label><input name="about_cta" value="${esc(s.about_cta||'')}"></div>
    <div class="field"><label>Mission title</label><input name="mission_title" value="${esc(s.mission_title||'')}"></div>
    <div class="field col2"><label>Mission body</label><div id="mission-body-w"></div></div>
    <div class="field"><label>Vision title</label><input name="vision_title" value="${esc(s.vision_title||'')}"></div>
    <div class="field col2"><label>Vision body</label><div id="vision-body-w"></div></div>
    <div class="field"><label>Values title</label><input name="values_title" value="${esc(s.values_title||'')}"></div>
    <div class="field col2"><label>Values body</label><div id="values-body-w"></div></div>
    <div class="col2"><button class="btn-primary" type="submit"><i class="fas fa-save"></i> Save Site Info</button></div>
  </form></div>`;
  initWysiwyg('about-body-w',s.about_body||'');initWysiwyg('mission-body-w',s.mission_body||'');initWysiwyg('vision-body-w',s.vision_body||'');initWysiwyg('values-body-w',s.values_body||'');
  bindMediaUploader($('#siteForm'));
  $('#siteForm').onsubmit=async e=>{e.preventDefault();
    const fd=new FormData($('#siteForm'));const obj={};fd.forEach((v,k)=>obj[k]=v);
    obj.about_body=getWysiwyg('about-body-w');obj.mission_body=getWysiwyg('mission-body-w');obj.vision_body=getWysiwyg('vision-body-w');obj.values_body=getWysiwyg('values-body-w');
    obj.logo_url=getMU($('#siteForm'),'logo');obj.favicon_url=getMU($('#siteForm'),'favicon');
    try{await api('/site',{method:'POST',body:JSON.stringify(obj)});toast('Saved');}catch(e){toast(e.message,'err');}
  };
}

/* ---------- Footer ---------- */
async function renderFooter(main){
  const s=await api('/site');
  main.innerHTML=`<div class="page-head"><h1>Footer Content</h1><p class="sub">Edit the footer that appears on every page.</p></div>
  <div class="card"><form id="footerForm" class="form-grid">
    <div class="field col2"><label>About column (rich text)</label><div id="foot-about-w"></div></div>
    <div class="field col2"><label>Copyright line</label><input name="footerCopyright" value="${esc(s.footerCopyright||'')}"></div>
    <div class="col2"><button class="btn-primary" type="submit"><i class="fas fa-save"></i> Save Footer</button></div>
  </form></div>`;
  initWysiwyg('foot-about-w',s.footerAbout||'');
  $('#footerForm').onsubmit=async e=>{e.preventDefault();
    const obj={footerAbout:getWysiwyg('foot-about-w'),footerCopyright:$('#footerForm input[name=footerCopyright]').value};
    try{await api('/site',{method:'POST',body:JSON.stringify(obj)});toast('Saved');}catch(e){toast(e.message,'err');}
  };
}

/* ---------- Donations / Payments ---------- */
async function renderDonations(main){
  const s=await api('/site');
  let banks=[];try{banks=JSON.parse(s.bankAccounts||'[]');if(!Array.isArray(banks))banks=[];}catch(e){banks=[];}
  main.innerHTML=`<div class="page-head"><h1>Donations & Payment Gateways</h1><p class="sub">Manage verified donations, bank account details, and Paystack integration.</p></div>
  <div class="card"><h3>Bank Accounts (shown on donate page)</h3><div id="bankList"></div><button class="btn-secondary" id="addBank"><i class="fas fa-plus"></i> Add Bank Account</button></div>
  <div class="card"><h3>Paystack Payment Gateway</h3><form id="payForm" class="form-grid">
    <div class="field col2"><label class="toggle"><input type="checkbox" id="ps-en" ${s.paystackEnabled=='1'?'checked':''}> Enable Paystack (online card payments)</label></div>
    <div class="field"><label>Public Key</label><input id="ps-pub" value="${esc(s.paystackKey||'')}" placeholder="pk_test_..."></div>
    <div class="field"><label>Secret Key</label><input id="ps-secret" type="password" value="${esc(s.paystackSecret||'')}" placeholder="sk_test_..."></div>
    <div class="field col2"><label>Donate page title</label><input id="dtitle" value="${esc(s.donationTitle||'Support Our Mission')}"></div>
    <div class="field col2"><label>Donate page note</label><div id="dnote-w"></div></div>
    <div class="col2"><button class="btn-primary" type="submit"><i class="fas fa-save"></i> Save Payment Settings</button></div>
  </form></div>
  <div class="card"><h3>All Donations <button class="btn-secondary small" onclick="exportCSV()">Export CSV</button></h3><div id="donList"></div></div>`;
  renderBankList(banks);
  initWysiwyg('dnote-w',s.donationNote||'');
  $('#addBank').onclick=()=>addBankRow({bankName:'',accountName:'',accountNumber:''});
  $('#payForm').onsubmit=async e=>{e.preventDefault();
    const bankRows=[...document.querySelectorAll('.bank-row')].map(r=>({bankName:r.querySelector('.bn').value,accountName:r.querySelector('.an').value,accountNumber:r.querySelector('.anum').value}));
    const payload={bankAccounts:JSON.stringify(bankRows),paystackEnabled:$('#ps-en').checked?'1':'0',paystackKey:$('#ps-pub').value,paystackSecret:$('#ps-secret').value,donationTitle:$('#dtitle').value,donationNote:getWysiwyg('dnote-w')};
    try{await api('/settings',{method:'POST',body:JSON.stringify(payload)});toast('Saved');}catch(e){toast(e.message,'err');}
  };
  const dons=await api('/donations');
  $('#donList').innerHTML=`<table class="data-tbl"><thead><tr><th>Date</th><th>Donor</th><th>Amount</th><th>Campaign</th><th>Method</th><th>Status</th><th></th></tr></thead><tbody>${dons.map(d=>`<tr><td>${fmtDate(d.created_at)}</td><td>${esc(d.donor||'')} ${d.anonymous?'<span class="badge">anon</span>':''}<br><span class="small muted">${esc(d.email||'')}</span></td><td>${fmtMoney(d.amount)}</td><td>${esc(d.campaign)}</td><td>${esc(d.method)}</td><td><span class="badge b-${d.status}">${d.status}</span></td><td>${d.status==='pending'?`<button class="btn-primary small" onclick="verifyDon(${d.id})">Verify</button>`:''}</td></tr>`).join('')}</tbody></table>`;
}
function renderBankList(banks){
  $('#bankList').innerHTML=banks.length?'':`<p class="muted">No bank accounts added yet. Click "Add Bank Account" below.</p>`;
  banks.forEach(b=>addBankRow(b));
}
function addBankRow(b){
  const wrap=document.createElement('div');wrap.className='bank-row form-grid';
  wrap.innerHTML=`<div class="field"><label>Bank Name</label><input class="bn" value="${esc(b.bankName||'')}" placeholder="e.g. Access Bank"></div>
    <div class="field"><label>Account Name</label><input class="an" value="${esc(b.accountName||'')}" placeholder="Zee Glow Link Foundation"></div>
    <div class="field"><label>Account Number</label><input class="anum" value="${esc(b.accountNumber||'')}" placeholder="0123456789"></div>
    <div class="field" style="align-self:end"><button type="button" class="btn-danger small remove-bank"><i class="fas fa-trash"></i></button></div>`;
  wrap.querySelector('.remove-bank').onclick=()=>wrap.remove();
  $('#bankList').appendChild(wrap);
}

/* ---------- Programs ---------- */
async function renderPrograms(main){
  const ps=await api('/programs');
  main.innerHTML=`<div class="page-head"><h1>Programs & Pillars</h1><p class="sub">Manage the organization's core programs. <button class="btn-primary" id="newProg"><i class="fas fa-plus"></i> New Program</button></p></div>
  <div class="grid-3" id="progGrid"></div>`;
  $('#progGrid').innerHTML=ps.map(p=>`<div class="prog-card"><div class="prog-cover">${p.cover?`<img src="${esc(p.cover)}">`:`<i class="fas ${esc(p.icon)}"></i>`}<span class="tag" style="background:${esc(p.tag_color)}">${esc(p.tag||'')}</span></div><div class="prog-body"><h4>${esc(p.title)}</h4><p>${esc((p.short_desc||'').replace(/<[^>]+>/g,'').slice(0,120))}</p><div class="acts"><button class="btn-secondary small" onclick="editProg(${p.id})"><i class="fas fa-edit"></i></button><button class="btn-danger small" onclick="delProg(${p.id})"><i class="fas fa-trash"></i></button><span class="badge ${p.published?'b-verified':'b-pending'}">${p.published?'Live':'Draft'}</span></div></div></div>`).join('');
  $('#newProg').onclick=()=>progForm(null);
  window.editProg=id=>progForm(ps.find(p=>p.id===id));
  window.delProg=async id=>{if(!confirm('Delete this program?'))return;await api('/programs/'+id,{method:'DELETE'});toast('Deleted');navigate();};
}
function progForm(p){
  const isEdit=!!p;
  overlay(`<h3>${isEdit?'Edit':'New'} Program</h3><form id="progForm" class="form-grid">
    <div class="field col2"><label>Title</label><input id="p-title" value="${esc(p?.title||'')}"></div>
    <div class="field"><label>Tag (pill label)</label><input id="p-tag" value="${esc(p?.tag||'')}"></div>
    <div class="field"><label>Tag color</label><input type="color" id="p-tc" value="${esc(p?.tag_color||'#1a37b8')}"></div>
    <div class="field"><label>Icon</label><div id="p-icon"></div></div>
    <div class="field"><label>Slug (URL)</label><input id="p-slug" value="${esc(p?.slug||'')}" placeholder="auto-from-title"></div>
    <div class="col2">${mediaUploader('p-cover',p?.cover||'',{label:'Cover image (local upload only)'})}</div>
    <div class="field col2"><label>Short description (card)</label><textarea id="p-short" rows="2">${esc(p?.short_desc||'')}</textarea></div>
    <div class="field col2"><label>Full description (rich text)</label><div id="p-full-w"></div></div>
    <div class="field col2"><label class="toggle"><input type="checkbox" id="p-pub" ${p?.published?'checked':''}> Published (visible on site)</label></div>
    <div class="col2 flex gap"><button type="button" class="btn-secondary" onclick="closeOverlay()">Cancel</button><button class="btn-primary" type="submit"><i class="fas fa-save"></i> Save</button></div>
  </form>`);
  setTimeout(()=>{
    $('#p-icon').innerHTML=iconPicker(p?.icon||'fa-star');
    initWysiwyg('p-full-w',p?.full_desc||'');
    bindMediaUploader($('#progForm'));bindIconPicker($('#progForm'));
    $('#progForm').onsubmit=async e=>{e.preventDefault();
      const payload={title:$('#p-title').value,tag:$('#p-tag').value,tag_color:$('#p-tc').value,icon:getIconPicker($('#progForm')),slug:$('#p-slug').value,cover:getMU($('#progForm'),'p-cover'),short_desc:$('#p-short').value,full_desc:getWysiwyg('p-full-w'),published:$('#p-pub').checked?1:0};
      try{await api('/programs'+(isEdit?'/'+p.id:''),{method:'POST',body:JSON.stringify(payload)});closeOverlay();toast('Saved');navigate();}catch(e){toast(e.message,'err');}
    };
  },10);
}

/* ---------- Events ---------- */
async function renderEvents(main){
  const es=await api('/events');
  main.innerHTML=`<div class="page-head"><h1>Events</h1><p class="sub">Upcoming and past events. <button class="btn-primary" id="newEvt"><i class="fas fa-plus"></i> New Event</button></p></div>
  <div class="evt-grid" id="evtGrid"></div>`;
  $('#evtGrid').innerHTML=es.map(ev=>{
    const img=ev.featured_image||(ev.media&&ev.media[0]?.url)||'';
    return `<div class="evt-card"><div class="evt-cover">${img?`<img src="${esc(img)}">`:`<i class="fas fa-calendar"></i>`}<span class="badge b-${ev.status}">${ev.status}</span></div><div class="evt-body"><div class="evt-date"><i class="fas fa-calendar-alt"></i> ${fmtDate(ev.event_date)} ${ev.event_time?atob?('· '+esc(ev.event_time)):''}</div><h4>${esc(ev.title)}</h4><div class="muted small"><i class="fas fa-map-marker-alt"></i> ${esc(ev.location||'TBA')}</div><p>${esc((ev.excerpt||ev.description||'').replace(/<[^>]+>/g,'').slice(0,140))}</p><div class="acts"><button class="btn-secondary small" onclick="editEvt(${ev.id})"><i class="fas fa-edit"></i></button><button class="btn-danger small" onclick="delEvt(${ev.id})"><i class="fas fa-trash"></i></button></div></div></div>`;
  }).join('');
  $('#newEvt').onclick=()=>evtForm(null);
  window.editEvt=id=>evtForm(es.find(e=>e.id===id));
  window.delEvt=async id=>{if(!confirm('Delete this event?'))return;await api('/events/'+id,{method:'DELETE'});toast('Deleted');navigate();};
}
function evtForm(ev){
  const isEdit=!!ev;
  const media=ev?.media||[];
  overlay(`<h3>${isEdit?'Edit':'New'} Event</h3><form id="evtForm" class="form-grid">
    <div class="field col2"><label>Event title</label><input id="e-title" value="${esc(ev?.title||'')}"></div>
    <div class="field"><label>Date</label><input type="date" id="e-date" value="${esc(ev?.event_date||'')}"></div>
    <div class="field"><label>Time</label><input type="time" id="e-time" value="${esc(ev?.event_time||'')}"></div>
    <div class="field col2"><label>Location</label><input id="e-loc" value="${esc(ev?.location||'')}"></div>
    <div class="field"><label>Status</label><select id="e-status"><option value="upcoming" ${ev?.status==='upcoming'?'selected':''}>Upcoming</option><option value="ongoing" ${ev?.status==='ongoing'?'selected':''}>Ongoing</option><option value="completed" ${ev?.status==='completed'?'selected':''}>Completed</option></select></div>
    <div class="field col2"><label>Featured image (local upload)</label><div id="e-feat"></div></div>
    <div class="field col2"><label>Description (rich text)</label><div id="e-desc-w"></div></div>
    <div class="col2"><h4 style="margin:10px 0 4px">Gallery (optional)</h4><div id="e-gallery"></div><button type="button" class="btn-secondary small" id="addGal"><i class="fas fa-plus"></i> Add gallery image</button></div>
    <div class="col2 flex gap"><button type="button" class="btn-secondary" onclick="closeOverlay()">Cancel</button><button class="btn-primary" type="submit"><i class="fas fa-save"></i> Save Event</button></div>
  </form>`);
  setTimeout(()=>{
    $('#e-feat').innerHTML=mediaUploader('e-feat-mu',ev?.featured_image||(media[0]?.url||''),{label:'Featured image'});
    initWysiwyg('e-desc-w',ev?.description||'');
    bindMediaUploader($('#evtForm'));
    const galWrap=document.createElement('div');galWrap.id='galItems';galWrap.style.display='grid';galWrap.style.gap='10px';galWrap.style.gridTemplateColumns='repeat(3,1fr)';
    $('#e-gallery').appendChild(galWrap);
    const gal=[];
    function addGal(url){const item={url:url||''};gal.push(item);renderGal();}
    function renderGal(){galWrap.innerHTML='';gal.forEach((it,idx)=>{const d=document.createElement('div');d.innerHTML=mediaUploader('gal-'+idx,it.url,{label:'Image '+(idx+1)});galWrap.appendChild(d);bindMediaUploader(d,u=>{it.url=u;});});}
    media.filter(m=>m.type!=='featured'||idx).forEach(m=>addGal(m.url));
    $('#addGal').onclick=()=>addGal('');
    $('#evtForm').onsubmit=async e=>{e.preventDefault();
      const feat=getMU($('#evtForm'),'e-feat-mu');
      const mediaList=[];if(feat)mediaList.push({type:'image',url:feat});gal.forEach(g=>{if(g.url)mediaList.push({type:'image',url:g.url});});
      const payload={title:$('#e-title').value,event_date:$('#e-date').value,event_time:$('#e-time').value,location:$('#e-loc').value,status:$('#e-status').value,description:getWysiwyg('e-desc-w'),featured_image:feat,media:mediaList};
      try{await api('/events'+(isEdit?'/'+ev.id:''),{method:'POST',body:JSON.stringify(payload)});closeOverlay();toast('Saved');navigate();}catch(e){toast(e.message,'err');}
    };
  },10);
}

/* ---------- NEC / Leadership ---------- */
async function renderNEC(main){
  const ns=await api('/nec');
  main.innerHTML=`<div class="page-head"><h1>NEC / Leadership</h1><p class="sub">National Executive Committee members per ZGLF constitution. <button class="btn-primary" id="newNEC"><i class="fas fa-plus"></i> Add Officer</button></p></div>
  <div class="nec-grid" id="necGrid"></div>`;
  $('#necGrid').innerHTML=ns.map(n=>`<div class="nec-card"><div class="nec-photo">${n.photo?`<img src="${esc(n.photo)}">`:`<i class="fas ${esc(n.icon||'fa-user')}"></i>`}</div><div class="nec-body"><h4>${esc(n.role_title||'')}</h4><div class="muted">${esc(n.name||'(vacant)')}</div><p class="small">${esc((n.duty||'').replace(/<[^>]+>/g,'').slice(0,110))}</p><div class="acts"><button class="btn-secondary small" onclick="editNEC(${n.id})"><i class="fas fa-edit"></i></button><button class="btn-danger small" onclick="delNEC(${n.id})"><i class="fas fa-trash"></i></button><span class="badge ${n.published?'b-verified':'b-pending'}">${n.published?'Published':'Hidden'}</span></div></div></div>`).join('');
  $('#newNEC').onclick=()=>necForm(null);
  window.editNEC=id=>necForm(ns.find(n=>n.id===id));
  window.delNEC=async id=>{if(!confirm('Remove this officer?'))return;await api('/nec/'+id,{method:'DELETE'});toast('Removed');navigate();};
}
function necForm(n){
  const isEdit=!!n;
  overlay(`<h3>${isEdit?'Edit':'Add'} NEC Officer</h3><form id="necForm" class="form-grid">
    <div class="field col2"><label>Position / Role title</label><input id="n-role" value="${esc(n?.role_title||'')}" placeholder="e.g. National President"></div>
    <div class="field col2"><label>Name of officer</label><input id="n-name" value="${esc(n?.name||'')}" placeholder="Leave empty if vacant"></div>
    <div class="field col2"><label>Photo (local upload)</label><div id="n-photo"></div></div>
    <div class="field"><label>Icon (shown if no photo)</label><div id="n-icon"></div></div>
    <div class="field"><label>Accent gradient</label><select id="n-grad">
      <option value="from-azure-500 to-azure-700" ${n?.gradient==='from-azure-500 to-azure-700'?'selected':''}>Azure Blue</option>
      <option value="from-gold-500 to-yellow-600" ${n?.gradient==='from-gold-500 to-yellow-600'?'selected':''}>Gold</option>
      <option value="from-sky-500 to-cyan-600" ${n?.gradient==='from-sky-500 to-cyan-600'?'selected':''}>Sky</option>
      <option value="from-green-500 to-emerald-600" ${n?.gradient==='from-green-500 to-emerald-600'?'selected':''}>Green</option>
      <option value="from-rose-500 to-red-600" ${n?.gradient==='from-rose-500 to-red-600'?'selected':''}>Rose</option>
    </select></div>
    <div class="field col2"><label>Duties / bio (rich text)</label><div id="n-duty-w"></div></div>
    <div class="field col2"><label class="toggle"><input type="checkbox" id="n-pub" ${n?.published?'checked':''}> Published (visible on site)</label></div>
    <div class="col2 flex gap"><button type="button" class="btn-secondary" onclick="closeOverlay()">Cancel</button><button class="btn-primary" type="submit"><i class="fas fa-save"></i> Save</button></div>
  </form>`);
  setTimeout(()=>{
    $('#n-photo').innerHTML=mediaUploader('n-photo-mu',n?.photo||'',{label:'Photo'});
    $('#n-icon').innerHTML=iconPicker(n?.icon||'fa-user');
    initWysiwyg('n-duty-w',n?.duty||'');
    bindMediaUploader($('#necForm'));bindIconPicker($('#necForm'));
    $('#necForm').onsubmit=async e=>{e.preventDefault();
      const payload={role_title:$('#n-role').value,name:$('#n-name').value,photo:getMU($('#necForm'),'n-photo-mu'),icon:getIconPicker($('#necForm')),gradient:$('#n-grad').value,duty:getWysiwyg('n-duty-w'),published:$('#n-pub').checked?1:0};
      try{await api('/nec'+(isEdit?'/'+n.id:''),{method:'POST',body:JSON.stringify(payload)});closeOverlay();toast('Saved');navigate();}catch(e){toast(e.message,'err');}
    };
  },10);
}

/* ---------- Media Library ---------- */
async function renderPhotos(main){
  const ms=await api('/media');
  main.innerHTML=`<div class="page-head"><h1>Media Library</h1><p class="sub">Upload images (local files only). No URL inputs.</p></div>
  <div class="card"><h3>Upload New</h3><form id="upForm"><input type="file" id="upFile" accept="image/*,video/*"><button class="btn-primary" type="submit"><i class="fas fa-upload"></i> Upload</button><span id="upStat" class="muted"></span></form></div>
  <div class="card"><h3>Library (${ms.length} items)</h3><div class="media-grid" id="medGrid"></div></div>`;
  $('#medGrid').innerHTML=ms.length?ms.map(m=>`<div class="media-tile"><div class="mt-thumb">${m.type==='video'?`<video src="${esc(m.url)}"></video>`:`<img src="${esc(m.url)}">`}<button class="mt-del" onclick="delMedia(${m.id})" title="Delete"><i class="fas fa-trash"></i></button><button class="mt-copy" onclick="copyUrl('${esc(m.url)}')" title="Copy URL"><i class="fas fa-copy"></i></button></div><div class="mt-name">${esc(m.title||m.url.split('/').pop())}</div></div>`).join(''):'<p class="muted">No media yet. Upload one above!</p>';
  $('#upForm').onsubmit=async e=>{e.preventDefault();const f=$('#upFile').files[0];if(!f){toast('Pick a file first','err');return;}$('#upStat').textContent='Uploading…';try{await uploadFile(f,'images');toast('Uploaded');navigate();}catch(e){$('#upStat').textContent=e.message;}};
  window.delMedia=async id=>{if(!confirm('Delete this media?'))return;try{await api('/media/'+id,{method:'DELETE'});toast('Deleted');navigate();}catch(e){toast(e.message,'err');}};
  window.copyUrl=u=>{navigator.clipboard.writeText(u);toast('URL copied');};
}

/* ---------- Members ---------- */
async function renderMembers(main){
  const ms=await api('/members');
  main.innerHTML=`<div class="page-head"><h1>Members</h1><p class="sub">Registered members and applicants.</p></div>
  <div class="card"><table class="data-tbl"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>State</th><th>Tier</th><th>Status</th><th>Joined</th><th></th></tr></thead><tbody>${ms.map(m=>`<tr><td>${esc(m.name)}</td><td>${esc(m.email||'')}</td><td>${esc(m.phone||'')}</td><td>${esc(m.state||'')}</td><td>${esc(m.tier)}</td><td><span class="badge b-${m.status==='active'?'verified':(m.status==='pending'?'pending':'rejected')}">${m.status}</span></td><td>${fmtDate(m.joined)}</td><td><select onchange="updMember(${m.id},this.value)"><option value="">Change status…</option><option value="active">Approve (active)</option><option value="suspended">Suspend</option><option value="pending">Pending</option></select></td></tr>`).join('')}</tbody></table></div>`;
  window.updMember=async(id,st)=>{if(!st)return;try{await api('/members/'+id,{method:'POST',body:JSON.stringify({status:st})});toast('Updated');navigate();}catch(e){toast(e.message,'err');}};
}

/* ---------- Messages ---------- */
async function renderMessages(main){
  const ms=await api('/messages');
  main.innerHTML=`<div class="page-head"><h1>Messages</h1><p class="sub">Contact form submissions.</p></div>
  <div class="card"><div class="msg-list">${ms.map(m=>`<div class="msg-row ${m.is_read?'read':'unread'}"><div class="msg-head"><b>${esc(m.name)}</b> <span class="muted small">${esc(m.email)} · ${fmtDate(m.created_at)}</span><span class="badge" style="margin-left:8px">${esc(m.source||'contact')}</span></div><div class="subj"><b>${esc(m.subject||'')}</b></div><div class="msg-body">${esc(m.message||'')}</div><div class="msg-acts"><button class="btn-${m.is_read?'ghost':'primary'} small" onclick="toggleMsg(${m.id},${m.is_read?0:1})">${m.is_read?'Mark unread':'Mark read'}</button></div></div>`).join('')}</div></div>`;
  window.toggleMsg=async(id,r)=>{await api('/messages/'+id,{method:'POST',body:JSON.stringify({is_read:r})});navigate();};
}

/* ---------- Users ---------- */
async function renderUsers(main){
  const us=await api('/users');
  const perms=['dashboard','hero','site','footer','donations','programs','events','photos','nec','members','messages','users','reports','settings'];
  main.innerHTML=`<div class="page-head"><h1>Users & Permissions</h1><button class="btn-primary" id="newUsr"><i class="fas fa-plus"></i> New User</button></div>
  <div class="card"><table class="data-tbl"><thead><tr><th>Username</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th></th></tr></thead><tbody>${us.map(u=>`<tr><td>${esc(u.username)}</td><td>${esc(u.name||'')}</td><td>${esc(u.email||'')}</td><td>${esc(u.role)}</td><td>${esc(u.status)}</td><td>${fmtDate(u.created_at)}</td><td><button class="btn-secondary small" onclick="editUser(${u.id})"><i class="fas fa-edit"></i></button> ${u.username!=='admin'?`<button class="btn-danger small" onclick="delUser(${u.id})"><i class="fas fa-trash"></i></button>`:''}</td></tr>`).join('')}</tbody></table></div>`;
  $('#newUsr').onclick=()=>userForm(null,perms);
  window.editUser=id=>userForm(us.find(u=>u.id===id),perms);
  window.delUser=async id=>{if(!confirm('Delete this user?'))return;await api('/users/'+id,{method:'DELETE'});toast('Deleted');navigate();};
}
function userForm(u,perms){
  overlay(`<h3>${u?'Edit':'New'} User</h3><form id="usrForm" class="form-grid">
    <div class="field"><label>Username</label><input id="u-un" value="${esc(u?.username||'')}"></div>
    <div class="field"><label>Full name</label><input id="u-nm" value="${esc(u?.name||'')}"></div>
    <div class="field col2"><label>Email</label><input id="u-em" type="email" value="${esc(u?.email||'')}"></div>
    <div class="field"><label>Role</label><select id="u-role"><option value="staff" ${u?.role==='staff'?'selected':''}>Staff</option><option value="editor" ${u?.role==='editor'?'selected':''}>Editor</option><option value="admin" ${u?.role==='admin'?'selected':''}>Admin</option></select></div>
    <div class="field"><label>Status</label><select id="u-st"><option value="active" ${u?.status==='active'?'selected':''}>Active</option><option value="disabled" ${u?.status==='disabled'?'selected':''}>Disabled</option></select></div>
    <div class="field col2"><label>Password ${u?'(leave blank to keep)':''}</label><input id="u-pw" type="password" ${u?'':'required'}></div>
    <div class="field col2"><label>Module permissions</label><div class="perm-grid" id="permGrid"></div></div>
    <div class="col2 flex gap"><button type="button" class="btn-secondary" onclick="closeOverlay()">Cancel</button><button class="btn-primary" type="submit"><i class="fas fa-save"></i> Save</button></div>
  </form>`);
  setTimeout(()=>{
    const pg=$('#permGrid');
    perms.forEach(p=>{
      const lbl=document.createElement('label');lbl.className='perm-cb';
      const cb=document.createElement('input');cb.type='checkbox';cb.value=p;cb.checked=u?.perms?.[p]?true:false;if(u?.role==='admin')cb.checked=true;
      lbl.appendChild(cb);lbl.appendChild(document.createTextNode(' '+p));pg.appendChild(lbl);
    });
    $('#u-role').onchange=()=>{if($('#u-role').value==='admin')pg.querySelectorAll('input').forEach(c=>c.checked=true);};
    $('#usrForm').onsubmit=async e=>{e.preventDefault();
      const permObj={};[...pg.querySelectorAll('input:checked')].forEach(c=>permObj[c.value]=1);
      const payload={username:$('#u-un').value,name:$('#u-nm').value,email:$('#u-em').value,role:$('#u-role').value,status:$('#u-st').value,password:$('#u-pw').value,perms:permObj};
      try{await api('/users'+(u?'/'+u.id:''),{method:'POST',body:JSON.stringify(payload)});closeOverlay();toast('Saved');navigate();}catch(e){toast(e.message,'err');}
    };
  },10);
}

/* ---------- Settings ---------- */
async function renderSettings(main){
  const s=await api('/site');
  main.innerHTML=`<div class="page-head"><h1>Settings</h1><p class="sub">Currency, maintenance mode, and global options.</p></div>
  <div class="card"><form id="setForm" class="form-grid">
    <div class="field"><label>Currency code</label><input name="currency" value="${esc(s.currency||'NGN')}"></div>
    <div class="field"><label>Currency symbol</label><input name="currencySymbol" value="${esc(s.currencySymbol||'₦')}"></div>
    <div class="field col2"><label class="toggle"><input type="checkbox" name="maintenanceMode" value="1" ${s.maintenanceMode=='1'?'checked':''}> Maintenance mode (locks public site)</label></div>
    <div class="field col2"><label class="toggle"><input type="checkbox" name="nav_login" value="1" ${s.nav_login=='1'?'checked':''}> Show Login button in public nav</label></div>
    <div class="field col2"><label class="toggle"><input type="checkbox" name="nav_donate" value="1" ${s.nav_donate=='1'?'checked':''}> Show Donate button in public nav</label></div>
    <div class="col2"><button class="btn-primary" type="submit"><i class="fas fa-save"></i> Save Settings</button><div class="muted small" style="margin-top:12px">Default admin login is admin / admin123. <a href="#" onclick="chgPw();return false;">Change your password</a></div></div>
  </form></div>
  <div id="pwArea"></div>`;
  $('#setForm').onsubmit=async e=>{e.preventDefault();
    const fd=new FormData($('#setForm'));const obj={};fd.forEach((v,k)=>obj[k]=v);
    obj.maintenanceMode=$('#setForm input[name=maintenanceMode]').checked?'1':'0';
    obj.nav_login=$('#setForm input[name=nav_login]').checked?'1':'0';
    obj.nav_donate=$('#setForm input[name=nav_donate]').checked?'1':'0';
    try{await api('/settings',{method:'POST',body:JSON.stringify(obj)});toast('Saved');}catch(e){toast(e.message,'err');}
  };
  window.chgPw=()=>{
    $('#pwArea').innerHTML=`<div class="card"><h3>Change your password</h3><form id="pwForm" class="form-grid">
      <div class="field"><label>Current password</label><input type="password" id="pw-cur"></div>
      <div class="field"><label>New password (min 6)</label><input type="password" id="pw-new"></div>
      <div class="col2"><button class="btn-primary" type="submit">Update Password</button></div></form></div>`;
    $('#pwForm').onsubmit=async e=>{e.preventDefault();try{await api('/auth/password',{method:'POST',body:JSON.stringify({current:$('#pw-cur').value,password:$('#pw-new').value})});toast('Password updated');$('#pwArea').innerHTML='';}catch(e){toast(e.message,'err');}};
  };
}

function exportCSV(){toast('CSV export coming soon');}

boot();
