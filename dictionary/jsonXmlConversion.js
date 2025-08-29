/* List of forms that do not convert directly from JSON to XML
 * Keys are the form_definition.form_id
 * Property: rootName : a string that will replace "root" from the XML
 * Property: subRoots : an array of strings. These will be between root and JSON data. The first value in the array will be highest (after root) while the last will be lowest (before JSON)
 * Property: wrapperTags : an array of objects. If not empty, then should include object { [the wrapper Tag name] : { wrapFields: [], wrapperTags: []} } where the second wrapperTag repeats the full object if children are needed.
 * Property: allowBooleanCheckbox : if a field is in this array, skip conversion step
 * Property: omitFields : an array of strings. These are the UUIDs of fields that must be omitted before XML creation. (TO BE DONE in saveICMdataHandler.js)
 * Property: version : a string that will check if the exception list should include the version of the form submitted. All values in version should overwrite the default form properties.
 */
const formExceptions = {
    "HR3689E": { 
        "rootName": "ListOfDtFormInstanceLW", 
        "subRoots": ["FormInstance"],
        "wrapperTags": [],
        "allowBooleanCheckbox": [],
        "omitFields": [],
        "versions": {
            "1": {
                "omitFields": []
            },
            "2": {
                "omitFields": []
            }
        }
    },
    "CF0925": {
        "rootName": "", 
        "subRoots": [],
        "wrapperTags": [
            {
                "ParentGuardian": {
                    "wrapFields": [
                        "last-name-91433118-4a0c-47fe-80d8-2676f83a2022",
                        "first-name-5dd5f94c-be98-4dd1-a442-3903c6330391",
                        "middle-names-690ef4b4-bf83-487e-8ef2-fd39f09fb545",
                        "address-parent-9dcf849c-b28b-4faa-afe3-8603af7c98fa",
                        "unit-fbbdce5c-a970-4d8f-98f5-d3a6e8af6005",
                        "address-1-a81293da-3d95-42cf-b6fa-ec15fac39ed1",
                        "address-2-3f5515c8-8d91-424f-8302-0e7fea6599bf",
                        "city-80cbf0f7-fa28-47f0-a4e4-94793e8a12fb",
                        "province-835a46e3-4a7c-4496-a196-8e93172092ed",
                        "postal-code-29edf972-2b5c-421d-a1ab-d97aa4005911",
                        "primary-phone-number-type-a7eba596-6474-4a01-93e5-6cd49c8ef4cc",
                        "primary-phone-number-f29b9ffd-9e7c-4f20-8bc3-57b333d88a0e",
                        "secondary-phone-number-type-fc15a5f0-bfcd-4fe8-8836-833fc2573525",
                        "secondary-phone-number-135375c3-f0bc-4b3a-aea2-b98995676ebc",
                    ], 
                    "wrapperTags" : []
                },
            },
            {
                "Child" : {
                    "wrapFields" : [],
                    "wrapperTags" : []
                }
            }
        ],
        "allowBooleanCheckbox": [],
        "omitFields": [],
        "versions" : {
            "1" :{
                "omitFields": []
            },
            "2" : {
                "omitFields": []
            }
        }
    } 
};

module.exports = { formExceptions };