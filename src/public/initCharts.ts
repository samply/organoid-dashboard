import { Chart, ChartData, ChartOptions as ChartJsOptions } from 'chart.js';
import { makeHtmlLegendPlugin } from './htmlLegendPlugin';

interface ChartOptions {
  type: 'bar' | 'pie';
  labels: string[];
  data: number[];
  titleX?: string;
  titleY?: string;
}

function createChart(canvasId: string, options: ChartOptions) {
  const ctx = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!ctx) {
    console.log(`Element with id '${canvasId}' not found`);
    return;
  }

  const chartOptions: ChartJsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            let value = context.formattedValue;
            return `${label}: ${value}`;
          }
        }
      }
    }
  };

  if (options.type === 'bar') {
    chartOptions.indexAxis = 'x';
    if (chartOptions.plugins && chartOptions.plugins.legend) {
      chartOptions.plugins.legend.display = false;
    }
    chartOptions.scales = {
      y: {
        title: {
          display: true,
          text: options.titleY
        }
      },
      x: {
        title: {
          display: true,
          text: options.titleX
        }
      }
    };
  }

  return new Chart(ctx, {
    type: options.type,
    data: {
      labels: options.labels,
      datasets: [
        { data: options.data }
      ]
    },
    options: chartOptions,
    plugins: options.type === 'pie' ? [makeHtmlLegendPlugin(canvasId.replace('Canvas', 'Legend'))] : [],
  });
}

export function initPatientsByProjectBarChart() {
  return createChart('patientsByProjectBarChartCanvas', {
    type: 'bar',
    labels: ['MetPredict', 'NeoMatch'],
    data: [10, 10],
    titleX: 'Project',
    titleY: 'Number of Patients'
  });
}

export function initPatientsByAgeBarChart() {
  return createChart('patientsByAgeBarChartCanvas', {
    type: 'bar',
    labels: ['<30', '31-40', '41-50', '51-60', '>61'],
    data: [10, 10, 10, 10, 10],
    titleX: 'Age',
    titleY: 'Number of Patients'
  });
}

export function initOrganoidsByProjectBarChart() {
  return createChart('organoidsByProjectBarChartCanvas', {
    type: 'bar',
    labels: ['MetPredict', 'NeoMatch'],
    data: [10, 10],
    titleX: 'Project',
    titleY: 'Number of Organoids'
  });
}

export function initPatientsByGenderPieChart() {
  return createChart('patientsByGenderPieChartCanvas', {
    type: 'pie',
    labels: ['Male', 'Female'],
    data: [10, 10]
  });
}

export function initOrganoidsByBiopsySitePieChart() {
  return createChart('organoidByBiopsySitePieChartCanvas', {
    type: 'pie',
    labels: ['Metastasis', 'Untreated Primary Tumor', 'Treated Tumor'],
    data: [1, 1, 1]
  });
}

export function initMetPPatientsByPdosPieChart() {
  return createChart('metPPatientsByPdosPieChartCanvas', {
    type: 'pie',
    labels: ['<=3 PDOs', '4 PDOs', '5 PDOs', '>5 PDOs'],
    data: [1, 1, 1, 1]
  });
}

export function initNeoMPatientsByTherapyStatusPieChart() {
  return createChart('neoMPatientsByTherapyStatusPieChartCanvas', {
    type: 'pie',
    labels: ['after neoCX', 'before neoCX', 'before & after neoCX'],
    data: [1, 1, 1]
  });
}