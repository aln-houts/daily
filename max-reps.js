function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/([A-Z])/g, ' $1');
}

function loadMaxRepsCharts() {
  const history = JSON.parse(localStorage.getItem('maxRepHistory') || '{}');
  const chartsSection = document.getElementById('maxRepsCharts');
  chartsSection.innerHTML = '';

  exercises.forEach(ex => {
    // 1) Create a wrapper section + canvas for every exercise
    const section = document.createElement('section');
    section.innerHTML = `
      <h4>${capitalize(ex)}</h4>
      <canvas id="chart_${ex}"></canvas>
    `;
    chartsSection.appendChild(section);

    // 2) Grab the canvas context
    const ctx = document.getElementById(`chart_${ex}`).getContext('2d');

    // 3) Plot—even if entries is empty, this will draw empty axes
    const entries = history[ex] || [];
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: entries.map(e => e.date),
        datasets: [{
          label: 'Max Reps',
          data: entries.map(e => e.value),
          fill: false,
          tension: 0.2
        }]
      },
      options: {
        scales: {
          x: {
            type: 'category',
            title: { display: true, text: 'Date' }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Reps' }
          }
        }
      }
    });
  });
}


window.onload = loadMaxRepsGraphs;
