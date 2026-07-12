// ============================================================
// ASSET CATEGORY CHART — UI COMPONENT
// Responsibility: Render a Bar chart showing assets grouped by
// category. Uses Chart.js. Expose update() for live refresh.
// ============================================================

let chartInstance = null;

const getElement = (id) => document.getElementById(id);

const PALETTE = [
  "rgba(59, 130, 246, 0.78)",
  "rgba(16, 185, 129, 0.78)",
  "rgba(249, 115, 22, 0.78)",
  "rgba(139, 92, 246, 0.78)",
  "rgba(236, 72, 153, 0.78)",
  "rgba(234, 179, 8, 0.78)",
  "rgba(20, 184, 166, 0.78)",
  "rgba(239, 68, 68, 0.78)",
];

const BORDER_PALETTE = PALETTE.map((c) => c.replace("0.78", "1"));

const buildChartConfig = (labels, values) => ({
  type: "bar",
  data: {
    labels,
    datasets: [
      {
        label: "Assets",
        data: values,
        backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
        borderColor: labels.map((_, i) => BORDER_PALETTE[i % BORDER_PALETTE.length]),
        borderWidth: 1.5,
        borderRadius: 6,
        maxBarThickness: 52,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        titleFont: { size: 13, weight: "600" },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y} asset${ctx.parsed.y === 1 ? "" : "s"}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, maxRotation: 45 },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: {
          stepSize: 1,
          font: { size: 11 },
        },
      },
    },
  },
});

const updateAssetCategoryChart = (categoryMap) => {
  if (!chartInstance) return;
  const labels = Object.keys(categoryMap);
  const values = Object.values(categoryMap);
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = values;
  chartInstance.data.datasets[0].backgroundColor = labels.map((_, i) => PALETTE[i % PALETTE.length]);
  chartInstance.data.datasets[0].borderColor = labels.map((_, i) => BORDER_PALETTE[i % BORDER_PALETTE.length]);
  chartInstance.update();
};

const renderAssetCategoryChart = (categoryMap) => {
  const canvas = getElement("assetCategoryChart");
  if (!canvas) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  const labels = Object.keys(categoryMap);
  const values = Object.values(categoryMap);

  chartInstance = new Chart(canvas.getContext("2d"), buildChartConfig(labels, values));
};

export { renderAssetCategoryChart, updateAssetCategoryChart };
