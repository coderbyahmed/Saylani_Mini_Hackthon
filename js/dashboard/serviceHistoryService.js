import {
    addServiceHistoryEntry,
    getServiceHistoryByIssue,
    getServiceHistoryByAsset,
    getAllServiceHistory,
} from "./serviceHistoryRepository.js";
import { updateIssue } from "./issueRepository.js";
import { fetchAssetById, updateAsset } from "./dashboardService.js";

const generateHistoryId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "SVC-";
    for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
};

const addMaintenanceUpdate = async ({
    issueId,
    assetId,
    assetName,
    action,
    remarks,
    performedBy,
    status,
}) => {
    const historyEntry = {
        historyId: generateHistoryId(),
        issueId,
        assetId,
        assetName,
        action,
        remarks: remarks || "",
        performedBy,
        status,
    };

    const result = await addServiceHistoryEntry(historyEntry);

    await updateIssue(issueId, { status });

    try {
        const asset = await fetchAssetById(assetId);
        if (asset) {
            const today = new Date().toISOString().split("T")[0];
            await updateAsset(assetId, {
                assetName: asset.assetName,
                assetId: asset.assetId,
                category: asset.category,
                location: asset.location,
                status: asset.status,
                lastMaintenance: today,
            });
        }
    } catch (error) {
        console.error("ServiceHistoryService: failed to update asset maintenance date —", error.message);
    }

    return result;
};

const fetchHistoryByIssue = async (issueId) => {
    return getServiceHistoryByIssue(issueId);
};

const fetchHistoryByAsset = async (assetId) => {
    return getServiceHistoryByAsset(assetId);
};

const fetchAllServiceHistory = async (max = 50) => {
    return getAllServiceHistory(max);
};

export {
    addMaintenanceUpdate,
    fetchHistoryByIssue,
    fetchHistoryByAsset,
    fetchAllServiceHistory,
};
