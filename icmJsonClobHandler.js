const axios = require("axios");
const { keycloakForSiebel } = require("./keycloak.js");

function processIcmJsonClobData(jsonData) {
    // Create a copy to avoid mutating the original instance
    const processedData = JSON.parse(JSON.stringify(jsonData));

    if (processedData.items && Array.isArray(processedData.items)) {
        processedData.items = processedData.items.map(item => {
            if (item.ICMJsonClob && typeof item.ICMJsonClob === 'string') {
                try {
                    item.ICMJsonClobParsed = JSON.parse(item.ICMJsonClob);
                    delete item.ICMJsonClob;
                } catch (error) {
                    console.warn(`Failed to parse ICMJsonClob for item ${item.Id}: ${error.message}`);
                    item.ICMJsonClobParsed = null;
                }
            }

            return item;
        });
    }
    else {
        if (processedData.ICMJsonClob && typeof processedData.ICMJsonClob === 'string') {
            try {
                processedData.ICMJsonClobParsed = JSON.parse(processedData.ICMJsonClob);
                delete processedData.ICMJsonClob;
            } catch (error) {
                console.warn(`Failed to parse ICMJsonClob for item ${processedData.Id}: ${error.message}`);
                processedData.ICMJsonClobParsed = null;
            }
        }

        return processedData;
    }

    return processedData;
}

async function fetchIcmJsonClobData(attachmentId) {
    try {
        const grant = await keycloakForSiebel.grantManager.obtainFromClientCredentials();

        const username = process.env.SIEBEL_ICM_TRUSTED_USERNAME;

        const headers = {
            Authorization: `Bearer ${grant.id_token.token}`,
            "X-ICM-TrustedUsername": username,
            "Content-Type": "application/json"
        };

        const url = process.env.SIEBEL_ICM_BASE_URL;

        const queryParams = {
            ViewMode: "Catalog",
            searchspec: attachmentId // "UserFieldCLOB"="1-123ABC"
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

async function getProcessedData(attachmentId) {
    try {
        const response = await fetchIcmJsonClobData(attachmentId);
        const processedResult = processIcmJsonClobData(response.data);

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