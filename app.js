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
  if (type === "line") return lineOverTime(region, "unitsM");
  if (type === "scatter") return scatterTripsVsTemp(year);
  if (type === "doughnut") return doughnutRegionVsShare(year, region);
  if (type === "radar") return radarCompareNeighborgenres(year);
  return barByGenre(year, metric);
}

// Task A: BAR — compare sales by platform per genre
function barByGenre(year, metric) {
  const rows = chartData.filter(r => r.year === year);
  console.log(rows);

  // Group genres
  const organizedByGenre = new Map()
  for (const row of rows) {
    const genre = row.genre;
    const value = row[metric];

    if (organizedByGenre.has(genre)) {
      const currentTotal = organizedByGenre.get(genre);
      organizedByGenre.set(genre, currentTotal + value);
    } else {
      organizedByGenre.set(genre, value);
    }
  }

  console.log(organizedByGenre);

  // Get the genre names, get the metric values
  // **Conver to array otherwise chart.js errors
  const labels = Array.from(organizedByGenre.keys());
  const values = Array.from(organizedByGenre.values());
  console.log(labels, values);

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

// Task B: LINE — Sales over years
function lineOverTime(year, metric) {
  const rows = chartData.filter(r => r.year === year);

  const labels = rows.map(r => r.year);

  // Group genres
  const organizedByGenre = new Map()
  for (const row of rows) {
    const year = row.year;
    const value = row[metric];

    if (organizedByGenre.has(year)) {
      const currentTotal = organizedByGenre.get(genre);
      organizedByGenre.set(genre, currentTotal + value);
    } else {
      organizedByGenre.set(genre, value);
    }
  }

  const datasets = {
    label: "T",
    data: organizedByGenre.map(r => r[metric]) // Grabs the value of the metric
  };

  return {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: `Trends over time: ${year}` }
      },
      scales: {
        y: { title: { display: true, text: "Value" } },
        x: { title: { display: true, text: "year" } }
      }
    }
  };
}

// SCATTER — relationship between review score and sales
function scatterTripsVsTemp(year) {
  const rows = chartData.filter(r => r.year === year);

  const points = rows.map(r => ({ x: r.reviewScore, y: r.unitsM }))
  console.log(points);

  return {
    type: "scatter",
    data: {
      datasets: [{
        label: `Review Score vs Sales (${year})`,
        data: points
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: `Does review score affect sales? (${year})` }
      },
      scales: {
        x: { title: { display: true, text: "Review Score" } },
        y: { title: { display: true, text: "Sales (M)" } }
      }
    }
  };
}

// DOUGHNUT — region share for one year
function doughnutRegionVsShare(year, region) {
  const rowsOnYear = chartData.filter(r => r.year === year)
  console.log(rowsOnYear)

  const totalRegion = (rowsOnYear.filter(r => r.region).length)
  const percent = ((rowsOnYear.filter(r => r.region === region).length)/totalRegion) * 100

  const share = 100 - percent;

  return {
    type: "doughnut",
    data: {
      labels: ["Region (%)", "Total (%)"],
      datasets: [{ label: "Region Share", data: [percent, share] }]
    },
    options: {
      plugins: {
        title: { display: true, text: `Region Share: ${percent} (${year})` }
      }
    }
  };
}

// RADAR — compare publishers across multiple metrics for one year
function radarCompareNeighborgenres(year) {
  const rows = chartData.filter(r => r.year === year);

  const metrics = ["unitsM", "revenueUSD", "priceUSD", "reviewScore", "esports"];
  const labels = metrics;

  const groupedPublishers = groupStatistics(rows,"publisher",metrics)

  const datasets = groupedPublishers.map(r => ({
    label: r.publisher,
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