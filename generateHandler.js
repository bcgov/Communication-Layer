const { keycloakForFormRepo } = require("./keycloak.js");
const axios = require("axios");
const databindingsHandler = require("./databindingsHandler.js");
const getFormFromFormTemplate = require("./formRepoHandler.js");
const { getUsername, isUsernameValid } = require('./usernameHandler.js');
const populateDatabindings = databindingsHandler.populateDatabindings;
const { getErrorMessage } = require("./errorHandling/errorHandler.js");
const { getICMAttachmentStatus } = require("./saveICMdataHandler");
const puppeteer = require('puppeteer');

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
    console.log("username>>",username);

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

async function generateFormFromAPI(req, res) {
  const { attachmentId } = req.body;

    // Validate attachment is present in incoming message
    if (!attachmentId) {
      return res.status(400).json({
        errorCode: 1,
        errorMessage: "Invalid JSON . No attachment found.",
        pdf: null
      });
    }

    console.log("generateFormFromAPI");
  const browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
        //headless: false, // <--- SHOW browser window!
        //slowMo: 50, // Optional: slows down actions for visibility
        protocolTimeout: 120000, // <--- Set to 120 seconds
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--headless"
          
        ],
      });
  const page = await browser.newPage();
  // Define the cookie
  const cookie = {
    name: 'username',
    value: 'CGINST06', // <-- Your value here
    domain: 'host.docker.internal', // <-- Must match the site you're visiting
    path: '/',
    httpOnly: false,
    secure: false
  };

  const context = browser.defaultBrowserContext();
  await context.addCookies([cookie]);

  // Step 1: Navigate to the endpoint
  await page.goto('http://host.docker.internal:8080/new?attachmentId=1-4ZYB8OE&formId=CF8787&CaseId=1-4ZYB34V&ContactId=1-4Z1UVQC',{
  timeout: 200000,         // 60 seconds
  waitUntil: 'domcontentloaded',      // You can also use 'networkidle2' or 'domcontentloaded'
}); // Replace with your actual URL
console.log('Page loaded.');

  // Step 2: Wait for the button to be available
  await page.waitForSelector('#saveAndClose',{ timeout: 200000 }); // Use the actual selector
  

  // Step 3: Click the button
  await page.click('#saveAndClose'); // Same selector as above

  // Optional: Wait for any result/response after clicking
  await page.waitForTimeout(200000); // or use `waitForSelector` for expected change

  await browser.close();
}



module.exports = {generateTemplate , generateFormFromAPI };