function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/([A-Z])/g,' $1');
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function loadWorkoutPage() {
  const section = document.getElementById('workoutSection');
  section.innerHTML = '<h2>Today\'s Workout</h2>';
  const schedule = JSON.parse(localStorage.getItem('workoutSchedule')||'{}');
  const today = new Date();
  let exercises = [];
  if (schedule.type === 'daily') exercises = schedule.day1||[];
  else if (schedule.type==='two-day') {
    const day = today.getDay();
    exercises = (day%2===0)? schedule.day1 : schedule.day2;
  }
  if (!exercises.length) {
    section.innerHTML += '<p>No exercises scheduled for today.</p>';
    return;
  }
  const logs = JSON.parse(localStorage.getItem('workoutLogs')||'{}');
  const todayLog = logs[getTodayKey()]||{};
  exercises.forEach(ex => {
    // find config
    let dayIndex = schedule.type==='daily'?1:((today.getDay()%2===0)?1:2);
    const cfgKey = `${ex}_d${dayIndex}`;
    const cfg = (schedule.config&&schedule.config[cfgKey])||{sets:1,reps:0};
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.innerHTML = `<h3>${capitalize(ex)}</h3><div class="sets-container" id="sets_${ex}"></div>`;
    section.appendChild(card);
    const container = document.getElementById(`sets_${ex}`);
    const logEx = todayLog[ex]||{sets:[]};
    for (let i=1;i<=cfg.sets;i++){
      const prev = logEx.sets[i-1]||{};
      const repsVal = prev.reps!=null?prev.reps:cfg.reps;
      const completed = prev.completed? 'checked':'';
      const div = document.createElement('div');
      div.className = 'set-item';
      div.innerHTML = `
        <input type="radio" name="${ex}_set${i}_completed" ${completed} />
        <input type="number" name="${ex}_set${i}_reps" value="${repsVal}" min="0" />
      `;
      container.appendChild(div);
    }
  });
}

function saveWorkout() {
  const schedule = JSON.parse(localStorage.getItem('workoutSchedule')||'{}');
  const todayKey = getTodayKey();
  const logs = JSON.parse(localStorage.getItem('workoutLogs')||'{}');
  const todayLog = {};
  const section = document.getElementById('workoutSection');
  const cards = section.querySelectorAll('.exercise-card');
  cards.forEach(card=>{
    const ex = card.querySelector('h3').textContent.replace(/ /g,'').toLowerCase();
    const items = card.querySelectorAll('.set-item');
    todayLog[ex] = { sets: [] };
    items.forEach((item,i)=>{
      const repsInput = item.querySelector(`input[type="number"]`);
      const repVal = Number(repsInput.value);
      const completed = item.querySelector(`input[type="radio"]`).checked;
      todayLog[ex].sets.push({ reps: repVal, completed });
    });
  });
  logs[todayKey] = todayLog;
  localStorage.setItem('workoutLogs', JSON.stringify(logs));
  alert('Workout saved!');
  loadWorkoutGraph();
}

function loadWorkoutGraph() {
  const data = JSON.parse(localStorage.getItem('workoutLogs')||'{}');
  const labels = Object.keys(data);
  const totals = labels.map(date=>{
    return Object.values(data[date]).reduce((sum,ex)=>sum+ex.sets.reduce((s,st)=>s+st.reps,0),0);
  });
  const ctx = document.getElementById('workoutChart').getContext('2d');
  new Chart(ctx,{
    type:'line',
    data:{ labels,datasets:[{label:'Total Reps',data:totals,fill:false,tension:0.2}] },
    options:{scales:{x:{type:'category'},y:{beginAtZero:true}}}
  });
}

document.getElementById('saveWorkoutButton').addEventListener('click', saveWorkout);

window.onload = () => {
  loadWorkoutPage();
  loadWorkoutGraph();
};