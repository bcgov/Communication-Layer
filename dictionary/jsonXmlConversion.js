/* List of forms that do not convert directly from JSON to XML
 * Keys are the form_definition.form_id
 * Property: rootName : a string that will replace "root" from the XML
 * Property: subRoots : an array of strings. These will be between root and JSON data. The first value in the array will be highest (after root) while the last will be lowest (before JSON)
 * Property: wrapperTags : an array of objects. If not empty, then should include object { [the wrapper Tag name] : { wrapFieldsName: indexOfDepth } }
 * Property: allowCheckboxWithNoChange : if a field is in this array, skip conversion step
 * Property: omitFields : an array of strings. These are the UUIDs of fields that must be omitted before XML creation. For child UUIDs, include only the values after "-i-" where i is the index of the list
 * Property: version : a string that will check if the exception list should include the version of the form submitted. All values in version should overwrite the default form properties.
 */
const formExceptions = {
    "HR3689E": { 
        "rootName": "ListOfDtFormInstanceLW", 
        "subRoots": ["FormInstance"],
        "wrapperTags": [],
        "allowCheckboxWithNoChange": [],
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
                    "last-name-91433118-4a0c-47fe-80d8-2676f83a2022": 0,
                    "first-name-5dd5f94c-be98-4dd1-a442-3903c6330391": 0,
                    "middle-names-690ef4b4-bf83-487e-8ef2-fd39f09fb545": 0,
                    "address-parent-9dcf849c-b28b-4faa-afe3-8603af7c98fa": 0,
                    "unit-fbbdce5c-a970-4d8f-98f5-d3a6e8af6005": 0,
                    "address-1-a81293da-3d95-42cf-b6fa-ec15fac39ed1": 0,
                    "address-2-3f5515c8-8d91-424f-8302-0e7fea6599bf": 0,
                    "city-80cbf0f7-fa28-47f0-a4e4-94793e8a12fb": 0,
                    "province-835a46e3-4a7c-4496-a196-8e93172092ed": 0,
                    "postal-code-29edf972-2b5c-421d-a1ab-d97aa4005911": 0,
                    "primary-phone-number-type-a7eba596-6474-4a01-93e5-6cd49c8ef4cc": 0,
                    "primary-phone-number-f29b9ffd-9e7c-4f20-8bc3-57b333d88a0e": 0,
                    "secondary-phone-number-type-fc15a5f0-bfcd-4fe8-8836-833fc2573525": 0,
                    "secondary-phone-number-135375c3-f0bc-4b3a-aea2-b98995676ebc": 0
                }
            },
            {
                "Child" : {
                    "child-last-name-15a0adbf-a3bd-4bd1-be3f-bfb9a2b02f3e": 0,
                    "child-first-name-4a8302bb-6eca-46c8-ae50-efe37434ea8e": 0,
                    "child-middle-names-81cf1856-1541-4eed-85d8-1f376b727fd0": 0,
                    "child-dob-3d6f9a94-7c0f-4a06-89dc-872ee39fa818": 0
                }
            },
            {
                "PartB" : {
                    "sub-total-equipment-and-supplies-96a6e253-7a5d-4c7e-b2f4-abe26d48c478": 0,
                    "sub-total-training-ff57ad93-2e67-496e-aace-830303b0172e": 0,
                    "total-tte-e9836886-e4c3-49cf-83c8-c708dd005ab7": 0,
                    "eligible-total-tte-8de84d25-c659-4b7d-91b8-e16f99e44a29": 0,
                    "i-agree-that-these-expenses-are-related-to-my-childs-autism-intervention-52374221-28ad-4214-ad55-24c731900c21": 0,
                    "equipment-and-supplies-expense-605f2d0c-41d7-412d-9eff-6786964e5c6f": 0,
                    "TravelList": {
                        "Travel": {
                            "reason-for-travel-da2832f4-b848-4601-bd2f-2d796bf085c8": 2,
                            "start-date-of-trip-719d8dd1-fbb9-422c-afa8-2aaacaf61ccb": 2,
                            "end-date-of-trip-11639718-ab5b-40a6-a724-b89aecbc4a62" : 2,
                            "name-of-travellers-67f591a6-8f2c-4242-9653-49c6b95ae9e2": 2,
                            "from-location-5b51204f-e85c-4846-8c12-38373df07ef4": 2,
                            "to-location-52571198-2842-41b9-aec6-3e4f4bb23599": 2,
                            "travel-expense-68d80d8a-ed7f-44cc-8d85-74b10d62d7d8": 2
                        }
                    },
                    "training-expense-6452d421-896d-4ae3-9588-621fca63151f": 0,
                    "sub-total-travel-e78551b9-35f1-40d5-8e7e-8ef00637753d": 0,
                    "eligible-sub-total-travel-bf11f98e-d39f-4a67-a1a2-a0b6b36a7440": 0,
                }
            },
            {
                "InterventionService": {
                    "start-date-intervention-e2cda870-27fc-4b35-876d-0af737e13ea0": 0,
                    "end-date-intervention-13687d44-ebfc-419e-8fa0-238d7ef29836": 0,
                    "total-intervention-54d8d0df-9a34-4474-9e34-077a9bb3b3ff": 0,
                    "eligible-total-intervention-751659e6-5f37-41ab-b179-21c22e2292a5": 0,
                    "intervention-expense-77e6cc72-66f9-4b6d-a437-cf64b7017b1f": 0,
                    "funding-period-start-dc5ab528-454b-4746-a556-a2591ff3967b": 0,
                    "funding-period-end-date-b47975a4-2d33-4578-9c00-ce42da63a99e": 0
                }
            }
        ],
        "allowCheckboxWithNoChange": [],
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