function renderCerts(){
  currentView='certs'; navState('certs');
  const sorted=[...state.certs].sort(byExpiry);
  const expired=sorted.filter(c=>daysUntil(c.expiry)<0).length;
  const due=sorted.filter(c=>{const d=daysUntil(c.expiry);return d>=0&&d<=90;}).length;
  const current=sorted.length-expired-due;
  qs('#app').innerHTML=`
    <div class="view-title"><p class="eyebrow">RENEWAL RADAR</p><h2>Certifications</h2><p class="muted">Track expirations and optional continuing-education progress before renewal turns urgent.</p><div class="title-actions"><button class="primary" data-action="open-cert">+ Add certification</button></div></div>
    <section class="cert-summary"><div class="summary-chip"><strong>${current}</strong><span>current</span></div><div class="summary-chip"><strong>${due}</strong><span>due ≤90d</span></div><div class="summary-chip"><strong>${expired}</strong><span>expired</span></div></section>
    <section class="stack">${sorted.length?sorted.map(certCard).join(''):emptyCard('✓','Build your renewal radar','Add EMT/paramedic, AHA, fire, hazmat, officer, instructor, rescue, and operator credentials.')}</section>`;
}

function renderExposures(){
  currentView='exposures'; navState('exposures');
  const sorted=[...state.exposures].sort(byDateDesc);
  const significant=sorted.filter(e=>e.severity==='significant').length;
  qs('#app').innerHTML=`
    <div class="view-title"><p class="eyebrow">CAREER HEALTH HISTORY</p><h2>Exposure record</h2><p class="muted">Keep a personal, portable history of occupational exposures across departments and decades.</p><div class="title-actions"><button class="primary" data-action="open-exposure">+ Document exposure</button><button class="secondary" data-action="export-exposures">Export CSV</button></div></div>
    <div class="exposure-banner"><strong>Personal record—not official reporting.</strong> Use this to preserve your own career history. Continue to follow your department’s exposure reporting, infection-control, workers’ compensation, and medical evaluation processes.</div>
    <section class="stats-grid" style="margin-bottom:14px"><article class="stat card"><div class="stat-label"><span>Total records</span></div><strong>${sorted.length}</strong><small>career exposure entries</small></article><article class="stat card"><div class="stat-label"><span>Significant</span></div><strong>${significant}</strong><small>flagged by you</small></article></section>
    <section class="stack">${sorted.length?sorted.map(exposureCard).join(''):emptyCard('EXP','No exposures documented','When an occupational exposure matters, record the basics while they are fresh—without patient identifiers.')}</section>`;
}

function renderGoals(){
  currentView='goals'; navState('goals');
  const sorted=[...state.goals].sort((a,b)=>(Number(a.progress)>=100)-(Number(b.progress)>=100)||String(a.targetDate||'9999').localeCompare(String(b.targetDate||'9999')));
  const active=sorted.filter(g=>(Number(g.progress)||0)<100).length;
  const completed=sorted.length-active;
  qs('#app').innerHTML=`
    <div class="view-title"><p class="eyebrow">NEXT POSITION / NEXT SKILL</p><h2>Career goals</h2><p class="muted">Keep the next step visible instead of letting it disappear between shifts.</p><div class="title-actions"><button class="primary" data-action="open-goal">+ Add goal</button></div></div>
    <section class="cert-summary"><div class="summary-chip"><strong>${active}</strong><span>active</span></div><div class="summary-chip"><strong>${completed}</strong><span>completed</span></div><div class="summary-chip"><strong>${state.goals.length?Math.round(state.goals.reduce((s,g)=>s+(Number(g.progress)||0),0)/state.goals.length):0}%</strong><span>overall progress</span></div></section>
    <section class="stack">${sorted.length?sorted.map(goalCard).join(''):emptyCard('◎','Give your career a target','Promotion, certification, degree, specialty team, instructor credential—add a date and one next step.')}</section>`;
}

function topCategories(type,limit=5){
  const counts={}; state.entries.filter(e=>e.type===type).forEach(e=>counts[e.category]=(counts[e.category]||0)+1);
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,limit);
}

