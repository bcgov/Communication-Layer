const { keycloakForSiebel } = require("./keycloak.js");
const axios = require("axios");
const databindingsHandler = require("./databindingsHandler.js");
const buildUrlWithParams = databindingsHandler.buildUrlWithParams;
const xml2js = require("xml2js");
const { getUsername, isUsernameValid } = require("./usernameHandler.js");
const { getErrorMessage } = require("./errorHandling/errorHandler.js");
const { isJsonStringValid } = require("./validate.js");
const appCfg = require('./appConfig.js');

const SIEBEL_ICM_API_FORMS_ENDPOINT = process.env.SIEBEL_ICM_API_FORMS_ENDPOINT;
// utility function to fetch Attachment status (In Progress, Open...)
//  and Locked By User field  
async function getICMAttachmentStatus(attachment_id, username, params) {
    let return_data = {};
    return_data["Status"] = "";
    return_data["Locked by User"] = "";
    return_data["Locked Flag"] = "";
    return_data["Locked by Id"] = "";
    return_data["DocFileName"] = "";
    return_data["Office Name"] = "";
    if (!attachment_id || attachment_id == "") {
        return return_data;
    }
    //let url = buildUrlWithParams('SIEBEL_ICM_API_HOST', 'fwd/v1.0/data/DT Form Instance Thin/DT Form Instance Thin/' + attachment_id + '/', '');
    let url = buildUrlWithParams(params["apiHost"], params["saveEndpoint"] + attachment_id + '/', params);
    try {
        let response;
        const grant =
            await keycloakForSiebel.grantManager.obtainFromClientCredentials();
        const headers = {
            Authorization: `Bearer ${grant.id_token.token}`,
            "X-ICM-TrustedUsername": username,
        }
        const params = {
            viewMode: "Catalog"
        }
        if (process.env.SIEBEL_ICM_API_WORKSPACE) {
            params.workspace = process.env.SIEBEL_ICM_API_WORKSPACE;
        }
        response = await axios.get(url, { params, headers });
        return_data["Status"] = response.data["Status"];
        return_data["Locked by User"] = response.data["Locked by User"];
        return_data["Locked Flag"] = response.data["Locked Flag"];
        return_data["Locked by Id"] = response.data["Locked by Id"];
        return_data["DocFileName"] = response.data["DocFileName"];
        return_data["Office Name"] = response.data["Office Name"];
        return return_data;
    }
    catch (error) {
        console.log(error);
        return null;
    }
}

