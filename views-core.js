function emptyCard(icon,title,body,action=''){
  return `<article class="empty card"><div class="empty-icon">${icon}</div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span>${action}</article>`;
}

function entryCard(entry){
  const meta=typeMeta[entry.type]||{label:'Record',icon:'•',cls:''};
  const details=[];
  if(entry.type==='training'&&Number(entry.minutes))details.push(`${entry.minutes} min`);
  if(entry.type==='skill'&&entry.confidence){ const labels=['','Needs practice','Developing','Comfortable','Strong']; details.push(labels[Number(entry.confidence)]||''); }
  if(entry.note)details.push(entry.note);
  if(!details.length)details.push(meta.label+' logged');
  return `<article class="log-row card">
    <div class="record-icon ${meta.cls}">${meta.icon}</div>
    <div class="record-copy"><strong>${escapeHtml(entry.category||meta.label)}</strong><span>${escapeHtml(details.filter(Boolean).join(' • '))}</span></div>
    <div class="record-meta">${formatDate(entry.date)}<br>${formatTime(entry.date)}<div class="record-actions"><button class="mini-action" data-edit-entry="${entry.id}">Edit</button><button class="mini-action" data-delete-entry="${entry.id}">Delete</button></div></div>
  </article>`;
}

function certCard(cert){
  const status=certStatus(cert);
  const needed=Number(cert.hoursNeeded)||0, done=Number(cert.hoursDone)||0;
  const progress=needed?clamp(Math.round(done/needed*100),0,100):0;
  return `<article class="cert-row card">
    <div class="record-icon">✓</div>
    <div class="record-copy"><strong>${escapeHtml(cert.name)}</strong><span>${escapeHtml(cert.category||'Certification')} • Expires ${formatDate(`${cert.expiry}T12:00:00`,{year:true})}${cert.note?` • ${escapeHtml(cert.note)}`:''}</span>
      ${needed?`<div class="cert-progress"><div class="cert-progress-head"><span>Renewal progress</span><b>${done}/${needed} hrs</b></div><div class="progress-track"><div class="progress-fill" style="--progress:${progress}%"></div></div></div>`:''}
    </div>
    <div class="record-meta"><span class="status-pill ${status.cls}">${status.label}</span><div class="record-actions"><button class="mini-action" data-edit-cert="${cert.id}">Edit</button><button class="mini-action" data-delete-cert="${cert.id}">Delete</button></div></div>
  </article>`;
}

function exposureCard(item){
  const severity=item.severity==='significant'?['Significant','danger']:item.severity==='notable'?['Notable','warn']:['Routine','neutral'];
  return `<article class="exposure-row card">
    <div class="record-icon exposure">EXP</div>
    <div class="record-copy"><strong>${escapeHtml(item.type)}</strong><span>${escapeHtml([item.decon,item.ppe?`PPE: ${item.ppe}`:'',item.note||item.ref||'Personal exposure record'].filter(Boolean).join(' • '))}</span></div>
    <div class="record-meta"><span class="status-pill ${severity[1]}">${severity[0]}</span><br>${formatDate(item.date)}<div class="record-actions"><button class="mini-action" data-edit-exposure="${item.id}">Edit</button><button class="mini-action" data-delete-exposure="${item.id}">Delete</button></div></div>
  </article>`;
}

function goalCard(goal){
  const p=clamp(Number(goal.progress)||0,0,100), done=p>=100;
  const due=goal.targetDate?daysUntil(goal.targetDate):Infinity;
  const dueText=!goal.targetDate?'No target date':due<0?'Target date passed':due===0?'Due today':`${Math.abs(due)} days ${due>0?'left':'past'}`;
  return `<article class="goal-row card ${done?'goal-done':''}">
    <div class="record-icon win">◎</div>
    <div class="record-copy"><strong>${escapeHtml(goal.name)}</strong><span>${escapeHtml(goal.category||'Goal')}${goal.note?` • ${escapeHtml(goal.note)}`:''}</span><div class="goal-progress"><div class="progress-track"><div class="progress-fill" style="--progress:${p}%"></div></div><div class="goal-due">${p}% • ${escapeHtml(dueText)}</div></div></div>
    <div class="record-meta"><span class="status-pill ${done?'good':'neutral'}">${done?'Complete':'Active'}</span><div class="record-actions"><button class="mini-action" data-edit-goal="${goal.id}">Edit</button><button class="mini-action" data-delete-goal="${goal.id}">Delete</button></div></div>
  </article>`;
}

