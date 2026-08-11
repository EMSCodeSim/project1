const STORAGE_KEY = 'responderlog.v1';

const categories = {
  incident: ['Medical', 'Trauma', 'Cardiac arrest', 'Motor vehicle collision', 'Structure fire', 'Wildland / brush', 'Alarm / investigation', 'Hazmat', 'Rescue / extrication', 'Public assist', 'Other incident'],
  skill: ['IV access', 'IO access', '12-lead ECG', 'Airway management', 'BVM ventilation', 'CPAP', 'Medication administration', 'Patient assessment', 'Splinting', 'Hemorrhage control', 'Extrication', 'Pump operations', 'Hose deployment', 'Ladders', 'Forcible entry', 'Search', 'Ropes / knots', 'SCBA / air management', 'Other skill'],
  training: ['EMS continuing education', 'Fire training', 'Company drill', 'Driver / operator', 'Officer development', 'Physical training', 'Instructor / teaching', 'Protocol review', 'Other training'],
  accomplishment: ['Award / recognition', 'Committee / project', 'Instructor milestone', 'Leadership', 'Community outreach', 'New certification', 'Special assignment', 'Promotion preparation', 'Other accomplishment']
};

const icons = { incident: 'INC', skill: 'SKL', training: 'TRN', accomplishment: '★' };

let state = loadState();
let currentView = 'home';
let historyFilter = 'all';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      certs: Array.isArray(parsed.certs) ? parsed.certs : []
    };
  } catch {
    return { entries: [], certs: [] };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function localDateTimeValue(date = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDate(value) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function daysUntil(dateString) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(`${dateString}T00:00:00`);
  return Math.ceil((target - today) / 86400000);
}

function isWithinDays(dateString, days) {
  const d = daysUntil(dateString);
  return d >= 0 && d <= days;
}

function entryWithinDays(entry, days) {
  return (Date.now() - new Date(entry.date).getTime()) <= days * 86400000;
}

function updateStats() {
  const recent = state.entries.filter(e => entryWithinDays(e, 30));
  document.querySelector('#statIncidents').textContent = recent.filter(e => e.type === 'incident').length;
  document.querySelector('#statSkills').textContent = recent.filter(e => e.type === 'skill').length;
  document.querySelector('#statTraining').textContent = recent.filter(e => e.type === 'training').reduce((sum, e) => sum + (Number(e.minutes) || 0), 0);
  document.querySelector('#statCerts').textContent = state.certs.filter(c => isWithinDays(c.expiry, 90)).length;
}

function entryCard(entry) {
  const minuteText = entry.type === 'training' && entry.minutes ? ` • ${entry.minutes} min` : '';
  return `<article class="log-row card">
    <div class="log-icon">${icons[entry.type] || '•'}</div>
    <div class="log-copy">
      <strong>${escapeHtml(entry.category)}</strong>
      <span>${escapeHtml(entry.note || labelForType(entry.type))}${minuteText}</span>
    </div>
    <div class="row-meta">${formatDate(entry.date)}<br>${formatTime(entry.date)}<br><button class="row-delete" data-delete-entry="${entry.id}">Delete</button></div>
  </article>`;
}

function certCard(cert) {
  const days = daysUntil(cert.expiry);
  let label = `${days} days`;
  let cls = '';
  if (days < 0) { label = 'Expired'; cls = 'due'; }
  else if (days <= 30) cls = 'due';
  else if (days <= 90) cls = 'warn';
  return `<article class="cert-row card">
    <div class="log-icon">✓</div>
    <div class="cert-copy"><strong>${escapeHtml(cert.name)}</strong><span>Expires ${formatDate(`${cert.expiry}T12:00:00`)}${cert.note ? ` • ${escapeHtml(cert.note)}` : ''}</span></div>
    <div><span class="cert-badge ${cls}">${label}</span><br><button class="row-delete" data-delete-cert="${cert.id}">Delete</button></div>
  </article>`;
}

function labelForType(type) {
  return ({incident:'Incident logged', skill:'Skill performed', training:'Training completed', accomplishment:'Career accomplishment'})[type] || 'Log entry';
}

function renderHome() {
  const recent = [...state.entries].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0, 4);
  const certs = [...state.certs].sort((a,b) => a.expiry.localeCompare(b.expiry)).slice(0, 3);
  const recentList = document.querySelector('#recentList');
  const certPreview = document.querySelector('#certPreview');
  recentList.innerHTML = recent.length ? recent.map(entryCard).join('') : emptyHtml('No activity logged yet.');
  certPreview.innerHTML = certs.length ? certs.map(certCard).join('') : emptyHtml('No certifications added yet.');
  updateStats();
}

