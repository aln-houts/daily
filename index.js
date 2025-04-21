function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/([A-Z])/g,' $1');
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

let timerInterval, countdownInterval, remainingTime, remainingRounds;

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

// Pre-countdown before each round
function startPreCountdown(duration, onComplete) {
  clearInterval(timerInterval);
  clearInterval(countdownInterval);
  let preTime = duration;
  document.getElementById('timerDisplay').textContent = formatTime(preTime);
  countdownInterval = setInterval(() => {
    preTime--;
    if (preTime > 0 && preTime <= 3) playBeep();
    document.getElementById('timerDisplay').textContent = formatTime(preTime);
    if (preTime <= 0) {
      clearInterval(countdownInterval);
      playBeep();
      onComplete();
    }
  }, 1000);
}

// Main timer cycle for rounds
function startTimerCycle() {
  clearInterval(timerInterval);
  const duration = Number(document.getElementById('setTimerDuration').value);
  remainingRounds = Number(document.getElementById('timerRounds').value);
  // Start first pre-countdown of 3 seconds
  function runRound() {
    if (remainingRounds <= 0) {
      clearInterval(timerInterval);
      document.getElementById('timerDisplay').textContent = "00:00";
      return;
    }
    remainingTime = duration;
    timerInterval = setInterval(() => {
      remainingTime--;
      if (remainingTime > 0 && remainingTime <= 3) playBeep();
      document.getElementById('timerDisplay').textContent = formatTime(remainingTime);
      if (remainingTime <= 0) {
        playBeep();
        clearInterval(timerInterval);
        remainingRounds--;
        // start next round pre-countdown
        startPreCountdown(3, runRound);
      }
    }, 1000);
  }
  // initial pre-countdown
  startPreCountdown(3, runRound);
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

function loadWorkoutPage() {
  const section = document.getElementById('workoutSection');
  section.innerHTML = '<h2>Today\'s Workout</h2>';
  const schedule = JSON.parse(localStorage.getItem('workoutSchedule') || '{}');
  const logs = JSON.parse(localStorage.getItem('workoutLogs') || '{}');
  const todayKey = getTodayKey();
  const todayLog = logs[todayKey] || {};
  const todayIdx = new Date().getDay();
  const exercises = schedule.byDay?.[todayIdx] || [];

  if (!exercises.length) {
    section.innerHTML += '<p>No exercises scheduled for today.</p>';
    return;
  }

  let totalSets = 0;
  exercises.forEach(ex => {
    const cfg = schedule.config?.[`${ex}_${todayIdx}`] || { sets: 1, reps: 0 };
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
      const item = document.createElement('div');
      item.className = 'set-item';
      item.innerHTML = `
        <input type="radio" name="${ex}_set${i}_completed" ${completed}/>
        <input type="number" name="${ex}_set${i}_reps" value="${repsVal}" min="0"/>
      `;
      container.appendChild(item);
    }
  });

  // Default rounds equals total sets
  document.getElementById('timerRounds').value = totalSets;
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

document.getElementById('startTimerBtn').addEventListener('click', startTimerCycle);
document.getElementById('pauseTimerBtn').addEventListener('click', () => { 
  clearInterval(timerInterval);
  clearInterval(countdownInterval);
});
document.getElementById('saveWorkoutButton').addEventListener('click', saveWorkout);

window.onload = () => {
  loadWorkoutPage();
  loadWorkoutGraph();
};
