// change this to reference the dataset you chose to work with.
import { gameSales as chartData } from "./data/gameSales.js";

// --- DOM helpers ---
const yearSelect = document.getElementById("yearSelect");
const regionSelect = document.getElementById("regionSelect");
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

  // Destroy old chart if it exists (common Chart.js gotcha)
  if (currentChart) currentChart.destroy();

  // Build chart config based on type
  const config = buildConfig(chartType, { year, region });

  currentChart = new Chart(canvas, config);
});

// --- Students: you’ll edit / extend these functions ---


function buildConfig(type, { year, region }) {
  if (type === "bar") return barByGenre(year);
  if (type === "line") return lineOverTime(region);
  if (type === "scatter") return scatterReviewScoresVsSales(year);
  if (type === "doughnut") return doughnutRegionVsShare(year, region);
  if (type === "radar") return radarComparePublishers(year);
  return barByGenre(year);
}

// Task A: BAR — compare sales by genre
function barByGenre(year) {
  const rows = chartData.filter(r => r.year === year);

  // Group genres
  const organizedByGenre = new Map()
  for (const row of rows) {
    const genre = row.genre;
    const sales = row.unitsM;

    if (organizedByGenre.has(genre)) {
      const currentTotal = organizedByGenre.get(genre);
      organizedByGenre.set(genre, currentTotal + sales);
    } else {
      organizedByGenre.set(genre, sales);
    }
  }

  // Get the genre names, get the metric values
  // **Convert to array, otherwise chart.js throws errors
  const labels = Array.from(organizedByGenre.keys());
  const values = Array.from(organizedByGenre.values());

  return {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: `Units sold by genre in ${year}`,
        data: values
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: `Units sold per genre comparison (${year})` }
      },
      scales: {
        y: { title: { display: true, text: "Units sold (M)" } },
        x: { title: { display: true, text: "Genre" } }
      }
    }
  };
}

// Task B: LINE — Sales over years
function lineOverTime(region) {
  const rows = chartData.filter(r => r.region === region);

  // Group occurences of sales per year (basically exact same thing in bar)
  const groupedYears = new Map()
  for (const row of rows) {
    const year = row.year;
    const value = row.unitsM;

    if (groupedYears.has(year)) {
      const currentTotal = groupedYears.get(year);
      groupedYears.set(year, currentTotal + value);
    } else {
      groupedYears.set(year, value);
    }
  }

  const labels = Array.from(groupedYears.keys());
  const values = Array.from(groupedYears.values());

  return {
    type: "line",
    data: {
      labels, 
      datasets: [{
        label: `Units sold in ${region}`,
        data: values
      }] 
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: `Game sales over years in ${region}` }
      },
      scales: {
        y: { title: { display: true, text: "Units Sold (M)" } },
        x: { title: { display: true, text: "Year" } }
      }
    }
  };
}

// SCATTER — relationship between review score and sales
function scatterReviewScoresVsSales(year) {
  const rows = chartData.filter(r => r.year === year);

  const points = rows.map(r => ({ x: r.reviewScore, y: r.unitsM }))

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
        title: { display: true, text: `Do Review Scores Affect Sales? (${year})` }
      },
      scales: {
        x: { title: { display: true, text: "Review Score" } },
        y: { title: { display: true, text: "Units Sold (M)" } }
      }
    }
  };
}

// DOUGHNUT — region share for one year
function doughnutRegionVsShare(year, region) {
  const rowsOnYear = chartData.filter(r => r.year === year);
  console.log(rowsOnYear);

  const totalRegion = (rowsOnYear.filter(r => r.region).length);

  const getRegionPercentContribution = (givenRegion) => {
    return ((rowsOnYear.filter(r => r.region === givenRegion).length)/totalRegion) * 100;
  };
  const NApercent = getRegionPercentContribution("NA");
  const EUpercent = getRegionPercentContribution("EU");
  const JPpercent = getRegionPercentContribution("JP");
  const ASIApercent = getRegionPercentContribution("ASIA");

  const accumulativePercent = NApercent + EUpercent + JPpercent + ASIApercent;

  return {
    type: "doughnut",
    data: {
      labels: ["North America (%)", "European Union (%)", "Japan (%)", "Asia (%)"],
      datasets: [{ label: "Region Share", data: [NApercent,EUpercent,JPpercent,ASIApercent] }]
    },
    options: {
      plugins: {
        title: { display: true, text: `Region Share of Game Sales (${year})` }
      }
    }
  };
}

// RADAR — compare publishers across multiple metrics for one year
function radarComparePublishers(year) {
  const rows = chartData.filter(r => r.year === year);

  const metrics = ["unitsM", "revenueUSD", "priceUSD", "reviewScore", "esports"];
  const labels = metrics;

  // Same gropuing function used for most other graphs but tweaked due to array inputs
  const groupedByPublisher = new Map();
  for (const row of rows) {
    const publisher = row.publisher;

    if (groupedByPublisher.has(publisher)) {
      const currentData = groupedByPublisher.get(publisher);
      const incomingData = metrics.map(m => row[m])
      // Add the already existing data to the new data given by the next row
      for (const index in currentData) {
        incomingData[index] += currentData[index]
      }
      // Set the publisher's value to the summed data table
      groupedByPublisher.set(publisher, incomingData);
    } else {
      // Data is storing the numerical values of the metrics, not giving them keys (but you can infer what is what based on the index; chart.js can, at least)
      const data = metrics.map(m => row[m])
      groupedByPublisher.set(publisher, data);
    }
  }

  // Converting to array for the sake of my sanity in not rewriting the only grouping function I know how to work (if it aint broke, don't fix it...)
  const arrayFormat = Array.from(groupedByPublisher)

  const datasets = arrayFormat.map(r => ({
    label: r[0],
    data: r[1]
  }));
  console.log(datasets)


  return {
    type: "radar",
    data: { labels, datasets },
    options: {
      plugins: {
        title: { display: true, text: `Multi-metric comparison per publisher (${year})` }
      }
    }
  };
}