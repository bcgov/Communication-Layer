const { keycloakForFormRepo } = require("./keycloak.js");
const axios = require("axios");
const databindingsHandler = require("./databindingsHandler.js");
const getFormFromFormTemplate = require("./formRepoHandler.js");
const { getUsername, isUsernameValid } = require('./usernameHandler.js');
const populateDatabindings = databindingsHandler.populateDatabindings;
const { getErrorMessage } = require("./errorHandling/errorHandler.js");
const { getICMAttachmentStatus } = require("./saveICMdataHandler");
const puppeteer = require('puppeteer');
const {storeData,retrieveData,deleteData} = require('./helper/redisHelperHandler.js');
const appCfg = require('./appConfig.js');

async function generateTemplate(req, res) {
  try {
    let params = req.body;
    const rawHost = (req.get("X-Original-Server") || req.hostname);
    console.log("HOST",rawHost)
    const configOpt = appCfg[rawHost];
    params = { ...params, ...configOpt };
    const template_id = params["formId"];
    console.log("template_id>>", template_id);
    console.log("Parameters:",params)
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
      username = await getUsername(params["token"], params["employeeEndpoint"]);
    } else if (params["username"]) {
      const valid = await isUsernameValid(params["username"], params["employeeEndpoint"]);
      username = valid ? params["username"] : null;
    }    

    if (!username || !isNaN(username)) {
      return res
        .status(401)
        .send({ error: getErrorMessage("INVALID_USER") });
    }
    let icm_metadata = await getICMAttachmentStatus(attachment_Id, username, params);
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



async function generateNewTemplate(req, res) {
  try {
    let params = req.body;
    const rawHost = (req.get("X-Original-Server") || req.hostname);
    const configOpt = appCfg[rawHost];
    params = { ...params, ...configOpt };
    const template_id = params["formId"];
    const attachment_Id = params["attachmentId"];    
    const authHeader = req.get('Authorization') || '';
    const rawToken = authHeader.split(' ')[0] === 'Bearer'? authHeader.split(' ')[1] : authHeader || null;
    console.log("Raw Token:",rawToken);
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
    let valid = false;
    console.log("Generate - token:",params["token"]);
    console.log("Generate - username:",params["username"]);

    if (params["username"]) {
      valid = await isUsernameValid(params["username"], params["employeeEndpoint"]);
      username = valid ? params["username"] : null;
    } else if (params["token"]) {
      username = await getUsername(params["token"], params["employeeEndpoint"]);
      valid = await isUsernameValid(username, params["employeeEndpoint"]);
      username = valid ? username : null;
    }    

    console.log("Generate - Final username:",username);

    if (!username || !isNaN(username)) {
      return res
        .status(401)
        .send({ error: getErrorMessage("INVALID_USER") });
    }

    let icm_metadata = await getICMAttachmentStatus(attachment_Id, username, params);
    let icm_status = icm_metadata["Status"];   
    
    if (icm_status == "Complete") {
            return res
        .status(401)
        .send({ error: getErrorMessage("FORM_ALREADY_FINALIZED") });
    }

    if (icm_metadata["Template"] !== template_id) {
      return res
          .status(400)
          .send({ error: getErrorMessage("INVALID_FORM_ID") });
    }

    if (icm_metadata["Tool"]?.toLowerCase() !== "formfoundry") {
      return res
          .status(400)
          .send({ error: getErrorMessage("INVALID_TOOL") });
    }

    const requestArea = params.area?.toLowerCase();

    if (requestArea) {
      const icmArea = icm_metadata.Categorie?.toLowerCase();

      const isServiceRequest = requestArea === "service request";

      const isAreaValid =
          (isServiceRequest && icmArea === "application") ||
          (!isServiceRequest && requestArea === icmArea);

      if (!isAreaValid) {
        return res.status(400).send({ error: getErrorMessage("INVALID_AREA") });
      }
    }
      
    const icmOfficeName = icm_metadata?.["Office Name"];    
    const requestOfficeName = typeof params.OfficeName === "string" ? params.OfficeName.trim() : "";
    console.log('RequestOfficeName:', requestOfficeName);
    console.log('IcmOfficeName:', icmOfficeName);
    if (!requestOfficeName && icmOfficeName) {
      params.OfficeName = icmOfficeName;
    }
    console.log("Params:",params);
    
    const formJson = await constructFormJson(template_id, params);

    if (formJson != null) {

      //params added to json so they can be used in SaveToICM functionality call
      formJson.params ={
        ...params
      }     
      const saveDataForLater = JSON.stringify(formJson)
      const id = await storeData(saveDataForLater);
      const rawGenerateEndpoint = params?.generateEndpoint;
      const generateEndpoint = rawGenerateEndpoint?.trim() || process.env.GENERATE_KILN_URL;
      console.log("Generate APP config:",generateEndpoint);
      const endPointForGenerate = generateEndpoint + "?jsonId=" + id;
      const isGenerateSuccess = await performGenerateFunction(endPointForGenerate,rawToken,username);
      deleteData(id);

      //if successfully generated send back response 
      if(isGenerateSuccess) {
         return res.status(200).send({
        message: "Successfully generated the form"
      });
      } else {
        return res
      .status(400)
      .send({ error: getErrorMessage("FORM_CANNOT_BE_GENERATED") });
      }
      
      
      //
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

async function performGenerateFunction(url,token,username) {
 
  try {
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--headless",
    ],
  });
  

    //const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
      console.log('Browser logs:', msg.type(), msg.text());
    });
    
    page.on('request', req => {
      console.log('Request:', req.url(), req.failure());
    });

    // Set the HTML content of the page
     await page.goto(url,{
    timeout: 200000,         // 60 seconds
    waitUntil: 'domcontentloaded',      // You can also use 'networkidle2' or 'domcontentloaded'
    }); // Replace with your actual URL
    console.log('Page loaded.');
    const appUrl = new URL(url);
    const cookies = [];

    if (token) {
      cookies.push({
        name: 'token',
        value: token,
        url: appUrl.origin
      });
    }

    if (username) {
      cookies.push({ 
        name: 'username', 
        value: username,
        url: appUrl.origin
    });
    }
    if (cookies.length) {
      await browser.setCookie(...cookies);
    }

  // Step 2: Wait for the button to be available
  await page.waitForSelector('#generate',{ timeout: 200000 }); // Use the actual selector
  

  // Step 3: Click the button
  await page.click('#generate'); // Same selector as above

  

  await new Promise(res => setTimeout(res, 3000));

  await page.waitForFunction(() => {
      const modals = document.querySelectorAll('[role="dialog"]');
      return Array.from(modals).some(modal =>
        modal.textContent.includes('Success')
      );
    }, { timeout: 60000 });

    console.log('✅ Success modal appeared.');
    await browser.close();
    return true; 

  } catch (error) {
    console.error('Error performing generate function:', error);    
    return false;
  }

}



module.exports = {generateTemplate , generateNewTemplate };