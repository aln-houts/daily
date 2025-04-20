let maxReps = {
  pushups: { value: 50, lastUpdated: '2025-03-20' },
  pullups: { value: 10, lastUpdated: '2025-03-20' },
  squats: { value: 100, lastUpdated: '2025-03-20' },
  toeToBar: { value: 5, lastUpdated: '2025-03-20' }
};

function openMaxRepsEntry() {
  const form = document.getElementById('maxRepsForm');
  form.pushups.value = maxReps.pushups.value;
  form.pullups.value = maxReps.pullups.value;
  form.squats.value = maxReps.squats.value;
  form.toeToBar.value = maxReps.toeToBar.value;
  document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

document.getElementById('maxRepsForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const today = new Date().toISOString().split('T')[0];
  const updates = {
    pushups: Number(this.pushups.value),
    pullups: Number(this.pullups.value),
    squats: Number(this.squats.value),
    toeToBar: Number(this.toeToBar.value)
  };

  for (const ex in updates) {
    maxReps[ex] = { value: updates[ex], lastUpdated: today };
  }

  const history = JSON.parse(localStorage.getItem('maxRepHistory') || '{}');
  for (const ex in updates) {
    if (!history[ex]) history[ex] = [];
    history[ex].push({ date: today, value: updates[ex] });
  }
  localStorage.setItem('maxRepHistory', JSON.stringify(history));

  closeModal();
  renderMaxReps();
  checkNextTestReminder();
  renderChart();
});

function openSchedule() {
  document.getElementById('scheduleSection').classList.remove('hidden');
}

function closeSchedule() {
  document.getElementById('scheduleSection').classList.add('hidden');
}

document.getElementById('scheduleForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const formData = new FormData(this);
  const scheduleType = formData.get('scheduleType');
  const day1 = formData.getAll('day1');
  const day2 = formData.getAll('day2');
  const schedule = { type: scheduleType, day1, day2 };
  localStorage.setItem('workoutSchedule', JSON.stringify(schedule));
  closeSchedule();
  alert('Workout schedule saved!');
});

function startWorkout() {
  const workoutSection = document.getElementById('workoutSection');
  const form = document.getElementById('workoutForm');
  form.innerHTML = '';

  const schedule = JSON.parse(localStorage.getItem('workoutSchedule') || '{}');
  const today = new Date();
  let exercises = [];

  if (schedule.type === 'daily') {
    exercises = schedule.day1 || [];
  } else if (schedule.type === 'two-day') {
    const day = today.getDay();
    exercises = (day % 2 === 0) ? schedule.day1 : schedule.day2;
  }

  if (!exercises.length) {
    form.innerHTML = '<p>No exercises set for today.</p>';
    workoutSection.classList.remove('hidden');
    return;
  }

  exercises.forEach(ex => {
    form.innerHTML += `
      <label>${capitalize(ex)}:
        <input type="number" name="${ex}" min="0" required>
      </label><br/>
    `;
  });

  form.innerHTML += `<button type="submit">Save Workout</button>`;
  workoutSection.classList.remove('hidden');
}

document.getElementById('workoutForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const formData = new FormData(this);
  const today = new Date().toISOString().split('T')[0];
  const log = {};
  for (const [exercise, reps] of formData.entries()) {
    log[exercise] = Number(reps);
  }
  const allLogs = JSON.parse(localStorage.getItem('workoutLogs') || '{}');
  allLogs[today] = log;
  localStorage.setItem('workoutLogs', JSON.stringify(allLogs));
  alert('Workout saved!');
  const workoutSection = document.getElementById('workoutSection');
const form = document.getElementById('workoutForm');
form.reset();
form.innerHTML = '';
workoutSection.classList.add('hidden');
});

function showMaxHistory() {
  const section = document.getElementById('maxHistorySection');
  const ctx = document.getElementById('maxChart').getContext('2d');
  const history = JSON.parse(localStorage.getItem('maxRepHistory') || '{}');
  const datasets = Object.keys(history).map(ex => ({
    label: capitalize(ex),
    data: history[ex].map(entry => ({ x: entry.date, y: entry.value })),
    fill: false,
    tension: 0.2
  }));

  new Chart(ctx, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      parsing: false,
      scales: {
        x: { type: 'time', time: { unit: 'day' } },
        y: { beginAtZero: true }
      }
    }
  });

  section.classList.remove('hidden');
}

function closeMaxHistory() {
  document.getElementById('maxHistorySection').classList.add('hidden');
  document.getElementById('maxChart').replaceWith(document.getElementById('maxChart').cloneNode());
}

window.onload = () => {
  renderMaxReps();
  checkNextTestReminder();
  renderChart();
};

function renderMaxReps() {
  const container = document.getElementById('maxRepsDisplay');
  container.innerHTML = '<h3>Current Max Reps</h3>';
  for (const ex in maxReps) {
    const { value, lastUpdated } = maxReps[ex];
    container.innerHTML += `<p>${capitalize(ex)}: ${value} (Last updated: ${lastUpdated})</p>`;
  }
}

function checkNextTestReminder() {
  const reminder = document.getElementById('nextTestReminder');
  const today = new Date();
  const oldest = Object.values(maxReps).reduce((min, { lastUpdated }) => {
    const date = new Date(lastUpdated);
    return date < min ? date : min;
  }, new Date());
  const diffDays = Math.floor((today - oldest) / (1000 * 60 * 60 * 24));
  if (diffDays >= 30) {
    reminder.textContent = `It's time to retest your max reps! (${diffDays} days since last update)`;
  } else {
    reminder.textContent = `Next max rep test in ${30 - diffDays} days.`;
  }
}

function renderChart() {
  const ctx = document.getElementById('progressChart');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(maxReps).map(capitalize),
      datasets: [{
        label: 'Max Reps',
        data: Object.values(maxReps).map(ex => ex.value),
      }]
    }
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/([A-Z])/g, ' $1');
}
