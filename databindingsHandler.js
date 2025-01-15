const fs = require('fs');
const { JSONPath } = require('jsonpath-plus');
const { keycloakForSiebel } = require("./keycloak.js");
const axios = require("axios");

async function populateDatabindings(formJson, params) {
  console.error("Form JSON",formJson);
  //start code here
  try {
    // Extract dataSources from the form JSON
    const dataSources = formJson.datasources;

    // Fetch data from all sources
    const apiData = await fetchDataFromSources(dataSources, params);

    if (!apiData) {
      console.error('No Data found from datsources');
      return null;
    }

    // Map the API data to the form fields
    const boundData = bindDataToFields(formJson, apiData);

    return boundData;
  } catch (error) {
    console.error('Error processing form data:', error);
    return null;
  }
  //end code here

}

async function fetchDataFromSources(dataSources, params) {
  let data = {};
  for (const source of dataSources) {
    try {

      const response = await readJsonFormApi(source, params);
      data[source.name] = response;

    } catch (error) {
      console.error(`Error fetching data from ${source.name}:`, error);
      data[source.name] = null; // Handle missing data source
    }
  }
  return data;
}

function bindDataToFields(formJson, fetchedData) {
  const formData = {};

  // Iterate through fields
  formJson.data.items.forEach(field => {

    if (field.databindings) {

      const dataSourceName = field.databindings.source;
      const dataPath = field.databindings.path;
      const fetchedSourceData = fetchedData[dataSourceName];

      // Fetch the value from the fetched data
      if (fetchedSourceData) {
        const valueFromPath = JSONPath(dataPath, fetchedSourceData);
        // If the field is a group, handle groupItems
        if (field.type === 'group' && field.groupItems) {
          // Create an array to store groupData objects for each item in valueFromPath
          const groupDataArray = valueFromPath.map((pathObj, index) => {
            const groupData = {};

            // For each item in valueFromPath, iterate over the group fields
            field.groupItems.forEach(groupItem => {
              groupItem.fields.forEach(groupField => {
                if (groupField.databindings) {
                  const fieldBindings = groupField.databindings.path;
                  const fieldIdInGroup = `${field.id}-${index}-${groupField.id}`;
                  // Assign data from pathObj or an empty string if not available
                  groupData[fieldIdInGroup] = pathObj[fieldBindings] || '';
                }
              });
            });
            return groupData;
          });

          // Assign the groupDataArray to formData for this field's ID
          formData[field.id] = groupDataArray;
        } else {
          formData[field.id] = valueFromPath.length > 0 ? valueFromPath[0] : null;
        }
      }
    }
  });

  return formData;
}

async function readJsonFormApi(datasource, pathParams) {
  console.log("readJsonFormApi>>pathParams", pathParams);
  const { name, type, host, endpoint, params, body } = datasource;
  //const url = `${endpoint}`;
  const url = buildUrlWithParams(host, endpoint, pathParams);
  try {
    let response;
    const grant =
      await keycloakForSiebel.grantManager.obtainFromClientCredentials();
    const headers = {
      Authorization: `Bearer ${grant.access_token.token}`,
    }
    if (type.toUpperCase() === 'GET') {

      // For GET requests, add params directly in axios config            
      response = await axios.get(url, { params, headers }
      );
    } else if (type.toUpperCase() === 'POST') {
      // For POST requests, pass params in the body if applicable
      const bodyForPost = buildBodyWithParams(body, pathParams)
      response = await axios.post(url, bodyForPost, { params, headers });
    }

    // Store response data
    return response.data;

  } catch (error) {
    console.error(`Error fetching data from ${name}:`, error);
    return null; // Handle missing data source or error
  }
}

function buildUrlWithParams(host, endpoint, pathVariables) {
  const hostFromEnv = getHost(host);
  let url = `${hostFromEnv}${endpoint}`;
  // Replace any placeholder variables like @@attachmentId
  Object.keys(pathVariables).forEach(key => {
    const placeholder = `@@${key}`;
    url = url.replace(new RegExp(placeholder, 'g'), pathVariables[key]);
  });

  return url;
}

function getHost(host) {
  // Use host from  environment variable if available, otherwise fall back to JSON
  return process.env[host] || host;
}

function buildBodyWithParams(bodyFromJson, pathVariables) {

  let bodyString = JSON.stringify(bodyFromJson);

  Object.keys(pathVariables).forEach(key => {
    const placeholder = `@@${key}`;
    bodyString = bodyString.replace(new RegExp(placeholder, 'g'), pathVariables[key]);
  });
  console.log("after body", bodyString);
  return JSON.parse(bodyString);
}


module.exports.populateDatabindings = populateDatabindings;
module.exports.buildUrlWithParams = buildUrlWithParams;
