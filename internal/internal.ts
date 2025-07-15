import {
  sendSqlQuery,
  TableResult
} from "../spot";
import { Grid } from "gridjs";

let rows: TableResult = [];

async function renderTable() {
  const oldTableElement = document.getElementById("table")!;
  const tableElement = document.createElement("div");
  tableElement.id = "table";
  oldTableElement.parentNode?.replaceChild(tableElement, oldTableElement);

  new Grid({
    columns: [
      "Site",
      "Project",
      "Patient Pseudonym",
      "Sample Collection Date",
      "Sample Pseudonym",
      "cTNM",
      "Localisation Primary Tumor",
      "Sample Type",
      "Neoadj. Therapy of Primary Tumor",
      "Neoadj. Therapy of Metastases",
    ],
    data: rows.map((row) => [
      row.site,
      row.project,
      row.patient_pseudonym,
      (row.date_of_visite_2b as string).split("T")[0],
      row.sample_pseudonym,
      row.clinical_tnm,
      row.localisation_primary_tumor,
      row.sample_type,
      row.neoadj_therapy_primary_tumor,
      row.neoadj_therapy_metastases,
    ]),
    sort: true,
    search: true,
  }).render(tableElement);
}

function updateTable(siteRows: TableResult, site: string) {
  console.log(`Received ${siteRows.length} rows from ${site}`);
  rows = rows.concat(siteRows.map((row) => ({...row, site})));
  renderTable();
}

function sendQuery() {
  rows = [];
  renderTable();
  sendSqlQuery("ORGANOID_DASHBOARD_INTERNAL", updateTable);
}

sendQuery();
document.getElementById("rerun-query-button")?.addEventListener("click", () => {
  sendQuery();
});