function emptyHtml(text) {
  return `<article class="empty card"><strong>${escapeHtml(text)}</strong><span class="muted">Use the + button to get started.</span></article>`;
}

function renderHistory() {
  const filtered = [...state.entries]
    .filter(e => historyFilter === 'all' || e.type === historyFilter)
    .sort((a,b) => new Date(b.date)-new Date(a.date));
  document.querySelector('#app').innerHTML = `
    <div class="view-title"><p class="eyebrow">CAREER LOG</p><h2>History</h2><p class="muted">A searchable-by-eye timeline of your incidents, skills, drills, and accomplishments.</p></div>
    <div class="filter-row">${['all','incident','skill','training','accomplishment'].map(f => `<button class="filter ${historyFilter===f?'active':''}" data-filter="${f}">${f[0].toUpperCase()+f.slice(1)}</button>`).join('')}</div>
    <section class="stack">${filtered.length ? filtered.map(entryCard).join('') : emptyHtml('No entries in this category.')}</section>`;
}

function renderCerts() {
  const sorted = [...state.certs].sort((a,b) => a.expiry.localeCompare(b.expiry));
  document.querySelector('#app').innerHTML = `
    <div class="view-title"><p class="eyebrow">RENEWAL RADAR</p><h2>Certifications</h2><p class="muted">See what is coming due before it becomes an emergency.</p><button class="primary" data-action="open-cert">+ Add certification</button></div>
    <section class="stack">${sorted.length ? sorted.map(certCard).join('') : emptyHtml('No certifications added yet.')}</section>`;
}

function renderPortfolio() {
  const accomplishments = state.entries.filter(e => e.type === 'accomplishment').sort((a,b) => new Date(b.date)-new Date(a.date));
  const trainingMinutes = state.entries.filter(e => e.type === 'training').reduce((s,e) => s + (Number(e.minutes)||0), 0);
  const skillCount = state.entries.filter(e => e.type === 'skill').length;
  document.querySelector('#app').innerHTML = `
    <div class="view-title"><p class="eyebrow">PROMOTION FILE</p><h2>Portfolio</h2><p class="muted">A running record for evaluations, resumes, interviews, and promotion packets.</p></div>
    <section class="stats-grid portfolio-summary">
      <article class="card portfolio-item"><strong>${accomplishments.length}</strong><span>accomplishments</span></article>
      <article class="card portfolio-item"><strong>${skillCount}</strong><span>skills logged</span></article>
      <article class="card portfolio-item"><strong>${Math.round(trainingMinutes/60*10)/10}</strong><span>training hours</span></article>
      <article class="card portfolio-item"><strong>${state.certs.length}</strong><span>certifications tracked</span></article>
    </section>
    <section class="section-head"><div><p class="eyebrow">HIGHLIGHTS</p><h3>Accomplishments</h3></div><button class="text-btn" data-action="open-log-accomplishment">+ Add</button></section>
    <section class="stack">${accomplishments.length ? accomplishments.map(entryCard).join('') : emptyHtml('No accomplishments logged yet.')}</section>`;
}

function renderView(view) {
  currentView = view;
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
  if (view === 'home') {
    location.reload();
    return;
  }
  if (view === 'history') renderHistory();
  if (view === 'certs') renderCerts();
  if (view === 'portfolio') renderPortfolio();
  window.scrollTo({top:0, behavior:'smooth'});
}

function setLogType(type) {
  const safeType = categories[type] ? type : 'incident';
  document.querySelector('#logType').value = safeType;
  document.querySelectorAll('.seg').forEach(btn => btn.classList.toggle('active', btn.dataset.type === safeType));
  const select = document.querySelector('#logCategory');
  select.innerHTML = categories[safeType].map(c => `<option>${escapeHtml(c)}</option>`).join('');
  document.querySelector('#minutesWrap').classList.toggle('hidden', safeType !== 'training');
}

