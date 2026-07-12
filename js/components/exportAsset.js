// ============================================================
// EXPORT ASSET — UI CONTROLLER
// Responsibility: Read currently visible assets from the
// table DOM, generate a professional PDF report using jsPDF +
// jspdf-autotable, and trigger the file download.
// No Firestore queries, no business logic.
// ============================================================

import { showErrorToast } from "../ui/toast.js";
import { showButtonLoader, hideButtonLoader } from "../ui/loader.js";

// ============================================================
// CONSTANTS
// ============================================================

const TBODY_SELECTOR = "#recordsBody";
const TABLE_SELECTOR = "#recordsTable";
const TABLE_EMPTY_SELECTOR = "#tableEmpty";
const TOOLBAR_EXPORT_BTN = ".toolbar > button:nth-of-type(2)";

// ============================================================
// STATE
// ============================================================

let initialized = false;
let isExporting = false;

// ============================================================
// CACHED DOM REFERENCES
// ============================================================

let refs = null;

const cacheDOMRefs = () => {
  if (refs) return refs;

  refs = {
    tbody: document.querySelector(TBODY_SELECTOR),
    table: document.querySelector(TABLE_SELECTOR),
    empty: document.querySelector(TABLE_EMPTY_SELECTOR),
    exportBtn: document.querySelector(TOOLBAR_EXPORT_BTN),
  };

  return refs;
};

// ============================================================
// PRIVATE — GET VISIBLE ASSETS
// ============================================================

const getVisibleRecords = () => {
  const { tbody } = cacheDOMRefs();
  if (!tbody) return [];

  const rows = tbody.querySelectorAll("tr");
  const records = [];

  rows.forEach((tr) => {
    const cells = tr.querySelectorAll("td");
    if (cells.length < 6) return;

    records.push({
      assetName: cells[1].textContent.trim(),
      assetId: cells[2].textContent.trim(),
      category: cells[3].textContent.trim(),
      status: cells[4].textContent.trim(),
    });
  });

  return records;
};

// ============================================================
// PRIVATE — CHECK IF TABLE HAS VISIBLE DATA
// ============================================================

const hasVisibleData = () => {
  const { table, empty } = cacheDOMRefs();

  if (table && table.hidden) return false;
  if (empty && !empty.hidden) return false;

  const records = getVisibleRecords();
  return records.length > 0;
};

// ============================================================
// PRIVATE — FORMAT DATE FOR HEADER
// ============================================================

const formatHeaderDate = (date) => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// ============================================================
// PRIVATE — FORMAT TIME FOR HEADER
// ============================================================

const formatHeaderTime = (date) => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ============================================================
// PRIVATE — GENERATE PDF
// ============================================================

const generatePDF = (records) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const now = new Date();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(33, 37, 41);
  doc.text("Asset Maintenance System", pageWidth / 2, 22, { align: "center" });

  // Subtitle
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Assets Report", pageWidth / 2, 30, { align: "center" });

  // Horizontal rule
  doc.setDrawColor(200, 200, 210);
  doc.setLineWidth(0.5);
  doc.line(14, 36, pageWidth - 14, 36);

  // Metadata
  doc.setFontSize(9);
  doc.setTextColor(108, 117, 125);
  doc.text(`Generated: ${formatHeaderDate(now)} at ${formatHeaderTime(now)}`, 14, 44);
  doc.text(`Total Assets: ${records.length}`, 14, 50);

  // Table
  const headRows = [["Asset Name", "Asset ID", "Category", "Status"]];
  const bodyRows = records.map((r) => [
    r.assetName,
    r.assetId,
    r.category,
    r.status,
  ]);

  doc.autoTable({
    head: headRows,
    body: bodyRows,
    startY: 56,
    margin: { top: 56, right: 14, bottom: 18, left: 14 },
    pageBreak: "auto",
    tableWidth: "auto",
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "left",
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 40 },
      2: { cellWidth: 40 },
      3: { cellWidth: 30 },
    },
    theme: "grid",
    styles: {
      lineColor: [210, 210, 220],
      lineWidth: 0.3,
    },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 170);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Download
  const datePart = now.toISOString().slice(0, 10);
  doc.save(`asset-maintenance-${datePart}.pdf`);
};

// ============================================================
// PRIVATE — HANDLE EXPORT CLICK
// ============================================================

const handleExportClick = async () => {
  if (isExporting) return;

  const { exportBtn } = cacheDOMRefs();

  if (!hasVisibleData()) {
    showErrorToast("No assets available to export.");
    return;
  }

  isExporting = true;
  showButtonLoader(exportBtn);

  try {

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const records = getVisibleRecords();

    if (!window.jspdf || typeof window.jspdf.jsPDF !== "function") {
      throw new Error("PDF library is not loaded. Please check your internet connection.");
    }

    generatePDF(records);

  } catch (error) {

    showErrorToast(error.message || "Failed to export assets. Please try again.");

  } finally {

    isExporting = false;
    hideButtonLoader(exportBtn);

  }
};

// ============================================================
// PRIVATE — SETUP EVENT LISTENERS
// ============================================================

const setupEventListeners = () => {
  const { exportBtn } = cacheDOMRefs();

  if (exportBtn) {
    exportBtn.addEventListener("click", handleExportClick);
  }
};

// ============================================================
// INIT
// ============================================================

const initExportAsset = () => {
  if (initialized) return;
  initialized = true;

  cacheDOMRefs();

  if (!refs.exportBtn) return;

  setupEventListeners();
};

export { initExportAsset };
