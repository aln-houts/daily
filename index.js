// index.js - Unified byDay schedule only

// Utility functions
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/([A-Z])/g, ' $1');
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

// Timer state
let timerInterval;
let currentRound = 1;
let totalRounds;
let duration;
let remainingTime;

// Load beep sound
const beep = new Audio('beep.mp3'); // Ensure you have a `beep.mp3` file in your project

// Format seconds to MM:SS
function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Sounds
function playBeep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  osc.frequency.value = 1000;
  osc.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.05);
}

function playBell() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  osc.frequency.value = 500;
  osc.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
}

// Start the timer
function startTimer() {
  const durationInput = document.getElementById('setTimerDuration');
  const roundsInput = document.getElementById('timerRounds');
  const timerDisplay = document.getElementById('timerDisplay');
  const timerToggleBtn = document.getElementById('timerToggleBtn');

  duration = parseInt(durationInput.value, 10);
  totalRounds = parseInt(roundsInput.value, 10);
  remainingTime = duration;
  currentRound = 1;

  timerToggleBtn.textContent = 'Stop';
  timerToggleBtn.onclick = stopTimer;

  updateDisplay(timerDisplay, remainingTime);

  timerInterval = setInterval(() => {
    if (remainingTime > 0) {
      remainingTime--;

      // Play beep sound for the last 3 seconds
      if (remainingTime <= 3 && remainingTime > 0) {
        beep.play();
      }

      updateDisplay(timerDisplay, remainingTime);
    } else {
      // End of the current round
      if (currentRound < totalRounds) {
        currentRound++;
        remainingTime = duration; // Reset for the next round
      } else {
        // All rounds complete
        stopTimer();
        alert('Workout complete!');
      }
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  document.getElementById('timerToggleBtn').textContent = 'Start';
  document.getElementById('timerToggleBtn').onclick = startTimer;
}

function updateDisplay(displayElement, time) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  displayElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Load workout page
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
    document.getElementById('timerToggleBtn').disabled = true;
    return;
  }
  document.getElementById('timerToggleBtn').disabled = false;

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
      container.innerHTML += `
        <div class="set-item">
          <input type="radio" name="${ex}_set${i}_completed" ${completed}/>
          <input type="number" name="${ex}_set${i}_reps" value="${repsVal}" min="0"/>
        </div>`;
    }
  });

  document.getElementById('timerRounds').value = totalSets;
}

// Save workout and graph
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
    Object.values(data[date] || {}).reduce((sum, ex) =>
      sum + (ex.sets || []).reduce((s, st) => s + (st.reps || 0), 0), 0)
  );

  if (!labels.length) {
    console.warn('No workout data available for the graph.');
    return;
  }

  const ctx = document.getElementById('workoutChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Total Reps',
        data: totals,
        fill: false,
        borderColor: 'blue',
        tension: 0.2
      }]
    },
    options: {
      scales: {
        x: { type: 'category' },
        y: { beginAtZero: true }
      }
    }
  });
}

// Event listeners
document.getElementById('timerToggleBtn').onclick = startTimer;
document.getElementById('saveWorkoutButton').addEventListener('click', saveWorkout);

window.onload = () => {
  loadWorkoutPage();
  loadWorkoutGraph();
};
