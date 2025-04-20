function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/([A-Z])/g, ' $1');
}

function loadMaxRepsGraphs() {
  const history = JSON.parse(localStorage.getItem('maxRepHistory') || '{}');
  const container = document.getElementById('maxRepsCharts');

  Object.keys(history).forEach(ex => {
    const section = document.createElement('section');
    section.innerHTML = `
      <h4>${capitalize(ex)}</h4>
      <canvas id="chart_${ex}"></canvas>
    `;
    container.appendChild(section);

    const ctx = section.querySelector('canvas');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: history[ex].map(entry => entry.date),
        datasets: [{
          label: 'Max Reps',
          data: history[ex].map(entry => entry.value)
        }]
      }
    });
  });
}

window.onload = loadMaxRepsGraphs;
