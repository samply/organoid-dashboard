import {
  Spot,
  ResponseStore,
  Response,
  ResponseBody,
  ResponseDetails,
} from "./spot";
import { Grid } from "gridjs";

type siteDataArray = string[][];
let siteData: siteDataArray = [];
let grid: Grid | null = null;

// Define the updateTable function
export function updateTable(parsedResponse: ResponseStore) {
  // Extract the response details from the parsed response
  const responseDetails = parsedResponse.response.data?.responseDetails;

  //@todo: include 'site' into ResponseDetails
  // Transform the response details into an array of type siteDataArray
  const transformedData: siteDataArray =
    responseDetails?.map((detail) => [
      parsedResponse.site,
      detail.project,
      detail.patId,
      detail.organoidId,
      detail.localisationPt,
      detail.classificationPt,
      detail.sampleType,
      detail.therapyPt.toString(),
      detail.therapyTypePt,
      detail.therapyM.toString(),
      detail.typeTherapyM,
    ]) ?? [];

  if (siteData.length == 0) {
    siteData = transformedData;
    renderTable(siteData);
  } else if (siteData.length > 0 && grid) {
    siteData = siteData.concat(transformedData);
    grid.updateConfig({
      data: siteData,
    });
  }
}

/*
// Create a new Spot instance
const url = new URL('');
const sites = [''];
const spot = new Spot(url, sites);

const payload = JSON.stringify({ payload: "SELECT_TABLES" });
const query = btoa(payload);

// Create an AbortController to cancel the request if needed
const controller = new AbortController();

// Send the query
spot.send(query, controller).then(() => {
  console.log('Query sent successfully');
}).catch((err) => {
  console.error('Error sending query:', err);
});
*/

function renderTable(siteData: siteDataArray) {
  const tableElement = document.getElementById("table");
  if (tableElement) {
    tableElement.innerHTML = "";
    grid = new Grid({
      columns: [
        "Site",
        "Project",
        "Pat.ID",
        "Organoid.ID",
        "Localisation Primary Tumor",
        "TNM",
        "Sample Type",
        "Therapy primary Tumor",
        "Type of Therapy (primary Tumor)",
        "Therapy Metastasis",
        "Type of Therapy (Metastases)",
      ],
      data: siteData,
      sort: true,
      pagination: {
        limit: 30,
      },
      search: true,
    }).render(tableElement);
  } else {
    console.error("Element with id 'table' not found");
  }
}

// Example usage of the updateTable function
// spot.send will call this function internally when it receives new data
// but you can also call it manually for testing purposes
const exampleParsedResponse: ResponseStore = {
  site: "site1",
  response: {
    status: "succeeded",
    data: {
      date: "2023-03-01",
      responseDetails: [
        {
          project: "NeoMatch",
          patId: "NeoM-M1-01",
          organoidId: "NeoM-M01-t1-T0",
          localisationPt: "Pancreas",
          classificationPt: "T2N1M0",
          sampleType: "Biopsy",
          therapyPt: true,
          therapyTypePt: "FOLFIRINOX",
          therapyM: false,
          typeTherapyM: "",
        },
      ],
    },
  },
};

const exampleParsedResponse2: ResponseStore = {
  site: "site2",
  response: {
    status: "succeeded",
    data: {
      date: "2023-03-01",
      responseDetails: [
        /*
    {        
        "project": "MetPredict",
        "patId": "M3tIg31-F1-02",
        "organoidId": "M3tIg31-F01-t1-T0",
        "therapy": true,
        "therapyType": "genetic editing"      
      }  
    */
        {
          project: "MetPredict",
          patId: "M3tIg31-F1-02",
          organoidId: "M3tIg31-F1-02-T0",
          localisationPt: "Liver",
          classificationPt: "T4N1M1",
          sampleType: "Biopsy",
          therapyPt: true,
          therapyTypePt: "RCTx",
          therapyM: false,
          typeTherapyM: "",
        },
      ],
    },
  },
};

window.addEventListener("load", () => {
  updateTable(exampleParsedResponse);
  updateTable(exampleParsedResponse2);
});

new EventSource('/esbuild').addEventListener('change', () => location.reload());
