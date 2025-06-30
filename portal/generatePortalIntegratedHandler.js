const { keycloakForFormRepo } = require("../keycloak.js");
const axios = require("axios");
const getFormFromFormTemplate = require("../formRepoHandler.js");
const { getErrorMessage } = require("../errorHandling/errorHandler.js");
const appConfig = require('./appConfig.js');

async function generatePortalIntegratedTemplate(req, res) {
  try {
    const params = req.body;
    const token = params["id"];
    console.log("token>>", token);
    if (!token ) {
      return res
        .status(400)
        .send({ error: 'No token found' });
    }  
    
    const portalId = params["portalId"];
    console.log("portalId",portalId);
    const targetApp = appConfig[portalId];
    
    if(!targetApp) {
        return res.status(400).send({ error: 'Unknown app ID' });
    }     
    const paramsFromPortal = await getParametersFromPortal(targetApp);    

    if(!paramsFromPortal) {
        return res.status(400).send({ error: 'Parameters not found to generate form' });
    } 

    const formJson = await constructFormJson(paramsFromPortal);

    if (formJson != null) {
      //expire token
      res.status(200).send({
        save_data: formJson
      });
    }
    else {
      res.status(400)
        .send({ error: getErrorMessage("FORM_NOT_FOUND", { templateId: template_id }) });
    }
  } catch (error) {
    console.error(`Error generating the form:`, error);
    return res
      .status(400)
      .send({ error: getErrorMessage("GENERATE_ERROR_MSG") });
  }
}

async function constructFormJson(params) {

  console.log("paramsFromPortal",params);

  const formId = params["formId"];

  const formDefinition = await getFormFromFormTemplate(formId);

  if (!formDefinition || formDefinition === null) {
    return null;
  }  

  const fullJSON = {
    data: {},
    form_definition: formDefinition || {}, // Providing default empty object if missing
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: "1.0.0", // Add any other metadata
    }
  };

  return fullJSON;
}

async function getParametersFromPortal(portal) {
  //call another api from portal to get the params

  let parametersForForm = "";

  try {
    const urlForValidateTokenAndGetParams= portal.baseUrl+ (portal.getParametersEndpoint || process.env.PORTAL_VALIDATE_TOKEN_ENDPOINT);
    console.log("urlForValidateTokenAndGetParams",urlForValidateTokenAndGetParams);
    const response = await axios.post(`${urlForValidateTokenAndGetParams}`, req.body, {
      headers: {
        'Authorization': `Bearer ${portal.apiKey}`,
      },
    });

    parametersForForm = response.data;
  } catch (err) {
    console.log( 'Failed to contact target app', err.message );
    parametersForForm = {
      formId:"CF0001"
    }
    return parametersForForm;
  }
  return parametersForForm;
}

async function expireTokenInPortal(portal) {
  //call another api from portal to get the params

  let isTokenExpired = false;

  try {
    const urlForExpiringToken = portal.baseUrl + (portal.expireTokenEndPoint || process.env.PORTAL_EXPIRE_TOKEN_ENDPOINT);;
    console.log("urlForExpiringToken",urlForExpiringToken);
    const response = await axios.post(`${urlForExpiringToken}`, req.body, {
      headers: {
        'Authorization': `Bearer ${portalApiKey}`,
      },
    });

    isTokenExpired = response.data;
  } catch (err) {
    console.log( 'Failed to contact target app', err.message );
    
    return true;
  }
  return isTokenExpired;
}

module.exports = generatePortalIntegratedTemplate;