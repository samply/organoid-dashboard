import { querySpot } from "./spot";
import { Grid } from "gridjs";

const siteNames: Record<string, string> = {
  "dresden": "Dresden",
  "dresden-test": "Dresden Test",
  "muenchen-tum": "München TUM",
  "muenchen-lmu": "München LMU",
};

let rows: Record<string, string>[] = [];

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
      row.siteName,
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

function updateDashboard(siteRows: Record<string, string>[], site: string) {
  const siteName = siteNames[site] || site;
  document.getElementById("loaded-sites")!.innerText += (document.getElementById("loaded-sites")!.innerText ? ", " : "") + siteName;
  rows = rows.concat(siteRows.map((row) => ({ ...row, siteName })));
  renderTable();
}

let abortController = new AbortController();
function sendQuery() {
  abortController.abort();
  abortController = new AbortController();

  document.getElementById("loaded-sites")!.innerText = "";
  rows = [];
  renderTable();

  querySpot(
    import.meta.env.PROD ? 'https://organoid.ccp-it.dktk.dkfz.de/spot-internal/' : 'http://localhost:8056/',
    import.meta.env.PROD ? ['dresden', 'dresden-test', 'muenchen-tum'] : ['proxy1'],
    btoa(JSON.stringify({ lang: "sql-named", payload: "ORGANOID_DASHBOARD_INTERNAL" })),
    abortController.signal,
    (result) => {
      const site = result.from.split(".")[1];
      if (result.status === "claimed") {
      } else if (result.status === "succeeded") {
        console.log(`Received data from site ${site}`);
        const siteRows = JSON.parse(atob(result.body));
        updateDashboard(siteRows, site);
      } else {
        console.error(
          `Site ${site} failed with status ${result.status}:`,
          result.body,
        );
      }
    }
  );
}

sendQuery();
document.getElementById("rerun-query-button")?.addEventListener("click", () => {
  sendQuery();
});
