export type TableResult = {
  [key: string]: string | number;
}[];

export function sendSqlQuery(
  queryName: string,
  resultCallback: (result: TableResult, site: string) => void
): void {
  sendQuery(
    btoa(JSON.stringify({ payload: queryName })),
    resultCallback
  )
}

type BeamResult = {
  body: string;
  from: string;
  metadata: string;
  status: string;
  task: string;
  to: string[];
};

async function sendQuery(
  query: string,
  resultCallback: (result: any, site: string) => void
): Promise<void> {
  let url: string;
  let sites: string[];
  // @ts-ignore: The PROD variable is defined by the esbuild command in package.json
  if (PROD) {
    url = 'https://organoid.ccp-it.dktk.dkfz.de/prod/';
    sites = ['dresden', 'dresden-test', 'muenchen-tum'];
  } else {
    url = 'http://localhost:8055/';
    sites = ['proxy1', 'proxy5'];
  }

  const currentTask = crypto.randomUUID();
  const beamTaskResponse = await fetch(
    `${url}beam?sites=${sites.toString()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        id: currentTask,
        sites: sites,
        query: query,
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
    `${url.toString()}beam/${currentTask}?wait_count=${sites.length}`,
    {
      withCredentials: true,
    }
  );

  eventSource.addEventListener("new_result", (message) => {
    const response: BeamResult = JSON.parse(message.data);
    if (response.task !== currentTask) return;
    const site: string = response.from.split(".")[1];

    if (response.status === "succeeded") {
      resultCallback(JSON.parse(atob(response.body)), site);
    }
  });

  eventSource.onerror = () => {
    eventSource.close();
  };
}
