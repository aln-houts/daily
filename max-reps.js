const exercises = ["pushups","pullups","squats","toeToBar"];
const charts = {};

function capitalize(s){
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/([A-Z])/g, ' $1');
}

// Render the top cards with latest max for each exercise
function loadMaxRepsCards(){
  const container = document.getElementById('maxRepsCards');
  container.innerHTML = '';
  const history = JSON.parse(localStorage.getItem('maxRepHistory') || '{}');
  exercises.forEach(ex => {
    const entries = history[ex] || [];
    const latest = entries.length ? entries[entries.length - 1].value : 0;
    const card = document.createElement('div');
    card.className = 'max-rep-card';
    card.innerHTML = `<h4>${capitalize(ex)}</h4><p>${latest}</p>`;
    card.onclick = () => openMaxEntry(ex);
    container.appendChild(card);
  });
}

// Draw or update each of the four line charts
function loadMaxRepsCharts(){
  const history = JSON.parse(localStorage.getItem('maxRepHistory') || '{}');
  exercises.forEach(ex => {
    const canvas = document.getElementById(`chart_${ex}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const entries = history[ex] || [];
    const labels = entries.map(e => e.date);
    const data = entries.map(e => e.value);

    // If chart exists, destroy it before re-creating
    if (charts[ex]) charts[ex].destroy();

    charts[ex] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Max Reps',
          data,
          fill: false,
          tension: 0.2,
          pointRadius: 6
        }]
      },
      options: {
        scales: {
          x: {
            type: 'category',
            title: { display: true, text: 'Date' }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Reps' }
          }
        }
      }
    });
  });
}

function openMaxEntry(ex){
  document.getElementById('currentExercise').textContent = capitalize(ex);
  document.getElementById('maxEntryInputs').innerHTML =
    `<label>${capitalize(ex)}: <input name="${ex}" type="number" min="1"></label>`;
  document.getElementById('maxEntrySection').classList.remove('hidden');
}

function closeMaxEntry(){
  document.getElementById('maxEntrySection').classList.add('hidden');
}

// Save a new max for just the selected exercise
document.getElementById('maxEntryForm').onsubmit = e => {
  e.preventDefault();
  const form = e.target;
  const inp = form.querySelector('input[name]');
  const ex = inp.name;
  const val = Number(inp.value);
  if (!val) return;
  const today = new Date().toISOString().split('T')[0];
  const history = JSON.parse(localStorage.getItem('maxRepHistory') || '{}');
  (history[ex] || (history[ex] = [])).push({ date: today, value: val });
  localStorage.setItem('maxRepHistory', JSON.stringify(history));
  closeMaxEntry();
  updateDisplay();
};

function updateDisplay(){
  loadMaxRepsCards();
  loadMaxRepsCharts();
}

// Kick everything off on page load
window.onload = updateDisplay;
