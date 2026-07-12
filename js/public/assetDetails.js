import { fetchAssetById } from "../dashboard/dashboardService.js";
import { showErrorToast, showInfoToast } from "../ui/toast.js";

const ASSET_CARD_ID = "assetCard";
const ASSET_NOT_FOUND_ID = "assetNotFound";
const REPORT_SECTION_ID = "reportIssueSection";
const ASSET_IMAGE_CONTAINER = "assetImageContainer";
const ASSET_NAME = "assetName";
const ASSET_ID = "assetId";
const ASSET_CATEGORY = "assetCategory";
const ASSET_LOCATION = "assetLocation";
const ASSET_STATUS = "assetStatus";
const ASSET_MAINTENANCE = "assetMaintenance";

const getElement = (id) => document.getElementById(id);

const showElement = (element) => {
    if (element) element.hidden = false;
};

const hideElement = (element) => {
    if (element) element.hidden = true;
};

const formatLastMaintenance = (value) => {
    if (!value) return "Not available";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const setAssetImage = (url, assetName) => {
    const container = getElement(ASSET_IMAGE_CONTAINER);
    if (!container) return;

    container.innerHTML = "";

    if (url) {
        const image = document.createElement("img");
        image.src = url;
        image.alt = assetName || "Asset image";
        container.appendChild(image);
        return;
    }

    const placeholder = document.createElement("div");
    placeholder.className = "asset-image-placeholder";
    placeholder.innerHTML = `
        <span aria-hidden="true">📦</span>
        <p>No image available</p>
    `;
    container.appendChild(placeholder);
};

let currentAsset = null;

const renderAssetDetails = (asset) => {
    if (!asset) return;

    currentAsset = asset;

    const assetCard = getElement(ASSET_CARD_ID);
    const reportSection = getElement(REPORT_SECTION_ID);
    hideElement(getElement(ASSET_NOT_FOUND_ID));
    showElement(assetCard);
    showElement(reportSection);

    setAssetImage(asset.assetImageUrl, asset.assetName);

    const nameEl = getElement(ASSET_NAME);
    const idEl = getElement(ASSET_ID);
    const catEl = getElement(ASSET_CATEGORY);
    const locEl = getElement(ASSET_LOCATION);
    const statusEl = getElement(ASSET_STATUS);
    const maintEl = getElement(ASSET_MAINTENANCE);

    if (nameEl) nameEl.textContent = asset.assetName || "\u2014";
    if (idEl) idEl.textContent = asset.assetId || "\u2014";
    if (catEl) catEl.textContent = asset.category || "\u2014";
    if (locEl) locEl.textContent = asset.location || "\u2014";
    if (statusEl) {
        statusEl.textContent = asset.status || "Unknown";
        statusEl.className = `status-badge ${asset.status ? "status-" + asset.status.toLowerCase() : "status-pending"}`;
    }
    if (maintEl) maintEl.textContent = formatLastMaintenance(asset.lastMaintenance);
};

const showAssetNotFound = () => {
    currentAsset = null;
    hideElement(getElement(ASSET_CARD_ID));
    hideElement(getElement(REPORT_SECTION_ID));
    showElement(getElement(ASSET_NOT_FOUND_ID));
};

const getQueryParameter = (name) => {
    return new URLSearchParams(window.location.search).get(name) || "";
};

const validateAssetId = (assetId) => {
    return assetId && assetId.trim().length > 0;
};

const initPublicAssetPage = async () => {
    const assetId = getQueryParameter("id");

    if (!validateAssetId(assetId)) {
        showAssetNotFound();
        showErrorToast("No asset ID provided in the URL.");
        return;
    }

    try {
        const asset = await fetchAssetById(assetId);
        if (!asset) {
            showAssetNotFound();
            return;
        }

        renderAssetDetails(asset);
    } catch (error) {
        showAssetNotFound();
        showErrorToast(error.message || "Unable to load asset information.");
    }
};

const getCurrentAsset = () => currentAsset;

window.addEventListener("DOMContentLoaded", initPublicAssetPage);

export { initPublicAssetPage, getCurrentAsset };
