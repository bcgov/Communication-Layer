/* List of forms that do not convert directly from JSON to XML
 * Keys are the form_definition.form_id
 * Property: rootName : a string that will replace "root" from the XML
 * Property: subRoots : an array of strings. These will be between root and JSON data. The first value in the array will be highest (after root) while the last will be lowest (before JSON)
 * Property: omitFields : an array of strings. These are the UUIDs of fields that must be omitted before XML creation. (TO BE DONE in saveICMdataHandler.js)
 * Property: version : a string that will check if the exception list should include the version of the form submitted.
 */
const formExceptions = {
     "HR3689E": { 
        "rootName": "ListOfDtFormInstanceLW", 
        "subRoots": ["FormInstance"],
        "omitFields": [],
        "version": "2",
    }
};

module.exports = { formExceptions };