const axios = require("axios");

async function getUsername(userToken) {
    if (!userToken) {
        console.warn("No user token provided. Using default.");
        return process.env.TRUSTED_USERNAME;
    }

    try {
        const userInfoResponse = await axios.get(process.env.USERNAME_SERVERURL,
            {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            }
        );

        if (userInfoResponse.data && userInfoResponse.data.idir_username) {
            return userInfoResponse.data.idir_username;
        } else {
            console.warn("Username not found.");
        }
    } catch (error) {
        console.error("Error fetching username from Keycloak:", error);
    }

    return process.env.TRUSTED_USERNAME;
}

module.exports.getUsername = getUsername;

