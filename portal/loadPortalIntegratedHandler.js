const { keycloakForFormRepo } = require("../keycloak.js");
const axios = require("axios");
const getFormFromFormTemplate = require("../formRepoHandler.js");
const { getErrorMessage } = require("../errorHandling/errorHandler.js");
const appConfig = require('../appConfig.js');
const {getSavedFormFromPortal} = require("./loadPortalDataHandler.js");

async function loadPortalIntegratedForm(req, res) { 
  try {
    const params = req.body;
    const token = params["id"]; 
    const userId = params["userId"];   
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
    const formJson = await getSavedFormFromPortal(targetApp,token,userId); 

    if(!formJson) {
        return res.status(400).send({ error: getErrorMessage("FORM_NOT_FOUND", { templateId: template_id }) });
    }  
    //the formJson is a base64 string . Converting to json here.  
    const savedJson = Buffer.from(formJson["form"], 'base64').toString('utf-8');      
    const data = JSON.parse(savedJson);      
    res.status(200).send(data);    
    
  } catch (error) { 
    console.error(`Error generating the form:`, error);
    
    return res
      .status(400)
      .send({ error: getErrorMessage("FORM_CANNOT_BE_GENERATED") });
  }
}





module.exports = loadPortalIntegratedForm;