// Max Reps page logic
let exercises = JSON.parse(localStorage.getItem('masterExercises') || '[]');
if (!exercises.length) {
  exercises = ['pushups','pullups','squats','toeToBar'];
}

const charts = {};

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/([A-Z])/g, ' $1');
}

function loadMaxRepsCards() {
  const container = document.getElementById('maxRepsCards');
  container.innerHTML = '';
  const history = JSON.parse(localStorage.getItem('maxRepHistory') || '{}');
  exercises.forEach(ex => {
    const entries = history[ex] || [];
    const latest = entries.length ? entries[entries.length - 1].value : 0;
    const card = document.createElement('div');
    card.className = 'max-rep-card';
    card.dataset.exercise = ex;
    card.innerHTML = `<h4>${capitalize(ex)}</h4><p>${latest}</p>`;
    card.addEventListener('click', () => openMaxEntry(ex));
    container.appendChild(card);
  });
}

function loadMaxRepsCharts() {
  const history = JSON.parse(localStorage.getItem('maxRepHistory') || '{}');
  const chartsSection = document.getElementById('maxRepsCharts');
  chartsSection.innerHTML = '';
  exercises.forEach(ex => {
    const section = document.createElement('section');
    section.innerHTML = `<h4>${capitalize(ex)}</h4><canvas id="chart_${ex}"></canvas>`;
    chartsSection.appendChild(section);
    const canvas = document.getElementById(`chart_${ex}`);
    const ctx = canvas.getContext('2d');
    const entries = history[ex] || [];
    const labels = entries.map(e => e.date);
    const data = entries.map(e => e.value);
    if (charts[ex]) charts[ex].destroy();
    charts[ex] = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Max Reps', data, fill: false, tension: 0.2, pointRadius: 6 }] },
      options: {
        scales: {
          x: { type: 'category', title: { display: true, text: 'Date' } },
          y: { beginAtZero: true, title: { display: true, text: 'Reps' } }
        }
      }
    });
  });
}

function openMaxEntry(ex) {
  document.getElementById('currentExercise').textContent = capitalize(ex);
  document.getElementById('maxEntryInputs').innerHTML =
    `<label>${capitalize(ex)}: <input type="number" name="${ex}" min="1" required></label>`;
  document.getElementById('maxEntrySection').classList.remove('hidden');
}

function closeMaxEntry() {
  document.getElementById('maxEntrySection').classList.add('hidden');
}

document.getElementById('maxEntryForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const form = e.target;
  const ex = form.querySelector('input[name]').name;
  const val = Number(form[ex].value);
  if (!val) return;
  const today = new Date().toISOString().split('T')[0];
  const history = JSON.parse(localStorage.getItem('maxRepHistory') || '{}');
  if (!history[ex]) history[ex] = [];
  history[ex].push({ date: today, value: val });
  localStorage.setItem('maxRepHistory', JSON.stringify(history));
  closeMaxEntry();
  updateDisplay();
});

function updateDisplay() {
  loadMaxRepsCards();
  loadMaxRepsCharts();
}

window.onload = updateDisplay;
