let timer;
let seconds = 0;

function formatTime(sec) {
  const mins = Math.floor(sec / 60).toString().padStart(2, '0');
  const secs = (sec % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function updateTimerDisplay() {
  document.getElementById('timerDisplay').textContent = formatTime(seconds);
}

function startTimer() {
  if (!timer) {
    timer = setInterval(() => {
      seconds++;
      updateTimerDisplay();
    }, 1000);
  }
}

function stopTimer() {
  clearInterval(timer);
  timer = null;
}

function resetTimer() {
  stopTimer();
  seconds = 0;
  updateTimerDisplay();
}

function openSchedule() {
  window.location.href = 'schedule.html';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/([A-Z])/g, ' $1');
}

function loadWorkoutForm() {
  const form = document.getElementById('workoutForm');
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
    return;
  }

  exercises.forEach(ex => {
    form.innerHTML += `
      <h4>${capitalize(ex)}</h4>
      <label>Reps: <input type="number" name="${ex}_reps" /></label><br/>
    `;
  });

  form.innerHTML += '<button type="submit">Save Workout</button>';
}

document.getElementById('workoutForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const formData = new FormData(this);
  const today = new Date().toISOString().split('T')[0];
  const log = {};
  for (let [key, value] of formData.entries()) {
    const exercise = key.replace('_reps', '');
    log[exercise] = Number(value);
  }

  const allLogs = JSON.parse(localStorage.getItem('workoutLogs') || '{}');
  allLogs[today] = log;
  localStorage.setItem('workoutLogs', JSON.stringify(allLogs));
  alert('Workout saved!');
  loadWorkoutGraph();
});

function loadWorkoutGraph() {
  const data = JSON.parse(localStorage.getItem('workoutLogs') || '{}');
  const labels = Object.keys(data);
  const totals = labels.map(date =>
    Object.values(data[date]).reduce((sum, reps) => sum + reps, 0)
  );

  const ctx = document.getElementById('workoutChart');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Total Reps',
        data: totals
      }]
    }
  });
}

window.onload = () => {
  updateTimerDisplay();
  loadWorkoutForm();
  loadWorkoutGraph();
};
