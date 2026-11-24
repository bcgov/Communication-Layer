const { keycloakForFormRepo } = require("./keycloak.js");
const axios = require("axios");
const logger = require('./helper/logger');

async function getFormFromFormTemplate(formId) {  
  try {
    const FORMREPO_GETFORMURL = process.env.FORMREPO_GETFORMURL;
    const grant =
      await keycloakForFormRepo.grantManager.obtainFromClientCredentials();
    
    // Validate formId
    if (!/^[a-zA-Z0-9_-]+$/.test(formId)) {
      throw new Error("Invalid formId format");
    }
    
    let endpointUrl = `${FORMREPO_GETFORMURL}/${formId}`;
    logger.debug(`request : ${endpointUrl}`);
    const formDefinition = await axios.get(endpointUrl, {
      headers: {
        Authorization: `Bearer ${grant.access_token.token}`,
      },
    });    
    return formDefinition.data;
  } catch (err) {
    logger.error(`API error: ${err.message}`);
    return null;
  }

}

module.exports = getFormFromFormTemplate;