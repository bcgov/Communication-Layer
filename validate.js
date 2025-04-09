const fs = require('fs');
const yaml = require('yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Function to load and parse YAML schema
function loadSchema(schemaPath) {
    const schemaFile = fs.readFileSync(schemaPath, 'utf8');
    return yaml.parse(schemaFile);
}

// Function to validate JSON data against a YAML schema
function validateJson(jsonData) {
    const schema = loadSchema("schema/saved_json.yaml");
    const formDefinitionSchema = loadSchema("schema/form_definition.yaml");

    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    // Add the external schema
    ajv.addSchema(formDefinitionSchema, "form_definition_schema");

    const validate = ajv.compile(schema);
    const valid = validate(jsonData);

    return { valid, errors: validate.errors };
}

function isJsonStringValid(jsonDataString) {
    try {
        const jsonData = JSON.parse(jsonDataString);  
        return isJsonValid(jsonData)
      }
      catch (error) {
        console.error("Error converting incoming json:", error);  
        return false;
      }      
}

function isJsonValid(jsonData) {
    try {
            //const jsonData = JSON.parse(jsonDataString);  
            if(jsonData) {        
                const { valid, errors } = validateJson(jsonData);  
                if (valid) {
                console.log('JSON is valid ✅');
                } else {
                console.error('Validation errors ❌:', errors);          
                }
                return valid;
                }
            return false;
        }
      catch (error) {
        console.error("Error converting incoming json:", error);  
        return false;
      }
}


// Export the function so it can be used in other files
module.exports = { validateJson, isJsonStringValid ,isJsonValid };