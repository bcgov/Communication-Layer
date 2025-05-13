const { keycloakForFormRepo } = require("./keycloak.js");
const axios = require("axios");
const databindingsHandler = require("./databindingsHandler.js");
const getFormFromFormTemplate = require("./formRepoHandler.js");
const { getUsername, isUsernameValid } = require('./usernameHandler.js');
const populateDatabindings = databindingsHandler.populateDatabindings;
const { getErrorMessage } = require("./errorHandling/errorHandler.js");
const { getICMAttachmentStatus } = require("./saveICMdataHandler");

async function generateTemplate(req, res) {
  try {
    const params = req.body;
    const template_id = params["formId"];
    console.log("template_id>>", template_id);
    const attachment_Id = params["attachmentId"];    
    if (!template_id) {
      return res
        .status(400)
        .send({ error: getErrorMessage("FORM_ID_REQUIRED") });
    }
    if (!attachment_Id) {
        return res
            .status(400)
            .send({ error: getErrorMessage("ATTACHMENT_ID_REQUIRED") });
    }
    let username = null;

    if (params["token"]) {
      username = await getUsername(params["token"]);
    } else if (params["username"]) {
      const valid = await isUsernameValid(params["username"]);
      username = valid ? params["username"] : null;
    }

    if (!username || !isNaN(username)) {
      return res
        .status(401)
        .send({ error: getErrorMessage("INVALID_USER") });
    }


    let icm_metadata = await getICMAttachmentStatus(attachment_Id, username);
    let icm_status = icm_metadata["Status"];   
    
    if (icm_status == "Complete") {
            return res
        .status(401)
        .send({ error: getErrorMessage("FORM_ALREADY_FINALIZED") });
    }

    const formJson = await constructFormJson(template_id, params);

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
      .send({ error: getErrorMessage("GENERATE_ERROR_MSG") });
  }
}

async function constructFormJson(formId, params) {

  const formDefinition = await getFormFromFormTemplate(formId);

  if (!formDefinition || formDefinition === null) {
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