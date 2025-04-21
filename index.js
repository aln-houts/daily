// index.js - refined timer logic with precise beeps and final bell

// Utility functions
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/([A-Z])/g,' $1');
}
function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}
function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Sound functions
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

// Timer state
let timerInterval, preInterval;
let currentRound = 0, totalRounds = 0, remainingTime = 0;
let timerRunning = false;

// Pre-round countdown (3,2,1)
function startPreCountdown(onComplete) {
  clearInterval(preInterval);
  let count = 3;
  document.getElementById('timerDisplay').textContent = formatTime(count);
  preInterval = setInterval(() => {
    count--;
    if (count > 0) {
      playBeep();
      document.getElementById('timerDisplay').textContent = formatTime(count);
    } else {
      clearInterval(preInterval);
      onComplete();
    }
  }, 1000);
}

// Work timer
function startWorkTimer() {
  clearInterval(timerInterval);
  remainingTime = Number(document.getElementById('setTimerDuration').value);
  document.getElementById('timerDisplay').textContent = formatTime(remainingTime);
  timerInterval = setInterval(() => {
    remainingTime--;
    document.getElementById('timerDisplay').textContent = formatTime(remainingTime);
    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      nextRound();
    }
  }, 1000);
}

// Handle next round or finish
function nextRound() {
  if (currentRound < totalRounds - 1) {
    currentRound++;
    startPreCountdown(startWorkTimer);
  } else {
    playBell();
    document.getElementById('timerToggleBtn').textContent = 'Start';
    timerRunning = false;
    document.getElementById('timerToggleBtn').disabled = false;
  }
}

// Start/Pause toggle
function toggleTimer() {
  const btn = document.getElementById('timerToggleBtn');
  if (!timerRunning) {
    totalRounds = Number(document.getElementById('timerRounds').value);
    currentRound = 0;
    btn.textContent = 'Pause';
    btn.disabled = true;
    startPreCountdown(() => {
      btn.disabled = false;
      startWorkTimer();
    });
    timerRunning = true;
  } else {
    clearInterval(preInterval);
    clearInterval(timerInterval);
    btn.textContent = 'Start';
    btn.disabled = false;
    timerRunning = false;
  }
}

// Workout page logic
function loadWorkoutPage() {
  const section = document.getElementById('workoutSection');
  section.innerHTML = '<h2>Today\'s Workout</h2>';
  const schedule = JSON.parse(localStorage.getItem('workoutSchedule')|| '{}');
  const logs = JSON.parse(localStorage.getItem('workoutLogs')|| '{}');
  const todayKey = getTodayKey();
  const todayLog = logs[todayKey]|| {};
  const todayIdx = new Date().getDay();

  let exercises = [];
  if (schedule.byDay) {
    exercises = schedule.byDay[todayIdx] || [];
  } else {
    // legacy fallback omitted for brevity
  }

  if (!exercises.length) {
    section.innerHTML += '<p>No exercises scheduled for today.</p>';
    document.getElementById('timerToggleBtn').disabled = true;
    return;
  }
  document.getElementById('timerToggleBtn').disabled = false;

  let totalSets = 0;
  exercises.forEach(ex => {
    const cfg = schedule.config?.[`${ex}_${todayIdx}`] || {sets:1,reps:0};
    totalSets += cfg.sets;
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.dataset.exercise = ex;
    card.innerHTML = `<h3>${capitalize(ex)}</h3><div class="sets-container" id="sets_${ex}"></div>`;
    section.appendChild(card);
    const container = document.getElementById(`sets_${ex}`);
    const logEx = todayLog[ex]|| {sets:[]};
    for (let i=1;i<=cfg.sets;i++){
      const prev = logEx.sets[i-1]|| {};
      const repsVal = typeof prev.reps==='number'?prev.reps:cfg.reps;
      const completed = prev.completed?'checked':'';
      container.innerHTML += `
        <div class="set-item">
          <input type="radio" name="${ex}_set${i}_completed" ${completed}/>
          <input type="number" name="${ex}_set${i}_reps" value="${repsVal}" min="0"/>
        </div>`;
    }
  });
  document.getElementById('timerRounds').value = totalSets;
}

// Logging and graph
function saveWorkout() {
  const logs = JSON.parse(localStorage.getItem('workoutLogs')|| '{}');
  const todayKey = getTodayKey();
  const todayLog = {};
  document.querySelectorAll('.exercise-card').forEach(card=>{
    const ex = card.dataset.exercise;
    todayLog[ex] = {sets:[]};
    card.querySelectorAll('.set-item').forEach(item=>{
      const repVal=Number(item.querySelector('input[type="number"]').value);
      const completed=item.querySelector('input[type="radio"]').checked;
      todayLog[ex].sets.push({reps:repVal,completed});
    });
  });
  logs[todayKey] = todayLog;
  localStorage.setItem('workoutLogs',JSON.stringify(logs));
  alert('Workout saved!');
  loadWorkoutGraph();
}

function loadWorkoutGraph(){
  const data = JSON.parse(localStorage.getItem('workoutLogs')|| '{}');
  const labels = Object.keys(data);
  const totals = labels.map(date=>
    Object.values(data[date]).reduce((sum,ex)=>
      sum + ex.sets.reduce((s,st)=>s+st.reps,0),0));
  const ctx=document.getElementById('workoutChart').getContext('2d');
  new Chart(ctx,{
    type:'line',
    data:{labels,datasets:[{label:'Total Reps',data:totals,fill:false,tension:0.2}]},
    options:{scales:{x:{type:'category'},y:{beginAtZero:true}}}
  });
}

// Event listeners
document.getElementById('timerToggleBtn').addEventListener('click',toggleTimer);
document.getElementById('saveWorkoutButton').addEventListener('click',saveWorkout);
window.onload = ()=>{
  loadWorkoutPage();
  loadWorkoutGraph();
};
