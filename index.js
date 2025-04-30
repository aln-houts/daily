// index.js - Unified byDay schedule only

// Shared Utilities
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
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

// Shared Data
const defaultsByCategory = {
  bodyweight: ["pushups", "pullups", "squats", "toeToBar"],
  cardio: ["running", "jumpRope", "burpees"],
  dumbbell: ["dumbbellRow", "dumbbellPress"],
  kettlebell: ["kettlebellSwing", "gobletSquat"],
  barbell: ["barbellSquat", "deadlift", "benchPress"]
};
let masterExercises = JSON.parse(localStorage.getItem('masterExercises') || '[]');
if (!masterExercises.length) masterExercises = defaultsByCategory.bodyweight.slice();

// Detect Current Page
const currentPage = window.location.pathname.split('/').pop();

// Page-Specific Logic
if (currentPage === 'index.html') {
  // Timer and Workout Page Logic
  document.getElementById('timerToggleBtn')?.addEventListener('click', function () {
    // Timer logic here
    console.log('Timer toggled');
  });
}

if (currentPage === 'max-reps.html') {
  // Max Reps Page Logic
  const maxReps = JSON.parse(localStorage.getItem('maxReps') || '{}');
  const maxRepsHistory = JSON.parse(localStorage.getItem('maxRepsHistory') || '{}');

  function populateMaxReps() {
    const exerciseCards = document.getElementById('exerciseCards');
    exerciseCards.innerHTML = '';

    if (masterExercises.length === 0) {
      exerciseCards.innerHTML = '<p class="text-center text-muted">No exercises available. Add exercises in the Schedule page.</p>';
      return;
    }

    masterExercises.forEach(exercise => {
      const currentMax = maxReps[exercise] || 0;

      const cardHTML = `
        <div class="card shadow-sm mb-4">
          <div class="card-body">
            <h5 class="card-title text-center">${capitalize(exercise)}</h5>
            <form onsubmit="saveMaxReps(event, '${exercise}')">
              <div class="mb-3">
                <label for="maxRepsInput_${exercise}" class="form-label">Max Reps</label>
                <input type="number" class="form-control text-center" id="maxRepsInput_${exercise}" value="${currentMax}" min="0" />
              </div>
              <button type="submit" class="btn btn-primary w-100">Save</button>
            </form>
            <canvas id="chart_${exercise}" class="mt-4" style="max-height: 300px; width: 100%;"></canvas>
          </div>
        </div>
      `;

      exerciseCards.insertAdjacentHTML('beforeend', cardHTML);
      renderGraph(exercise);
    });
  }

  function saveMaxReps(event, exercise) {
    event.preventDefault();
    const input = document.getElementById(`maxRepsInput_${exercise}`);
    const value = parseInt(input.value, 10);

    if (!isNaN(value) && value >= 0) {
      maxReps[exercise] = value;
      if (!maxRepsHistory[exercise]) maxRepsHistory[exercise] = [];
      maxRepsHistory[exercise].push({ date: new Date().toISOString(), reps: value });
      localStorage.setItem('maxReps', JSON.stringify(maxReps));
      localStorage.setItem('maxRepsHistory', JSON.stringify(maxRepsHistory));
      renderGraph(exercise);
    }
  }

  function renderGraph(exercise) {
    const ctx = document.getElementById(`chart_${exercise}`).getContext('2d');
    const history = maxRepsHistory[exercise] || [];
    const labels = history.map(entry => new Date(entry.date).toLocaleDateString());
    const data = history.map(entry => entry.reps);

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
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 5
            }
          }
        }
      }
    });
  }

  window.onload = populateMaxReps;
}

if (currentPage === 'schedule.html') {
  // Schedule Page Logic
  function renderLibrary() {
    const flatDefaults = Object.values(defaultsByCategory).flat();
    Object.entries(defaultsByCategory).forEach(([cat, list]) => {
      const cont = document.getElementById('lib-' + cat);
      cont.innerHTML = '';
      list.forEach(ex => {
        cont.insertAdjacentHTML('beforeend',
          `<label><input type="checkbox" name="masterEx" value="${ex}" ${masterExercises.includes(ex) ? 'checked' : ''}/> ${capitalize(ex)}</label>`
        );
      });
    });
  }

  function addCustomExercise() {
    const name = document.getElementById('newExerciseName').value.trim();
    if (!name) return;
    const id = name.replace(/\s+/g, '').toLowerCase();
    if (!masterExercises.includes(id)) {
      masterExercises.push(id);
      localStorage.setItem('masterExercises', JSON.stringify(masterExercises));
    }
    document.getElementById('newExerciseName').value = '';
    renderLibrary();
  }

  window.onload = renderLibrary;
}

// Event listeners
document.getElementById('timerToggleBtn').onclick = startTimer;
document.getElementById('saveWorkoutButton').addEventListener('click', saveWorkout);

window.onload = () => {
  loadWorkoutPage();
  loadWorkoutGraph();
};