function openLog(type = 'incident') {
  document.querySelector('#logDate').value = localDateTimeValue();
  document.querySelector('#logNote').value = '';
  document.querySelector('#logMinutes').value = '';
  setLogType(type);
  document.querySelector('#logDialog').showModal();
}

function openCert() {
  document.querySelector('#certForm').reset();
  document.querySelector('#certDialog').showModal();
}

function download(filename, text, type) {
  const blob = new Blob([text], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replaceAll('"','""')}"` : s;
}

function exportCsv() {
  const rows = [['date','type','category','minutes','note'], ...state.entries.map(e => [e.date,e.type,e.category,e.minutes||'',e.note||''])];
  download(`responderlog-${new Date().toISOString().slice(0,10)}.csv`, rows.map(r => r.map(csvEscape).join(',')).join('\n'), 'text/csv');
}

function exportJson() {
  download(`responderlog-backup-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify({version:1, exportedAt:new Date().toISOString(), ...state}, null, 2), 'application/json');
}

function rerender() {
  if (currentView === 'home') renderHome(); else renderView(currentView);
}

document.addEventListener('click', event => {
  const viewBtn = event.target.closest('[data-view]');
  if (viewBtn) renderView(viewBtn.dataset.view);

  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'open-log') openLog();
  if (action === 'open-log-accomplishment') openLog('accomplishment');
  if (action === 'open-cert') openCert();

  const typeBtn = event.target.closest('[data-type]');
  if (typeBtn) setLogType(typeBtn.dataset.type);

  const filter = event.target.closest('[data-filter]')?.dataset.filter;
  if (filter) { historyFilter = filter; renderHistory(); }

  const entryId = event.target.closest('[data-delete-entry]')?.dataset.deleteEntry;
  if (entryId && confirm('Delete this log entry?')) {
    state.entries = state.entries.filter(e => e.id !== entryId); saveState(); rerender();
  }

  const certId = event.target.closest('[data-delete-cert]')?.dataset.deleteCert;
  if (certId && confirm('Delete this certification?')) {
    state.certs = state.certs.filter(c => c.id !== certId); saveState(); rerender();
  }
});

document.querySelector('#logForm').addEventListener('submit', event => {
  event.preventDefault();
  const type = document.querySelector('#logType').value;
  state.entries.push({
    id: uid(),
    type,
    date: document.querySelector('#logDate').value,
    category: document.querySelector('#logCategory').value,
    minutes: type === 'training' ? Number(document.querySelector('#logMinutes').value || 0) : 0,
    note: document.querySelector('#logNote').value.trim()
  });
  saveState();
  document.querySelector('#logDialog').close();
  rerender();
});

document.querySelector('#certForm').addEventListener('submit', event => {
  event.preventDefault();
  state.certs.push({
    id: uid(),
    name: document.querySelector('#certName').value.trim(),
    expiry: document.querySelector('#certExpiry').value,
    note: document.querySelector('#certNote').value.trim()
  });
  saveState();
  document.querySelector('#certDialog').close();
  rerender();
});

document.querySelector('#openSettings').addEventListener('click', () => document.querySelector('#dataDialog').showModal());
document.querySelector('#closeSettings').addEventListener('click', () => document.querySelector('#dataDialog').close());
document.querySelector('#exportJson').addEventListener('click', exportJson);
document.querySelector('#exportCsv').addEventListener('click', exportCsv);
document.querySelector('#clearData').addEventListener('click', () => {
  if (confirm('Permanently clear all ResponderLog data stored in this browser?')) {
    state = {entries:[], certs:[]}; saveState(); document.querySelector('#dataDialog').close(); rerender();
  }
});
document.querySelector('#importJson').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported.entries) || !Array.isArray(imported.certs)) throw new Error('Invalid backup');
    state = {entries: imported.entries, certs: imported.certs};
    saveState();
    document.querySelector('#dataDialog').close();
    rerender();
  } catch {
    alert('That file does not look like a valid ResponderLog backup.');
  } finally {
    event.target.value = '';
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

renderHome();
