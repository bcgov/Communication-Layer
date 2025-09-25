const axios = require("axios");
const { getErrorMessage } = require("../errorHandling/errorHandler.js");
const buildPortalAuthHeader = require('./authHandler.js');

async function getParametersFromPortal(portal,token) {  
  let parametersForForm = "";  

  try {
    const urlForValidateTokenAndGetParams= portal.apiHost+ (portal.getParametersEndpoint || process.env.PORTAL_VALIDATE_TOKEN_ENDPOINT);
    console.log("urlForValidateTokenAndGetParams >>",urlForValidateTokenAndGetParams);
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
    console.log( 'Failed to contact target app', err ); 

    throw err;
  }
  
}

async function expireTokenInPortal(portal,token) {
  //call another api from portal to get the params

  let isTokenExpired = false;

  try {
    const urlForExpiringToken = portal.apiHost + (portal.expireTokenEndPoint || process.env.PORTAL_EXPIRE_TOKEN_ENDPOINT);;
    console.log("urlForExpiringToken",urlForExpiringToken);
    const response = await axios.post(`${urlForExpiringToken}`,      
      {
        token
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...buildPortalAuthHeader(portal),
        }
      });

    isTokenExpired = response.data;
  } catch (err) {
    console.log( 'Failed to contact target app', err.message );
    
    return true;
  }
  return isTokenExpired;
}

async function getSavedFormFromPortal(portal,token) {  
  let parametersForForm = "";  

  try {
    const urlForValidateTokenAndGetJson= portal.apiHost+ (portal.getSavedJsonEndpoint || process.env.PORTAL_VALIDATE_TOKEN_ENDPOINT);
    console.log("urlForValidateTokenAndGetJson >>",urlForValidateTokenAndGetJson);

    const headers = {
      "Content-Type": "application/json",
      ...buildPortalAuthHeader(portal),
    };
    const response = await axios.post(urlForValidateTokenAndGetJson, { token}, { headers });

    //TODO: verify the json against schema  or some other sanity checks
    return response.data;
  
  } catch (err) {
    console.log( 'Failed to contact target app', err ); 

    throw err;
  }
  
}

module.exports = {getParametersFromPortal ,  expireTokenInPortal, getSavedFormFromPortal };