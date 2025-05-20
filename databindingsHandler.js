const fs = require('fs');
const { JSONPath } = require('jsonpath-plus');
const { keycloakForSiebel } = require("./keycloak.js");
const axios = require("axios");
const { getUsername, isUsernameValid } = require('./usernameHandler.js');
const { parse, format } = require("date-fns");


async function populateDatabindings(formJson, params) {
  //start code here
  try {
    // Extract dataSources from the form JSON
    const dataSources = formJson.dataSources;

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
  if (dataSources != null) {
    for (const source of dataSources) {
      try {

        const response = await readJsonFormApi(source, params);
        data[source.name] = response;

      } catch (error) {
        console.error(`Error fetching data from ${source.name}:`, error);
        data[source.name] = null; // Handle missing data source
      }
    }
  }
  return data;
}

function bindDataToFields(formJson, fetchedData) {
  const formData = {};

  const processItemsForDatabinding = (items) => {
    items.forEach(field => {

      if (field.type === 'container' && field.containerItems) {
        processItemsForDatabinding(field.containerItems);
      } else if (field.databindings != null) {

        const dataSourceName = field.databindings.source;
        const dataPath = field.databindings.path;
        const fetchedSourceData = fetchedData[dataSourceName];
        let valueFromPath = "";

        // Fetch the value from the fetched data
        if (fetchedSourceData) {
          valueFromPath = JSONPath(dataPath, fetchedSourceData);
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
                    groupData[fieldIdInGroup] = transformValueToBindIfNeeded(groupField, pathObj[fieldBindings]) || '';
                  }
                });
              });
              return groupData;
            });

            // Assign the groupDataArray to formData for this field's ID
            formData[field.id] = groupDataArray;
          } else {
            formData[field.id] = valueFromPath.length > 0 ? transformValueToBindIfNeeded(field, valueFromPath[0]) : null;
          }
        }
      } else if (field.type === 'group' && field.groupItems && !field.repeater) {
        const transformedItem = {};
        //get the databindings from individual filed from non-repeating group
        field.groupItems.forEach(groupItem => {
          groupItem.fields.forEach(groupField => {
            if (groupField.databindings) {
              const dataSourceName = groupField.databindings.source;
              const dataPath = groupField.databindings.path;
              const fetchedSourceData = fetchedData[dataSourceName];
              const fieldIdInGroup = `${field.id}-0-${groupField.id}`;
              if (fetchedSourceData) {
                const valueFromPathForGroupField = JSONPath(dataPath, fetchedSourceData);
                //do date conversion here uisng a function - chceking the type as date and then checking format and applying
                transformedItem[fieldIdInGroup] = valueFromPathForGroupField.length > 0 ? transformValueToBindIfNeeded(groupField, valueFromPathForGroupField[0]) : null; // Replace with actual value
              }
            }
          });
        });
        formData[field.id] = [transformedItem];
      }
    });
  }

  if (formJson?.data?.items) {
    processItemsForDatabinding(formJson.data.items);
  }

  // Iterate through fields
  formJson.data.items.forEach

  return formData;
}

async function readJsonFormApi(datasource, pathParams) {
  console.log("readJsonFormApi>>pathParams", pathParams);
  const { name, type, host, endpoint, params, body } = datasource;

  let username = null;

  if (pathParams["token"]) {
    username = await getUsername(pathParams["token"]);
  } else if (pathParams["username"]) {
    const valid = await isUsernameValid(pathParams["username"]);
    username = valid ? pathParams["username"] : null;
  }

  if (!username || !isNaN(username)) {
    return res
      .status(401)
      .send({ error: "Username is not valid" });
  }

  try {
    const url = buildUrlWithParams(host, endpoint, pathParams);
    let response;
    const grant =
      await keycloakForSiebel.grantManager.obtainFromClientCredentials();
    const headers = {
      Authorization: `Bearer ${grant.id_token.token}`,
      "X-ICM-TrustedUsername": username,
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
  const endpointFromEnv = getEndpoint(endpoint);
  let url = `${hostFromEnv}${endpointFromEnv}`;
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

function getEndpoint(endpoint) {
  // Use endpoint from environment variable if available, otherwise fall back to JSON
  return process.env[endpoint] || endpoint;
}
function buildBodyWithParams(bodyFromJson, pathVariables) {

  let bodyString = JSON.stringify(bodyFromJson);

  Object.keys(pathVariables).forEach(key => {
    const placeholder = `@@${key}`;
    bodyString = bodyString.replace(new RegExp(placeholder, 'g'), pathVariables[key]);
  });
  return JSON.parse(bodyString);
}

function transformValueToBindIfNeeded(field, valueToBind) {

  try {
    if (field && (field.type == "date" || field.type == "date-picker") && valueToBind) {
      const formatToBind = field.inputFormat ? field.inputFormat : "MM/dd/yyyy";
      const parsedDate = parse(valueToBind, formatToBind, new Date());
      const transformedValue = format(parsedDate, "yyyy-MM-dd");
      return transformedValue;
    }
  } catch (error) {
    console.error('Error processing date value:', error);
  }
  return valueToBind;
}

module.exports.populateDatabindings = populateDatabindings;
module.exports.buildUrlWithParams = buildUrlWithParams;
