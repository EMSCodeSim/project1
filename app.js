const STORAGE_KEY = 'responderlog.v2';
const OLD_STORAGE_KEY = 'responderlog.v1';
const BACKUP_KEY = 'responderlog.lastBackup';

const catalog = {
  incident: ['Medical', 'Trauma', 'Cardiac arrest', 'Motor vehicle collision', 'Structure fire', 'Wildland / brush', 'Alarm / investigation', 'Hazmat', 'Rescue / extrication', 'Public assist', 'Standby / coverage', 'Other incident'],
  skill: ['IV access', 'IO access', '12-lead ECG', 'Airway management', 'BVM ventilation', 'CPAP', 'Medication administration', 'Patient assessment', 'Splinting', 'Hemorrhage control', 'Extrication', 'Pump operations', 'Hose deployment', 'Ladders', 'Forcible entry', 'Search', 'Ropes / knots', 'SCBA / air management', 'Driver / apparatus', 'Other skill'],
  training: ['EMS continuing education', 'Fire training', 'Company drill', 'Driver / operator', 'Officer development', 'Physical training', 'Instructor / teaching', 'Protocol review', 'Hazmat', 'Rescue', 'Other training'],
  accomplishment: ['Award / recognition', 'Committee / project', 'Instructor milestone', 'Leadership', 'Community outreach', 'New certification', 'Special assignment', 'Promotion preparation', 'Mentoring / precepting', 'Other accomplishment']
};

const typeMeta = {
  incident: {label:'Incident', icon:'INC', cls:'incident'},
  skill: {label:'Skill', icon:'SKL', cls:'skill'},
  training: {label:'Training', icon:'TRN', cls:'training'},
  accomplishment: {label:'Career win', icon:'★', cls:'win'}
};

let state = loadState();
let currentView = 'home';
let historyFilter = 'all';
let historySearch = '';
let deferredInstallPrompt = null;
let toastTimer = null;

function defaultState(){
  return {
    version:2,
    profile:{name:'',role:'',agency:'',startDate:''},
    entries:[], certs:[], exposures:[], goals:[],
    settings:{theme:'dark'}
  };
}

function loadState(){
  try {
    const v2 = localStorage.getItem(STORAGE_KEY);
    if(v2){
      const parsed = JSON.parse(v2);
      return normalizeState(parsed);
    }
    const v1 = localStorage.getItem(OLD_STORAGE_KEY);
    if(v1){
      const old = JSON.parse(v1);
      const migrated = normalizeState({...defaultState(),entries:old.entries||[],certs:old.certs||[]});
      localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));
      return migrated;
    }
  } catch(err){ console.warn('ResponderLog storage could not be read.',err); }
  return defaultState();
}

function normalizeState(input={}){
  const base = defaultState();
  return {
    version:2,
    profile:{...base.profile,...(input.profile||{})},
    entries:Array.isArray(input.entries)?input.entries:[],
    certs:Array.isArray(input.certs)?input.certs:[],
    exposures:Array.isArray(input.exposures)?input.exposures:[],
    goals:Array.isArray(input.goals)?input.goals:[],
    settings:{...base.settings,...(input.settings||{})}
  };
}

function saveState(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }
function uid(){ return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`; }
function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return [...document.querySelectorAll(sel)]; }
function escapeHtml(value=''){ return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function localDateTimeValue(date=new Date()){ const p=n=>String(n).padStart(2,'0'); return `${date.getFullYear()}-${p(date.getMonth()+1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`; }
function formatDate(value,{year=false}={}){ if(!value)return 'No date'; const d=new Date(value); if(Number.isNaN(d.getTime()))return value; return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:year||d.getFullYear()!==new Date().getFullYear()?'numeric':undefined}); }
function formatTime(value){ const d=new Date(value); return Number.isNaN(d.getTime())?'':d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}); }
function daysUntil(dateString){ if(!dateString)return Infinity; const n=new Date(), today=new Date(n.getFullYear(),n.getMonth(),n.getDate()), target=new Date(`${dateString}T00:00:00`); return Math.ceil((target-today)/86400000); }
function entryWithinDays(entry,days){ return Date.now()-new Date(entry.date).getTime() <= days*86400000; }
function plural(n,word){ return `${n} ${word}${n===1?'':'s'}`; }
function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }
function byDateDesc(a,b){ return new Date(b.date||b.expiry||0)-new Date(a.date||a.expiry||0); }
function byExpiry(a,b){ return String(a.expiry||'9999').localeCompare(String(b.expiry||'9999')); }

function detectPotentialPhi(text=''){
  const s=String(text).trim();
  if(!s)return false;
  const patterns=[
    /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b\d{1,5}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,3}\s(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Ct|Court|Way)\b/i,
    /\b(?:DOB|date of birth|MRN|medical record|SSN)\b\s*[:#-]?\s*[A-Za-z0-9/-]+/i,
    /\b\d{3}-\d{2}-\d{4}\b/
  ];
  return patterns.some(r=>r.test(s));
}

function showToast(message){
  const toast=qs('#toast'); if(!toast)return;
  toast.textContent=message; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('show'),2600);
}
function openDialog(id){ const d=qs(`#${id}`); if(d&&!d.open)d.showModal(); }
function closeDialog(id){ const d=qs(`#${id}`); if(d?.open)d.close(); }

function applyTheme(){
  document.documentElement.dataset.theme=state.settings.theme==='light'?'light':'dark';
  const btn=qs('#toggleTheme'); if(btn)btn.textContent=state.settings.theme==='light'?'Use dark':'Use light';
  const meta=qs('meta[name="theme-color"]'); if(meta)meta.content=state.settings.theme==='light'?'#eef3f7':'#07101a';
}

function navState(view){
  qsa('.rail-link[data-view]').forEach(btn=>btn.classList.toggle('active',btn.dataset.view===view));
  qsa('.nav-item[data-view]').forEach(btn=>{
    const careerGroup=['career','portfolio','exposures','goals'];
    btn.classList.toggle('active',btn.dataset.view===view||(btn.dataset.view==='career'&&careerGroup.includes(view)));
  });
}

function greeting(){
  const h=new Date().getHours();
  const base=h<12?'Good morning':h<17?'Good afternoon':'Good evening';
  return state.profile.name?`${base}, ${escapeHtml(state.profile.name)}.`:`${base}.`;
}

function certStatus(cert){
  const days=daysUntil(cert.expiry);
  if(days<0)return {label:'Expired',cls:'danger',days};
  if(days<=30)return {label:`${days}d left`,cls:'danger',days};
  if(days<=90)return {label:`${days}d left`,cls:'warn',days};
  return {label:'Current',cls:'good',days};
}

function careerPulse(){
  const activeCerts=state.certs.filter(c=>daysUntil(c.expiry)>=0);
  const certScore=state.certs.length?Math.round(activeCerts.length/state.certs.length*100):0;
  const training90=state.entries.filter(e=>e.type==='training'&&entryWithinDays(e,90)).reduce((s,e)=>s+(Number(e.minutes)||0),0);
  const trainingScore=clamp(Math.round(training90/(12*60)*100),0,100);
  const skill90=state.entries.filter(e=>e.type==='skill'&&entryWithinDays(e,90)).length;
  const skillScore=clamp(skill90*10,0,100);
  const goalScore=state.goals.length?Math.round(state.goals.reduce((s,g)=>s+(Number(g.progress)||0),0)/state.goals.length):0;
  const score=Math.round(certScore*.35+trainingScore*.25+skillScore*.25+goalScore*.15);
  return {score,certScore,trainingScore,skillScore,goalScore,training90,skill90};
}
