import { querySpot } from './spot';
import { makeHtmlLegendPlugin } from './htmlLegendPlugin';
import * as excelValues from '../excel.json';

import { Chart, BarController, CategoryScale, LinearScale, BarElement, PieController, ArcElement, Legend, Tooltip, Colors } from 'chart.js';
Chart.register(BarController, CategoryScale, LinearScale, BarElement, PieController, ArcElement, Legend, Tooltip, Colors);

const pie_colors = [
  '#36a2eb', // blue
  '#ff6384', // pink/red
  '#ff9f40', // orange
  '#ffcd56', // yellow
  '#4bc0c0', // teal
  '#9966ff', // purple
  '#c9cbcf'  // gray
];

function renderBarChart(canvasId: string, labels: string[], data: number[]) {
  // Destroy old chart if it exists
  const oldChart = Chart.getChart(canvasId);
  if (oldChart) {
    oldChart.destroy();
  }

  const isSkeleton = data.every(d => d === 0);

  new Chart(canvasId, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: isSkeleton ? new Array(labels.length).fill(1) : data
      }]
    },
    options: {
      maintainAspectRatio: false, // Without this, charts don't resize properly
      plugins: {
        legend: {
          display: false,
        },
        colors: {
          enabled: !isSkeleton,
        }
      },
      scales: {
        y: {
          ticks: {
            // Don't show fractional values on the y-axis
            precision: 0,
          }
        }
      }
    }
  });
}

function renderPieChart(canvasId: string, legendId: string, labels: string[], data: number[], colors?: string[]) {
  // Destroy old chart if it exists
  const oldChart = Chart.getChart(canvasId);
  if (oldChart) {
    oldChart.destroy();
  }

  const isSkeleton = data.every(d => d === 0);

  // Use provided colors or fallback to new palette
  const backgroundColor = (colors && colors.length > 0)
    ? labels.map((_, i) => colors[i] || pie_colors[i % pie_colors.length])
    : labels.map((_, i) => pie_colors[i % pie_colors.length]);

  new Chart(canvasId, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: isSkeleton ? new Array(labels.length).fill(1) : data,
        backgroundColor: !isSkeleton ? backgroundColor : undefined
      }]
    },
    options: {
      maintainAspectRatio: false, // Without this, charts don't resize properly
      plugins: {
        legend: {
          // Hide the default legend as we are using a custom HTML legend
          display: false,
        },
        colors: {
          enabled: !isSkeleton,
        }
      }
    },
    plugins: [makeHtmlLegendPlugin(legendId)],
  });
}

let values = {
  metpredict_patients: 0,
  neomatch_patients: 0,
  metpredict_organoids: 0,
  neomatch_organoids: 0,
  patients_age_lt_30: 0,
  patients_age_31_40: 0,
  patients_age_41_50: 0,
  patients_age_51_60: 0,
  patients_age_gt_60: 0,
  unknown_age_patients: 0,
  male_patients: 0,
  female_patients: 0,
  diverse_patients: 0,
  unknown_gender_patients: 0,
  organoids_from_metastasis: 0,
  organoids_from_untreated_primary_tumor: 0,
  organoids_from_treated_primary_tumor: 0,
  organoids_from_unknown_site: 0,
  metpredict_patients_with_1_organoids: 0,
  metpredict_patients_with_2_organoids: 0,
  metpredict_patients_with_3_organoids: 0,
  metpredict_patients_with_4_organoids: 0,
  metpredict_patients_with_5_organoids: 0,
  metpredict_patients_with_gt_5_organoids: 0,
  neomatch_patients_with_untreated_organoids: 0,
  neomatch_patients_with_treated_organoids: 0,
  neomatch_patients_with_matched_organoids: 0,
};