//method to save the form (data, template and metadata) as a JSON file in ICM, and update form 
//  instance metadata with In Progress status, filename and extracted form data as an XML hierarchy
async function saveICMdata(req, res) {
    try {
    let params = req.body;
    const rawHost = (req.get("X-Forwarded-Host") || req.hostname);
    const configOpt = appCfg[rawHost];
    params = { ...params,...configOpt  };   
    const attachment_id = params["attachmentId"];
    const savedFormParam = params["savedForm"];
    
    if (!attachment_id) {
        return res
            .status(400)
            .send({ error: getErrorMessage("ATTACHMENT_ID_REQUIRED") });
    }
    if (!savedFormParam) {
        return res
            .status(400)
            .send({ error: getErrorMessage("FORM_NOT_FOUND_IN_REQUEST") });
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
    let form_metadata = await getICMAttachmentStatus(attachment_id, username, params);

    if (!form_metadata) {
        return res
            .status(400)
            .send({ error: getErrorMessage("FORM_STATUS_NOT_FOUND") });
    }

    let icm_status = form_metadata["Status"];   
    
    if (icm_status == "Complete") {
            return res
        .status(401)
        .send({ error: getErrorMessage("FORM_ALREADY_FINALIZED") });
    }
    //saveForm validate before saving to ICM
    const valid = isJsonStringValid(savedFormParam);
    if (!valid) {
        console.log('JSON is  not valid ');
        return res
            .status(400)
            .send({ error: getErrorMessage("FORM_NOT_VALID") });
    }

    let saveJson = {};
    saveJson["Id"] = attachment_id;
    saveJson["Office Name"] = form_metadata["Office Name"];
    saveJson["Status"] = "In Progress";
    saveJson["DocFileName"] = (form_metadata["DocFileName"] && form_metadata["DocFileName"] !== "") ? form_metadata["DocFileName"] : attachment_id.replace(/^[^-]+-/, 'Form_');
    saveJson["DocFileExt"] = "json";
    saveJson["Doc Attachment Id"] = Buffer.from(savedFormParam).toString('base64');//savedForm is saved as attachment 
    let saveData = JSON.parse(savedFormParam)["data"];// This is the data part of the savedJson    
    let builder = new xml2js.Builder();
    saveJson["XML Hierarchy"] = builder.buildObject(saveData);         
    //let url = buildUrlWithParams('SIEBEL_ICM_API_HOST', 'fwd/v1.0/data/DT Form Instance Thin/DT Form Instance Thin/' + attachment_id + '/', '');
    let url = buildUrlWithParams(params["apiHost"], params["saveEndpoint"] + attachment_id + '/', params);
    try {
        let response;
        const grant =
            await keycloakForSiebel.grantManager.obtainFromClientCredentials();
        const headers = {
            Authorization: `Bearer ${grant.id_token.token}`,
            "X-ICM-TrustedUsername": username,
        }
        const params = {
            viewMode: "Catalog"
        }
        if (process.env.SIEBEL_ICM_API_WORKSPACE) {
            params.workspace = process.env.SIEBEL_ICM_API_WORKSPACE;
        }
        response = await axios.put(url, saveJson, { params, headers });

        return res.status(200).send({});
    }
    catch (error) {
        console.error(`Error updating ICM:`, error);
        return null; // Handle missing data source or error
    }
    }
    catch (error) {
            console.error(`Error saving the form to ICM:`, error);
            return null; // Handle missing data source or error
    }
}

// method to load a JSON file from ICM, given the attachmentId
async function loadICMdata(req, res) {

    let params = req.body;
    const rawHost = (req.get("X-Forwarded-Host") || req.hostname);
    const configOpt = appCfg[rawHost];
    params = { ...params,...configOpt  }; 
    const attachment_id = params["attachmentId"];
    const office_name = params["OfficeName"];
    console.log("attachment_id>>", attachment_id);
    if (!attachment_id) {
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
    let icm_metadata = await getICMAttachmentStatus(attachment_id, username, params);
    let icm_status = icm_metadata["Status"];   
    if (!icm_status || icm_status == "") {
        console.log("Error fetching Form Instance Thin data for ", attachment_id);
        return res
            .status(400)
            .send({ error: getErrorMessage("FORM_STATUS_NOT_FOUND") });
    }
    //let url = buildUrlWithParams('SIEBEL_ICM_API_HOST', 'fwd/v1.0/data/DT FormFoundry Upsert/DT Form Instance Orbeon Revise/'+attachment_id+'/','');
    let url = buildUrlWithParams(params["apiHost"], params["saveEndpoint"] + attachment_id + '/', params);
    try {
        let response;
        const grant =
            await keycloakForSiebel.grantManager.obtainFromClientCredentials();
        const headers = {
            Authorization: `Bearer ${grant.id_token.token}`,
            "X-ICM-TrustedUsername": username,
        }
        const params = {
            viewMode: "Catalog",
            inlineattachment: true
        }
        if (process.env.SIEBEL_ICM_API_WORKSPACE) {
            params.workspace = process.env.SIEBEL_ICM_API_WORKSPACE;
        }
        response = await axios.get(url, { params, headers });
        let return_data = Buffer.from(response.data["Doc Attachment Id"], 'base64').toString('utf-8');
        //validate the returned data to be of the expected format 
        const valid = isJsonStringValid(return_data);
        if (!valid) {
            console.log('JSON is  not valid ');
            return res
                .status(400)
                .send({ error: getErrorMessage("FORM_NOT_VALID") });
        }
        //validate ends here. Once validated continue to modify json based on status and send back.
        if (icm_status == "Complete") {
            let new_data = JSON.parse(return_data);
            new_data.form_definition.readOnly = true;
            return_data = JSON.stringify(new_data);
        }
        return res.status(200).send(return_data);
    }
    catch (error) {
        console.error(`Error loading data from ICM:`, error);
        return res
            .status(400)
            .send({ error: getErrorMessage("GENERIC_ERROR_MSG") });
    }

}
async function clearICMLockedFlag(req, res) {
    let params = req.body;
    const rawHost = (req.get("X-Forwarded-Host") || req.hostname);
    const configOpt = appCfg[rawHost];
    params = { ...params,...configOpt  }; 
    const attachment_id = params["attachmentId"];
    if (!attachment_id) {
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

    try {
        console.log("Clearing....");
        //check that attachment ID exists and that the form is locked
        let icm_metadata = await getICMAttachmentStatus(attachment_id, username, params);
        let icm_status = icm_metadata["Status"];
        if (!icm_status || icm_status == "") {
            console.log("Bad status!");
            return res
                .status(400)
                .send({ error: getErrorMessage("FORM_STATUS_NOT_FOUND") });
        }
        if (icm_metadata["Locked by Id"] == "") {
            console.log("not locked?");
            return res
                .status(200)
                .send({});
        }

        //clear out the locked metadata parameters. It would be interesting to use Token as 
        //  additional verification, as it could be sent from ICM, and we could also make sure it exists
        //  and matches before any operation is permitted on an 'edit in progress form' workflow
        let saveJson = {};
        saveJson["Id"] = attachment_id;
        saveJson["Locked Flag"] = "N";
        saveJson["Locked by Id"] = "";
        saveJson["Token"] = "";

        //let url = buildUrlWithParams('SIEBEL_ICM_API_HOST', 'fwd/v1.0/data/DT Form Instance Thin/DT Form Instance Thin/' + attachment_id + '/', '');
        let url = buildUrlWithParams(params["apiHost"], params["saveEndpoint"] + attachment_id + '/', params);
        let response;
        const grant =
            await keycloakForSiebel.grantManager.obtainFromClientCredentials();
        const headers = {
            Authorization: `Bearer ${grant.id_token.token}`,
            "X-ICM-TrustedUsername": username,

        }
        const query = {
            viewMode: "Catalog"
        }
        if (process.env.SIEBEL_ICM_API_WORKSPACE) {
            query.workspace = process.env.SIEBEL_ICM_API_WORKSPACE;
        }
        response = await axios.put(url, saveJson, { params: query, headers });
        return res.status(200).send({});
    }

    catch (error) {
        console.log("Error clearing the locked metadata");
        return res.status(400).send({ error: getErrorMessage("FAILED_TO_UNLOCK_FORM") });
    }

}
module.exports.saveICMdata = saveICMdata;
module.exports.loadICMdata = loadICMdata;
module.exports.clearICMLockedFlag = clearICMLockedFlag;
module.exports.getICMAttachmentStatus = getICMAttachmentStatus;