function renderHome(){
  currentView='home'; navState('home');
  const month=state.entries.filter(e=>entryWithinDays(e,30));
  const incidents=month.filter(e=>e.type==='incident').length;
  const skills=month.filter(e=>e.type==='skill').length;
  const trainingMinutes=month.filter(e=>e.type==='training').reduce((s,e)=>s+(Number(e.minutes)||0),0);
  const due=state.certs.filter(c=>{const d=daysUntil(c.expiry);return d<=90;}).length;
  const recent=[...state.entries].sort(byDateDesc).slice(0,4);
  const renewals=[...state.certs].sort(byExpiry).slice(0,3);
  const goals=[...state.goals].filter(g=>(Number(g.progress)||0)<100).sort((a,b)=>String(a.targetDate||'9999').localeCompare(String(b.targetDate||'9999'))).slice(0,2);
  const pulse=careerPulse();
  const totalRecords=state.entries.length+state.certs.length+state.exposures.length+state.goals.length;
  const lastBackup=Number(localStorage.getItem(BACKUP_KEY)||0);
  const backupDue=totalRecords>=10&&(!lastBackup||Date.now()-lastBackup>30*86400000);
  qs('#app').innerHTML=`
    <section class="hero card">
      <div class="hero-copy"><p class="eyebrow">YOUR CAREER. YOUR RECORD.</p><h2>${greeting()} Keep the proof of the work you do.</h2><p class="muted">Capture calls, skills, training, exposures, certifications, and career wins in seconds. Everything stays on this device.</p></div>
      <div class="hero-actions"><button class="primary" data-action="open-capture">+ Add to my record</button><button class="secondary" data-view="portfolio">View career report</button></div>
    </section>
    <div class="privacy-strip"><b>PRIVATE BY DESIGN</b><span>No account. No cloud database. No patient identifiers. ResponderLog is your personal career record—not an ePCR.</span></div>

    <section class="section-head"><div><p class="eyebrow">FAST AFTER A CALL</p><h3>Quick capture</h3></div></section>
    <section class="quick-grid">
      <button class="quick-card" data-action="open-log" data-type="incident"><span class="quick-icon">INC</span><strong>Incident</strong><small>Category + short note</small></button>
      <button class="quick-card skill" data-action="open-log" data-type="skill"><span class="quick-icon">SKL</span><strong>Skill</strong><small>Build repetition history</small></button>
      <button class="quick-card training" data-action="open-log" data-type="training"><span class="quick-icon">TRN</span><strong>Training</strong><small>Track drill / CE time</small></button>
      <button class="quick-card exposure" data-action="open-exposure"><span class="quick-icon">EXP</span><strong>Exposure</strong><small>Protect your career history</small></button>
      <button class="quick-card win" data-action="open-log" data-type="accomplishment"><span class="quick-icon">★</span><strong>Career win</strong><small>Leadership + milestones</small></button>
    </section>

    <section class="section-head"><div><p class="eyebrow">LAST 30 DAYS</p><h3>Your activity</h3></div><button class="text-btn" data-view="history">View log</button></section>
    <section class="stats-grid">
      <article class="stat card"><div class="stat-label"><span>Incidents</span><i class="trend-dot"></i></div><strong>${incidents}</strong><small>non-identifying records</small></article>
      <article class="stat card"><div class="stat-label"><span>Skills</span><i class="trend-dot"></i></div><strong>${skills}</strong><small>hands-on reps</small></article>
      <article class="stat card"><div class="stat-label"><span>Training</span><i class="trend-dot"></i></div><strong>${Math.round(trainingMinutes/6)/10}</strong><small>hours logged</small></article>
      <article class="stat card"><div class="stat-label"><span>Renewals</span><i class="trend-dot" style="background:${due?'var(--warn)':'var(--good)'}"></i></div><strong>${due}</strong><small>due / expired ≤90d</small></article>
    </section>

    <section class="section-head"><div><p class="eyebrow">CAREER PULSE</p><h3>Keep momentum visible</h3></div></section>
    <article class="pulse-card card">
      <div class="pulse-top"><div><strong>Career pulse</strong><p class="muted" style="margin:4px 0 0;font-size:11px">A simple activity signal—not a clinical or operational readiness score.</p></div><div class="pulse-score" style="--pulse:${pulse.score}%"><strong>${pulse.score}</strong></div></div>
      <div class="pulse-list">
        <div><div class="pulse-row"><span>Certifications current</span><b>${pulse.certScore}%</b></div><div class="progress-track"><div class="progress-fill" style="--progress:${pulse.certScore}%"></div></div></div>
        <div><div class="pulse-row"><span>Training logged (90 days)</span><b>${Math.round(pulse.training90/6)/10} hr</b></div><div class="progress-track"><div class="progress-fill" style="--progress:${pulse.trainingScore}%"></div></div></div>
        <div><div class="pulse-row"><span>Skill repetitions (90 days)</span><b>${pulse.skill90}</b></div><div class="progress-track"><div class="progress-fill" style="--progress:${pulse.skillScore}%"></div></div></div>
      </div>
    </article>

    ${backupDue?`<div class="backup-nudge"><p><strong style="color:var(--text)">Your record is worth backing up.</strong><br>It has been more than 30 days since a backup.</p><button class="secondary compact-button" data-action="backup-now">Back up</button></div>`:''}

    <section class="section-head"><div><p class="eyebrow">RECENT</p><h3>Career log</h3></div><button class="text-btn" data-view="history">View all</button></section>
    <section class="stack">${recent.length?recent.map(entryCard).join(''):emptyCard('＋','Start your career log','After a call, class, or drill, save the one detail future-you will care about.')}</section>

    <section class="section-head"><div><p class="eyebrow">DON'T GET BLINDSIDED</p><h3>Certification radar</h3></div><button class="text-btn" data-view="certs">Manage</button></section>
    <section class="stack">${renewals.length?renewals.map(certCard).join(''):emptyCard('✓','Add your first certification','Track expiration dates and optional CE progress in one place.')}</section>

    <section class="section-head"><div><p class="eyebrow">WHAT'S NEXT</p><h3>Career goals</h3></div><button class="text-btn" data-view="goals">Open goals</button></section>
    <section class="stack">${goals.length?goals.map(goalCard).join(''):emptyCard('◎','Set a target','Promotion, certification, leadership, education—turn it into a visible next step.',`<button class="secondary" data-action="open-goal" style="margin-top:12px">Add a goal</button>`)}</section>`;
}

