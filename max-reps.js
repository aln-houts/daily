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
      renderGraph(ex);
    }
    chartsSection.appendChild(section);
  });
}

function renderGraph(exercise) {
  const ctx = document.getElementById(`chart_${exercise}`).getContext('2d');
  const history = historyData[exercise] || []; // Use `historyData` for consistency
  const labels = history.map(entry => new Date(entry.date).toLocaleDateString());
  const data = history.map(entry => entry.value); // Use `value` for max reps

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Max Reps Over Time',
        data: data,
        borderColor: 'blue',
        backgroundColor: 'rgba(0, 123, 255, 0.2)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Reps'
          },
          beginAtZero: true,
          ticks: {
            stepSize: 5, // Ensure increments of 5
            callback: function(value) {
              return Number.isInteger(value) ? value : ''; // Only show integer values
            }
          }
        }
      }
    }
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
