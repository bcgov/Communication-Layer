const axios = require("axios");
const { keycloakForSiebel } = require("./keycloak.js");

function processICMJsonItem(item, index) {
    console.log(">>> ICMJsonClob (raw):\n\n", item.ICMJsonClob);
    console.log("--------------------------------------------------");

    const trimmedClob = item.ICMJsonClob.trim();
    if (!trimmedClob.startsWith('{') && !trimmedClob.startsWith('[')) {
        console.log(`Item ${index + 1}: ICMJsonClob is not a valid JSON`);
        return;
    }

    try {
        const parsedClob = JSON.parse(item.ICMJsonClob);
        console.log("ICMJsonClob (parsed):\n\n", JSON.stringify(parsedClob, null, 2));
    } catch (parseError) {
        console.log(`Item ${index + 1}: Failed to parse JSON: ${parseError.message}`);
    }
}

async function getData() {
    try {
        const grant = await keycloakForSiebel.grantManager.obtainFromClientCredentials();

        const headers = {
            Authorization: `Bearer ${grant.id_token.token}`,
            "X-ICM-TrustedUsername": "DMEIRELE",
            "Content-Type": "application/json"
        };

        const url = "https://sieblabm.apps.gov.bc.ca/ffdy/v1.0/data/ICMJSONClobBO/ICMJSONClobBC"

        const queryParams = {
            ViewMode: "Catalog",
            workspace: "dev_sadmin_bz_1",
            searchspec: `("SR Id" = "1-54SIG7F")`
        };

        const response = await axios.get(url, {
            headers,
            params: queryParams
        });

        console.log("Status:", response.status + " " + response.statusText);

        if (response.data && response.data.items && Array.isArray(response.data.items)) {
            response.data.items.forEach((item, index) => {
                processICMJsonItem(item, index);
            });
        } else {
            console.log("No items found in response");
        }

        return {
            success: true,
            totalItems: response.data?.items?.length || 0,
            statusCode: response.status,
            statusText: response.statusText
        };

    } catch (error) {
        console.error("API call failed:", error.message);
        return {
            success: false,
            error: error.message,
            totalItems: 0,
            errors: [error.message]
        };
    }
}

module.exports = {
    getData
};