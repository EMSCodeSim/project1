function setLogType(type){
  const safe=catalog[type]?type:'incident';
  qs('#logType').value=safe;
  qsa('#entryType .seg').forEach(b=>b.classList.toggle('active',b.dataset.type===safe));
  qs('#logCategory').innerHTML=catalog[safe].map(c=>`<option>${escapeHtml(c)}</option>`).join('');
  qs('#minutesWrap').classList.toggle('hidden',safe!=='training');
  qs('#confidenceWrap').classList.toggle('hidden',safe!=='skill');
  qs('#logTitle').textContent=safe==='accomplishment'?'Add career win':`Add ${typeMeta[safe].label.toLowerCase()}`;
}

function openLog(type='incident',id=''){
  closeDialog('captureDialog');
  qs('#logForm').reset(); qs('#logId').value=''; qs('#logDate').value=localDateTimeValue(); qs('#phiWarning').classList.add('hidden');
  setLogType(type);
  if(id){
    const e=state.entries.find(x=>x.id===id); if(!e)return;
    qs('#logId').value=e.id; setLogType(e.type); qs('#logDate').value=e.date; qs('#logCategory').value=e.category; qs('#logMinutes').value=e.minutes||''; qs('#logConfidence').value=e.confidence||''; qs('#logNote').value=e.note||''; qs('#logTitle').textContent=`Edit ${typeMeta[e.type]?.label.toLowerCase()||'entry'}`;
  }
  openDialog('logDialog');
}

function openCert(id=''){
  qs('#certForm').reset(); qs('#certId').value=''; qs('#certTitle').textContent='Add certification';
  if(id){ const c=state.certs.find(x=>x.id===id); if(!c)return; qs('#certId').value=c.id;qs('#certName').value=c.name||'';qs('#certCategory').value=c.category||'EMS';qs('#certExpiry').value=c.expiry||'';qs('#certHoursNeeded').value=c.hoursNeeded||'';qs('#certHoursDone').value=c.hoursDone||'';qs('#certNote').value=c.note||'';qs('#certTitle').textContent='Edit certification'; }
  openDialog('certDialog');
}

function openExposure(id=''){
  closeDialog('captureDialog'); qs('#exposureForm').reset(); qs('#exposureId').value=''; qs('#exposureDate').value=localDateTimeValue(); qs('#exposurePhiWarning').classList.add('hidden'); qs('#exposureTitle').textContent='Document exposure';
  if(id){ const e=state.exposures.find(x=>x.id===id); if(!e)return; qs('#exposureId').value=e.id;qs('#exposureDate').value=e.date;qs('#exposureType').value=e.type;qs('#exposureSeverity').value=e.severity||'routine';qs('#exposureDecon').value=e.decon||'Not applicable';qs('#exposurePpe').value=e.ppe||'';qs('#exposureRef').value=e.ref||'';qs('#exposureNote').value=e.note||'';qs('#exposureTitle').textContent='Edit exposure'; }
  openDialog('exposureDialog');
}

function openGoal(id=''){
  qs('#goalForm').reset(); qs('#goalId').value=''; qs('#goalProgress').value=0; qs('#goalProgressLabel').textContent='0%'; qs('#goalTitle').textContent='Add goal';
  if(id){ const g=state.goals.find(x=>x.id===id); if(!g)return; qs('#goalId').value=g.id;qs('#goalName').value=g.name||'';qs('#goalCategory').value=g.category||'Promotion';qs('#goalDate').value=g.targetDate||'';qs('#goalProgress').value=g.progress||0;qs('#goalProgressLabel').textContent=`${g.progress||0}%`;qs('#goalNote').value=g.note||'';qs('#goalTitle').textContent='Edit goal'; }
  openDialog('goalDialog');
}

function openProfile(){
  qs('#profileName').value=state.profile.name||'';qs('#profileRole').value=state.profile.role||'';qs('#profileStart').value=state.profile.startDate||'';qs('#profileAgency').value=state.profile.agency||'';openDialog('profileDialog');
}

