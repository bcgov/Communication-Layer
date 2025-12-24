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
const {generatePDF }= require("./generatePDFHandler.js");
const { param } = require("./renderHandler.js");

const SIEBEL_ICM_API_FORMS_ENDPOINT = process.env.SIEBEL_ICM_API_FORMS_ENDPOINT;

// Fetch attachment status and locked-by fields from ICM
// authHeaders: optional pre-acquired headers to avoid duplicate Keycloak token calls
async function getICMAttachmentStatus(attachment_id, username, params, authHeaders = null) {
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
        let headers;

        if (authHeaders) {
            headers = authHeaders;
        } else {
            const grant = await keycloakForSiebel.grantManager.obtainFromClientCredentials();
            headers = {
                Authorization: `Bearer ${grant.id_token.token}`,
                "X-ICM-TrustedUsername": username,
            };
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
    let validUsername = false;
    console.log("Params:",params);
    const usernameInParams = params?.username || params?.SessionParams?.username || null;
    const tokenInParams = params?.token || params?.SessionParams?.token || null;

    console.log("Params - token:",tokenInParams);
    console.log("Params - username:",usernameInParams);

    if (usernameInParams) {
        validUsername = await isUsernameValid(usernameInParams, params["employeeEndpoint"]);
        username = validUsername ? usernameInParams : null;
    } else if (tokenInParams) {
        username = await getUsername(tokenInParams, params["employeeEndpoint"]);
        valid = await isUsernameValid(username, params["employeeEndpoint"]);
        username = validUsername ? username : null;
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

    //saveForm validate before saving to ICM and determine kiln version being used
    const includesData = Object.keys(JSON.parse(savedFormParam)).includes("data"); // Check if data exists.
    if (!includesData) {
    console.log('JSON is  not valid ');
    return res
        .status(400)
        .send({ error: getErrorMessage("FORM_NOT_VALID") });
    }
 
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
    
    /**
     * Apply Kiln Version
     * Kiln V1 uses data: { items: []}
     * Kiln V2 uses dataSources []
     */
    const kilnVersion = Object.keys(JSON.parse(savedFormParam)["form_definition"]["data"]).includes("items") ? 1 : 2;
    const formDefinitionItems = kilnVersion === 1 ? JSON.parse(savedFormParam)["form_definition"]["data"]["items"] : JSON.parse(savedFormParam)["form_definition"]["elements"];// This is the field info for form items
    
    // dateItemsId : This will contain all of the IDs of the date fields
    // checkboxItemsId : This will contain all of the IDs of the checkbox fields
    const { dateItemsId, checkboxItemsId, textInfoFields } = getFormIds(formDefinitionItems);

    const dictionary = formExceptions;
    const formId = JSON.parse(savedFormParam)["form_definition"]["form_id"]; // Get the form ID
    const formVersion = JSON.parse(savedFormParam)["form_definition"]["version"]; // Get the form version
    const isFormException = keyExists(dictionary, formId); // If true, then this form will have its exceptions formatted
    let toWrapIds = {}; //List of ids that will need to be placed in a wrapper. This only happens if form exception is true and wrapperTags exists
    const noCheckboxChange = (isFormException && propertyExists(dictionary, formId, "allowCheckboxWithNoChange")) ? dictionary[formId].allowCheckboxWithNoChange : [];
    const omitFields = (isFormException && propertyExists(dictionary, formId, "omitFields")) ? dictionary[formId].omitFields : [];
    const addFields = (isFormException && propertyExists(dictionary, formId, "addFields")) ? dictionary[formId].addFields : {};

    if (isFormException && propertyExists(dictionary, formId, "wrapperTags")) { 
        dictionary[formId]["wrapperTags"].forEach((wrapperTag, index) => {
            const tagKey = Object.keys(dictionary[formId]["wrapperTags"][index])[0];
            if (wrapperTag[tagKey].length != 0) { // If there are any wrappers with no fields, ignore. Otherwise, keep a list of UUID and the wrapper to put it in.
                toWrapIds = {...toWrapIds, ...getWrapperIds(wrapperTag[tagKey], [tagKey])};
            }
        });
    }

    // The updated JSON values required for XML creation
    const truncatedKeysSaveData = fixJSONValuesForXML(saveData, {}, toWrapIds, dateItemsId, checkboxItemsId, textInfoFields, noCheckboxChange, omitFields, addFields, kilnVersion);
    
    let builder; // This will be for building the XML
    if (isFormException) { // If any forms with the correct version (TODO) have been listed as exceptions, then proceed with their form exceptions
        // If the root needs a differernt name, apply it here. Otherwise use the default "root"
        if (propertyExists(dictionary, formId, "rootName") && propertyNotEmpty(dictionary, formId, "rootName")) {
            builder = new xml2js.Builder({xmldec: { version: '1.0' }, renderOpts: { pretty: false }, rootName: dictionary[formId]["rootName"]});
        } else {
            builder = new xml2js.Builder({xmldec: { version: '1.0' }, renderOpts: { pretty: false }});
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
        builder = new xml2js.Builder({xmldec: { version: '1.0' }, renderOpts: { pretty: false }});
        saveJson["XML Hierarchy"] = builder.buildObject(truncatedKeysSaveData);
    } 
    //let url = buildUrlWithParams('SIEBEL_ICM_API_HOST', 'fwd/v1.0/data/DT Form Instance Thin/DT Form Instance Thin/' + attachment_id + '/', '');
    const xml = saveJson["XML Hierarchy"];
    const xmlSize = Buffer.byteLength(xml, 'utf8'); // size in bytes

    // console.log("XML Hierarchy:", xml);
    console.log("XML Hierarchy length (chars):", xml.length);
    console.log("XML Hierarchy size (bytes):", xmlSize);
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

    // Acquire token once and reuse for all ICM calls
    let authHeaders;
    try {
        const grant = await keycloakForSiebel.grantManager.obtainFromClientCredentials();
        authHeaders = {
            Authorization: `Bearer ${grant.id_token.token}`,
            "X-ICM-TrustedUsername": username,
        };
    } catch (error) {
        console.error("Failed to acquire Keycloak token:", error);
        return res.status(500).send({ error: getErrorMessage("GENERIC_ERROR_MSG") });
    }

    let icm_metadata = await getICMAttachmentStatus(attachment_id, username, params, authHeaders);
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
        const query = {
            viewMode: "Catalog",
            inlineattachment: true
        }
        if (params.icmWorkspace) {
            query.workspace = params.icmWorkspace;
        }
        response = await axios.get(url, { params: query, headers: authHeaders });
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

/** Get the UUIDs (data.items "id"s) from the form for specific field types
 * @params formDefinitionItems  = JSON.parse(savedFormParam)["form_definition"]["data"]["items"]
 * @returns dateItemsId : This will contain all of the IDs of the date fields
 * @returns checkboxItemsId : This will contain all of the IDs of the checkbox fields
 * @returns textInfoFields : This will contain all of the IDs of the text-info fields
 */
function getFormIds (formDefinitionItems) {
    let dateItemsId = [];
    let checkboxItemsId = [];
    let textInfoFields = [];
    formDefinitionItems.forEach(item => { // Add the field types found in this loop into their specific item id arrays
        if (item.containerItems) { // Check for fields in containers (currently, there can be up to 5 container levels)
            item.containerItems.forEach(subItem => {
                if (subItem.type === "date") dateItemsId.push(subItem.id);
                else if (subItem.type === "checkbox") checkboxItemsId.push(subItem.id);
                else if (subItem.type === "text-info") textInfoFields.push(subItem.id);
                else if (subItem.type === "container") { 
                    const {dateItemsId: recursiveDateItemIds, checkboxItemsId: recursiveCheckboxItemIds, textInfoFields: recursiveTextInfoFields} = getFormIds([subItem]);
                    dateItemsId = [...dateItemsId, ...recursiveDateItemIds];
                    checkboxItemsId = [...checkboxItemsId, ...recursiveCheckboxItemIds];
                    textInfoFields = [ ...textInfoFields, ...recursiveTextInfoFields];
                }
            });
        } else if (item.groupItems){ // Check for fields in groups
            item.groupItems.forEach(subItem => {
                subItem.fields.forEach(childItemData => { // Group's fields is where the fields will be in
                    if (childItemData.type === "date") dateItemsId.push(childItemData.id);
                    else if (childItemData.type === "checkbox") checkboxItemsId.push(childItemData.id);
                    else if (childItemData.type === "text-info") textInfoFields.push(childItemData.id);
                });
            });
        } else {
            if (item.type === "date") dateItemsId.push(item.id);
            else if (item.type === "checkbox") checkboxItemsId.push(item.id);
            else if (item.type === "text-info") textInfoFields.push(item.id);
        }
    });
    return { dateItemsId, checkboxItemsId, textInfoFields };
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

/** Recursive function that gets all of the wrapper tags from a value in a dictionary's wrapperTags
 * 
 * @param keyPair : {}
 * @param topLevelKeys : []
 * @returns 
 */
function getWrapperIds (keyPair, topLevelKeys) {
    const keys = Object.keys(keyPair);
    if (typeof keyPair === "undefined" || keys.length === 0) return undefined
    let toWrapIds = {};
    keys.forEach(key => {
        if (typeof keyPair[key] === "number") {
            toWrapIds[key] = {tags: topLevelKeys, level: keyPair[key]};            
        } else if (typeof keyPair[key] === "object") {
            const tempKeyWrappers = topLevelKeys.concat([key]);
            const tempWrapperContainer = getWrapperIds(keyPair[key], tempKeyWrappers);
            if (typeof tempWrapperContainer != undefined) {
                Object.keys(tempWrapperContainer).forEach(value => {
                    toWrapIds[value] = tempWrapperContainer[value];
                });
            }
        }
    });
    return toWrapIds;
}

/** When multiple wrappers are listed in dictionary for a uuid, wrap for JSON -> XML here
 * 
 * @param truncatedKeysSaveData 
 * @param toWrapIds 
 * @param dataToWrap 
 * @param oldKey 
 * @param newKey 
 * @param isChild : boolean, checks if the multilevel wrapper was called from the child uuid shortening if-else
 * @returns 
 */
function multilevelWrappers(truncatedKeysSaveData, toWrapIds, dataToWrap, oldKey, newKey, isChild){
    if (toWrapIds[oldKey].tags.length === 1 || toWrapIds[oldKey].level === 0) { //One wrapper
        if(isChild) {
            const wrapperKey = {};
            wrapperKey[newKey] = dataToWrap;
            truncatedKeysSaveData[toWrapIds[oldKey].tags[0]][`${newKey}-List`] = wrapperKey; // Add a wrapper around the children/dependecies
        } else {
            truncatedKeysSaveData[toWrapIds[oldKey].tags[0]][newKey] = dataToWrap;
        }
    } else if (toWrapIds[oldKey].tags.length === 2 || toWrapIds[oldKey].level === 1) { //Two wrappers
        if (!truncatedKeysSaveData[toWrapIds[oldKey].tags[0]][toWrapIds[oldKey].tags[1]]) {
            truncatedKeysSaveData[toWrapIds[oldKey].tags[0]][toWrapIds[oldKey].tags[1]] = {};
        }
        if(isChild) {
            const wrapperKey = {};
            wrapperKey[newKey] = dataToWrap;
            truncatedKeysSaveData[toWrapIds[oldKey].tags[0]][toWrapIds[oldKey].tags[1]][`${newKey}-List`] = wrapperKey;
        } else {
            truncatedKeysSaveData[toWrapIds[oldKey].tags[0]][toWrapIds[oldKey].tags[1]][newKey] = dataToWrap;
        }
    } else if (toWrapIds[oldKey].tags.length === 3 || toWrapIds[oldKey].level === 2) { //Three wrappers
        if (!truncatedKeysSaveData[toWrapIds[oldKey].tags[0]][toWrapIds[oldKey].tags[1]]) {
            truncatedKeysSaveData[toWrapIds[oldKey].tags[0]][toWrapIds[oldKey].tags[1]] = {};
        }
        if (!truncatedKeysSaveData[toWrapIds[oldKey].tags[0]][toWrapIds[oldKey].tags[1]][toWrapIds[oldKey].tags[2]]){
            truncatedKeysSaveData[toWrapIds[oldKey].tags[0]][toWrapIds[oldKey].tags[1]][toWrapIds[oldKey].tags[2]] = {};
        }
        if(isChild) {
            const wrapperKey = {};
            wrapperKey[newKey] = dataToWrap;
            truncatedKeysSaveData[toWrapIds[oldKey].tags[0]][toWrapIds[oldKey].tags[1]][toWrapIds[oldKey].tags[2]][`${newKey}-List`] = wrapperKey;
        } else {
            truncatedKeysSaveData[toWrapIds[oldKey].tags[0]][toWrapIds[oldKey].tags[1]][toWrapIds[oldKey].tags[2]][newKey] = dataToWrap;
        }
    } else if (toWrapIds[oldKey].tags.length === 4 || toWrapIds[oldKey].level === 3) { //Four wrappers
        if (!truncatedKeysSaveData[toWrapIds[oldKey].tags[0]][toWrapIds[oldKey].tags[1]]) {
            truncatedKeysSaveData[toWrapIds[oldKey].tags[0]][toWrapIds[oldKey].tags[1]] = {};
        }
        if (!truncatedKeysSaveData[toWrapIds[oldKey].tags[0]][toWrapIds[oldKey].tags[1]][toWrapIds[oldKey].tags[2]]){
            truncatedKeysSaveData[toWrapIds[oldKey].tags[0]][toWrapIds[oldKey].tags[1]][toWrapIds[oldKey].tags[2]] = {};
        }
        if (!truncatedKeysSaveData[toWrapIds[oldKey].tags[0]][toWrapIds[oldKey].tags[1]][toWrapIds[oldKey].tags[2]][toWrapIds[oldKey].tags[3]]){
            truncatedKeysSaveData[toWrapIds[oldKey].tags[0]][toWrapIds[oldKey].tags[1]][toWrapIds[oldKey].tags[2]][toWrapIds[oldKey].tags[3]] = {};
        }
        if(isChild) {
            const wrapperKey = {};
            wrapperKey[newKey] = dataToWrap;
            truncatedKeysSaveData[toWrapIds[oldKey].tags[0]][toWrapIds[oldKey].tags[1]][toWrapIds[oldKey].tags[2]][toWrapIds[oldKey].tags[3]][`${newKey}-List`] = wrapperKey;
        } else {
            truncatedKeysSaveData[toWrapIds[oldKey].tags[0]][toWrapIds[oldKey].tags[1]][toWrapIds[oldKey].tags[2]][toWrapIds[oldKey].tags[3]][newKey] = dataToWrap;
        }
    }
    return truncatedKeysSaveData
}

/** Take the saveData JSON values and update them to new layout. Changes include:
 * Shorten UUID. 
 * Wrap values with children inside a List. 
 * Wrap specified values under a parent. 
 * Change date format. 
 * Convert checkboxes to use "Yes" or "No". 
 * 
 * @param saveData : = JSON.parse(savedFormParam)["data"]
 * @param truncatedKeysSaveData : list of key-object pairs that will be returned at end of function. These may or may not already include values related to toWrapIds.
 * @param toWrapIds : list of key-string pairs where the keys are UUIDs and the strings are what wrapper tag they need to go under.
 * @param dateItemsId : list of date fields
 * @param checkboxItemsId : list of checkbox fields
 * @param textInfoFields : list of text-info fields. These will be omitted from adding to the XML
 * @param noCheckboxChange : list of checkbox UUIDs that should not have their value changed
 * @param omitFields : list of field UUIDS that should not be included in the XML
 * @param addFields : list of empty fields to add for form to succeed in saving as XML
 * @param {number} kilnVersion : the Kiln version matching the save data json layout
 * @returns truncatedKeysSaveData : a list of key-object pairs
 */

function fixJSONValuesForXML (saveData, truncatedKeysSaveData, toWrapIds, dateItemsId, checkboxItemsId, textInfoFields, noCheckboxChange, omitFields, addFields, kilnVersion) {
    for(let oldKey in saveData) { //This begins trunicating the JSON keys for XML (UUID should be first 8 characters)
        if (!omitFields.includes(oldKey) && !textInfoFields.includes(oldKey)) {
            const stringLength = oldKey.length;
            const newKey = oldKey.substring(0, stringLength-28);
            if (Array.isArray(saveData[oldKey]) > 0 && Object.keys(saveData[oldKey]).length > 0) { //This trunicates child/dependant objects
                const childrenArray = [];
                for(let i = 0; i < saveData[oldKey].length; i++) {
                    const truncatedChildrenKeys = {};
                    for (let oldChildKey in saveData[oldKey][i]) {
                        if (kilnVersion === 1) { // Kiln V1
                            const childStringLength = oldChildKey.length;
                            const newChildKey = oldChildKey.substring(stringLength+3, childStringLength-28);
                            if (!omitFields.includes(oldChildKey.substring(stringLength+3, childStringLength)) && !textInfoFields.includes(oldChildKey.substring(stringLength+3, childStringLength))) {
                                if (dateItemsId.includes(oldChildKey.substring(stringLength+3, childStringLength))) { // If child data is in a date field, change date format from YYYY-MM-DD to MM/DD/YYYY
                                    const newDateFormat = toICMFormat(saveData[oldKey][i][oldChildKey]); 
                                    if (newDateFormat === "-1") {
                                        throw new Error("Invalid date. Was unable to convert to ICM format!");
                                    }
                                    truncatedChildrenKeys[newChildKey] = newDateFormat;
                                } else if (checkboxItemsId.includes(oldChildKey.substring(stringLength+3, childStringLength)) && !noCheckboxChange.includes(oldChildKey.substring(stringLength+3, childStringLength))) { // If child data is in a checkbox field AND is not listed for ommission, change from true/false/undefined to Yes/No/""
                                    truncatedChildrenKeys[newChildKey] = convertCheckboxFormatToICM(saveData[oldKey][i][oldChildKey]);
                                } else {
                                    truncatedChildrenKeys[newChildKey] = saveData[oldKey][i][oldChildKey];
                                }
                            }
                        }
                        else { // Kiln V2
                            const childStringLength = oldChildKey.length;
                            const newChildKey = oldChildKey.substring(0, childStringLength-28);
                            if (!omitFields.includes(oldChildKey.substring(0, childStringLength)) && !textInfoFields.includes(oldChildKey.substring(0, childStringLength))) {
                                if (dateItemsId.includes(oldChildKey.substring(0, childStringLength))) { // If child data is in a date field, change date format from YYYY-MM-DD to MM/DD/YYYY
                                    const newDateFormat = toICMFormat(saveData[oldKey][i][oldChildKey]); 
                                    if (newDateFormat === "-1") {
                                        throw new Error("Invalid date. Was unable to convert to ICM format!");
                                    }
                                    truncatedChildrenKeys[newChildKey] = newDateFormat;
                                } else if (checkboxItemsId.includes(oldChildKey.substring(0, childStringLength)) && !noCheckboxChange.includes(oldChildKey.substring(0, childStringLength))) { // If child data is in a checkbox field AND is not listed for ommission, change from true/false/undefined to Yes/No/""
                                    truncatedChildrenKeys[newChildKey] = convertCheckboxFormatToICM(saveData[oldKey][i][oldChildKey]);
                                } else {
                                    truncatedChildrenKeys[newChildKey] = saveData[oldKey][i][oldChildKey];
                                }
                            }
                        }
                    }
                    if (Object.keys(truncatedChildrenKeys).length != 0) {
                        childrenArray.push(truncatedChildrenKeys);
                    }
                }
                if (toWrapIds[oldKey]) {
                    if (!truncatedKeysSaveData[toWrapIds[oldKey].tags[0]]) { //Initalize wrapper if top level doesn't exist
                        truncatedKeysSaveData[toWrapIds[oldKey].tags[0]] = {};
                    }
                    truncatedKeysSaveData = multilevelWrappers(truncatedKeysSaveData, toWrapIds, childrenArray, oldKey, newKey, true);
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
                        if (!truncatedKeysSaveData[toWrapIds[oldKey].tags[0]]) { //Initalize wrapper if top level doesn't exist
                            truncatedKeysSaveData[toWrapIds[oldKey].tags[0]] = {};
                        }
                        truncatedKeysSaveData = multilevelWrappers(truncatedKeysSaveData, toWrapIds, newDateFormat, oldKey, newKey, false);
                    } else {
                        truncatedKeysSaveData[newKey] = newDateFormat;
                    }
                } else if (checkboxItemsId.includes(oldKey) && !noCheckboxChange.includes(oldKey)) { // If data is in a checkbox field AND is not listed for ommission, change from true/false/undefined to Yes/No/""
                    if (toWrapIds[oldKey]) {
                        if (!truncatedKeysSaveData[toWrapIds[oldKey].tags[0]]) { //Initalize wrapper if top level doesn't exist
                            truncatedKeysSaveData[toWrapIds[oldKey].tags[0]] = {};
                        }
                        const newCheckboxFormat = convertCheckboxFormatToICM(saveData[oldKey]);
                        truncatedKeysSaveData = multilevelWrappers(truncatedKeysSaveData, toWrapIds, newCheckboxFormat, oldKey, newKey, false);
                    } else {
                        truncatedKeysSaveData[newKey] = convertCheckboxFormatToICM(saveData[oldKey]);
                    }
                } else {
                    if (toWrapIds[oldKey]) {
                        if (!truncatedKeysSaveData[toWrapIds[oldKey].tags[0]]) { //Initalize wrapper if top level doesn't exist
                            truncatedKeysSaveData[toWrapIds[oldKey].tags[0]] = {};
                        }
                        truncatedKeysSaveData = multilevelWrappers(truncatedKeysSaveData, toWrapIds, saveData[oldKey], oldKey, newKey, false);
                    } else {
                        truncatedKeysSaveData[newKey] = saveData[oldKey]; //Data is added to new JSON with the truncated key
                    }
                }
            }
        }
    }
    //Check additional fields needed before returning final value
    const additionalFieldKeys = Object.keys(addFields);
    if (additionalFieldKeys.length > 0) {
        additionalFieldKeys.forEach(key => {
            if (addFields[key] === null) { //Parent key/field. If it passes, then this should not exist in form already because this is for ADDING fields. If it exists in form, it will be overwritten.
                truncatedKeysSaveData[key] = null;
            } else if (truncatedKeysSaveData[key] === undefined) { //If truncatedKeysSaveData[key] does not exist, create it with all values under the add key from dictionary
                truncatedKeysSaveData[key] = addFields[key];
            } else { //Has children in dictionary AND truncatedKeysSaveData exists already

                    //Consider making the following a recursive function in a future iteration
                    /**
                     * For each key:
                     *  Check to see if field is undefined. If undefined, then define it as empty
                     *  Get the keys of the object if avaliable. Otherwise, get empty array
                     *  If truncatedKeysSaveData keys lead to a group/list: apply values from dictionary
                     *  Else if there are child keys avaliable: check the child keys (i.e. repeat this for each key)
                     *  Else: save current level truncatedKeysSaveData with the current dictionary key values
                     */

                const childFields1 = addFields[key] != null ? Object.keys(addFields[key]) : [];
                 if (truncatedKeysSaveData[key] && truncatedKeysSaveData[key].length != undefined) {
                    truncatedKeysSaveData[key][childKey1].forEach((value, index) => {
                        truncatedKeysSaveData[key][index] = {...truncatedKeysSaveData[key][index], ...addFields[key]};
                    });
                } else if(childFields1.length > 0) {
                    childFields1.forEach(childKey1 => {
                        if (truncatedKeysSaveData[key][childKey1] === undefined) {
                            truncatedKeysSaveData[key][childKey1] = {};
                        }
                        const childFields2 = addFields[key][childKey1] != null ? Object.keys(addFields[key][childKey1]) : [];
                        if (truncatedKeysSaveData[key][childKey1] && truncatedKeysSaveData[key][childKey1].length != undefined) { //Add the second layer of empty fields to groups
                            truncatedKeysSaveData[key][childKey1].forEach((value, index) => {
                                truncatedKeysSaveData[key][childKey1][index] = {...truncatedKeysSaveData[key][childKey1][index], ...addFields[key][childKey1]};
                            });
                        } else if (childFields2.length > 0) { //Continue if there are more fields listed
                            childFields2.forEach(childKey2 => {
                                if (truncatedKeysSaveData[key][childKey1][childKey2] === undefined) {
                                    truncatedKeysSaveData[key][childKey1][childKey2] = {};
                                }
                                const childFields3 = addFields[key][childKey1][childKey2] != null ? Object.keys(addFields[key][childKey1][childKey2]) : [];
                                if (truncatedKeysSaveData[key][childKey1][childKey2] && truncatedKeysSaveData[key][childKey1][childKey2].length != undefined) {
                                    truncatedKeysSaveData[key][childKey1][childKey2].forEach((value, index) => {
                                        truncatedKeysSaveData[key][childKey1][childKey2][index] = {...truncatedKeysSaveData[key][childKey1][childKey2][index], ...addFields[key][childKey1][childKey2]};
                                    });
                                } else if (childFields3.length > 0) {
                                    childFields3.forEach(childKey3 => {
                                        if (truncatedKeysSaveData[key][childKey1][childKey2][childKey3] === undefined) {
                                            truncatedKeysSaveData[key][childKey1][childKey2][childKey3] = {};
                                        }
                                        const childFields4 = addFields[key][childKey1][childKey2][childKey3] != null ? Object.keys(addFields[key][childKey1][childKey2][childKey3]) : [];
                                        if (truncatedKeysSaveData[key][childKey1][childKey2][childKey3] && truncatedKeysSaveData[key][childKey1][childKey2][childKey3].length != undefined) {
                                            truncatedKeysSaveData[key][childKey1][childKey2][childKey3].forEach((value, index) => {
                                                truncatedKeysSaveData[key][childKey1][childKey2][childKey3][index] = {...truncatedKeysSaveData[key][childKey1][childKey2][childKey3][index], ...addFields[key][childKey1][childKey2][childKey3]};
                                            });
                                        } else if (childFields4.length > 0) {
                                            childFields4.forEach(childKey4 => {
                                                if (truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4] === undefined) {
                                                    truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4] = {};
                                                }
                                                const childFields5 = addFields[key][childKey1][childKey2][childKey3][childKey4] != null ? Object.keys(addFields[key][childKey1][childKey2][childKey3][childKey4]) : [];
                                                if (truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4] && truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4].length != undefined) {
                                                    truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4].forEach((value, index) => {
                                                        truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4][index] = {...truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4][index], ...addFields[key][childKey1][childKey2][childKey3][childKey4]};
                                                    });
                                                } else if (childFields5.length > 0) {
                                                    childFields5.forEach(childKey5 => {
                                                        if (truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4][childKey5] === undefined) {
                                                            truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4][childKey5] = {};
                                                        }
                                                        const childFields6 = addFields[key][childKey1][childKey2][childKey3][childKey4][childKey5] != null ? Object.keys(addFields[key][childKey1][childKey2][childKey3][childKey4][childKey5]) : [];
                                                        if (truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4][childKey5] && truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4][childKey5].length != undefined) {
                                                            truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4][childKey5].forEach((value, index) => {
                                                                truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4][childKey5][index] = {...truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4][childKey5][index], ...addFields[key][childKey1][childKey2][childKey3][childKey4][childKey5]};
                                                            });
                                                        } else if (childFields6.length > 0) {
                                                            childFields6.forEach(childKey6 => {
                                                                if (truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4][childKey5][childKey6] === undefined) {
                                                                    truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4][childKey5][childKey6] = {};
                                                                }
                                                                if (truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4][childKey5][childKey6] && truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4][childKey5][childKey6].length != undefined) {
                                                                    truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4][childKey5].forEach((value, index) => {
                                                                        truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4][childKey5][childKey6][index] = {...truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4][childKey5][childKey6][index], ...addFields[key][childKey1][childKey2][childKey3][childKey4][childKey5][childKey6]};
                                                                    });
                                                                } else {
                                                                    truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4][childKey5][childKey6] = addFields[key][childKey1][childKey2][childKey3][childKey4][childKey5][childKey6];
                                                                }
                                                            });
                                                        } else {
                                                            truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4][childKey5] = addFields[key][childKey1][childKey2][childKey3][childKey4][childKey5];
                                                        }
                                                    });
                                                } else {
                                                    truncatedKeysSaveData[key][childKey1][childKey2][childKey3][childKey4] = addFields[key][childKey1][childKey2][childKey3][childKey4];
                                                }
                                            });
                                        } else {
                                            truncatedKeysSaveData[key][childKey1][childKey2][childKey3] = addFields[key][childKey1][childKey2][childKey3];
                                        }
                                    });
                                } else {
                                    truncatedKeysSaveData[key][childKey1][childKey2] = addFields[key][childKey1][childKey2];
                                }
                            });
                        } else { //If value is null or if truncatedKeysSaveData[key][childKey1] did not exist
                            truncatedKeysSaveData[key][childKey1] = addFields[key][childKey1];
                        }
                    });
                } else { //The parent key has not been made yet, so make it and add dictionary values. This is just a precaution because the scenario should be solved during addFields null check
                    truncatedKeysSaveData[key] = addFields[key];
                }
            }
        });
    }
    return truncatedKeysSaveData;
}

