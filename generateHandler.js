const { keycloakForFormRepo } = require("./keycloak.js");
const axios = require("axios");
const populateDatabindings = require("./databindingsHandler.js");
const getFormFromFormTemplate = require("./formRepoHandler.js");

async function generateTemplate(req, res) {  
 
  const params = req.body;  
  const template_id = params["formId"];    
  console.log("template_id>>",template_id);

  if ( !template_id) {
    return res
      .status(400)
      .send({ error: "form Id is  required" });
  }

  const formJson = await constructFormJson(template_id,params);
  res.status(200).send({        
        save_data: formJson
        });
  }

  async function constructFormJson(formId, params) {   

    const formDefinition = await getFormFromFormTemplate(formId) || {};
    const formData = await populateDatabindings(formDefinition,params);

    const fullJSON = {
        data: formData|| {}, 
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