function renderCareer(){
  currentView='career'; navState('career');
  const activeGoals=state.goals.filter(g=>(Number(g.progress)||0)<100).length;
  const significant=state.exposures.filter(e=>e.severity==='significant').length;
  const expDue=state.certs.filter(c=>daysUntil(c.expiry)<0).length;
  qs('#app').innerHTML=`
    <div class="view-title"><p class="eyebrow">YOUR LONG-TERM RECORD</p><h2>Career vault</h2><p class="muted">The parts of your career that are easy to lose when you change stations, departments, or roles.</p></div>
    <section class="stack">
      <button class="quick-card exposure" data-view="exposures" style="width:100%;min-height:128px"><span class="quick-icon">EXP</span><strong>Exposure record</strong><small>${state.exposures.length} personal records • ${significant} significant</small></button>
      <button class="quick-card win" data-view="goals" style="width:100%;min-height:128px"><span class="quick-icon">◎</span><strong>Career goals</strong><small>${activeGoals} active targets • keep the next step visible</small></button>
      <button class="quick-card training" data-view="taskbooks" style="width:100%;min-height:128px"><span class="quick-icon">▣</span><strong>Taskbooks</strong><small>${state.taskbooks.length} qualification paths • turn a goal into completed work</small></button>
      <button class="quick-card skill" data-view="portfolio" style="width:100%;min-height:128px"><span class="quick-icon">★</span><strong>Career report</strong><small>Training, skills, credentials, accomplishments, and promotion evidence</small></button>
    </section>
    ${expDue?`<div class="backup-nudge"><p><strong style="color:var(--text)">${plural(expDue,'certification')} expired.</strong><br>Open Certifications to update your renewal status.</p><button class="secondary compact-button" data-view="certs">Review</button></div>`:''}`;
}

function taskbookProgress(book){const total=book.tasks.length,done=book.tasks.filter(t=>t.done).length;return {total,done,pct:total?Math.round(done/total*100):0};}

function renderTaskbooks(){
  currentView='taskbooks'; navState('taskbooks');
  qs('#app').innerHTML=`
    <div class="view-title"><p class="eyebrow">FROM GOAL TO SIGN-OFF</p><h2>Taskbooks</h2><p class="muted">Break a promotion or qualification into work you can finish one shift at a time.</p><div class="title-actions"><button class="primary" data-action="open-taskbook">+ Start taskbook</button></div></div>
    <div class="privacy-strip"><b>PERSONAL WORKING COPY</b><span>Use department-issued forms and required evaluator signatures when they are the official record.</span></div>
    <section class="taskbook-grid">${state.taskbooks.length?state.taskbooks.map(book=>{const p=taskbookProgress(book);return `<button class="taskbook-card card" data-open-taskbook="${book.id}"><span class="status-pill ${p.pct===100?'good':'neutral'}">${p.pct===100?'Complete':'In progress'}</span><h3>${escapeHtml(book.name)}</h3><p>${p.done} of ${p.total} tasks complete${book.targetDate?` • target ${formatDate(`${book.targetDate}T12:00:00`,{year:true})}`:''}</p><div class="progress-track"><div class="progress-fill" style="--progress:${p.pct}%"></div></div><strong>${p.pct}%</strong></button>`}).join(''):emptyCard('▣','Start your first taskbook','Choose Driver / Operator, Fire Officer I, Field Training Officer, or build your own.',`<button class="primary" data-action="open-taskbook" style="margin-top:12px">Choose a path</button>`)}</section>`;
}

function renderTaskbookDetail(id){
  const book=state.taskbooks.find(b=>b.id===id); if(!book){renderTaskbooks();return;}
  currentView=`taskbook:${id}`; navState('taskbooks'); const p=taskbookProgress(book);
  qs('#app').innerHTML=`<div class="view-title"><button class="text-btn" data-view="taskbooks">← All taskbooks</button><p class="eyebrow" style="margin-top:16px">QUALIFICATION PATH</p><h2>${escapeHtml(book.name)}</h2><p class="muted">${p.done} of ${p.total} complete${book.targetDate?` • target ${formatDate(`${book.targetDate}T12:00:00`,{year:true})}`:''}</p><div class="title-actions"><button class="primary" data-action="open-task" data-book-id="${book.id}">+ Add task</button><button class="secondary" data-action="print-report">Print</button><button class="text-btn danger-text" data-delete-taskbook="${book.id}">Delete taskbook</button></div></div>
  <article class="taskbook-meter card"><div><span>Overall progress</span><strong>${p.pct}%</strong></div><div class="progress-track"><div class="progress-fill" style="--progress:${p.pct}%"></div></div></article>
  <section class="task-list">${book.tasks.map((task,i)=>`<article class="task-row card ${task.done?'done':''}"><button class="task-check" data-toggle-task="${task.id}" data-book-id="${book.id}" aria-label="Mark ${escapeHtml(task.name)} ${task.done?'incomplete':'complete'}">${task.done?'✓':''}</button><div><strong>${escapeHtml(task.name)}</strong>${task.note?`<span>${escapeHtml(task.note)}</span>`:''}</div><small>${task.done&&task.completedAt?formatDate(task.completedAt):`Task ${i+1}`}</small><button class="mini-action" data-delete-task="${task.id}" data-book-id="${book.id}">Delete</button></article>`).join('')||emptyCard('＋','No tasks yet','Add the first requirement for this qualification.')}</section>`;
}

