// ============================================================
// EXPORT RECORD — UI CONTROLLER
// Responsibility: Read currently visible records from the
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
// PRIVATE — GET VISIBLE RECORDS
// Reads the currently rendered table rows from the DOM.
// Returns an array of { name, email, phone, status, date }.
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
      name: cells[1].textContent.trim(),
      email: cells[2].textContent.trim(),
      phone: cells[3].textContent.trim(),
      status: cells[4].textContent.trim(),
      date: cells[5].textContent.trim(),
    });
  });

  return records;
};

// ============================================================
// PRIVATE — CHECK IF TABLE HAS VISIBLE DATA
// Returns true when the table is shown and contains rows.
// ============================================================

const hasVisibleData = () => {
  const { table, empty } = cacheDOMRefs();

  // Table is hidden (empty state shown or loading)
  if (table && table.hidden) return false;

  // Empty state is visible
  if (empty && !empty.hidden) return false;

  const records = getVisibleRecords();
  return records.length > 0;
};

// ============================================================
// PRIVATE — FORMAT DATE FOR HEADER
// Returns a friendly date string like "July 10, 2026".
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
// Returns a friendly time string like "02:30 PM".
// ============================================================

const formatHeaderTime = (date) => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ============================================================
// PRIVATE — GENERATE PDF
// Builds a professional PDF with header info and auto-table.
// Triggers the file download.
// ============================================================

const generatePDF = (records) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const now = new Date();
  const pageWidth = doc.internal.pageSize.getWidth();

  // --------------------------------------------------
  // Header
  // --------------------------------------------------

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(33, 37, 41);
  doc.text("Student Management System", pageWidth / 2, 22, { align: "center" });

  // Subtitle
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Records Report", pageWidth / 2, 30, { align: "center" });

  // Horizontal rule
  doc.setDrawColor(200, 200, 210);
  doc.setLineWidth(0.5);
  doc.line(14, 36, pageWidth - 14, 36);

  // Metadata — left aligned below the rule
  doc.setFontSize(9);
  doc.setTextColor(108, 117, 125);
  doc.text(`Generated: ${formatHeaderDate(now)} at ${formatHeaderTime(now)}`, 14, 44);
  doc.text(`Total Records: ${records.length}`, 14, 50);

  // --------------------------------------------------
  // Table
  // --------------------------------------------------

  const headRows = [["Full Name", "Email", "Phone Number", "Status", "Created Date"]];
  const bodyRows = records.map((r) => [r.name, r.email, r.phone, r.status, r.date]);

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
      0: { cellWidth: 40 },
      1: { cellWidth: 46 },
      2: { cellWidth: 34 },
      3: { cellWidth: 28 },
      4: { cellWidth: 34 },
    },
    theme: "grid",
    styles: {
      lineColor: [210, 210, 220],
      lineWidth: 0.3,
    },
  });

  // --------------------------------------------------
  // Footer — page number on each page
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Download
  // --------------------------------------------------

  const datePart = now.toISOString().slice(0, 10);
  doc.save(`student-records-${datePart}.pdf`);
};

// ============================================================
// PRIVATE — HANDLE EXPORT CLICK
// Validation, button loader, PDF generation, error handling.
// ============================================================

const handleExportClick = async () => {
  if (isExporting) return;

  const { exportBtn } = cacheDOMRefs();

  if (!hasVisibleData()) {
    showErrorToast("No records available to export.");
    return;
  }

  isExporting = true;
  showButtonLoader(exportBtn);

  try {

    // Intentional 2-second delay so the button spinner is visible
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const records = getVisibleRecords();

    // Ensure jsPDF and autotable are loaded
    if (!window.jspdf || typeof window.jspdf.jsPDF !== "function") {
      throw new Error("PDF library is not loaded. Please check your internet connection.");
    }

    generatePDF(records);

  } catch (error) {

    showErrorToast(error.message || "Failed to export records. Please try again.");

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

const initExportRecord = () => {
  if (initialized) return;
  initialized = true;

  cacheDOMRefs();

  if (!refs.exportBtn) return;

  setupEventListeners();
};

export { initExportRecord };
