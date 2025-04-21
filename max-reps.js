// Max Reps page logic
const masterExercises = JSON.parse(localStorage.getItem('masterExercises') || 'null') 
  || ['pushups','pullups','squats','toeToBar'];
let historyData = JSON.parse(localStorage.getItem('maxRepHistory') || '{}');
const charts = {};

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/([A-Z])/g, ' $1');
}

function loadMaxRepsCards() {
  const container = document.getElementById('maxRepsCards');
  container.innerHTML = '';
  masterExercises.forEach(ex => {
    const entries = historyData[ex] || [];
    const latest = entries.length ? entries[entries.length - 1].value : 0;
    const card = document.createElement('div');
    card.className = 'max-rep-card';
    card.dataset.exercise = ex;
    card.innerHTML = `<h4>${capitalize(ex)}</h4><p>${latest || '—'}</p>`;
    card.addEventListener('click', () => openMaxEntry(ex));
    container.appendChild(card);
  });
}

function loadMaxRepsCharts() {
  const chartsSection = document.getElementById('maxRepsCharts');
  chartsSection.innerHTML = '';
  masterExercises.forEach(ex => {
    const section = document.createElement('section');
    section.innerHTML = `<h4>${capitalize(ex)}</h4>`;
    const entries = historyData[ex] || [];
    if (!entries.length) {
      const noData = document.createElement('div');
      noData.className = 'no-data';
      noData.textContent = 'No data recorded. Click above to add.';
      section.appendChild(noData);
    } else {
      const canvas = document.createElement('canvas');
      canvas.id = 'chart_' + ex;
      section.appendChild(canvas);
      const ctx = canvas.getContext('2d');
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
    }
    chartsSection.appendChild(section);
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
  const input = e.target.querySelector('input[name]');
  const ex = input.name;
  const val = Number(input.value);
  if (!val) return;
  const today = new Date().toISOString().split('T')[0];
  if (!historyData[ex]) historyData[ex] = [];
  historyData[ex].push({ date: today, value: val });
  localStorage.setItem('maxRepHistory', JSON.stringify(historyData));
  closeMaxEntry();
  updateDisplay();
});

function updateDisplay() {
  historyData = JSON.parse(localStorage.getItem('maxRepHistory') || '{}');
  loadMaxRepsCards();
  loadMaxRepsCharts();
}

window.onload = updateDisplay;
