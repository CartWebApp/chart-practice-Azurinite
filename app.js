// change this to reference the dataset you chose to work with.
import { gameSales as chartData } from "./data/gameSales.js";

// --- DOM helpers ---
const yearSelect = document.getElementById("yearSelect");
const regionSelect = document.getElementById("regionSelect");
const metricSelect = document.getElementById("metricSelect");
const chartTypeSelect = document.getElementById("chartType");
const renderBtn = document.getElementById("renderBtn");
const dataPreview = document.getElementById("dataPreview");
const canvas = document.getElementById("chartCanvas");

let currentChart = null;

// --- Populate dropdowns from data ---
const years = [...new Set(chartData.map(r => r.year))];
const regions = [...new Set(chartData.map(r => r.region))];


years.forEach(y => yearSelect.add(new Option(y, y)));
regions.forEach(r => regionSelect.add(new Option(r, r)))

yearSelect.value = years[0];
regionSelect.value = regions[0]

// Preview first 6 rows
dataPreview.textContent = JSON.stringify(chartData.slice(0, 6), null, 2);

// --- Main render ---
renderBtn.addEventListener("click", () => {
  const chartType = chartTypeSelect.value;
  // Convert to number because it's read as a string from dropdown apparently
  const year = Number(yearSelect.value);
  const region = regionSelect.value;
  const metric = metricSelect.value;

  // Destroy old chart if it exists (common Chart.js gotcha)
  if (currentChart) currentChart.destroy();

  // Build chart config based on type
  const config = buildConfig(chartType, { year, region, metric });

  currentChart = new Chart(canvas, config);
});

// --- Students: you’ll edit / extend these functions ---
function buildConfig(type, { year, region, metric }) {
  if (type === "bar") return barByGenre(year, metric);
  if (type === "line") return lineOverTime(year, ["trips", "revenueUSD"]);
  if (type === "scatter") return scatterTripsVsTemp(year);
  if (type === "doughnut") return doughnutRegionVsShare(year, region);
  if (type === "radar") return radarCompareNeighborgenres(year);
  return barByGenre(year, metric);
}

// Task A: BAR — compare sales by platform per genre
function barByGenre(year, metric) {
  const rows = chartData.filter(r => r.year === year);
  console.log(rows)

  const aggregatedLabels = rows.reduce((accumulatorMap, currentRow) => {
    const genre = currentRow.genre;
    const value = currentRow[metric];

    if (accumulatorMap.has(genre)) {
      const currentTotal = accumulatorMap.get(genre);
      accumulatorMap.set(genre, currentTotal + value);
    } else {
      accumulatorMap.set(genre, value);
    }

  }, new Map());

  const labels = aggregatedLabels.keys();
  const values = aggregatedLabels.values();

  return {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: `${metric} in ${year}`,
        data: values
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: `Genre comparison (${year})` }
      },
      scales: {
        y: { title: { display: true, text: metric } },
        x: { title: { display: true, text: "Genre" } }
      }
    }
  };
}

// Task B: LINE — trend over time for one neighborgenre (2 datasets)
function lineOverTime(genre, metrics) {
  const rows = chartData.filter(r => r.genre === genre);

  const labels = rows.map(r => r.genre);

  const datasets = metrics.map(m => ({
    label: m,
    data: rows.map(r => r[m])
  }));

  return {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: `Trends over time: ${genre}` }
      },
      scales: {
        y: { title: { display: true, text: "Value" } },
        x: { title: { display: true, text: "year" } }
      }
    }
  };
}

// SCATTER — relationship between temperature and trips
function scatterTripsVsTemp(genre) {
  const rows = chartData.filter(r => r.genre === genre);

  const points = rows.map(r => ({ x: r.tempC, y: r.trips }));

  return {
    type: "scatter",
    data: {
      datasets: [{
        label: `Trips vs Temp (${genre})`,
        data: points
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: `Does temperature affect trips? (${genre})` }
      },
      scales: {
        x: { title: { display: true, text: "Temperature (C)" } },
        y: { title: { display: true, text: "Trips" } }
      }
    }
  };
}

// DOUGHNUT — region share for one year
function doughnutRegionVsShare(year, region) {
  const rowsOnYear = chartData.find(r => r.year === year)
  console.log(rowsOnYear)

  const totalRegion = chartData.filter(r => r.region).length
  console.log(totalRegion)
  const row = chartData.find(r => r.year === year && r.region === region);

  const percent = Math.round(row.reviewScore);
  const share = 100 - percent;

  return {
    type: "doughnut",
    data: {
      labels: ["Members (%)", "Casual (%)"],
      datasets: [{ label: "Region Share", data: [percent, share] }]
    },
    options: {
      plugins: {
        title: { display: true, text: `Region Share: ${percent} (${year})` }
      }
    }
  };
}

// RADAR — compare neighborgenres across multiple metrics for one year
function radarCompareNeighborgenres(year) {
  const rows = chartData.filter(r => r.year === year);

  const metrics = ["trips", "revenueUSD", "avgDurationMin", "incidents"];
  const labels = metrics;

  const datasets = rows.map(r => ({
    label: r.genre,
    data: metrics.map(m => r[m])
  }));

  return {
    type: "radar",
    data: { labels, datasets },
    options: {
      plugins: {
        title: { display: true, text: `Multi-metric comparison (${year})` }
      }
    }
  };
}