async function loadICMdataAsPDF(req,res) {
    
    //load the savedJson form ICM.
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

    // Acquire token once and reuse for all ICM calls
    let authHeaders;
    try {
        const grant = await keycloakForSiebel.grantManager.obtainFromClientCredentials();
        authHeaders = {
            Authorization: `Bearer ${grant.id_token.token}`,
            "X-ICM-TrustedUsername": username,
        };
    } catch (error) {
        console.error("Failed to acquire Keycloak token:", error);
        return res.status(500).send({ error: getErrorMessage("GENERIC_ERROR_MSG") });
    }

    let icm_metadata = await getICMAttachmentStatus(attachment_id, username, params, authHeaders);
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
        const query = {
            viewMode: "Catalog",
            inlineattachment: true
        }
        if (params.icmWorkspace) {
            query.workspace = params.icmWorkspace;
        }
        response = await axios.get(url, { params: query, headers: authHeaders });
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
        
        const pdfBuffer = await generatePDF(return_data); //get the pdf from the savedJson  

        const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');    
        res.status(200).json({        
        pdf_base64: pdfBase64
        });
    }
    catch (error) {
        console.error(`Error loading data from ICM for PDF:`, error);
        return res
            .status(400)
            .send({ error: getErrorMessage("GENERIC_ERROR_MSG") });
    }
}

module.exports.saveICMdata = saveICMdata;
module.exports.loadICMdata = loadICMdata;
module.exports.clearICMLockedFlag = clearICMLockedFlag;
module.exports.getICMAttachmentStatus = getICMAttachmentStatus;
module.exports.loadICMdataAsPDF =  loadICMdataAsPDF;