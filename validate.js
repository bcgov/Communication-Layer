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
    const schema = loadSchema("savedJsonSchema.yml");

    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const valid = validate(jsonData);

    return { valid, errors: validate.errors };
}

// Export the function so it can be used in other files
module.exports = { validateJson };