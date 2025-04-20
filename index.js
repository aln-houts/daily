function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/([A-Z])/g, ' $1');
}

function loadWorkoutForm() {
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
    return;
  }

  exercises.forEach(ex => {
    let dayIndex = 1;
    if (schedule.type === 'two-day') {
      const d = today.getDay();
      dayIndex = (d % 2 === 0) ? 1 : 2;
    }
    const key = `${ex}_d${dayIndex}`;
    const cfg = (schedule.config && schedule.config[key]) || { sets: 1, reps: 0 };

    form.innerHTML += `
      <div class="exercise-block">
        <h3>${capitalize(ex)}</h3>
        <label>Sets: <input type="number" name="${ex}_sets" min="1" value="${cfg.sets}" required></label>
        <label>Reps per Set: <input type="number" name="${ex}_reps" min="1" value="${cfg.reps}" required></label>
      </div>
    `;
  });

  form.innerHTML += '<button type="submit">Save Workout</button>';
}

function saveWorkoutLog(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const today = new Date().toISOString().split('T')[0];
  const log = {};

  for (let [key, value] of formData.entries()) {
    const exercise = key.replace(/_(sets|reps)$/, '');
    if (!log[exercise]) log[exercise] = {};
    if (key.endsWith('_sets')) log[exercise].sets = Number(value);
    if (key.endsWith('_reps')) log[exercise].reps = Number(value);
  }

  const allLogs = JSON.parse(localStorage.getItem('workoutLogs') || '{}');
  allLogs[today] = log;
  localStorage.setItem('workoutLogs', JSON.stringify(allLogs));
  alert('Workout saved!');
  loadWorkoutGraph();
}

function loadWorkoutGraph() {
  const data = JSON.parse(localStorage.getItem('workoutLogs') || '{}');
  const labels = Object.keys(data);
  const totals = labels.map(date => {
    return Object.values(data[date])
      .reduce((sum, ex) => sum + (ex.sets * ex.reps), 0);
  });

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

document.getElementById('workoutForm').addEventListener('submit', saveWorkoutLog);
window.onload = () => {
  loadWorkoutForm();
  loadWorkoutGraph();
};