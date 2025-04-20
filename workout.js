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

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/([A-Z])/g, ' $1');
}

function loadWorkout() {
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
      <div class="exercise-block">
        <h4>${capitalize(ex)}</h4>
        <label>Target Reps per Set:
          <input type="number" name="${ex}_reps" min="0" />
        </label><br/>
        <label>Number of Sets:
          <input type="number" name="${ex}_sets" min="1" max="10" onchange="generateSetRadios('${ex}', this.value)" />
        </label>
        <div id="${ex}_setChecks" class="set-checks"></div>
        <hr/>
      </div>
    `;
  });
}

function generateSetRadios(ex, num) {
  const container = document.getElementById(`${ex}_setChecks`);
  container.innerHTML = '';
  for (let i = 1; i <= num; i++) {
    container.innerHTML += `
      <label>Set ${i}: <input type="checkbox" name="${ex}_set_${i}" /></label><br/>
    `;
  }
}

window.onload = loadWorkout;