function renderCharts() {
  renderBarChart(
    'patientsByProjectCanvas',
    ['MetPredict', 'NeoMatch'],
    [values.metpredict_patients, values.neomatch_patients]
  );
  renderBarChart(
    'organoidsByProjectCanvas',
    ['MetPredict', 'NeoMatch'],
    [values.metpredict_organoids, values.neomatch_organoids]
  );
  renderBarChart(
    'patientsByAgeCanvas',
    ['<=30', '31-40', '41-50', '51-60', '>=61', 'Unknown'],
    [values.patients_age_lt_30, values.patients_age_31_40, values.patients_age_41_50, values.patients_age_51_60, values.patients_age_gt_60, values.unknown_age_patients]
  );
  renderPieChart(
    'patientsByGenderCanvas',
    'patientsByGenderLegend',
    ['Male', 'Female', 'Diverse', 'Unknown'],
    [values.male_patients, values.female_patients, values.diverse_patients, values.unknown_gender_patients],
    [pie_colors[0], pie_colors[1], pie_colors[2], pie_colors[6]] // Make "Unknown" gray
  );
  renderPieChart(
    'organoidsByBiopsySiteCanvas',
    'organoidsByBiopsySiteLegend',
    ['Metastasis', 'Untreated Primary Tumor', 'Treated Primary Tumor', 'Unknown'],
    [values.organoids_from_metastasis, values.organoids_from_untreated_primary_tumor, values.organoids_from_treated_primary_tumor, values.organoids_from_unknown_site],
    [pie_colors[0], pie_colors[1], pie_colors[2], pie_colors[6]] // Make "Unknown" gray
  );
  renderPieChart(
    'metPPatientsByPdosCanvas',
    'metPPatientsByPdosLegend',
    ['1 PDO', '2 PDOs', '3 PDOs', '4 PDOs', '>4 PDOs'],
    [
      values.metpredict_patients_with_1_organoids,
      values.metpredict_patients_with_2_organoids,
      values.metpredict_patients_with_3_organoids,
      values.metpredict_patients_with_4_organoids,
      values.metpredict_patients_with_5_organoids + values.metpredict_patients_with_gt_5_organoids
    ]
  );
  renderPieChart(
    'neoMPatientsByTherapyStatusCanvas',
    'neoMPatientsByTherapyStatusLegend',
    ['Before neoCX', 'After neoCX', 'Before/After neoCX'],
    [values.neomatch_patients_with_untreated_organoids, values.neomatch_patients_with_treated_organoids, values.neomatch_patients_with_matched_organoids]
  );
}

function updateDashboard(row: Record<string, number>, numSites: number) {
  for (const [key, value] of Object.entries(row)) {
    values[key as keyof typeof values] += value;
  }

  document.getElementById('numResponses')!.innerText = (Number(document.getElementById('numResponses')!.innerText) + numSites).toString();
  document.getElementById('numProjects')!.innerText = (Math.min(values.metpredict_patients, 1) + Math.min(values.neomatch_patients, 1)).toString();
  document.getElementById('numPatients')!.innerText = (values.metpredict_patients + values.neomatch_patients).toString();
  document.getElementById('numOrganoids')!.innerText = (values.metpredict_organoids + values.neomatch_organoids).toString();

  renderCharts();
}

function sendQuery() {
  updateDashboard(excelValues, 5);

  querySpot(
    import.meta.env.PROD ? 'https://organoid.ccp-it.dktk.dkfz.de/spot-public/' : 'http://localhost:8055/',
    import.meta.env.PROD ? [/*'dresden', 'dresden-test', 'muenchen-tum'*/'foobar'/*spot crashes if list is empty*/] : ['proxy1'],
    btoa(JSON.stringify({ lang: "sql-named", payload: "ORGANOID_DASHBOARD_PUBLIC" })),
    new AbortController().signal,
    (result) => {
      const site = result.from.split(".")[1];
      if (result.status === "claimed") {
      } else if (result.status === "succeeded") {
        console.log(`Received data from site ${site}`);
        const rows = JSON.parse(atob(result.body));
        updateDashboard(rows[0], 1);
      } else {
        console.error(
          `Site ${site} failed with status ${result.status}:`,
          result.body,
        );
      }
    }
  );
}

function showConsentPopup() {
  const consentPopup = document.getElementById("consentPopup")!;
  const consentButton = document.getElementById("consentButton") as HTMLButtonElement;
  const consentCheckbox = document.getElementById("consentCheckbox") as HTMLInputElement;

  consentButton.disabled = true;
  consentCheckbox.onchange = () => {
    consentButton.disabled = !consentCheckbox.checked;
  };

  consentButton.onclick = () => {
    localStorage.setItem("hasGivenConsent", "true");
    consentPopup.style.display = "none";
    sendQuery();
  };

  // Show the consent popup
  consentPopup.style.display = "flex";
}

renderCharts();
if (localStorage.getItem("hasGivenConsent") === "true") {
  sendQuery();
} else {
  showConsentPopup();
}