function renderHistory(){
  currentView='history'; navState('history');
  const search=historySearch.trim().toLowerCase();
  const filtered=[...state.entries].filter(e=>historyFilter==='all'||e.type===historyFilter).filter(e=>!search||`${e.category} ${e.note||''}`.toLowerCase().includes(search)).sort(byDateDesc);
  const totalMinutes=filtered.filter(e=>e.type==='training').reduce((s,e)=>s+(Number(e.minutes)||0),0);
  qs('#app').innerHTML=`
    <div class="view-title"><p class="eyebrow">CAREER TIMELINE</p><h2>Career log</h2><p class="muted">Search years of calls, skills, classes, and accomplishments without storing patient details.</p><div class="title-actions"><button class="primary" data-action="open-capture">+ Add record</button></div></div>
    <div class="search-row"><label class="search-field" style="margin:0"><span>⌕</span><input id="historySearch" value="${escapeHtml(historySearch)}" placeholder="Search category or note" aria-label="Search career log" /></label><button class="secondary compact-button" data-action="export-log">Export</button></div>
    <div class="filter-row">${['all','incident','skill','training','accomplishment'].map(f=>`<button class="filter ${historyFilter===f?'active':''}" data-filter="${f}">${f==='all'?'All':typeMeta[f].label}</button>`).join('')}</div>
    <div class="privacy-strip"><b>${filtered.length} RECORDS</b><span>${Math.round(totalMinutes/6)/10} training hours in this view.</span></div>
    <section class="stack">${filtered.length?filtered.map(entryCard).join(''):emptyCard('⌕','Nothing matches','Try another filter or search term.')}</section>`;
  const input=qs('#historySearch');
  if(input){input.addEventListener('input',e=>{historySearch=e.target.value; debounceHistory();}); setTimeout(()=>{if(document.activeElement?.id==='historySearch'){const len=input.value.length;input.setSelectionRange(len,len);}},0);}
}
let historyDebounce;
function debounceHistory(){ clearTimeout(historyDebounce); historyDebounce=setTimeout(renderHistory,180); }
