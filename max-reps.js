const exercises = ["pushups","pullups","squats","toeToBar"];
const charts = {};

function capitalize(s){
  return s.charAt(0).toUpperCase()+s.slice(1).replace(/([A-Z])/g,' $1');
}

function loadMaxRepsCards(){
  const c = document.getElementById('maxRepsCards');
  c.innerHTML = '';
  const h = JSON.parse(localStorage.getItem('maxRepHistory')||'{}');
  exercises.forEach(ex=>{
    const arr = h[ex]||[], latest = arr.length?arr[arr.length-1].value:0;
    const card = document.createElement('div');
    card.className='max-rep-card';
    card.innerHTML=`<h4>${capitalize(ex)}</h4><p>${latest}</p>`;
    card.onclick = ()=> openMaxEntry(ex);
    c.appendChild(card);
  });
}

function loadMaxRepsCharts() {
  const history = JSON.parse(localStorage.getItem('maxRepHistory') || '{}');
  console.log('▶ maxRepHistory:', history);
  exercises.forEach(ex => {
    console.log('⟳ rendering chart for', ex);
    const canvas = document.getElementById(`chart_${ex}`);
    if (!canvas) { console.error('❌ missing canvas for', ex); return; }
    const ctx = canvas.getContext('2d');
    console.log('   ctx is', ctx);
    // … rest of your chart code …
  });
}


function openMaxEntry(ex){
  document.getElementById('currentExercise').textContent=capitalize(ex);
  document.getElementById('maxEntryInputs').innerHTML=
    `<label>${capitalize(ex)}: <input name="${ex}" type="number" min="1"></label>`;
  document.getElementById('maxEntrySection').classList.remove('hidden');
}

function closeMaxEntry(){
  document.getElementById('maxEntrySection').classList.add('hidden');
}

document.getElementById('maxEntryForm').onsubmit = e=>{
  e.preventDefault();
  const f=e.target, inp=f.querySelector('input[name]'), ex=inp.name, val=Number(inp.value);
  if(!val) return;
  const today=new Date().toISOString().split('T')[0];
  const h=JSON.parse(localStorage.getItem('maxRepHistory')||'{}');
  (h[ex]||(h[ex]=[])).push({date:today,value:val});
  localStorage.setItem('maxRepHistory',JSON.stringify(h));
  closeMaxEntry(); updateDisplay();
};

function updateDisplay(){
  loadMaxRepsCards();
  loadMaxRepsCharts();
}

window.onload = updateDisplay;
