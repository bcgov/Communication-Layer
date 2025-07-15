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
    console.log("Request",req);
    const rawHost = (req.get("X-Original-Server") || req.hostname);
    console.log("Raw host:",rawHost);
    console.log("App configs",appCfg);
    const configOpt = appCfg[rawHost];
    console.log("Config options:",configOpt);
    params = { ...params, ...configOpt };
    console.log("Params:",params);
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
      username = await getUsername(params["token"], params["employeeEndpoint"]);
    } else if (params["username"]) {
      const valid = await isUsernameValid(params["username"]);
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
    const params = req.body;
    const rawHost = (req.get("X-Original-Server") || req.hostname);
    const configOpt = appCfg[rawHost];
    console.log("Config:",configOpt);
    params = { ...params, ...configOpt };
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
      username = await getUsername(params["token"], params["employeeEndpoint"]);
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

      //params added to json so they can be used in SaveToICM functionality call
      formJson.params ={
        attachmentId: params["attachmentId"],
        OfficeName:params["OfficeName"],
        username:params["username"]
      }     
     
      const saveDataForLater = JSON.stringify(formJson)
      const id = await storeData(saveDataForLater);
      const endPointForGenerate = process.env.GENERATE_KILN_URL + "?jsonId=" + id;
      const isGenerateSuccess = await performGenerateFunction(endPointForGenerate);
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

async function performGenerateFunction(url) {
 
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

    // Set the HTML content of the page
     await page.goto(url,{
    timeout: 200000,         // 60 seconds
    waitUntil: 'domcontentloaded',      // You can also use 'networkidle2' or 'domcontentloaded'
    }); // Replace with your actual URL
    console.log('Page loaded.');

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