function renderPortfolio(){
  currentView='portfolio'; navState('portfolio');
  const careerTraining=state.entries.filter(e=>e.type==='training').reduce((s,e)=>s+(Number(e.minutes)||0),0);
  const skills=state.entries.filter(e=>e.type==='skill').length;
  const incidents=state.entries.filter(e=>e.type==='incident').length;
  const wins=state.entries.filter(e=>e.type==='accomplishment').sort(byDateDesc);
  const years=state.profile.startDate?Math.max(0,Math.round((Date.now()-new Date(`${state.profile.startDate}T00:00:00`).getTime())/31557600000*10)/10):null;
  const initials=(state.profile.name||'Responder').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
  const topSkills=topCategories('skill');
  const topTraining=topCategories('training');
  qs('#app').innerHTML=`
    <div class="view-title no-print"><p class="eyebrow">YOUR PORTABLE CAREER FILE</p><h2>Career report</h2><p class="muted">A clean summary for annual reviews, resumes, promotion prep, interviews, or simply remembering what you have done.</p><div class="title-actions"><button class="primary" data-action="print-report">Print / Save PDF</button><button class="secondary" data-action="open-profile">Edit profile</button></div></div>
    <article class="report-hero card">
      <div class="profile-line"><div class="profile-avatar">${escapeHtml(initials)}</div><div class="profile-copy"><p class="eyebrow">RESPONDERLOG CAREER RECORD</p><h3>${escapeHtml(state.profile.name||'Your career')}</h3><p class="muted">${escapeHtml([state.profile.role,state.profile.agency,years!==null?`${years} years tracked`:null].filter(Boolean).join(' • ')||'Add your profile to personalize this report.')}</p></div><button class="text-btn no-print" data-action="open-profile">Edit</button></div>
      <section class="report-grid"><div class="report-stat"><strong>${incidents}</strong><span>incidents logged</span></div><div class="report-stat"><strong>${skills}</strong><span>skill repetitions</span></div><div class="report-stat"><strong>${Math.round(careerTraining/6)/10}</strong><span>training hours</span></div><div class="report-stat"><strong>${state.certs.length}</strong><span>certifications tracked</span></div></section>
    </article>
    <section class="section-head"><div><p class="eyebrow">PROFICIENCY HISTORY</p><h3>Most logged skills</h3></div></section>
    <section class="rank-list">${topSkills.length?topSkills.map(([k,v])=>`<div class="rank-row"><span>${escapeHtml(k)}</span><b>${plural(v,'rep')}</b></div>`).join(''):emptyCard('SKL','No skill history yet','Log skill repetitions to build a long-term practice history.')}</section>
    <section class="section-head"><div><p class="eyebrow">TRAINING FOCUS</p><h3>Where your hours go</h3></div></section>
    <section class="rank-list">${topTraining.length?topTraining.map(([k,v])=>`<div class="rank-row"><span>${escapeHtml(k)}</span><b>${plural(v,'session')}</b></div>`).join(''):emptyCard('TRN','No training history yet','Log classes and drills to see your training pattern over time.')}</section>
    <section class="section-head"><div><p class="eyebrow">CAREER HIGHLIGHTS</p><h3>Accomplishments</h3></div><button class="text-btn no-print" data-action="open-log" data-type="accomplishment">+ Add</button></section>
    <section class="stack">${wins.length?wins.map(entryCard).join(''):emptyCard('★','Your wins belong here','Projects, awards, instructor milestones, leadership work, committees, special assignments, and promotions.')}</section>
    <section class="section-head"><div><p class="eyebrow">CREDENTIALS</p><h3>Certification snapshot</h3></div></section>
    <section class="stack">${state.certs.length?[...state.certs].sort(byExpiry).map(certCard).join(''):emptyCard('✓','No certifications tracked','Add credentials to include them in your career report.')}</section>`;
}

function renderView(view){
  if(view==='home')renderHome();
  else if(view==='history')renderHistory();
  else if(view==='certs')renderCerts();
  else if(view==='exposures')renderExposures();
  else if(view==='goals')renderGoals();
  else if(view==='taskbooks')renderTaskbooks();
  else if(view.startsWith('taskbook:'))renderTaskbookDetail(view.split(':')[1]);
  else if(view==='career')renderCareer();
  else if(view==='portfolio')renderPortfolio();
  window.scrollTo({top:0,behavior:'smooth'});
  qs('#app')?.focus({preventScroll:true});
}
