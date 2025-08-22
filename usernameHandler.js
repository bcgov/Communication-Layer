const axios = require("axios");
const { keycloakForSiebel } = require("./keycloak.js");

async function isUsernameValid(username,employeeURL) {
    try {
        console.log("Username:", username);
        console.log("Username URL:",employeeURL);        
        if(!employeeURL){
            console.error("No Employeee URL provided");
            return false;
        }
        
        const grant = await keycloakForSiebel.grantManager.obtainFromClientCredentials();
        console.log("Grant:",grant);
        const response = await axios.get(employeeURL, {
            params: {
                excludeEmptyFieldsInResponse: "true",
                searchspec: `([Login Name] LIKE '${username}') AND ('Employment Status' = 'Active')`,
                PageSize: "1",
                ViewMode: "Catalog",
            },
            headers: {
                Authorization: `Bearer ${grant.access_token.token}`,
                "X-ICM-TrustedUsername": username,
            },
        });
        console.log("Response:",response);
        return response.data?.items?.["Login Name"]?.toUpperCase() === username.toUpperCase();

    } catch (error) {
        if (error.response) {
            console.error(`Siebel API Error (${error.response.status}): ${error.response.data?.ERROR || "Unknown error"}`);
            throw new Error(`${error.response.status}`);
        }
        console.error("Error connecting to Siebel API:", error);
        throw new Error("500 - Internal Server Error");
    }
}

async function getUsername(userToken, employeeURL) {
    if (!userToken) {
        console.warn("No user token provided.");
        return null;
    }

    try {
        const tokens = JSON.parse(Buffer.from(userToken.split('.')[1], 'base64').toString());
        
        if (tokens && tokens.idir_username) {

            const username = tokens.idir_username;

            try {
                const isValid = await isUsernameValid(username,employeeURL);
                return isValid ? username : null;
            } catch (error) {
                return error.message;
            }
        } else {
            console.warn("Username not found.");
        }
    } catch (error) {
        console.error("Error fetching username from Keycloak:", error);
    }

    return null; // No username should be returned if not valid
}

module.exports.getUsername = getUsername;
module.exports.isUsernameValid = isUsernameValid;
