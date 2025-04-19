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
  maxReps.pushups = { value: Number(this.pushups.value), lastUpdated: today };
  maxReps.pullups = { value: Number(this.pullups.value), lastUpdated: today };
  maxReps.squats = { value: Number(this.squats.value), lastUpdated: today };
  maxReps.toeToBar = { value: Number(this.toeToBar.value), lastUpdated: today };
  closeModal();
  renderMaxReps();
  checkNextTestReminder();
  renderChart();
});

function openSchedule() {
  document.getElementById('scheduleModal').classList.remove('hidden');
}

function closeSchedule() {
  document.getElementById('scheduleModal').classList.add('hidden');
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
