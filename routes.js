const express = require("express");
const axios = require("axios");
const xmlparser = require("express-xml-bodyparser");
const { keycloakForSiebel,keycloakForFormRepo} = require("./keycloak.js");
const generateTemplate = require("./generateHandler");
const getFormsFromFormTemplate = require("./formRepoHandler");
const router = express.Router();

const FORM_SERVER_URL = process.env.FORMSERVERURL;
const ENDPOINT_URL = process.env.ENDPOINTURL;

// Form Map
const formMap = new Map();
formMap.set("id1", "form1");
formMap.set("id2", "form2");

function findForm(input_path) {
  return formMap.get(input_path);
}

// Status route
router.get("/status", (req, res) => {
  res.send({ status: "running" });
});

// API forwarding route
router.get("/api*", async (req, res) => {
  try {
    const grant =
      await keycloakForSiebel.grantManager.obtainFromClientCredentials();
    const destinationPath = RegExp("api/(.*)").exec(req.path)[1];
    let endpointUrl = `${ENDPOINT_URL}${destinationPath}`;
    endpointUrl += "?ViewMode=Catalog&workspace=dev_sadmin_bz";

    const newResp = await axios.get(endpointUrl, {
      headers: {
        Authorization: `Bearer ${grant.access_token.token}`,
      },
    });

    res.json(newResp.data);
  } catch (err) {
    console.error("API error: " + err.message);
    res.status(500).send({ error: err.message });
  }
});

// XML form post route
router.post("/form1", xmlparser(), async (req, res) => {
  console.log(req.body);
  res.status(200).json("{success!}");
});

// XML push route
router.post("/xmlPush/:formId", xmlparser(), async (req, res) => {
  try {
    const response_path = findForm(req.params.formId);
    if (response_path === undefined) {
      return res.status(404).send({ error: "Form not found" });
    }
    const forwardAddress = `${FORM_SERVER_URL}/${response_path}`;
    console.log(forwardAddress);

    res.redirect(307, forwardAddress);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Send XML file route
router.get("/xml", async (req, res) => {
  const options = {
    root: "./common",
  };

  res.sendFile("data.xml", options, (err) => {
    if (err) {
      console.error(`XML Error: ${err.message}`);
      res.status(500).send({ error: "Internal server error." });
    }
  });
});

// Save data route
router.post("/saveData", async (request, response) => {
  console.log(request.body);  
  response.status(200).json("{success!}");
});

// Generate route
router.post("/generate", generateTemplate);

router.get("/getAllForms", async (request,response) => {
  try {
    console.log(`FORM_SERVER_URL: ${FORM_SERVER_URL}`);
    const grant =
    await keycloakForFormRepo.grantManager.obtainFromClientCredentials(); 
    console.log(`Access Token: ${grant.access_token.token}`);
    let endpointUrl = `${FORM_SERVER_URL}/api/forms-list`;  
    console.log(`endpointUrl: ${endpointUrl}`);

    const forms = await axios.get(endpointUrl, {
      headers: {
        Authorization: `Bearer ${grant.access_token.token}`,
      },
    });    
    console.log("forms",forms);
    response.json(forms.data);
    
  } catch (err) {
    console.error("API error: " + err.message);        
    response.status(500).send({ error: err.message });
  }

});

module.exports = router;
