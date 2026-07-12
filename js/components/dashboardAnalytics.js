// ============================================================
// DASHBOARD ANALYTICS — ORCHESTRATOR
// Responsibility: Coordinate all analytics sub-components.
// Fetches the snapshot once, distributes data to child
// components. Handles live-update events for auto-refresh.
// ============================================================

import { fetchAnalyticsSnapshot } from "../dashboard/analyticsService.js";
import { showErrorToast } from "../ui/toast.js";
import { renderIssueStatusChart, updateIssueStatusChart } from "./issueStatusChart.js";
import { renderAssetCategoryChart, updateAssetCategoryChart } from "./assetCategoryChart.js";

const getElement = (id) => document.getElementById(id);

let initialized = false;
let lastSnapshot = null;

// ============================================================
// PRIVATE — UPDATE SUMMARY STAT CARDS
// Populates the analytics-specific stat cards (Total Issues,
// Open Issues, Maintenance Due, etc.) which sit alongside
// the existing Overview cards.
// ============================================================

const updateAnalyticsCards = (snapshot) => {
  const { assetStats, issueStats } = snapshot;

  const setCard = (id, value) => {
    const el = getElement(id);
    if (el) el.textContent = value;
  };

  setCard("analyticsTotalAssets", assetStats.total);
  setCard("analyticsActiveAssets", assetStats.active);
  setCard("analyticsMaintenanceDue", assetStats.maintenanceDue);
  setCard("analyticsTotalIssues", issueStats.total);
  setCard("analyticsOpenIssues", issueStats.open);
  setCard("analyticsInProgressIssues", issueStats.inProgress);
  setCard("analyticsResolvedIssues", issueStats.resolved);
  setCard("analyticsClosedIssues", issueStats.closed);
};

// ============================================================
// PRIVATE — RENDER ALL CHILD COMPONENTS
// ============================================================

const renderAll = (snapshot) => {
  updateAnalyticsCards(snapshot);
  renderIssueStatusChart(snapshot.issueStats);
  renderAssetCategoryChart(snapshot.assetStats.categoryMap);
};

// ============================================================
// PRIVATE — REFRESH (LIVE UPDATE)
// Re-fetches the full snapshot and re-renders all analytics.
// Uses chart .update() paths where possible for smooth
// transitions.
// ============================================================

const refreshAnalytics = async () => {
  try {
    const snapshot = await fetchAnalyticsSnapshot();
    lastSnapshot = snapshot;
    renderAll(snapshot);
  } catch (error) {
    console.error("DashboardAnalytics: refresh failed —", error.message);
  }
};

// ============================================================
// PRIVATE — INITIAL LOAD
// Fetches snapshot and renders all.
// ============================================================

const loadAnalytics = async () => {
  try {
    const snapshot = await fetchAnalyticsSnapshot();
    lastSnapshot = snapshot;
    renderAll(snapshot);
  } catch (error) {
    showErrorToast(error.message || "Failed to load analytics.");
  }
};

// ============================================================
// PRIVATE — EVENT LISTENERS
// Listens for existing custom events to trigger live refresh.
// ============================================================

const setupEventListeners = () => {
  document.addEventListener("record-added", () => refreshAnalytics());
  document.addEventListener("record-updated", () => refreshAnalytics());
  document.addEventListener("record-deleted", () => refreshAnalytics());
  document.addEventListener("maintenance-updated", () => refreshAnalytics());
};

// ============================================================
// INIT
// ============================================================

const initDashboardAnalytics = () => {
  if (initialized) return;
  initialized = true;

  const section = getElement("analyticsSection");
  if (!section) return;

  loadAnalytics();
  setupEventListeners();
};

export { initDashboardAnalytics };
