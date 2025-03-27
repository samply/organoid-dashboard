import { Spot, ResponseStatus } from './spot';
import * as chartInits from './initCharts';

import {
  Chart, ChartTypeRegistry, BarController, BarElement, CategoryScale,
  LinearScale, Tooltip, PieController, ArcElement, Legend
} from 'chart.js';

export const colors = {
  white: '#ffffff',
  ghostWhite: '#f8f8ff',
  black: '#000000',
  gray: '#a7a7a7',
  lightGray: '#dee2e6',
  lightestGray: '#efefef',
  darkGray: '#323232',
  blue: '#007bff',
  lightBlue: '#007bff',
  lightestBlue: '#adc7f3',
  darkBlue: '#002d80',
  green: '#00882d',
  lightGreen: '#00b33c',
  darkGreen: '#00591a',
  red: '#b90000',
  lightRed: '#ff0000',
  darkRed: '#800000',
  orange: '#e95713',
  lightOrange: '#ffa750',
};

interface CData {
  labels: string[];
  datasets: {
    data: number[];
  }[];
}

function updateChartData(chart: Chart, obj: object, colors: string[]) {
  const labels = Object.keys(obj);
  const data = Object.values(obj);

  // If all data points are 0 (that means a pie chart wouldn't render at all),
  // don't update the chart and instead keep the gray chart from initialization.
  if (data.every(d => d === 0)) {
    return;
  }

  chart.data = {
    labels,
    datasets: [
      {
        data,
      },
    ],
  };
  chart.data.datasets[0].backgroundColor = colors;
  chart.update();
}

let patientsByProjectBarChart: Chart<keyof ChartTypeRegistry, number[], string> | null;
let organoidsByProjectBarChart: Chart<keyof ChartTypeRegistry, number[], string> | null;
let patientsByAgeBarChart: Chart<keyof ChartTypeRegistry, number[], string> | null;
let organoidsByBiopsySitePieChart: Chart<keyof ChartTypeRegistry, number[], string> | null;
let patientsByGenderPieChart: Chart<keyof ChartTypeRegistry, number[], string> | null;
let metPPatientsByPdosPieChart: Chart<keyof ChartTypeRegistry, number[], string> | null;
let neoMPatientsByTherapyStatusPieChart: Chart<keyof ChartTypeRegistry, number[], string> | null;

// card values
export type CardRowData = {
  successfullSiteResponses: number,
  projectsSeen: Set<string>,
  nProjects: number,
  nPatients: number,
  nOrganoids: number;
};

let crd: CardRowData = {
  projectsSeen: new Set([]),
  nProjects: 0,
  nPatients: 0,
  nOrganoids: 0,
  successfullSiteResponses: 0
};

let patientsByProject = {
  MetPredict: 0,
  NeoMatch: 0
};

let organoidsByProject = {
  MetPredict: 0,
  NeoMatch: 0
};

let patientsByAge = {
  "<=30": 0,
  "31-40": 0,
  "41-50": 0,
  "51-60": 0,
  ">=61": 0
};

let organoidsByBiopsySite = {
  Metastasis: 0,
  "Untreated Primary Tumor": 0,
  "Treated Tumor": 0
};

let patientsByGender = {
  Male: 0,
  Female: 0
};

let metPPatientsByPdos = {
  "<=3 PDOs": 0,
  "4 PDOs": 0,
  "5 PDOs": 0,
  ">5 PDOs": 0
};

/*
let neoMPatientsByTherapyStatus = {
  "after neoCX": 0,
  "before neoCX": 0,
  "before/after neoCX": 0
}
*/

// patient and organoid focused query
export type SiteResponse = {
  status: ResponseStatus, data: {
    date: string, responseDetails: [{
      project: string,
      field: string,
      value: number;
    }];
  };
};

//init all visual elements with blank/default initial values
function initBlank() {
  patientsByProjectBarChart = chartInits.initPatientsByProjectBarChart() ?? null;
  organoidsByProjectBarChart = chartInits.initOrganoidsByProjectBarChart() ?? null;
  patientsByAgeBarChart = chartInits.initPatientsByAgeBarChart() ?? null;
  organoidsByBiopsySitePieChart = chartInits.initOrganoidsByBiopsySitePieChart() ?? null;
  patientsByGenderPieChart = chartInits.initPatientsByGenderPieChart() ?? null;
  metPPatientsByPdosPieChart = chartInits.initMetPPatientsByPdosPieChart() ?? null;
  neoMPatientsByTherapyStatusPieChart = chartInits.initNeoMPatientsByTherapyStatusPieChart() ?? null;
}

function updateCardRow(crd: CardRowData) {
  const numResponsesSpan = document.getElementById('numResponses')!;
  const numProjectsSpan = document.getElementById('numProjects')!;
  const numPatientsSpan = document.getElementById('numPatients')!;
  const numOrganoidsSpan = document.getElementById('numOrganoids')!;

  numResponsesSpan.innerText = crd.successfullSiteResponses.toString();
  numProjectsSpan.innerText = crd.nProjects.toString();
  numPatientsSpan.innerText = crd.nPatients.toString();
  numOrganoidsSpan.innerText = crd.nOrganoids.toString();
}

