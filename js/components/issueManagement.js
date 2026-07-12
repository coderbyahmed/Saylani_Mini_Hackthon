import {
    showErrorToast,
    showSuccessToast,
} from "../ui/toast.js";
import { showButtonLoader, hideButtonLoader } from "../ui/loader.js";
import {
    fetchIssues,
    createIssue,
    updateIssueStatus,
    updateIssuePriority,
    assignIssue,
    removeIssue,
} from "../dashboard/issueService.js";
import {
    addMaintenanceUpdate,
    fetchHistoryByIssue,
} from "../dashboard/serviceHistoryService.js";
import { fetchAssets } from "../dashboard/dashboardService.js";

const PAGE_SIZE = 8;
let issues = [];
let filteredIssues = [];
let currentPage = 1;
let selectedIssueId = null;
let modalMode = "view";
let initialized = false;
let assetsList = [];
let currentIssueObjectUrl = null;

const getElement = (id) => document.getElementById(id);

const formatDate = (value) => {
    if (!value) return "—";
    if (typeof value.toDate === "function") {
        return value.toDate().toLocaleString();
    }
    if (value instanceof Date) {
        return value.toLocaleString();
    }
    return value;
};

const getStatusBadgeClass = (status = "") => {
    switch (status.toLowerCase()) {
        case "in progress":
        case "in_progress":
            return "status-badge status-pending";
        case "resolved":
            return "status-badge status-active";
        case "closed":
            return "status-badge status-archived";
        case "open":
        default:
            return "status-badge status-inactive";
    }
};

const getPriorityBadgeClass = (priority = "") => {
    switch (priority.toLowerCase()) {
        case "low":
            return "priority-badge priority-low";
        case "medium":
            return "priority-badge priority-medium";
        case "high":
            return "priority-badge priority-high";
        case "critical":
            return "priority-badge priority-critical";
        default:
            return "priority-badge priority-medium";
    }
};

const updateSummaryCards = () => {
    const total = issues.length;
    const open = issues.filter((issue) => (issue.status || "").toLowerCase() === "open").length;
    const inProgress = issues.filter((issue) => (issue.status || "").toLowerCase() === "in progress" || (issue.status || "").toLowerCase() === "in_progress").length;
    const resolved = issues.filter((issue) => (issue.status || "").toLowerCase() === "resolved").length;

    const totalEl = getElement("issueTotalCount");
    const openEl = getElement("issueOpenCount");
    const inProgressEl = getElement("issueInProgressCount");
    const resolvedEl = getElement("issueResolvedCount");

    if (totalEl) totalEl.textContent = total;
    if (openEl) openEl.textContent = open;
    if (inProgressEl) inProgressEl.textContent = inProgress;
    if (resolvedEl) resolvedEl.textContent = resolved;
};

