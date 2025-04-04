const { keycloakForFormRepo } = require("./keycloak.js");
const axios = require("axios");

async function getFormFromFormTemplate(formId) {
  const FORMREPO_GETFORMURL = process.env.FORMREPO_GETFORMURL;
  try {
    const grant =
      await keycloakForFormRepo.grantManager.obtainFromClientCredentials();
    let endpointUrl = `${FORMREPO_GETFORMURL}/${formId}`;
    console.error("request: " + endpointUrl);
    const formDefinition = await axios.get(endpointUrl, {
      headers: {
        Authorization: `Bearer ${grant.access_token.token}`,
      },
    });

    return formDefinition.data;
  } catch (err) {
    console.error("API error: " + err.message);
    return null;
  }

}

module.exports = getFormFromFormTemplate;