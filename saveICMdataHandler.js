const { keycloakForSiebel } = require("./keycloak.js");
const axios = require("axios");
const databindingsHandler = require("./databindingsHandler.js");
const buildUrlWithParams = databindingsHandler.buildUrlWithParams;
const xml2js = require("xml2js");
const { getUsername, isUsernameValid } = require("./usernameHandler.js");
const { getErrorMessage } = require("./errorHandling/errorHandler.js");
const { isJsonStringValid } = require("./validate.js");
const appCfg = require('./appConfig.js');
const { toICMFormat } = require("./dateConverter.js");
const { formExceptions } = require("./dictionary/jsonXmlConversion.js");
const { propertyExists, propertyNotEmpty, keyExists } = require("./dictionary/dictionaryUtils.js");

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
    return_data["Template"] = "";
    return_data["Tool"] = "";
    return_data["Categorie"] = "";

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
        const query = {
             viewMode: "Catalog"
        }
        if (params.icmWorkspace) {
            query.workspace = params.icmWorkspace;
        }
        response = await axios.get(url, { params: query, headers });
        return_data["Status"] = response.data["Status"];
        return_data["Locked by User"] = response.data["Locked by User"];
        return_data["Locked Flag"] = response.data["Locked Flag"];
        return_data["Locked by Id"] = response.data["Locked by Id"];
        return_data["DocFileName"] = response.data["DocFileName"];
        return_data["Office Name"] = response.data["Office Name"];
        return_data["Template"] = response.data["Template"];
        return_data["Tool"] = response.data["Tool"];
        return_data["Categorie"] = response.data["Categorie"];
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
    const rawHost = (req.get("X-Original-Server") || req.hostname);
    const configOpt = appCfg[rawHost] || Object.values(appCfg).find(cfg => {
        try {
          return new URL(cfg.apiHost).hostname === rawHost;
        } catch {
          return false;
        }
      }) || {};
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
        const valid = await isUsernameValid(params["username"], params["employeeEndpoint"]);
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
    const formDefinitionItems = JSON.parse(savedFormParam)["form_definition"]["data"]["items"];// This is the field info for form items
    
    // dateItemsId : This will contain all of the IDs of the date fields
    // checkboxItemsId : This will contain all of the IDs of the checkbox fields
    const { dateItemsId, checkboxItemsId } = getFormIds(formDefinitionItems);

    const truncatedKeysSaveData = {};

    const dictionary = formExceptions;
    const formId = JSON.parse(savedFormParam)["form_definition"]["form_id"]; // Get the form ID
    const formVersion = JSON.parse(savedFormParam)["form_definition"]["version"]; // Get the form version
    const isFormException = keyExists(dictionary, formId); // If true, then this form will have its exceptions formatted
    const toWrapIds = {}; //List of ids that will need to be placed in a wrapper. This only happens if form exception is true and wrapperTags exists
    if (isFormException && propertyExists(dictionary, formId, "wrapperTags")) { 
        dictionary[formId]["wrapperTags"].forEach((wrapperTag, index) => {
            const tagKey = Object.keys(dictionary[formId]["wrapperTags"][index])[0];
            if (wrapperTag[tagKey]["wrapFields"].length != 0) { // If there are any wrappers with no fields, ignore. Otherwise, keep a list of UUID and the wrapper to put it in.
                truncatedKeysSaveData[tagKey] = {};
                wrapperTag[tagKey]["wrapFields"].forEach(fieldId => {
                    toWrapIds[fieldId] = tagKey;
                });
            }
        });
    }


    for(let oldKey in saveData) { //This begins trunicating the JSON keys for XML (UUID should be first 8 characters)
        const stringLength = oldKey.length;
        const newKey = oldKey.substring(0, stringLength-28);
        if (Array.isArray(saveData[oldKey]) > 0 && Object.keys(saveData[oldKey]).length > 0) { //This trunicates child/dependant objects
            const childrenArray = [];
            for(let i = 0; i < saveData[oldKey].length; i++) {
                const truncatedChildrenKeys = {};
                for (let oldChildKey in saveData[oldKey][i]) {
                    const childStringLength = oldChildKey.length;
                    const newChildKey = oldChildKey.substring(stringLength+3, childStringLength-28);
                    if (dateItemsId.includes(oldChildKey.substring(stringLength+3, childStringLength))) { // If child data is in a date field, change date format from YYYY-MM-DD to MM/DD/YYYY
                        const newDateFormat = toICMFormat(saveData[oldKey][i][oldChildKey]); 
                        if (newDateFormat === "-1") {
                            throw new Error("Invalid date. Was unable to convert to ICM format!");
                        }
                        truncatedChildrenKeys[newChildKey] = newDateFormat;
                    } else if (checkboxItemsId.includes(oldChildKey.substring(stringLength+3, childStringLength))) { // If child data is in a checkbox field, change from true/false/undefined to Yes/No/""
                        truncatedKeysSaveData[newKey] = convertCheckboxFormatToICM(saveData[oldKey][i][oldChildKey]);
                    } else {
                        truncatedChildrenKeys[newChildKey] = saveData[oldKey][i][oldChildKey];
                    }
                }
                childrenArray.push(truncatedChildrenKeys);
            }
            if (toWrapIds[oldKey]) {
                const wrapperKey = {};
                wrapperKey[newKey] = childrenArray;
                truncatedKeysSaveData[toWrapIds[oldKey]][`${newKey}-List`] = wrapperKey // Add a wrapper around the children/dependecies
            } else {
                const wrapperKey = {};
                wrapperKey[newKey] = childrenArray;
                truncatedKeysSaveData[`${newKey}-List`] = wrapperKey; // Add a wrapper around the children/dependecies
            }
        } else {
            if (dateItemsId.includes(oldKey)) { // If data is in a date field, change date format from YYYY-MM-DD to MM/DD/YYYY
                const newDateFormat = toICMFormat(saveData[oldKey]);
                if (newDateFormat === "-1") {
                    throw new Error("Invalid date. Was unable to convert to ICM format!");
                }
                if (toWrapIds[oldKey]) {
                    truncatedKeysSaveData[toWrapIds[oldKey]][newKey] = newDateFormat;
                } else {
                    truncatedKeysSaveData[newKey] = newDateFormat;
                }
            } else if (checkboxItemsId.includes(oldKey)) { // If data is in a checkbox field, change from true/false/undefined to Yes/No/""
                if (toWrapIds[oldKey]) {
                    truncatedKeysSaveData[toWrapIds[oldKey]][newKey] = convertCheckboxFormatToICM(saveData[oldKey]);
                } else {
                    truncatedKeysSaveData[newKey] = convertCheckboxFormatToICM(saveData[oldKey]);
                }
            } else {
                if (toWrapIds[oldKey]) {
                    truncatedKeysSaveData[toWrapIds[oldKey]][newKey] = saveData[oldKey]; 
                } else {
                    truncatedKeysSaveData[newKey] = saveData[oldKey]; //Data is added to new JSON with the truncated key
                }
            }
        }
    }
    
    let builder; // This will be for building the XML
    if (isFormException) { // If any forms with the correct version (TODO) have been listed as exceptions, then proceed with their form exceptions
        // If the root needs a differernt name, apply it here. Otherwise use the default "root"
        if (propertyExists(dictionary, formId, "rootName") && propertyNotEmpty(dictionary, formId, "rootName")) {
            builder = new xml2js.Builder({xmldec: { version: '1.0' }, rootName: dictionary[formId]["rootName"]});
        } else {
            builder = new xml2js.Builder({xmldec: { version: '1.0' }});
        }

        let wrapperJson = truncatedKeysSaveData;
        // If subRoots exist, wrap the sub-roots around the JSON where the last array object will be closest to JSON and first array object will be closest to root/rootName
        if (propertyExists(dictionary, formId, "subRoots") && propertyNotEmpty(dictionary, formId, "subRoots")) {
            wrapperJson = {};
            let tempJson = {};
            const subRootLength = dictionary[formId]["subRoots"].length;
            for (i = subRootLength; i > 0; i= i -1) {
                if (i === subRootLength) {
                    tempJson[dictionary[formId]["subRoots"][i-1]] = truncatedKeysSaveData;
                } else {
                    wrapperJson[dictionary[formId]["subRoots"][i-1]] = tempJson;
                    tempJson = wrapperJson;
                    wrapperJson = {};
                }
            }
            wrapperJson = tempJson;
        }
        saveJson["XML Hierarchy"] = builder.buildObject(wrapperJson);
    } else {
        builder = new xml2js.Builder({xmldec: { version: '1.0' }});
        saveJson["XML Hierarchy"] = builder.buildObject(truncatedKeysSaveData);
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
        const query = {
            viewMode: "Catalog"
        }
        if (params.icmWorkspace) {
            query.workspace = params.icmWorkspace;
        }
        response = await axios.put(url, saveJson, { params: query, headers });
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
    const rawHost = (req.get("X-Original-Server") || req.hostname);
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
        const valid = await isUsernameValid(params["username"], params["employeeEndpoint"]);
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
        const query = {
            viewMode: "Catalog",
            inlineattachment: true
        }
        if (params.icmWorkspace) {
            query.workspace = params.icmWorkspace;
        }
        response = await axios.get(url, { params: query, headers });
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
    const rawHost = (req.get("X-Original-Server") || req.hostname);
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
        const valid = await isUsernameValid(params["username"], params["employeeEndpoint"]);
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
        if (params.icmWorkspace) {
            query.workspace = params.icmWorkspace;
        }
        response = await axios.put(url, saveJson, { params: query, headers });
        return res.status(200).send({});
    }

    catch (error) {
        console.log("Error clearing the locked metadata");
        return res.status(400).send({ error: getErrorMessage("FAILED_TO_UNLOCK_FORM") });
    }

}

