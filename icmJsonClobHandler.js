const axios = require("axios");
const { keycloakForSiebel } = require("./keycloak.js");

function parseIcmJsonClob(item) {
    if (item.ICMJsonClob && typeof item.ICMJsonClob === 'string') {
        try {
            item.ICMJsonClobParsed = JSON.parse(item.ICMJsonClob);
            delete item.ICMJsonClob;
        } catch (error) {
            console.warn(`Failed to parse ICMJsonClob for item ${item.Id || 'unknown'}: ${error.message}`);
            item.ICMJsonClobParsed = null;
        }
    }
    return item;
}

function processIcmJsonClobData(jsonData) {

    // Create a copy to avoid mutating the original instance
    const processedData = JSON.parse(JSON.stringify(jsonData));

    if (processedData.items && Array.isArray(processedData.items)) {
        processedData.items = processedData.items.map(parseIcmJsonClob);
        return processedData;
    }

    return parseIcmJsonClob(processedData);
}

async function fetchIcmJsonClobData(attachmentId) {
    try {
        const grant = await keycloakForSiebel.grantManager.obtainFromClientCredentials();

        const username = process.env.TRUSTED_USERNAME;

        const headers = {
            Authorization: `Bearer ${grant.id_token.token}`,
            "X-ICM-TrustedUsername": username,
            "Content-Type": "application/json"
        };

        const url = `${process.env.SIEBEL_ICM_API_HOST}${process.env.ICM_JSON_CLOB_ENDPONT}`;

        const queryParams = {
            ViewMode: "Catalog",
            SearchSpec: `UserFieldCLOB=\"${attachmentId}\"`
        };

        return await axios.get(url, {
            headers,
            params: queryParams,
            timeout: 30000
        });

    } catch (error) {
        throw new Error(`Failed to fetch ICM data for SR ID ${attachmentId}: ${error.message}`);
    }
}

function extractICMJsonClobParsed(data) {
    if (data.items && Array.isArray(data.items)) {
        return data.items
            .map(item => item.ICMJsonClobParsed)
            .filter(parsed => parsed !== null && parsed !== undefined);
    }

    if (data.ICMJsonClobParsed !== null && data.ICMJsonClobParsed !== undefined) {
        return data.ICMJsonClobParsed;
    }

    return [];
}

async function getProcessedData(attachmentId, returnAnswersOnly = true) {
    try {
        const response = await fetchIcmJsonClobData(attachmentId);
        let processedResult = processIcmJsonClobData(response.data);

        if (returnAnswersOnly) {
            processedResult = extractICMJsonClobParsed(processedResult);
        }

        return {
            success: true,
            data: processedResult
        };
    } catch (error) {
        console.error("API call failed:", error.message);

        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    getProcessedData
};