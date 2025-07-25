const { keycloakForFormRepo } = require("../keycloak.js");
const axios = require("axios");
const getFormFromFormTemplate = require("../formRepoHandler.js");
const { getErrorMessage } = require("../errorHandling/errorHandler.js");
const appConfig = require('../appConfig.js');
const {getParametersFromPortal ,  expireTokenInPortal} = require("./loadPortalDataHandler.js");

async function generatePortalIntegratedTemplate(req, res) { 
  try {
    const params = req.body;
    const token = params["id"]; 
    const userId = "test";   
    if (!token ) {
      return res
        .status(400)
        .send({ error: 'No token found' });
    }   

    const rawHost = (req.get("X-Original-Server") || req.hostname);
    const targetApp = appConfig[rawHost];
    
    if(!targetApp) {
        return res.status(400).send({ error: getErrorMessage("UNKNOWN_ORIGIN_SERVER") });
    }     
    const paramsFromPortal = await getParametersFromPortal(targetApp,token,userId);      

    if(!paramsFromPortal) {
        return res.status(400).send({ error: getErrorMessage("PARAMS_NOT_FOUND") });
    } 
    const formJson = await constructFormJson(paramsFromPortal);

    if (formJson != null) {
      
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
      .send({ error: getErrorMessage("FORM_CANNOT_BE_GENERATED") });
  }
}

async function constructFormJson(params) { 

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



module.exports = generatePortalIntegratedTemplate;