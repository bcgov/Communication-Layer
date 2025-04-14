const axios = require("axios");
const { keycloakForSiebel } = require("./keycloak.js");

async function isUsernameValid(username) {
    try {
        console.log("USERNAME", username)
        const siebelApiUrl = process.env.SIEBEL_ICM_API_EMPLOYEE_URL;
        const grant = await keycloakForSiebel.grantManager.obtainFromClientCredentials();
        const response = await axios.get(siebelApiUrl, {
            params: {
                excludeEmptyFieldsInResponse: "true",
                searchspec: `([Login Name] LIKE '${username}')`,
                PageSize: "1",
                ViewMode: "Catalog",
            },
            headers: {
                Authorization: `Bearer ${grant.access_token.token}`,
                "X-ICM-TrustedUsername": username,
            },
        });
        return response.data?.items?.["Login Name"] === username;

    } catch (error) {
        if (error.response) {
            console.error(`Siebel API Error (${error.response.status}): ${error.response.data?.ERROR || "Unknown error"}`);
            throw new Error(`${error.response.status}`);
        }
        console.error("Error connecting to Siebel API:", error);
        throw new Error("500 - Internal Server Error");
    }
}

async function getUsername(userToken) {
    if (!userToken) {
        console.warn("No user token provided.");
        return null;
    }

    try {

        const userInfoResponse = await axios.get(process.env.USERNAME_SERVERURL, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });
        if (userInfoResponse.data && userInfoResponse.data.idir_username) {
            const username = userInfoResponse.data.idir_username;

            try {
                const isValid = await isUsernameValid(username);
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
