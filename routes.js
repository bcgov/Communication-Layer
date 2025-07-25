const express = require("express");
const axios = require("axios");
const xmlparser = require("express-xml-bodyparser");
const { keycloakForSiebel, keycloakForFormRepo } = require("./keycloak.js");
const { generateTemplate,generateNewTemplate } = require("./generateHandler");
const { saveICMdata, loadICMdata, clearICMLockedFlag } = require("./saveICMdataHandler");
const { getUsername } = require("./usernameHandler.js");
const renderRouter = require("./renderHandler");

const {generatePDFFromHTML,generatePDFFromURL,generatePDFFromJSON,loadSavedJson } = require("./generatePDFHandler");
const generatePortalIntegratedTemplate = require("./portal/generatePortalIntegratedHandler.js");
const submitForPortalAction = require("./portal/savePortalFormDataHandler.js");


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

/*/ API forwarding route
router.get("/api*", async (req, res) => {
  try {
    const grant =
      await keycloakForSiebel.grantManager.obtainFromClientCredentials();
    const destinationPath = RegExp("api/(.*)").exec(req.path)[1];
    let endpointUrl = `${ENDPOINT_URL}${destinationPath}`;
    endpointUrl += "?ViewMode=Catalog&workspace=dev_sadmin_bz";
    const username = await getUsername(req.headers["token"]);
    if (!username || !isNaN(username)) {
      return res
        .status(401)
        .send({ error: "Username is not valid" });
    }
    const newResp = await axios.get(endpointUrl, {
      headers: {
        Authorization: `Bearer ${grant.access_token.token}`,
        "X-ICM-TrustedUsername": username,
      },
    });

    res.json(newResp.data);
  } catch (err) {
    console.error("API error: " + err.message);
    res.status(500).send({ error: err.message });
  }
});*/

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

// ICM save data route
router.post("/saveICMData", saveICMdata);

// ICM load data rout
router.post("/loadICMData", loadICMdata);

// Generate route
router.post("/generate", generateTemplate);

router.get("/getAllForms", async (request, response) => {
  try {
    const grant =
      await keycloakForFormRepo.grantManager.obtainFromClientCredentials();
    let endpointUrl = `http://localhost:3030/api/forms-list`;

    const forms = await axios.get(endpointUrl, {
      headers: {
        Authorization: `Bearer ${grant.access_token.token}`,
      },
    });
    console.log("forms", forms);
    response.json(forms.data);

  } catch (err) {
    console.error("API error: " + err.message);
    response.status(500).send({ error: err.message });
  }

});

// clear the locked by flags in ICM for the form, used when form is closed
router.post("/clearICMLockedFlag", clearICMLockedFlag);


router.post("/generatePDFFromJson", generatePDFFromJSON);

// Generate route
router.post("/generatePDF", generatePDFFromHTML);
router.post("/generatePDFFromURL", generatePDFFromURL);
router.post("/loadSavedJson", loadSavedJson);
router.post("/generatePortalForm", generatePortalIntegratedTemplate);
router.post("/generateNewTemplate", generateNewTemplate);
router.use('/pdfRender', renderRouter);
router.use('/submitForPortalAction', submitForPortalAction);

module.exports = router;