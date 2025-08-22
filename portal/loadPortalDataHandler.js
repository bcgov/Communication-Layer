const axios = require("axios");
const { getErrorMessage } = require("../errorHandling/errorHandler.js");
async function getParametersFromPortal(portal,token, userId) {  
  let parametersForForm = "";  

  try {
    const urlForValidateTokenAndGetParams= portal.apiHost+ (portal.getParametersEndpoint || process.env.PORTAL_VALIDATE_TOKEN_ENDPOINT);
    console.log("urlForValidateTokenAndGetParams >>",urlForValidateTokenAndGetParams);
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
    return response.data;
    
    
  } catch (err) {
    console.log( 'Failed to contact target app', err ); 

    throw err;
  }
  
}

async function expireTokenInPortal(portal,token, userId) {
  //call another api from portal to get the params

  let isTokenExpired = false;

  try {
    const urlForExpiringToken = portal.apiHost + (portal.expireTokenEndPoint || process.env.PORTAL_EXPIRE_TOKEN_ENDPOINT);;
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

async function getSavedFormFromPortal(portal,token, userId) {  
  let parametersForForm = "";  

  try {
    const urlForValidateTokenAndGetJson= portal.apiHost+ (portal.getSavedJsonEndpoint || process.env.PORTAL_VALIDATE_TOKEN_ENDPOINT);
    console.log("urlForValidateTokenAndGetJson >>",urlForValidateTokenAndGetJson);
    let response;
    if (portal.portalAuth === "basic" && ((portal.basicAuth && portal.basicAuth.username && portal.basicAuth.password) || portal.apiSecret)) {
      const auth = (portal.basicAuth && portal.basicAuth.username && portal.basicAuth.password)
        ? "Basic " + btoa(portal.basicAuth.username + ":" + portal.basicAuth.password)
        : "Basic " + btoa(portal.apiSecret);
        response = await axios.post(`${urlForValidateTokenAndGetJson}`,
          {
            token,
            userId
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': auth
            },
          }
        ); 
    } else {
      response = await axios.post(`${urlForValidateTokenAndGetJson}`,
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
    }
    //TODO: verify the json against schema  or some other sanity checks
    return response.data;
    
    
  } catch (err) {
    console.log( 'Failed to contact target app', err ); 

    throw err;
  }
  
}

module.exports = {getParametersFromPortal ,  expireTokenInPortal, getSavedFormFromPortal };