function sendQuery() {
  //############################ query site data ###############################
  // Create a new Spot instance

  const url = new URL('https://organoid.ccp-it.dktk.dkfz.de/prod/');
  const sites = ['dresden', 'dresden-test', 'muenchen-tum'];
  // const url = new URL('http://localhost:8055/');
  // const sites = ['dev-tim'];

  //MetPredict query
  const spot1 = new Spot(url, sites);
  const payload1 = JSON.stringify({ payload: "SIORGP_PUBLIC_METPREDICT" });
  const metpredict_query = btoa(payload1);
  // Create an AbortController to cancel the request if needed
  const controller1 = new AbortController();

  spot1.send(metpredict_query, controller1).then(() => {
    console.log('MetPredict query sent');
  }).catch((err) => {
    console.error('Error sending MetPredict query:', err);
  });

  //NeoMatch query
  const spot2 = new Spot(url, sites);
  const payload2 = JSON.stringify({ payload: "SIORGP_PUBLIC_NEOMATCH" });
  const neomatch_query = btoa(payload2);
  const controller2 = new AbortController();

  spot2.send(neomatch_query, controller2).then(() => {
    console.log('NeoMatch query sent');
  }).catch((err) => {
    console.error('Error sending NeoMatch query:', err);
  });

}

export function updateDashboard(res_map: Map<string, number | string>) {
  console.log(res_map);

  let project = String(res_map.get("project"));
  // update card row
  crd.successfullSiteResponses += 1;
  crd.nOrganoids += Number(res_map.get("n_organoids") ?? 0);
  crd.nPatients += Number(res_map.get("n_patients") ?? 0);
  crd.projectsSeen.add(project);
  crd.nProjects = crd.projectsSeen.size;
  updateCardRow(crd);

  //update patientsByProject
  if (project == "MetPredict") {
    patientsByProject.MetPredict += Number(res_map.get("n_patients") ?? 0);
  } else if (project == "NeoMatch") {
    patientsByProject.NeoMatch += Number(res_map.get("n_patients") ?? 0);
  }
  if (patientsByProjectBarChart) {
    updateChartData(
      patientsByProjectBarChart,
      patientsByProject,
      [
        colors.lightBlue, // color for MetPredict
        colors.lightGreen, // color for NeoMatch
      ],
    );
  }

  //update organoidsByProject
  if (project == "MetPredict") {
    organoidsByProject.MetPredict += Number(res_map.get("n_organoids") ?? 0);
  } else if (project == "NeoMatch") {
    organoidsByProject.NeoMatch += Number(res_map.get("n_organoids") ?? 0);
  }
  if (organoidsByProjectBarChart) {
    updateChartData(
      organoidsByProjectBarChart,
      organoidsByProject,
      [
        colors.lightBlue, // color for MetPredict
        colors.lightGreen, // color for NeoMatch
      ],
    );
  }

  //update patientsByAge 
  patientsByAge['<=30'] += Number(res_map.get("<=30") ?? 0);
  patientsByAge['31-40'] += Number(res_map.get("31-40") ?? 0);
  patientsByAge['41-50'] += Number(res_map.get("41-50") ?? 0);
  patientsByAge['51-60'] += Number(res_map.get("51-60") ?? 0);
  patientsByAge['>=61'] += Number(res_map.get(">=61") ?? 0);

  if (patientsByAgeBarChart) {
    updateChartData(
      patientsByAgeBarChart,
      patientsByAge,
      [colors.blue, colors.green, colors.orange, colors.red, colors.gray],
    );
  }

  //update patientsByGender
  patientsByGender.Female += Number(res_map.get("gender_female") ?? 0);
  patientsByGender.Male += Number(res_map.get("gender_male") ?? 0);

  if (patientsByGenderPieChart) {
    updateChartData(
      patientsByGenderPieChart,
      patientsByGender,
      [colors.blue, colors.green],
    );
  }


  //update organoidsByBiopsieSite
  if (project == "MetPredict") {
    //MetPredict Organoids are always taken from a Metastasis
    organoidsByBiopsySite.Metastasis += Number(res_map.get("n_organoids") ?? 0);
  }
  if (organoidsByBiopsySitePieChart) {
    updateChartData(
      organoidsByBiopsySitePieChart,
      organoidsByBiopsySite,
      [colors.blue, colors.green, colors.orange],
    );
  }

  //update metPPatientsByPDOs
  metPPatientsByPdos["<=3 PDOs"] += Number(res_map.get("pat_pdos_leq_3") ?? 0);
  metPPatientsByPdos["4 PDOs"] += Number(res_map.get("pat_pdos_4") ?? 0);
  metPPatientsByPdos["5 PDOs"] += Number(res_map.get("pat_pdos_5") ?? 0);
  metPPatientsByPdos[">5 PDOs"] += Number(res_map.get("pat_pdos_gt_5") ?? 0);

  if (metPPatientsByPdosPieChart) {
    updateChartData(
      metPPatientsByPdosPieChart,
      metPPatientsByPdos,
      [colors.blue, colors.green, colors.orange, colors.gray],
    );
  }
  //@todo: add neoMPatientsByTherapyStatus
}

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip,
  PieController, ArcElement, Legend
);
initBlank();

const consentPopup = document.getElementById("consentPopup")!;
const consentButton = document.getElementById("consentButton") as HTMLButtonElement;
const consentCheckbox = document.getElementById("consentCheckbox") as HTMLInputElement;

if (localStorage.getItem("hasGivenConsent") === "true") {
  sendQuery();
} else {
  consentPopup.style.display = "flex";
}

consentButton.onclick = () => {
  localStorage.setItem("hasGivenConsent", "true");
  consentPopup.style.display = "none";
  sendQuery();
};

consentCheckbox.onchange = () => {
  consentButton.disabled = !consentCheckbox.checked;
};

// Initialize the button state based on the checkbox
consentButton.disabled = !consentCheckbox.checked;
