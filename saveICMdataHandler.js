const { keycloakForSiebel } = require("./keycloak.js");
const axios = require("axios");
const databindingsHandler = require("./databindingsHandler.js");
const buildUrlWithParams = databindingsHandler.buildUrlWithParams;
const xml2js = require("xml2js");

// utility function to fetch Attachment status (In Progress, Open...)
//  and Locked By User field  
async function getICMAttachmentStatus(attachment_id) {
    let return_data = {};
    return_data["Status"] = "";
    return_data["Locked by User"] = "";
    return_data["DocFileName"] = "";
    if (!attachment_id || attachment_id == "") {
        return return_data;
    }
    let url = buildUrlWithParams('SIEBEL_ICM_API_HOST', 'fwd/v1.0/data/DT Form Instance Thin/DT Form Instance Thin/' + attachment_id + '/', '');
    try {
        let response;
        const grant =
            await keycloakForSiebel.grantManager.obtainFromClientCredentials();
        const headers = {
            Authorization: `Bearer ${grant.access_token.token}`,
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
        return_data["DocFileName"] = response.data["DocFileName"];
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

    const params = req.body;
    const attachment_id = params["attachmentId"];
    console.log("attachment_id>>", attachment_id);
    if (!attachment_id) {
        return res
            .status(400)
            .send({ error: "Attachment Id is  required" });
    }
    let form_metadata = await getICMAttachmentStatus(attachment_id);

    if (!form_metadata) {
        return null;
    }

    let saveJson = {};
    saveJson["Id"] = attachment_id;
    //saveJson["Office Name"] = office_name;
    saveJson["Status"] = "In Progress";
    saveJson["DocFileName"] = form_metadata["DocFileName"];
    saveJson["DocFileExt"] = "json";
    saveJson["Doc Attachment Id"] = Buffer.from(params.savedForm).toString('base64');
    let saveData = JSON.parse(params.savedForm)["data"];
    let builder = new xml2js.Builder();
    saveJson["XML Hierarchy"] = builder.buildObject(saveData);

    let url = buildUrlWithParams('SIEBEL_ICM_API_HOST', 'fwd/v1.0/data/DT Form Instance Thin/DT Form Instance Thin/' + attachment_id + '/', '');
    try {
        let response;
        const grant =
            await keycloakForSiebel.grantManager.obtainFromClientCredentials();
        const headers = {
            Authorization: `Bearer ${grant.access_token.token}`,
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

// method to load a JSON file from ICM, given the attachmentId
async function loadICMdata(req, res) {

    const params = req.body;
    const attachment_id = params["attachmentId"];
    const office_name = params["OfficeName"];
    console.log("attachment_id>>", attachment_id);
    if (!attachment_id) {
        return res
            .status(400)
            .send({ error: "Attachment Id is  required" });
    }
    let icm_metadata = await getICMAttachmentStatus(attachment_id);
    let icm_status = icm_metadata["Status"];
    console.log(icm_metadata);
    if (!icm_status || icm_status == "") {
        console.log("Error fetching Form Instance Thin data for ", attachment_id);
        return null;
    }
    //let url = buildUrlWithParams('SIEBEL_ICM_API_HOST', 'fwd/v1.0/data/DT FormFoundry Upsert/DT Form Instance Orbeon Revise/'+attachment_id+'/','');
    let url = buildUrlWithParams('SIEBEL_ICM_API_HOST', 'fwd/v1.0/data/DT Form Instance Thin/DT Form Instance Thin/' + attachment_id + '/', '');
    try {
        let response;
        const grant =
            await keycloakForSiebel.grantManager.obtainFromClientCredentials();
        const headers = {
            Authorization: `Bearer ${grant.access_token.token}`,
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
        if (icm_status == "Complete") {
            let new_data = JSON.parse(return_data);
            new_data.form_definition.readOnly = true;
            return_data = JSON.stringify(new_data);
        }
        return res.status(200).send(return_data);
    }
    catch (error) {
        console.error(`Error loading data from ICM:`, error);
        return null; // Handle missing data source or error
    }

}
async function clearICMLockedFlag(req, res) {
    const params = req.body;
    const attachment_id = params["attachmentId"];
    if (!attachment_id) {
        return res
            .status(400)
            .send({ error: "Attachment Id is  required" });
    }
    try {
        console.log("Clearing....");

        //check that attachment ID exists and that the form is locked
        let icm_metadata = await getICMAttachmentStatus(attachment_id);
        let icm_status = icm_metadata["Status"];
        if (!icm_status || icm_status == "") {
            console.log("Bad status!");
            return res
                .status(400)
                .send({ error: "Attachment Id not found" });
        }
        if (!icm_metadata["Locked by User"] || icm_metadata["Locked by User"] == "") {
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
        saveJson["Locked by User"] = "";
        saveJson["Locked By Id"] = "";
        saveJson["Token"] = "";

        let url = buildUrlWithParams('SIEBEL_ICM_API_HOST', 'fwd/v1.0/data/DT Form Instance Thin/DT Form Instance Thin/' + attachment_id + '/', '');
        let response;
        const grant =
            await keycloakForSiebel.grantManager.obtainFromClientCredentials();
        const headers = {
            Authorization: `Bearer ${grant.access_token.token}`,
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
        console.log("Error clearing the locked metadata");
        return res.status(400).send({ error: "Failed to unlock the form" });
    }

}
module.exports.saveICMdata = saveICMdata;
module.exports.loadICMdata = loadICMdata;
module.exports.clearICMLockedFlag = clearICMLockedFlag;