const applyFilters = () => {
    const search = (getElement("issueSearch")?.value || "").trim().toLowerCase();
    const status = (getElement("issueStatusFilter")?.value || "").toLowerCase();
    const priority = (getElement("issuePriorityFilter")?.value || "").toLowerCase();
    const sort = getElement("issueSort")?.value || "newest";

    filteredIssues = issues.filter((issue) => {
        const haystack = `${issue.issueId || ""} ${issue.assetName || ""} ${issue.reporterName || ""} ${issue.issueTitle || ""}`.toLowerCase();
        const matchesSearch = !search || haystack.includes(search);
        const matchesStatus = !status || (issue.status || "").toLowerCase() === status;
        const matchesPriority = !priority || (issue.priority || "").toLowerCase() === priority;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    filteredIssues.sort((a, b) => {
        if (sort === "oldest") {
            return (a.createdAt?.toDate?.() || new Date()) - (b.createdAt?.toDate?.() || new Date());
        }
        return (b.createdAt?.toDate?.() || new Date()) - (a.createdAt?.toDate?.() || new Date());
    });

    currentPage = 1;
    renderTable();
};

const renderPagination = () => {
    const nav = getElement("issuePagination");
    const list = getElement("issuePageList");
    const totalPages = Math.max(1, Math.ceil(filteredIssues.length / PAGE_SIZE));

    if (!nav || !list) return;

    nav.hidden = filteredIssues.length <= PAGE_SIZE;
    list.innerHTML = "";

    for (let page = 1; page <= totalPages; page += 1) {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = page;
        button.className = page === currentPage ? "active" : "";
        button.addEventListener("click", () => {
            currentPage = page;
            renderTable();
        });
        item.appendChild(button);
        list.appendChild(item);
    }

    const prev = getElement("issuePrev");
    const next = getElement("issueNext");
    if (prev) {
        prev.disabled = currentPage === 1;
        prev.setAttribute("aria-disabled", currentPage === 1 ? "true" : "false");
    }
    if (next) {
        next.disabled = currentPage >= totalPages;
        next.setAttribute("aria-disabled", currentPage >= totalPages ? "true" : "false");
    }
};

const renderTable = () => {
    const loader = getElement("issueLoader");
    const table = getElement("issueTable");
    const empty = getElement("issueEmpty");
    const body = getElement("issueBody");

    if (!body) return;

    if (!filteredIssues.length) {
        if (table) table.hidden = true;
        if (empty) empty.hidden = false;
        if (loader) loader.hidden = true;
        if (body) body.innerHTML = "";
        renderPagination();
        return;
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const items = filteredIssues.slice(start, start + PAGE_SIZE);

    if (table) table.hidden = false;
    if (empty) empty.hidden = true;
    if (loader) loader.hidden = true;

    body.innerHTML = items.map((issue) => `
    <tr>
      <td><span class="td-asset-id">${issue.issueId || "—"}</span></td>
      <td>${issue.assetName || "—"}</td>
      <td>${issue.reporterName || "—"}</td>
      <td>${issue.issueTitle || "—"}</td>
      <td><span class="${getPriorityBadgeClass(issue.priority)}">${issue.priority || "Medium"}</span></td>
      <td><span class="${getStatusBadgeClass(issue.status)}">${issue.status || "Open"}</span></td>
      <td>${formatDate(issue.createdAt)}</td>
      <td>
        <div class="action-buttons">
          <button type="button" class="view-btn issue-view-btn" data-issue-id="${issue.id}">View</button>
          <button type="button" class="edit-btn issue-assign-btn" data-issue-id="${issue.id}">Assign</button>
          <button type="button" class="edit-btn issue-status-btn" data-issue-id="${issue.id}">Status</button>
          <button type="button" class="delete-btn issue-delete-btn" data-issue-id="${issue.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");

    renderPagination();
};

const populateModalView = async (issue) => {
    const title = getElement("issue-modal-title");
    const viewContent = getElement("issueModalBody");
    const form = getElement("issueForm");
    const saveButton = getElement("issueSaveBtn");
    const maintenanceBtn = getElement("addMaintenanceBtn");
    const historySection = getElement("serviceHistorySection");
    const historyTimeline = getElement("serviceHistoryTimeline");

    if (title) title.textContent = `Issue ${issue.issueId || "Details"}`;
    if (viewContent) {
        const imageHtml = issue.issueImage
            ? `<div class="issue-view-image-wrapper"><img class="issue-view-image" src="${issue.issueImage}" alt="Issue upload" /></div>`
            : "";

        const priorityClass = getPriorityBadgeClass(issue.priority);
        const statusClass = getStatusBadgeClass(issue.status);

        viewContent.innerHTML = `
      <div class="issue-view-body">
        ${imageHtml}
        <div class="issue-view-fields">
          <div class="issue-view-row">
            <span class="issue-view-label">Asset Name</span>
            <span class="issue-view-value">${issue.assetName || "—"}</span>
          </div>
          <div class="issue-view-row">
            <span class="issue-view-label">Issue Title</span>
            <span class="issue-view-value">${issue.issueTitle || "—"}</span>
          </div>
          <div class="issue-view-row">
            <span class="issue-view-label">Issue Description</span>
            <span class="issue-view-value">${issue.issueDescription || "—"}</span>
          </div>
          <div class="issue-view-row">
            <span class="issue-view-label">Reporter</span>
            <span class="issue-view-value">${issue.reporterName || "—"}</span>
          </div>
          <div class="issue-view-row">
            <span class="issue-view-label">Reporter Email</span>
            <span class="issue-view-value">${issue.reporterEmail || "—"}</span>
          </div>
          <div class="issue-view-row">
            <span class="issue-view-label">Priority</span>
            <span class="issue-view-value"><span class="${priorityClass}">${issue.priority || "Medium"}</span></span>
          </div>
          <div class="issue-view-row">
            <span class="issue-view-label">Status</span>
            <span class="issue-view-value"><span class="${statusClass}">${issue.status || "Open"}</span></span>
          </div>
          <div class="issue-view-row">
            <span class="issue-view-label">Assigned To</span>
            <span class="issue-view-value">${issue.assignedTo || "Unassigned"}</span>
          </div>
          <div class="issue-view-row">
            <span class="issue-view-label">Created</span>
            <span class="issue-view-value">${formatDate(issue.createdAt)}</span>
          </div>
        </div>
      </div>
    `;
    }
    if (form) form.hidden = true;
    if (saveButton) saveButton.hidden = true;
    if (maintenanceBtn) maintenanceBtn.hidden = false;

    if (historySection) historySection.hidden = false;
    if (historyTimeline) {
        try {
            const history = await fetchHistoryByIssue(issue.issueId);
            if (history && history.length > 0) {
                historyTimeline.innerHTML = history.map((entry) => `
                    <div class="service-history-entry">
                        <div class="service-history-entry__header">
                            <span class="service-history-entry__action">${entry.action || "—"}</span>
                            <span class="service-history-entry__date">${formatDate(entry.createdAt)}</span>
                        </div>
                        <div class="service-history-entry__details">
                            <span><strong>Status:</strong> ${entry.status || "—"}</span>
                            <span><strong>Technician:</strong> ${entry.performedBy || "—"}</span>
                        </div>
                        ${entry.remarks ? `<div class="service-history-entry__remarks">${entry.remarks}</div>` : ""}
                    </div>
                `).join("");
            } else {
                historyTimeline.innerHTML = `<div class="service-history-empty">No maintenance history yet.</div>`;
            }
        } catch (error) {
            historyTimeline.innerHTML = `<div class="service-history-empty">Could not load history.</div>`;
        }
    }
};

const populateModalManage = (issue) => {
    const title = getElement("issue-modal-title");
    const viewContent = getElement("issueModalBody");
    const form = getElement("issueForm");
    const saveButton = getElement("issueSaveBtn");
    const assignInput = getElement("issueAssignTo");
    const statusSelect = getElement("issueStatusSelect");
    const prioritySelect = getElement("issuePrioritySelect");
    const maintenanceBtn = getElement("addMaintenanceBtn");
    const historySection = getElement("serviceHistorySection");

    if (title) title.textContent = modalMode === "assign" ? "Assign Issue" : "Update Issue";
    if (viewContent) viewContent.innerHTML = "";
    if (form) form.hidden = false;
    if (saveButton) saveButton.hidden = false;
    if (maintenanceBtn) maintenanceBtn.hidden = true;
    if (historySection) historySection.hidden = true;

    if (assignInput) assignInput.value = issue.assignedTo || "";
    if (statusSelect) statusSelect.value = issue.status || "Open";
    if (prioritySelect) prioritySelect.value = issue.priority || "Medium";
};

const openModal = (issue, mode) => {
    selectedIssueId = issue.id;
    modalMode = mode;
    const modal = getElement("issueModal");
    if (modal) modal.hidden = false;
    document.body.style.overflow = "hidden";

    if (mode === "view") {
        populateModalView(issue);
    } else {
        populateModalManage(issue);
    }
};

const closeModal = () => {
    const modal = getElement("issueModal");
    const deleteModal = getElement("deleteIssueModal");
    const maintenanceModal = getElement("maintenanceModal");
    const addIssueModal = getElement("addIssueModal");
    if (modal) modal.hidden = true;
    if (deleteModal) deleteModal.hidden = true;
    if (maintenanceModal) maintenanceModal.hidden = true;
    if (addIssueModal) addIssueModal.hidden = true;
    document.body.style.overflow = "";
    selectedIssueId = null;
};

const openDeleteModal = (issueId) => {
    selectedIssueId = issueId;
    const modal = getElement("deleteIssueModal");
    if (modal) modal.hidden = false;
    document.body.style.overflow = "hidden";
};

const saveIssueUpdate = async () => {
    if (!selectedIssueId) return;

    const assignInput = getElement("issueAssignTo");
    const statusSelect = getElement("issueStatusSelect");
    const prioritySelect = getElement("issuePrioritySelect");
    const saveButton = getElement("issueSaveBtn");

    if (saveButton) showButtonLoader(saveButton);

    try {
        const updates = {};
        if (modalMode === "assign") {
            updates.assignedTo = assignInput?.value?.trim() || "";
        } else {
            updates.assignedTo = assignInput?.value?.trim() || "";
            updates.status = statusSelect?.value || "Open";
            updates.priority = prioritySelect?.value || "Medium";
        }

        await (modalMode === "assign"
            ? assignIssue(selectedIssueId, updates.assignedTo)
            : Promise.all([
                updateIssueStatus(selectedIssueId, updates.status),
                updateIssuePriority(selectedIssueId, updates.priority),
                assignIssue(selectedIssueId, updates.assignedTo),
            ]));

        showSuccessToast("Issue updated successfully.");
        await loadIssues();
        closeModal();
    } catch (error) {
        showErrorToast(error.message || "Could not update issue.");
    } finally {
        if (saveButton) hideButtonLoader(saveButton);
    }
};

const deleteSelectedIssue = async () => {
    if (!selectedIssueId) return;
    const deleteBtn = getElement("confirmDeleteIssueBtn");
    if (deleteBtn) showButtonLoader(deleteBtn);

    try {
        await removeIssue(selectedIssueId);
        showSuccessToast("Issue deleted successfully.");
        await loadIssues();
        closeModal();
    } catch (error) {
        showErrorToast(error.message || "Could not delete issue.");
    } finally {
        if (deleteBtn) hideButtonLoader(deleteBtn);
    }
};

const openMaintenanceModal = () => {
    const modal = getElement("maintenanceModal");
    if (modal) modal.hidden = false;
    document.body.style.overflow = "hidden";
};

const saveMaintenanceUpdate = async (event) => {
    event.preventDefault();
    if (!selectedIssueId) return;

    const actionInput = getElement("maintenanceAction");
    const technicianInput = getElement("maintenanceTechnician");
    const statusSelect = getElement("maintenanceStatus");
    const remarksInput = getElement("maintenanceRemarks");
    const saveButton = getElement("maintenanceSaveBtn");

    if (saveButton) showButtonLoader(saveButton);

    try {
        const issue = issues.find((item) => item.id === selectedIssueId);

        await addMaintenanceUpdate({
            issueId: selectedIssueId,
            assetId: issue?.assetId || "",
            assetName: issue?.assetName || "",
            action: actionInput?.value?.trim() || "",
            remarks: remarksInput?.value?.trim() || "",
            performedBy: technicianInput?.value?.trim() || "",
            status: statusSelect?.value || "In Progress",
        });

        showSuccessToast("Maintenance update added successfully.");

        document.dispatchEvent(new CustomEvent("maintenance-updated", {
            detail: {
                action: actionInput?.value?.trim() || "",
                assetName: issue?.assetName || "",
                status: statusSelect?.value || "In Progress",
            },
        }));

        await loadIssues();

        if (actionInput) actionInput.value = "";
        if (technicianInput) technicianInput.value = "";
        if (remarksInput) remarksInput.value = "";

        closeModal();

        const refreshedIssue = issues.find((item) => item.id === selectedIssueId);
        if (refreshedIssue) {
            openModal(refreshedIssue, "view");
        }
    } catch (error) {
        showErrorToast(error.message || "Could not add maintenance update.");
    } finally {
        if (saveButton) hideButtonLoader(saveButton);
    }
};

const handleIssueImageChange = () => {
    const imageInput = getElement("addIssueImage");
    const imagePreview = getElement("addIssueImagePreview");
    const file = imageInput?.files?.[0];

    if (!imagePreview) return;

    if (currentIssueObjectUrl) {
        URL.revokeObjectURL(currentIssueObjectUrl);
        currentIssueObjectUrl = null;
    }

    if (!file) {
        imagePreview.classList.remove("visible");
        imagePreview.removeAttribute("src");
        return;
    }

    if (!file.type.startsWith("image/")) {
        imageInput.value = "";
        showErrorToast("Please select a valid image file.");
        return;
    }

    currentIssueObjectUrl = URL.createObjectURL(file);
    imagePreview.src = currentIssueObjectUrl;
    imagePreview.classList.add("visible");
};

const resetIssueImage = () => {
    const imagePreview = getElement("addIssueImagePreview");
    if (imagePreview) {
        imagePreview.classList.remove("visible");
        imagePreview.removeAttribute("src");
    }
    if (currentIssueObjectUrl) {
        URL.revokeObjectURL(currentIssueObjectUrl);
        currentIssueObjectUrl = null;
    }
};

const openAddIssueModal = async () => {
    const modal = getElement("addIssueModal");
    if (modal) {
        modal.hidden = false;
        document.body.style.overflow = "hidden";

        // Populate asset dropdown
        const assetSelect = getElement("addIssueAsset");
        if (assetSelect) {
            assetSelect.innerHTML = '<option value="">Select an asset</option>';

            if (assetsList.length === 0) {
                try {
                    assetsList = await fetchAssets();
                } catch (error) {
                    showErrorToast("Failed to load assets.");
                }
            }

            assetsList.forEach(asset => {
                const option = document.createElement("option");
                option.value = asset.assetId || asset.id;
                option.textContent = `${asset.assetName} (${asset.assetId || asset.id})`;
                assetSelect.appendChild(option);
            });
        }

        // Reset form
        const form = getElement("addIssueForm");
        if (form) form.reset();
        resetIssueImage();
    }
};

const closeAddIssueModal = () => {
    const modal = getElement("addIssueModal");
    if (modal) modal.hidden = true;
    document.body.style.overflow = "";
    resetIssueImage();
};

const saveNewIssue = async (event) => {
    event.preventDefault();

    const assetSelect = getElement("addIssueAsset");
    const titleInput = getElement("addIssueTitle");
    const descriptionInput = getElement("addIssueDescription");
    const prioritySelect = getElement("addIssuePriority");
    const statusSelect = getElement("addIssueStatus");
    const imageInput = getElement("addIssueImage");
    const saveButton = getElement("addIssueSaveBtn");

    // Validate required fields
    const selectedAssetId = assetSelect?.value;
    const issueTitle = titleInput?.value?.trim();
    const issueDescription = descriptionInput?.value?.trim();

    if (!selectedAssetId) {
        showErrorToast("Please select an asset.");
        return;
    }

    if (!issueTitle) {
        showErrorToast("Please enter an issue title.");
        return;
    }

    if (!issueDescription) {
        showErrorToast("Please enter an issue description.");
        return;
    }

    // Find selected asset details
    const selectedAsset = assetsList.find(a => a.assetId === selectedAssetId || a.id === selectedAssetId);

    if (saveButton) showButtonLoader(saveButton);

    try {
        await createIssue({
            assetId: selectedAssetId,
            assetName: selectedAsset?.assetName || "",
            issueTitle,
            issueDescription,
            priority: prioritySelect?.value || "Medium",
            status: statusSelect?.value || "Open",
            issueImageFile: imageInput?.files?.[0] || null,
        });

        showSuccessToast("Issue created successfully.");
        closeAddIssueModal();
        await loadIssues();
    } catch (error) {
        showErrorToast(error.message || "Could not create issue.");
    } finally {
        if (saveButton) hideButtonLoader(saveButton);
    }
};

const bindEvents = () => {
    getElement("issueSearch")?.addEventListener("input", applyFilters);
    getElement("issueStatusFilter")?.addEventListener("change", applyFilters);
    getElement("issuePriorityFilter")?.addEventListener("change", applyFilters);
    getElement("issueSort")?.addEventListener("change", applyFilters);
    getElement("issueRefreshBtn")?.addEventListener("click", loadIssues);
    getElement("issuePrev")?.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage -= 1;
            renderTable();
        }
    });
    getElement("issueNext")?.addEventListener("click", () => {
        const totalPages = Math.max(1, Math.ceil(filteredIssues.length / PAGE_SIZE));
        if (currentPage < totalPages) {
            currentPage += 1;
            renderTable();
        }
    });

    getElement("issueBody")?.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;

        const issueId = button.dataset.issueId;
        const issue = issues.find((item) => item.id === issueId);
        if (!issue) return;

        if (button.classList.contains("issue-view-btn")) {
            openModal(issue, "view");
        } else if (button.classList.contains("issue-assign-btn")) {
            openModal(issue, "assign");
        } else if (button.classList.contains("issue-status-btn")) {
            openModal(issue, "manage");
        } else if (button.classList.contains("issue-delete-btn")) {
            openDeleteModal(issueId);
        }
    });

    getElement("issueModalClose")?.addEventListener("click", closeModal);
    getElement("issueCancelBtn")?.addEventListener("click", closeModal);
    getElement("issueSaveBtn")?.addEventListener("click", saveIssueUpdate);
    getElement("deleteIssueModalClose")?.addEventListener("click", closeModal);
    getElement("cancelDeleteIssueBtn")?.addEventListener("click", closeModal);
    getElement("confirmDeleteIssueBtn")?.addEventListener("click", deleteSelectedIssue);

    const modal = getElement("issueModal");
    if (modal) {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) closeModal();
        });
    }

    const deleteModal = getElement("deleteIssueModal");
    if (deleteModal) {
        deleteModal.addEventListener("click", (event) => {
            if (event.target === deleteModal) closeModal();
        });
    }

    getElement("addMaintenanceBtn")?.addEventListener("click", openMaintenanceModal);
    getElement("maintenanceModalClose")?.addEventListener("click", closeModal);
    getElement("maintenanceCancelBtn")?.addEventListener("click", closeModal);
    getElement("maintenanceForm")?.addEventListener("submit", saveMaintenanceUpdate);

    const maintenanceModal = getElement("maintenanceModal");
    if (maintenanceModal) {
        maintenanceModal.addEventListener("click", (event) => {
            if (event.target === maintenanceModal) closeModal();
        });
    }

    getElement("addIssueBtn")?.addEventListener("click", openAddIssueModal);
    getElement("addIssueModalClose")?.addEventListener("click", closeAddIssueModal);
    getElement("addIssueCancelBtn")?.addEventListener("click", closeAddIssueModal);
    getElement("addIssueForm")?.addEventListener("submit", saveNewIssue);

    const addIssueAvatar = getElement("addIssueAvatar");
    const addIssueImageInput = getElement("addIssueImage");
    if (addIssueAvatar && addIssueImageInput) {
        addIssueAvatar.addEventListener("click", () => addIssueImageInput.click());
        addIssueImageInput.addEventListener("change", handleIssueImageChange);
    }

    const addIssueModal = getElement("addIssueModal");
    if (addIssueModal) {
        addIssueModal.addEventListener("click", (event) => {
            if (event.target === addIssueModal) closeAddIssueModal();
        });
    }
};

const initIssueManagement = async () => {
    if (initialized) return;
    initialized = true;

    if (!getElement("issueTotalCount") && !getElement("issueTable")) return;

    bindEvents();
    await loadIssues();
};

const loadIssues = async () => {
    const loader = getElement("issueLoader");
    const table = getElement("issueTable");
    const empty = getElement("issueEmpty");
    if (loader) loader.hidden = false;
    if (table) table.hidden = true;
    if (empty) empty.hidden = true;

    try {
        issues = await fetchIssues();
        updateSummaryCards();
        applyFilters();
    } catch (error) {
        showErrorToast(error.message || "Failed to load issues.");
    } finally {
        if (loader) loader.hidden = true;
    }
};

window.addEventListener("DOMContentLoaded", initIssueManagement);

export { initIssueManagement };