function download(filename,text,type){ const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200); }
function csvEscape(v){ const s=String(v??''); return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s; }
function exportRows(filename,headers,rows){ download(filename,[headers,...rows].map(r=>r.map(csvEscape).join(',')).join('\n'),'text/csv'); }
function exportCsv(){ exportRows(`responderlog-career-${new Date().toISOString().slice(0,10)}.csv`,['date','type','category','minutes','skill_confidence','note'],state.entries.map(e=>[e.date,e.type,e.category,e.minutes||'',e.confidence||'',e.note||''])); }
function exportExposureCsv(){ exportRows(`responderlog-exposures-${new Date().toISOString().slice(0,10)}.csv`,['date','type','significance','decon','ppe','incident_reference','note'],state.exposures.map(e=>[e.date,e.type,e.severity,e.decon,e.ppe||'',e.ref||'',e.note||''])); }
function exportJson(){ localStorage.setItem(BACKUP_KEY,String(Date.now())); download(`responderlog-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({schema:'responderlog',version:2,exportedAt:new Date().toISOString(),data:state},null,2),'application/json');showToast('Full backup downloaded.'); }

function rerender(){ renderView(currentView); }
function confirmDelete(kind){ return confirm(`Delete this ${kind}? This cannot be undone unless it exists in a backup.`); }

document.addEventListener('click',event=>{
  const close=event.target.closest('[data-close-dialog]'); if(close){closeDialog(close.dataset.closeDialog);return;}
  const view=event.target.closest('[data-view]')?.dataset.view; if(view){renderView(view);return;}
  const actionEl=event.target.closest('[data-action]'); const action=actionEl?.dataset.action;
  if(action==='open-capture'){openDialog('captureDialog');return;}
  if(action==='open-log'){openLog(actionEl.dataset.type||'incident');return;}
  if(action==='open-cert'){openCert();return;}
  if(action==='open-exposure'){openExposure();return;}
  if(action==='open-goal'){openGoal();return;}
  if(action==='open-profile'){openProfile();return;}
  if(action==='backup-now'){exportJson();return;}
  if(action==='export-log'){exportCsv();return;}
  if(action==='export-exposures'){exportExposureCsv();return;}
  if(action==='print-report'){window.print();return;}
  const type=event.target.closest('[data-type]')?.dataset.type; if(type&&event.target.closest('#entryType')){setLogType(type);return;}
  const filter=event.target.closest('[data-filter]')?.dataset.filter; if(filter){historyFilter=filter;renderHistory();return;}
  const editEntry=event.target.closest('[data-edit-entry]')?.dataset.editEntry; if(editEntry){openLog('incident',editEntry);return;}
  const editCert=event.target.closest('[data-edit-cert]')?.dataset.editCert; if(editCert){openCert(editCert);return;}
  const editExposure=event.target.closest('[data-edit-exposure]')?.dataset.editExposure; if(editExposure){openExposure(editExposure);return;}
  const editGoal=event.target.closest('[data-edit-goal]')?.dataset.editGoal; if(editGoal){openGoal(editGoal);return;}
  const deleteEntry=event.target.closest('[data-delete-entry]')?.dataset.deleteEntry; if(deleteEntry&&confirmDelete('career log entry')){state.entries=state.entries.filter(e=>e.id!==deleteEntry);saveState();rerender();showToast('Entry deleted.');return;}
  const deleteCert=event.target.closest('[data-delete-cert]')?.dataset.deleteCert; if(deleteCert&&confirmDelete('certification')){state.certs=state.certs.filter(c=>c.id!==deleteCert);saveState();rerender();showToast('Certification deleted.');return;}
  const deleteExposure=event.target.closest('[data-delete-exposure]')?.dataset.deleteExposure; if(deleteExposure&&confirmDelete('exposure record')){state.exposures=state.exposures.filter(e=>e.id!==deleteExposure);saveState();rerender();showToast('Exposure record deleted.');return;}
  const deleteGoal=event.target.closest('[data-delete-goal]')?.dataset.deleteGoal; if(deleteGoal&&confirmDelete('goal')){state.goals=state.goals.filter(g=>g.id!==deleteGoal);saveState();rerender();showToast('Goal deleted.');return;}
});

qs('#logForm').addEventListener('submit',event=>{
  event.preventDefault();
  const note=qs('#logNote').value.trim();
  if(detectPotentialPhi(note)){qs('#phiWarning').classList.remove('hidden');return;}
  const type=qs('#logType').value,id=qs('#logId').value;
  const record={id:id||uid(),type,date:qs('#logDate').value,category:qs('#logCategory').value,minutes:type==='training'?Number(qs('#logMinutes').value||0):0,confidence:type==='skill'?qs('#logConfidence').value:'',note};
  if(!record.date||!record.category){showToast('Add a date and category.');return;}
  if(id)state.entries=state.entries.map(e=>e.id===id?record:e);else state.entries.push(record);
  saveState();closeDialog('logDialog');rerender();showToast(id?'Entry updated.':'Saved to your career record.');
});

qs('#certForm').addEventListener('submit',event=>{
  event.preventDefault();const id=qs('#certId').value,name=qs('#certName').value.trim(),expiry=qs('#certExpiry').value;if(!name||!expiry){showToast('Certification name and expiration date are required.');return;}
  const record={id:id||uid(),name,category:qs('#certCategory').value,expiry,hoursNeeded:Number(qs('#certHoursNeeded').value||0),hoursDone:Number(qs('#certHoursDone').value||0),note:qs('#certNote').value.trim()};
  if(id)state.certs=state.certs.map(c=>c.id===id?record:c);else state.certs.push(record);saveState();closeDialog('certDialog');rerender();showToast(id?'Certification updated.':'Certification added.');
});

qs('#exposureForm').addEventListener('submit',event=>{
  event.preventDefault(); const ppe=qs('#exposurePpe').value.trim(),ref=qs('#exposureRef').value.trim(),note=qs('#exposureNote').value.trim();
  if(detectPotentialPhi(`${ppe} ${ref} ${note}`)){qs('#exposurePhiWarning').classList.remove('hidden');return;}
  const id=qs('#exposureId').value,record={id:id||uid(),date:qs('#exposureDate').value,type:qs('#exposureType').value,severity:qs('#exposureSeverity').value,decon:qs('#exposureDecon').value,ppe,ref,note};
  if(!record.date||!record.type){showToast('Add a date and exposure type.');return;}
  if(id)state.exposures=state.exposures.map(e=>e.id===id?record:e);else state.exposures.push(record);saveState();closeDialog('exposureDialog');rerender();showToast(id?'Exposure updated.':'Exposure saved to your personal record.');
});

qs('#goalForm').addEventListener('submit',event=>{
  event.preventDefault(); const id=qs('#goalId').value,name=qs('#goalName').value.trim();if(!name){showToast('Give the goal a name.');return;}
  const record={id:id||uid(),name,category:qs('#goalCategory').value,targetDate:qs('#goalDate').value,progress:Number(qs('#goalProgress').value||0),note:qs('#goalNote').value.trim()};
  if(id)state.goals=state.goals.map(g=>g.id===id?record:g);else state.goals.push(record);saveState();closeDialog('goalDialog');rerender();showToast(id?'Goal updated.':'Goal added.');
});
qs('#goalProgress').addEventListener('input',e=>qs('#goalProgressLabel').textContent=`${e.target.value}%`);

qs('#profileForm').addEventListener('submit',event=>{event.preventDefault();state.profile={name:qs('#profileName').value.trim(),role:qs('#profileRole').value.trim(),agency:qs('#profileAgency').value.trim(),startDate:qs('#profileStart').value};saveState();closeDialog('profileDialog');rerender();showToast('Career profile updated.');});

qs('#openSettings').addEventListener('click',()=>openDialog('dataDialog'));
qs('#openSettingsRail').addEventListener('click',()=>openDialog('dataDialog'));
qs('#exportJson').addEventListener('click',exportJson);qs('#exportCsv').addEventListener('click',exportCsv);qs('#exportExposureCsv').addEventListener('click',exportExposureCsv);
qs('#toggleTheme').addEventListener('click',()=>{state.settings.theme=state.settings.theme==='light'?'dark':'light';saveState();applyTheme();showToast(`${state.settings.theme==='light'?'Light':'Dark'} mode enabled.`);});
qs('#clearData').addEventListener('click',()=>{if(confirm('Permanently clear every ResponderLog record stored in this browser?')){state=defaultState();saveState();localStorage.removeItem(BACKUP_KEY);closeDialog('dataDialog');applyTheme();renderHome();showToast('Local data cleared.');}});
qs('#importJson').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{const parsed=JSON.parse(await file.text());const payload=parsed.schema==='responderlog'?parsed.data:parsed;if(!payload||!Array.isArray(payload.entries)||!Array.isArray(payload.certs))throw new Error('Invalid backup');state=normalizeState(payload);saveState();applyTheme();closeDialog('dataDialog');renderHome();showToast('Backup imported successfully.');}
  catch(err){alert('That file does not look like a valid ResponderLog backup.');}
  finally{event.target.value='';}
});

window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;qs('#installRow')?.classList.remove('hidden');});
qs('#installApp').addEventListener('click',async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;qs('#installRow')?.classList.add('hidden');});
window.addEventListener('appinstalled',()=>showToast('ResponderLog installed.'));

function updateConnection(){const badge=qs('#connectionBadge');if(!badge)return;badge.textContent=navigator.onLine?'Online • offline ready':'Offline mode';badge.classList.toggle('warn',!navigator.onLine);}
window.addEventListener('online',updateConnection);window.addEventListener('offline',updateConnection);updateConnection();

if('serviceWorker'in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('Service worker unavailable',err)));}
applyTheme();renderHome();
