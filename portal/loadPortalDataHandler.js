const axios = require("axios");
const { getErrorMessage } = require("../errorHandling/errorHandler.js");
const buildPortalAuthHeader = require('./authHandler.js');
const logger = require('../helper/logger');

async function getParametersFromPortal(portal,token) {  
  let parametersForForm = "";  

  try {
    const urlForValidateTokenAndGetParams= portal.apiHost+ (portal.getParametersEndpoint || process.env.PORTAL_VALIDATE_TOKEN_ENDPOINT);
    logger.debug(`urlForValidateTokenAndGetParams >> ${urlForValidateTokenAndGetParams}`);
    const response = await axios.post(`${urlForValidateTokenAndGetParams}`,
      {
        token
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...buildPortalAuthHeader(portal),
        }
      }
    );    
    return response.data;
    
    
  } catch (err) {
    logger.error(`Failed to contact target app  ${err}`); 

    throw err;
  }
  
}

async function getSavedFormFromPortal(portal,token) {  
  let parametersForForm = "";  

  try {
    const urlForValidateTokenAndGetJson= portal.apiHost+ (portal.getSavedJsonEndpoint || process.env.PORTAL_VALIDATE_TOKEN_ENDPOINT);
    logger.debug(`urlForValidateTokenAndGetJson >> ${urlForValidateTokenAndGetJson}`);

    const headers = {
      "Content-Type": "application/json",
      ...buildPortalAuthHeader(portal),
    };
    const response = await axios.post(urlForValidateTokenAndGetJson, { token}, { headers });

    //TODO: verify the json against schema  or some other sanity checks
    return response.data;
  
  } catch (err) {
    logger.error( `Failed to contact target app ${err}` ); 

    throw err;
  }
  
}

module.exports = {getParametersFromPortal , getSavedFormFromPortal };