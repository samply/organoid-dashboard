export type TableResult = {
  [key: string]: string | number;
}[];

type BeamResult = {
  body: string;
  from: string;
  metadata: string;
  status: string;
  task: string;
  to: string[];
};

export async function sendSqlQuery(
  queryName: string,
  resultCallback: (result: TableResult, site: string) => void
): Promise<void> {
  console.log("Sending query", queryName);
  let url: string;
  let sites: string[];
  if (import.meta.env.PROD) {
    if (queryName === "ORGANOID_DASHBOARD_INTERNAL") {
      url = 'https://organoid.ccp-it.dktk.dkfz.de/spot-internal/';
    } else {
      url = 'https://organoid.ccp-it.dktk.dkfz.de/spot-public/';
    }
    sites = ['dresden', 'dresden-test', 'muenchen-tum'];
  } else {
    if (queryName === "ORGANOID_DASHBOARD_INTERNAL") {
      url = 'http://localhost:8056/';
    } else {
      url = 'http://localhost:8055/';
    }
    sites = ['proxy1'];
  }

  const id = crypto.randomUUID();
  const beamTaskResponse = await fetch(
    `${url}beam?sites=${sites.toString()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        id,
        sites,
        query: btoa(JSON.stringify({ payload: queryName })),
      })
    }
  );

  if (!beamTaskResponse.ok) {
    const error = await beamTaskResponse.text();
    console.error(
      `Received ${beamTaskResponse.status} with message ${error}`
    );
  }

  const eventSource = new EventSource(
    `${url.toString()}beam/${id}?wait_count=${sites.length}`,
    {
      withCredentials: true,
    }
  );

  eventSource.onerror = () => {
    // Server closed the connection, which is expected when all sites have responded
    eventSource.close();
  };

  eventSource.addEventListener("new_result", (message) => {
    const response: BeamResult = JSON.parse(message.data);
    if (response.task !== id) return;
    const site: string = response.from.split(".")[1];
    if (response.status === "succeeded") {
      resultCallback(JSON.parse(atob(response.body)), site);
    }
  });
}
