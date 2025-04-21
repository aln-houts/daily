function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/([A-Z])/g,' $1');
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

let timerInterval;
let remainingTime = 0;
let remainingRounds = 0;
let timerRunning = false;

function formatTime(sec) {
  const m = Math.floor(sec/60).toString().padStart(2,'0');
  const s = (sec%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

function playBeep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  osc.connect(ctx.destination);
  osc.frequency.value = 1000;
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

function tick() {
  if (remainingTime > 0) {
    remainingTime--;
    if (remainingTime > 0 && remainingTime <= 3) playBeep();
    document.getElementById('timerDisplay').textContent = formatTime(remainingTime);
  } else {
    playBeep();
    remainingRounds--;
    if (remainingRounds > 0) {
      remainingTime = Number(document.getElementById('setTimerDuration').value);
      document.getElementById('timerDisplay').textContent = formatTime(remainingTime);
    } else {
      clearInterval(timerInterval);
      timerRunning = false;
      document.getElementById('timerToggleBtn').textContent = 'Start';
    }
  }
}

function toggleTimer() {
  if (!timerRunning) {
    const duration = Number(document.getElementById('setTimerDuration').value);
    const rounds = Number(document.getElementById('timerRounds').value);
    remainingTime = duration;
    remainingRounds = rounds;
    document.getElementById('timerDisplay').textContent = formatTime(remainingTime);
    timerInterval = setInterval(tick, 1000);
    timerRunning = true;
    document.getElementById('timerToggleBtn').textContent = 'Pause';
  } else {
    clearInterval(timerInterval);
    timerRunning = false;
    document.getElementById('timerToggleBtn').textContent = 'Start';
  }
}

function loadWorkoutPage() {
  const section = document.getElementById('workoutSection');
  section.innerHTML = '<h2>Today\'s Workout</h2>';
  const schedule = JSON.parse(localStorage.getItem('workoutSchedule') || '{}');
  const logs = JSON.parse(localStorage.getItem('workoutLogs') || '{}');
  const todayKey = getTodayKey();
  const todayLog = logs[todayKey] || {};
  const todayIdx = new Date().getDay();

  // Determine exercises with fallback
  let exercises = [];
  if (schedule.byDay) {
    exercises = schedule.byDay[todayIdx] || [];
  } else {
    if (schedule.type === 'daily') {
      exercises = schedule.day1 || [];
    } else if (schedule.type === 'two-day') {
      exercises = (todayIdx % 2 === 0) ? (schedule.day1 || []) : (schedule.day2 || []);
    } else if (schedule.type === 'weekly') {
      const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
      const dayName = days[todayIdx];
      exercises = (schedule.weekly && schedule.weekly[dayName]) || [];
    }
  }

  if (!exercises.length) {
    section.innerHTML += '<p>No exercises scheduled for today.</p>';
    document.getElementById('timerToggleBtn').disabled = true;
    return;
  }
  document.getElementById('timerToggleBtn').disabled = false;

  let totalSets = 0;
  exercises.forEach(ex => {
    const cfgKey = schedule.byDay
      ? `${ex}_${todayIdx}`
      : `${ex}_${schedule.type==='weekly'
          ? new Date().toLocaleString('en-us', { weekday: 'long' }).toLowerCase()
          : ((todayIdx % 2 === 0 && schedule.type==='two-day') ? `${ex}_0` : `${ex}_1`)}`;
    const cfg = schedule.config && schedule.config[cfgKey] 
      ? schedule.config[cfgKey] 
      : { sets: 1, reps: 0 };
    totalSets += cfg.sets;
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.dataset.exercise = ex;
    card.innerHTML = `<h3>${capitalize(ex)}</h3><div class="sets-container" id="sets_${ex}"></div>`;
    section.appendChild(card);

    const container = document.getElementById(`sets_${ex}`);
    const logEx = todayLog[ex] || { sets: [] };
    for (let i = 1; i <= cfg.sets; i++) {
      const prev = logEx.sets[i - 1] || {};
      const repsVal = typeof prev.reps === 'number' ? prev.reps : cfg.reps;
      const completed = prev.completed ? 'checked' : '';
      container.innerHTML += `
        <div class="set-item">
          <input type="radio" name="${ex}_set${i}_completed" ${completed}/>
          <input type="number" name="${ex}_set${i}_reps" value="${repsVal}" min="0"/>
        </div>`;
    }
  });

  document.getElementById('timerRounds').value = totalSets;
}

function saveWorkout() {
  const logs = JSON.parse(localStorage.getItem('workoutLogs') || '{}');
  const todayKey = getTodayKey();
  const todayLog = {};
  document.querySelectorAll('.exercise-card').forEach(card => {
    const ex = card.dataset.exercise;
    todayLog[ex] = { sets: [] };
    card.querySelectorAll('.set-item').forEach(item => {
      const repVal = Number(item.querySelector('input[type="number"]').value);
      const completed = item.querySelector('input[type="radio"]').checked;
      todayLog[ex].sets.push({ reps: repVal, completed });
    });
  });
  logs[todayKey] = todayLog;
  localStorage.setItem('workoutLogs', JSON.stringify(logs));
  alert('Workout saved!');
  loadWorkoutGraph();
}

function loadWorkoutGraph() {
  const data = JSON.parse(localStorage.getItem('workoutLogs') || '{}');
  const labels = Object.keys(data);
  const totals = labels.map(date =>
    Object.values(data[date]).reduce((sum, ex) =>
      sum + ex.sets.reduce((s, st) => s + st.reps, 0), 0)
  );
  const ctx = document.getElementById('workoutChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: 'Total Reps', data: totals, fill: false, tension: 0.2 }] },
    options: { scales: { x: { type: 'category' }, y: { beginAtZero: true } } }
  });
}

document.getElementById('timerToggleBtn').addEventListener('click', toggleTimer);
document.getElementById('saveWorkoutButton').addEventListener('click', saveWorkout);

window.onload = () => {
  loadWorkoutPage();
  loadWorkoutGraph();
};