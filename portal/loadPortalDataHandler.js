const axios = require("axios");
const { getErrorMessage } = require("../errorHandling/errorHandler.js");
async function getParametersFromPortal(portal,token, userId) {
  //call another api from portal to get the params
    //TODO - add header for validation
  let parametersForForm = "";  

  try {
    const urlForValidateTokenAndGetParams= portal.baseUrl+ (portal.getParametersEndpoint || process.env.PORTAL_VALIDATE_TOKEN_ENDPOINT);
    console.log("urlForValidateTokenAndGetParams",urlForValidateTokenAndGetParams);
    const response = await axios.post(`${urlForValidateTokenAndGetParams}`,
      {
        token,
        userId
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    parametersForForm = response.data;
  } catch (err) {
    console.log( 'Failed to contact target app', err );    
    return parametersForForm;
  }
  return parametersForForm;
}

async function expireTokenInPortal(portal,token, userId) {
  //call another api from portal to get the params

  let isTokenExpired = false;

  try {
    const urlForExpiringToken = portal.baseUrl + (portal.expireTokenEndPoint || process.env.PORTAL_EXPIRE_TOKEN_ENDPOINT);;
    console.log("urlForExpiringToken",urlForExpiringToken);
    const response = await axios.post(`${urlForExpiringToken}`,      
      {
        token,
        userId
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

    isTokenExpired = response.data;
  } catch (err) {
    console.log( 'Failed to contact target app', err.message );
    
    return true;
  }
  return isTokenExpired;
}

module.exports = {getParametersFromPortal ,  expireTokenInPortal};