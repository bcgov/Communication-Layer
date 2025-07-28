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
    const boundData = bindDataToFields(formJson, apiData, params);

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

        let updatedParams = updateParams(source.params || {}, params, data);
        const response = await readJsonFormApi(source, { ...params, ...updatedParams });
        data[source.name] = response;

      } catch (error) {
        console.error(`Error fetching data from ${source.name}:`, error);
        data[source.name] = null; // Handle missing data source
      }
    }
  }
  return data;
}

function getBindingValue(bindings, fetchedData, params = {}) {
  // Normalize singular binding to array if needed
  let list;
  if (Array.isArray(bindings)) {
    list = bindings;
  } else if (bindings && bindings.source && bindings.path) {
    list = [{
      order: 0,
      condition: '',
      source:  bindings.source,
      path: bindings.path
    }];
  } else {
    return null;
  }

  const sortedBindings = list.slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  // Evaluate each binding
  for (const binding of sortedBindings) {
    // Parse condition
    const [conditionField, valuesListString = ''] = (binding.condition || '').split('=').map(str => str.trim());

    // Evaluate condition
    if (conditionField) {
      const allowedValues = valuesListString.split(',').map(str => str.trim());
      const currentParam = params[conditionField];
      if (!allowedValues.includes(currentParam)) {
        continue; 
      }
    }

    const sourceData = fetchedData[binding.source] || {};
    const results = JSONPath({ path: binding.path, json: sourceData });

    if (Array.isArray(results) && results.length > 0 && results[0] != null && results[0] !== '') {
      return results[0];
    }
  }

  return null;
}

function bindDataToFields(formJson, fetchedData, params = {}) {
  const formData = {};

  const processItemsForDatabinding = (items) => {
    items.forEach(field => {

      if (field.type === 'container' && field.containerItems) {
        processItemsForDatabinding(field.containerItems);

      }  else if (field.databindings) {
        // Use new array‑based bindings, otherwise wrap the legacy binding
        const bindings = Array.isArray(field.databindings) ? field.databindings : [ field.databindings ];
        const raw = getBindingValue(bindings, fetchedData, params);

        if (field.type === 'group' && field.groupItems) {
          const groupDataArray = raw && Array.isArray(raw)
            ? raw.map((pathObj, index) => {
                const groupData = {};
                field.groupItems.forEach(groupItem => {
                  groupItem.fields.forEach(groupField => {
                    if (groupField.databindings) {
                      const gf = Array.isArray(groupField.databindings) ? groupField.databindings[0] : groupField.databindings;
                      const fieldIdInGroup = `${field.id}-${index}-${groupField.id}`;
                      const subVal = JSONPath({ path: gf.path, json: pathObj })[0];
                      groupData[fieldIdInGroup] = transformValueToBindIfNeeded(groupField, subVal) || '';
                    }
                  });
                });
                return groupData;
              })
            : [];
          formData[field.id] = groupDataArray;

        } else {
          formData[field.id] = raw != null
            ? transformValueToBindIfNeeded(field, raw)
            : null;
        }
      }

      else if (field.type === 'group' && field.groupItems && !field.repeater) {
        const transformedItem = {};
        field.groupItems.forEach(groupItem => {
          groupItem.fields.forEach(groupField => {
            if (groupField.databindings) {
                const gf = Array.isArray(groupField.databindings) ? groupField.databindings[0] : groupField.databindings;
                const fetchedSourceData = fetchedData[gf.source] || {};
                const vals = JSONPath({ path: gf.path, json: fetchedSourceData });
                const id = `${field.id}-0-${groupField.id}`;
                transformedItem[id] = vals.length > 0 ? transformValueToBindIfNeeded(groupField, vals[0]): null;
              }
          });
        });
        formData[field.id] = [transformedItem];
      }
    });
  };

  if (formJson?.data?.items) {
    processItemsForDatabinding(formJson.data.items);
  }

  return formData;
}

