// ============================================================
// ISSUE STATUS CHART — UI COMPONENT
// Responsibility: Render a Doughnut chart showing issue status
// distribution. Uses Chart.js. Reusable: expose update()
// for live refresh without full re-init.
// ============================================================

let chartInstance = null;

const getElement = (id) => document.getElementById(id);

const COLORS = {
  open: { bg: "rgba(249, 115, 22, 0.75)", border: "rgba(249, 115, 22, 1)" },
  inProgress: { bg: "rgba(59, 130, 246, 0.75)", border: "rgba(59, 130, 246, 1)" },
  resolved: { bg: "rgba(16, 185, 129, 0.75)", border: "rgba(16, 185, 129, 1)" },
  closed: { bg: "rgba(107, 114, 128, 0.75)", border: "rgba(107, 114, 128, 1)" },
};

const buildChartConfig = (data) => ({
  type: "doughnut",
  data: {
    labels: ["Open", "In Progress", "Resolved", "Closed"],
    datasets: [
      {
        data: [data.open, data.inProgress, data.resolved, data.closed],
        backgroundColor: [
          COLORS.open.bg,
          COLORS.inProgress.bg,
          COLORS.resolved.bg,
          COLORS.closed.bg,
        ],
        borderColor: [
          COLORS.open.border,
          COLORS.inProgress.border,
          COLORS.resolved.border,
          COLORS.closed.border,
        ],
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { size: 12, family: "inherit" },
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        titleFont: { size: 13, weight: "600" },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed}`,
        },
      },
    },
  },
});

const updateIssueStatusChart = (data) => {
  if (!chartInstance) return;
  chartInstance.data.datasets[0].data = [data.open, data.inProgress, data.resolved, data.closed];
  chartInstance.update();
};

const renderIssueStatusChart = (data) => {
  const canvas = getElement("issueStatusChart");
  if (!canvas) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(canvas.getContext("2d"), buildChartConfig(data));
};

export { renderIssueStatusChart, updateIssueStatusChart };
