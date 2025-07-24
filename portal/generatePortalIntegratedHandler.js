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
    if (!token ) {
      return res
        .status(400)
        .send({ error: 'No token found' });
    }  
    const userId = "test";
    const portalId = params["portalId"];    
    //const targetApp = appConfig[portalId];

    const rawHost = (req.get("X-Forwarded-Host") || req.hostname);
    const targetApp = appConfig[rawHost];
    
    if(!targetApp) {
        return res.status(400).send({ error: 'Unknown app ID' });
    }     
    const paramsFromPortal = await getParametersFromPortal(targetApp,token,userId);   
    console.log("paramsFromPortal",paramsFromPortal);
    

    if(!paramsFromPortal) {
        return res.status(400).send({ error: 'Parameters not found to generate form' });
    } 

    const formJson = await constructFormJson(paramsFromPortal);

    if (formJson != null) {
      //expire token
      const isTokenExpired = await expireTokenInPortal(targetApp,token,userId); 
      console.log("isTokenExpired >> ",isTokenExpired);
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