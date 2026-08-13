const money=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
const controls=['members','hours','rate'];
function updateROI(){
  const members=Number(document.querySelector('#members').value);
  const hours=Number(document.querySelector('#hours').value);
  const rate=Number(document.querySelector('#rate').value);
  document.querySelector('#membersOut').value=members;
  document.querySelector('#hoursOut').value=hours;
  document.querySelector('#rateOut').value=money.format(rate);
  document.querySelector('#savings').textContent=money.format(members*hours*rate*12);
}
controls.forEach(id=>document.querySelector(`#${id}`).addEventListener('input',updateROI));
updateROI();
