const exercises = ["pushups","pullups","squats","toeToBar"];
const charts = {};

function capitalize(s){
  return s.charAt(0).toUpperCase()+s.slice(1).replace(/([A-Z])/g,' $1');
}

function loadMaxRepsCards(){
  const container = document.getElementById('maxRepsCards');
  container.innerHTML = '';
  const history = JSON.parse(localStorage.getItem('maxRepHistory')||'{}');
  exercises.forEach(ex=>{
    const arr = history[ex]||[], latest = arr.length?arr[arr.length-1].value:0;
    const card = document.createElement('div');
    card.className='max-rep-card';
    card.innerHTML=`<h4>${capitalize(ex)}</h4><p>${latest}</p>`;
    card.onclick = ()=> openMaxEntry(ex);
    container.appendChild(card);
  });
}

function loadMaxRepsCharts(){
  const history = JSON.parse(localStorage.getItem('maxRepHistory')||'{}');
  exercises.forEach(ex=>{
    const ctx = document.getElementById(`chart_${ex}`).getContext('2d');
    const data = (history[ex]||[]).map(e=>e.value);
    const labels = (history[ex]||[]).map(e=>e.date);
    if(charts[ex]) charts[ex].destroy();
    charts[ex] = new Chart(ctx,{
      type:'line',
      data:{ labels, datasets:[{ label:'Max Reps', data, fill:false, tension:0.2 }] },
      options:{ scales:{ x:{ type:'category' }, y:{ beginAtZero:true } } }
    });
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
  loadMaxRepsCards(); loadMaxRepsCharts();
}

window.onload = updateDisplay;