async function readJsonFormApi(datasource, pathParams) {
  console.log("readJsonFormApi>>pathParams", pathParams);
  const { name, type, host, endpoint, body } = datasource;

  let username = null;

  if (pathParams["token"]) {
    username = await getUsername(pathParams["token"],pathParams["employeeEndpoint"]);
  } else if (pathParams["username"]) {
    const valid = await isUsernameValid(pathParams["username"],pathParams["employeeEndpoint"]);
    username = valid ? pathParams["username"] : null;
  }

  if (!username || !isNaN(username)) {
    return res
      .status(401)
      .send({ error: "Username is not valid" });
  }

  let apiHost = pathParams["apiHost"];
  if (!apiHost || !isNaN(apiHost)) {
    return res
      .status(401)
      .send({ error: "API host is not valid" });
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
      response = await axios.get(url, { params: pathParams, headers }
      );
    } else if (type.toUpperCase() === 'POST') {
      // For POST requests, pass params in the body if applicable
      const bodyForPost = buildBodyWithParams(body, pathParams);
      response = await axios.post(url, bodyForPost, { params: pathParams, headers });
    }

    // Store response data
    return ensureObjectOrArray(response.data);

  } catch (error) {
    console.error(`Error fetching data from ${name}:`, error);
    return null; // Handle missing data source or error
  }
}

function buildUrlWithParams(host, endpoint, pathVariables) {
  const hostFromEnv = getHost(pathVariables,host);
  const endpointFromEnv = getEndpoint(endpoint);
  let url = `${hostFromEnv}${endpointFromEnv}`;
  // Replace any placeholder variables like @@attachmentId
  Object.keys(pathVariables).forEach(key => {
    const placeholder = `@@${key}`;
    url = url.replace(new RegExp(placeholder, 'g'), pathVariables[key]);
  });

  return url;
}


function getHost(params, host) {
  // Use host from  environment variable if available, otherwise fall back to JSON
  try {
    return params["apiHost"];
  } catch {
    return process.env[host];
  }
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

function ensureObjectOrArray(val, itemKey = "items") {
  if (!val) return null;
  // Unwrap `items` if it exists
  if (val[itemKey] !== undefined) {
    if (Array.isArray(val[itemKey])) {
      return val[itemKey][0] ?? null;
    }
    if (typeof val[itemKey] === "object" && val[itemKey] !== null) {
      return val[itemKey];
    }
    return val[itemKey];
  }
  if (typeof val === "object" && val !== null) return val;
  return null;
}


function updateParams(params, pathParams = {}, allFetchedData = {}) {
  const updated = {};
  for (const key of Object.keys(params)) {
    let val = params[key];

    // 1. Replace @@placeholders from pathParams
    if (typeof val === 'string') {
      Object.keys(pathParams).forEach(pathKey => {
        const placeholder = `@@${pathKey}`;
        val = val.replace(new RegExp(placeholder, 'g'), pathParams[pathKey]);
      });
    }

    // 2. Replace all !!.[Source]=jsonpath in the string
    if (typeof val === 'string') {
      val = val.replace(/'!!\.\[([^\]]+)\]=(.+\])'/g, (match, sourceName, jsonPath) => {
        const sourceData = allFetchedData[sourceName.trim()];
          const valueArr = JSONPath({ path: jsonPath.trim(), json: sourceData || {} });

          let safeValue = '';
          if (Array.isArray(valueArr) && valueArr.length > 0 && valueArr[0] != null) {
            const raw = valueArr[0];
            if (typeof raw === 'object' && raw !== null) {
              safeValue = raw.Id ?? raw.id ?? JSON.stringify(raw);
            } else {
              safeValue = raw;
            }
            safeValue = String(safeValue).replace(/'/g, "\\'");
          }
          return `'${safeValue}'`;
        }
      );
    }

    updated[key] = val;
  }
  return updated;
}

module.exports.populateDatabindings = populateDatabindings;
module.exports.buildUrlWithParams = buildUrlWithParams;
