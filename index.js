// index.js - refined timer logic with pre-round countdown
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/([A-Z])/g,' $1');
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

let intervalId;
let preIntervalId;
let currentRound = 0;
let totalRounds = 0;

// Utility to format seconds as MM:SS
function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Beep sound
function playBeep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  osc.connect(ctx.destination);
  osc.frequency.value = 1000;
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

// Pre-round countdown: 3,2,1
function startPreCountdown(onComplete) {
  clearInterval(preIntervalId);
  let count = 3;
  document.getElementById('timerDisplay').textContent = formatTime(count);
  playBeep();  // beep at 3 immediately
  preIntervalId = setInterval(() => {
    count--;
    if (count > 0) {
      playBeep();
      document.getElementById('timerDisplay').textContent = formatTime(count);
    } else {
      clearInterval(preIntervalId);
      onComplete();
    }
  }, 1000);
}

// Main work timer
function startWorkTimer() {
  clearInterval(intervalId);
  const duration = Number(document.getElementById('setTimerDuration').value);
  let remainingTime = duration;
  document.getElementById('timerDisplay').textContent = formatTime(remainingTime);

  intervalId = setInterval(() => {
    remainingTime--;
    if (remainingTime >= 0) {
      document.getElementById('timerDisplay').textContent = formatTime(remainingTime);
    }
    if (remainingTime <= 0) {
      clearInterval(intervalId);
      playBeep();  // beep at end of work period
      nextRound();
    }
  }, 1000);
}

function nextRound() {
  if (currentRound < totalRounds - 1) {
    currentRound++;
    startPreCountdown(startWorkTimer);
  } else {
    // Final round completed
    document.getElementById('timerToggleBtn').textContent = 'Start';
    document.getElementById('timerToggleBtn').disabled = false;
  }
}

// Single toggle button logic
function toggleTimer() {
  const btn = document.getElementById('timerToggleBtn');
  if (btn.textContent === 'Start') {
    totalRounds = Number(document.getElementById('timerRounds').value);
    currentRound = 0;
    btn.textContent = 'Pause';
    btn.disabled = true; // disable until ready
    startPreCountdown(() => {
      btn.disabled = false;
      startWorkTimer();
    });
  } else {
    // Pause both timers
    clearInterval(intervalId);
    clearInterval(preIntervalId);
    btn.textContent = 'Start';
    btn.disabled = false;
  }
}

// ... loadWorkoutPage, saveWorkout, loadWorkoutGraph unchanged ...

// Document event listeners
document.getElementById('timerToggleBtn').addEventListener('click', toggleTimer);
document.getElementById('saveWorkoutButton').addEventListener('click', saveWorkout);

window.onload = () => {
  loadWorkoutPage();
  loadWorkoutGraph();
};
