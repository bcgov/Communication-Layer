const { keycloakForFormRepo } = require("./keycloak.js");
const axios = require("axios");
const databindingsHandler = require("./databindingsHandler.js");
const getFormFromFormTemplate = require("./formRepoHandler.js");
const { getUsername } = require('./usernameHandler.js');
const populateDatabindings = databindingsHandler.populateDatabindings;
const { getErrorMessage } =  require("./errorHandling/errorHandler.js");

async function generateTemplate(req, res) {
  try {
    const params = req.body;
    const template_id = params["formId"];
    console.log("template_id>>", template_id);
    if (!template_id) {
      return res
        .status(400)
        .send({ error: getErrorMessage("FORM_ID_REQUIRED") });
    }
    const username = await getUsername(params["token"]);
    if (!username || !isNaN(username)) {    
      return res
        .status(401)
        .send({ error: getErrorMessage("INVALID_USER")});
    }  

    const formJson = await constructFormJson(template_id, params);

    if (formJson != null) {    
      res.status(200).send({
        save_data: formJson
      });
    }
    else {    
      res.status(400)
        .send({ error: getErrorMessage("FORM_NOT_FOUND",{ templateId: template_id })});
    }  
  }catch(error) {
    console.error(`Error generating the form:`, error);
    return res
        .status(400)
        .send({ error: getErrorMessage("GENERATE_ERROR_MSG") });
  }
}

async function constructFormJson(formId, params) {

  const formDefinition = await getFormFromFormTemplate(formId);

  if(!formDefinition || formDefinition === null) {
     return null;
  }

  const formData = await populateDatabindings(formDefinition, params);

  const fullJSON = {
    data: formData || {},
    form_definition: formDefinition || {}, // Providing default empty object if missing
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: "1.0.0", // Add any other metadata
    }
  };

  return fullJSON;
}



module.exports = generateTemplate;