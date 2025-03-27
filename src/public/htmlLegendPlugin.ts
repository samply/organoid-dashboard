import { Chart } from 'chart.js';

// We are using a custom HTML legend (see https://www.chartjs.org/docs/latest/samples/legend/html.html)
// instead of the built-in legend rendering of Chart.js. This gives us more flexibilty in styling the legend,
// specifically it allows us to separately lay out the pie charts and their legends for a consistent
// sizing and alignment of charts.

export function makeHtmlLegendPlugin(legendContainerId: string) {
  return {
    id: 'htmlLegend',
    afterUpdate(chart: Chart) {
      const legendContainer = document.getElementById(legendContainerId)!;
      legendContainer.innerHTML = '';

      const items = chart.options.plugins!.legend!.labels!.generateLabels!(chart);
      for (const item of items) {
        const legendItem = document.createElement('div');
        legendItem.style.alignItems = 'center';
        legendItem.style.cursor = 'pointer';
        legendItem.style.display = 'flex';
        legendItem.style.flexDirection = 'row';
        legendItem.style.fontSize = 'var(--font-size-xs)';

        legendItem.onclick = () => {
          chart.toggleDataVisibility(item.index!);
          chart.update();
        };

        // Color box
        const boxSpan = document.createElement('span');
        boxSpan.style.background = item.fillStyle!.toString();
        boxSpan.style.borderColor = item.strokeStyle!.toString();
        boxSpan.style.borderWidth = item.lineWidth + 'px';
        boxSpan.style.display = 'inline-block';
        boxSpan.style.flexShrink = '0';
        boxSpan.style.height = '20px';
        boxSpan.style.marginRight = '10px';
        boxSpan.style.width = '20px';

        // Text
        const textContainer = document.createElement('p');
        textContainer.style.color = item.fontColor!.toString();
        textContainer.style.margin = '0';
        textContainer.style.padding = '0';
        textContainer.style.textDecoration = item.hidden ? 'line-through' : '';

        const text = document.createTextNode(item.text);
        textContainer.appendChild(text);

        legendItem.appendChild(boxSpan);
        legendItem.appendChild(textContainer);
        legendContainer.appendChild(legendItem);
      }
    }
  };
}
