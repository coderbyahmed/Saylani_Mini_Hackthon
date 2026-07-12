// ============================================================
// ANALYTICS SERVICE
// Responsibility: Centralised data fetcher for the dashboard
// analytics section. Reads assets, issues, and service history
// in a single call, computes all counts and groupings, and
// returns a structured snapshot. No DOM access, no UI logic.
// ============================================================

import { fetchAssets } from "./dashboardService.js";
import { fetchIssues } from "./issueService.js";
import { fetchAllServiceHistory } from "./serviceHistoryService.js";

// ============================================================
// PRIVATE — COMPUTE ASSET STATS
// ============================================================

const computeAssetStats = (assets) => {
  const total = assets.length;
  const active = assets.filter((a) => (a.status || "").toLowerCase() === "active").length;
  const pending = assets.filter((a) => (a.status || "").toLowerCase() === "pending").length;
  const archived = assets.filter((a) => (a.status || "").toLowerCase() === "archived").length;

  const today = new Date();
  const thirtyDays = new Date(today);
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  const maintenanceDue = assets.filter((a) => {
    if (!a.lastMaintenance) return true;
    const last = new Date(a.lastMaintenance);
    const diffDays = (today - last) / (1000 * 60 * 60 * 24);
    return diffDays > 90;
  }).length;

  const categoryMap = {};
  assets.forEach((a) => {
    const cat = (a.category || "Uncategorized").trim();
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  return { total, active, pending, archived, maintenanceDue, categoryMap };
};

// ============================================================
// PRIVATE — COMPUTE ISSUE STATS
// ============================================================

const computeIssueStats = (issues) => {
  const total = issues.length;
  const open = issues.filter((i) => (i.status || "").toLowerCase() === "open").length;
  const inProgress = issues.filter((i) => {
    const s = (i.status || "").toLowerCase();
    return s === "in progress" || s === "in_progress";
  }).length;
  const resolved = issues.filter((i) => (i.status || "").toLowerCase() === "resolved").length;
  const closed = issues.filter((i) => (i.status || "").toLowerCase() === "closed").length;

  return { total, open, inProgress, resolved, closed };
};

// ============================================================
// PRIVATE — COMPUTE MAINTENANCE STATS
// ============================================================

const computeMaintenanceStats = (history) => {
  const recentMaintenance = history.slice(0, 5);

  return { recentMaintenance, totalEntries: history.length };
};

// ============================================================
// PRIVATE — COMPUTE UPCOMING MAINTENANCE
// ============================================================

const computeUpcomingMaintenance = (assets) => {
  const today = new Date();
  const upcoming = assets
    .filter((a) => {
      if (!a.lastMaintenance) return false;
      const last = new Date(a.lastMaintenance);
      const diffDays = (today - last) / (1000 * 60 * 60 * 24);
      return diffDays > 60 && diffDays <= 90;
    })
    .sort((a, b) => {
      const lastA = new Date(a.lastMaintenance);
      const lastB = new Date(b.lastMaintenance);
      return lastA - lastB;
    })
    .slice(0, 10)
    .map((a) => {
      const last = new Date(a.lastMaintenance);
      const due = new Date(last);
      due.setDate(due.getDate() + 90);
      return {
        assetName: a.assetName || "—",
        location: a.location || "—",
        lastMaintenance: a.lastMaintenance,
        dueDate: due.toISOString().split("T")[0],
      };
    });

  return upcoming;
};

// ============================================================
// PUBLIC — FETCH ANALYTICS SNAPSHOT
// Fetches assets, issues, and history in parallel, computes
// all derived data, and returns a single snapshot object.
// ============================================================

const fetchAnalyticsSnapshot = async () => {
  try {
    const [assets, issues, history] = await Promise.all([
      fetchAssets(),
      fetchIssues(),
      fetchAllServiceHistory(50),
    ]);

    const assetStats = computeAssetStats(assets);
    const issueStats = computeIssueStats(issues);
    const maintenanceStats = computeMaintenanceStats(history);
    const upcomingMaintenance = computeUpcomingMaintenance(assets);

    return {
      assetStats,
      issueStats,
      maintenanceStats,
      upcomingMaintenance,
      rawAssets: assets,
      rawIssues: issues,
      rawHistory: history,
    };
  } catch (error) {
    console.error("AnalyticsService: fetchSnapshot failed —", error.message);
    throw error;
  }
};

export { fetchAnalyticsSnapshot };