/* Get the UUIDs (data.items "id"s) from the form for specific field types
 * @params formDefinitionItems  = JSON.parse(savedFormParam)["form_definition"]["data"]["items"]
 * @returns dateItemsId : This will contain all of the IDs of the date fields
 * @returns checkboxItemsId : This will contain all of the IDs of the checkbox fields
 */
function getFormIds (formDefinitionItems) {
    const dateItemsId = [];
    const checkboxItemsId = [];
    formDefinitionItems.forEach(item => { // Add the field types found in this loop into their specific item id arrays
        if (item.containerItems) { // Check for fields in containers (currently, there can be up to 5 container levels)
            item.containerItems.forEach(subItem => {
                if (subItem.type === "date") dateItemsId.push(subItem.id);
                else if (subItem.type === "checkbox") checkboxItemsId.push(subItem.id);
                else if (subItem.type === "container") { // Check container field level 2
                    subItem.containerItems.forEach(subItem2 => {
                        if (subItem2.type === "date") dateItemsId.push(subItem2.id);
                        else if (subItem2.type === "checkbox") checkboxItemsId.push(subItem2.id);
                        else if (subItem2.type === "container") { // Check container field level 3
                            subItem2.containerItems.forEach(subItem3 => {
                                if (subItem3.type === "date") dateItemsId.push(subItem3.id);
                                else if (subItem3.type === "checkbox") checkboxItemsId.push(subItem3.id);
                                else if (subItem3.type === "container") { // Check container field level 4
                                    subItem3.containerItems.forEach(subItem4 => {
                                        if (subItem4.type === "date") dateItemsId.push(subItem4.id);
                                        else if (subItem4.type === "checkbox") checkboxItemsId.push(subItem4.id);
                                        else if (subItem4.type === "container") { // Check container field level 5
                                            subItem4.containerItems.forEach(subItem5 => {
                                                if (subItem5.type === "date") dateItemsId.push(subItem5.id);
                                                else if (subItem5.type === "checkbox") checkboxItemsId.push(subItem5.id);
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        } else if (item.groupItems){ // Check for fields in groups
            item.groupItems.forEach(subItem => {
                subItem.fields.forEach(childItemData => { // Group's fields is where the fields will be in
                    if (childItemData.type === "date") dateItemsId.push(childItemData.id);
                    else if (childItemData.type === "checkbox") checkboxItemsId.push(childItemData.id);
                });
            });
        }
    });
    return { dateItemsId, checkboxItemsId };
}

/**
 * Convert the checkbox value to one of the following:
 * true -> "Yes"
 * false -> "No"
 * undefined -> ""
 */
function convertCheckboxFormatToICM (value) {
    if (value === true) return "Yes";
    else if (value === false) return "No";
    else return "";
}

module.exports.saveICMdata = saveICMdata;
module.exports.loadICMdata = loadICMdata;
module.exports.clearICMLockedFlag = clearICMLockedFlag;
module.exports.getICMAttachmentStatus = getICMAttachmentStatus;