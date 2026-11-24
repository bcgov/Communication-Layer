const axios = require("axios");
const { keycloakForSiebel } = require("./keycloak.js");
const logger = require('./helper/logger');

async function isUsernameValid(username,employeeURL) {
    try {
        logger.debug(`Username: ${username}`);
        logger.debug(`Username URL ${employeeURL}`);        
        if(!employeeURL){
            logger.error("No Employeee URL provided");
            return false;
        }
        
        const grant = await keycloakForSiebel.grantManager.obtainFromClientCredentials();
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
        return response.data?.items?.["Login Name"]?.toUpperCase() === username.toUpperCase();

    } catch (error) {
        if (error.response) {
            logger.error(`Siebel API Error (${error.response.status}): ${error.response.data?.ERROR || "Unknown error"}`);
            return false;
        }
        logger.error(`Error connecting to Siebel API: ${error}`);
        return false;
    }
}

async function getUsername(userToken, employeeURL) {
    if (!userToken) {
        logger.warn("No user token provided.");
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
            logger.warn("Username not found.");
        }
    } catch (error) {
        logger.error(`Error fetching username from Keycloak: ${error}`);
    }

    return null; // No username should be returned if not valid
}

module.exports.getUsername = getUsername;
module.exports.isUsernameValid = isUsernameValid;
