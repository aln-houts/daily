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

function loadMaxRepsCharts(){
  const h = JSON.parse(localStorage.getItem('maxRepHistory')||'{}');
  exercises.forEach(ex=>{
    const canvas = document.getElementById(`chart_${ex}`);
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const entries = h[ex]||[];
    const labels = entries.map(e=>e.date);
    const data = entries.map(e=>e.value);
    if(charts[ex]) charts[ex].destroy();
    charts[ex] = new Chart(ctx,{
      type:'line',
      data: {
        labels: labels,
        datasets: [{
          label:'Max Reps',
          data: data,
          fill:false,
          tension:0.2,
          pointRadius:6
        }]
      },
      options: {
        scales: {
          x: { type:'category' },
          y: { beginAtZero:true }
        }
      }
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
  loadMaxRepsCards();
  loadMaxRepsCharts();
}

window.onload = updateDisplay;
