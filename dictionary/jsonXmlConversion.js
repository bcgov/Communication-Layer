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
    "CF0630": {
        "rootName": "ListOfDtFormInstanceLw", 
        "subRoots": ["FormInstance"],
        "wrapperTags": [],
        "allowCheckboxWithNoChange": [],
        "omitFields": [],
        "addFields": {},
        "versions": {
            "1": {
                "omitFields": []
            },
            "2": {
                "omitFields": []
            }
        }
    },
    "CF0631": {
        "rootName": "ListOfDtFormInstanceLw", 
        "subRoots": ["FormInstance"],
        "wrapperTags": [],
        "allowCheckboxWithNoChange": [],
        "omitFields": [],
        "addFields": {},
        "versions": {
            "1": {
                "omitFields": []
            },
            "2": {
                "omitFields": []
            }
        }
    },
    "CF0632": {
        "rootName": "ListOfDtFormInstanceLw", 
        "subRoots": ["FormInstance"],
        "wrapperTags": [],
        "allowCheckboxWithNoChange": [],
        "omitFields": [],
        "addFields": {},
        "versions": {
            "1": {
                "omitFields": []
            },
            "2": {
                "omitFields": []
            }
        }
    },
    "CF0633": {
        "rootName": "ListOfDtFormInstanceLw", 
        "subRoots": ["FormInstance"],
        "wrapperTags": [
            {
                "ListOfTeamLeads": {
                    "TeamLead": {
                        "team-leader-name-25e284ba-5eaf-4b67-afb0-9d05e7214669": 1
                    }
                },
                "ListOfOffice": {
                    "Office": {
                        "office-code-a7c2501c-d181-4b1a-a44e-1036e4f1f77b": 1
                    }
                }
            }
        ],
        "allowCheckboxWithNoChange": [],
        "omitFields": [],
        "addFields": {
            "ListOfUserEnteredData9": {
                "UserEnteredData9": {
                    "String35": null,
                    "String34": null,
                    "String33": null,
                    "Date1": null
                }
            },
            "ListOfUserEnteredData8": {
                "UserEnteredData8": {
                    "String42": null,
                    "String41": null
                }
            },
            "ListOfUserEnteredData12": {
                "UserEnteredData12": {
                    "String42": null,
                    "String41": null,
                    "String36": null,
                    "Date9": null
                }
            },
            "HeaderERIQ": null,
            "Created": null,
            "FormInstanceId": null,
            "CreatedBy": null,
            "CaseContactERIQ": null,
            "SRNum": null,
            "BenefitPlanId": null,
            "CaseId": null,
            "Category": null,
            "ContactId": null,
            "DocFileName": null,
            "DocFileSize": null,
            "DocFileSrcType": null,
            "FinalFlag": null,
            "ICPId": null,
            "IncidentNo": null,
            "MISCaseNum": null,
            "CaseNum": null,
            "SRId": null,
            "SubCategory": null,
            "Template": null,
            "RenderFlatFlag": null,
            "Bool01": null,
            "Bool02": null,
            "Bool03": null,
            "Bool04": null,
            "Bool05": null,
            "TemplateLocation": null,
            "Date01": null,
            "Date03": null,
            "Date04": null,
            "Date05": null,
            "String01": null,
            "String02": null,
            "String03": null,
            "String04": null,
            "String05": null,
            "String06": null,
            "String07": null,
            "String08": null,
            "String09": null,
            "String10": null,
            "String11": null,
            "AuxName": null,
            "AuxType": null,
            "Number01": null,
            "Number02": null,
            "Number03": null,
            "Number04": null,
            "Number05": null,
            "Bool06": null,
            "Bool07": null,
            "Bool08": null,
            "Bool09": null,
            "Bool010": null,
            "Date06": null,
            "Date07": null,
            "Bool11": null,
            "Bool12": null,
            "Bool13": null,
            "Bool14": null,
            "Bool15": null,
            "Bool16": null,
            "Bool17": null,
            "Bool18": null,
            "Bool19": null,
            "Bool20": null,
            "Bool21": null,
            "Bool22": null,
            "Bool23": null,
            "Bool24": null,
            "Bool25": null,
            "Bool26": null,
            "Bool27": null,
            "Bool28": null,
            "Bool29": null,
            "Bool30": null,
            "Bool31": null,
            "Bool32": null,
            "Bool33": null,
            "Bool34": null,
            "Bool35": null,
            "Bool36": null,
            "Bool37": null,
            "Bool38": null,
            "Bool39": null,
            "Bool40": null,
            "Bool41": null,
            "Bool42": null,
            "Bool43": null,
            "Bool44": null,
            "Bool45": null,
            "Bool46": null,
            "Bool47": null,
            "Bool48": null,
            "Bool49": null,
            "Bool50": null,
            "String14": null,
            "String15": null,
            "String16": null,
            "String17": null,
            "String18": null,
            "String19": null,
            "String20": null,
            "String21": null,
            "String22": null,
            "String23": null,
            "String24": null,
            "String25": null,
            "String26": null,
            "String27": null,
            "String28": null,
            "String29": null,
            "String30": null,
            "String31": null,
            "String32": null,
            "String33": null,
            "String34": null,
            "String35": null,
            "String36": null,
            "String37": null,
            "String38": null,
            "String39": null,
            "String40": null,
            "String41": null,
            "String42": null,
            "String43": null,
            "String44": null,
            "String45": null,
            "String46": null,
            "String47": null,
            "String48": null,
            "String49": null,
            "String50": null,
            "String51": null,
            "String52": null,
            "String53": null,
            "String54": null,
            "String55": null,
            "String56": null,
            "String57": null,
            "String58": null,
            "String59": null,
            "String60": null,
            "String61": null,
            "String62": null,
            "String63": null,
            "String64": null,
            "String65": null,
            "ListOfContact": {
                "Contact": {
                    "BirthDate": null,
                    "CaseRelTypeCode": null,
                    "ClientIDNumber": null,
                    "EmailAddress": null,
                    "FirstName": null,
                    "FullName": null,
                    "FullNameMiddle": null,
                    "LastName": null,
                    "MF": null,
                    "MiddleName": null,
                    "MiddleNameInitial": null
                }
            },
            "ListOfCase": {
                "Case": {
                    "CaseNum": null,
                    "Name": null,
                    "Status": null,
                    "ListOfContactAbove18": {
                        "ContactAbove18": {
                            "ContactFullName": null,
                            "ContactFullNameMiddle": null,
                            "AddressLine2": null,
                            "Province": null,
                            "AddressLine1": null,
                            "City": null,
                            "AddressLine3": null,
                            "PostalCode": null,
                            "ClientIDNumber": null,
                            "MiddleNameInitial": null,
                            "PersonUId": null
                        }
                    },
                    "ListOfContactBelow18": {
                        "ContactBelow18": {
                            "AddressLine1": null,
                            "AddressLine2": null,
                            "City": null,
                            "PostalCode": null,
                            "AddressLine3": null,
                            "ContactFullName": null,
                            "Province": null,
                            "ContactFullNameMiddle": null,
                            "Gender": null,
                            "ContactId": null,
                            "Age": null,
                            "BirthDate": null,
                            "FirstName": null,
                            "Role": null,
                            "ClientIDNumber": null,
                            "MiddleName": null,
                            "Relationship": null,
                            "MiddleNameInital": null,
                            "LastName": null,
                            "PersonUId": null,
                            "Date01": null,
                            "PersonIdICM": null,
                            "Number02": null
                        }
                    }
                }
            },
            "ListOfEmployee": {
                "Employee": {
                    "EMailAddr": null,
                    "Emp": null,
                    "Fax": null,
                    "FirstName": null,
                    "FullName": null,
                    "FullNameMiddle": null,
                    "JobTitle": null,
                    "LastName": null,
                    "MiddleName": null,
                    "MiddleNameInitial": null,
                    "WorkPhoneNumber": null
                }
            },
            "ListOfDtFormInstanceChildData": {
                "DtFormInstanceChildData": {
                    "Date01": null,
                    "Date02": null,
                    "Number01": null,
                    "Number02": null,
                    "Number03": null,
                    "Number04": null,
                    "String01": null,
                    "String02": null
                }
            },
            "ListOfDtFormInstanceChildData2": {
                "DtFormInstanceChildData2": {
                    "Bool01": null,
                    "Date01": null,
                    "Number05": null,
                    "String01": null,
                    "String02": null
                }
            },
            "ListOfDtFormInstanceChildData3": {
                "DtFormInstanceChildData3": {
                    "Bool03": null,
                    "String01": null,
                    "String02": null,
                    "String03": null,
                    "String04": null,
                    "String05": null,
                    "String07": null,
                    "String08": null,
                    "String09": null
                }
            },
            "ListOfDtFormInstanceChildData4": {
                "DtFormInstanceChildData4": {
                    "Bool01": null
                }
            },
            "ListOfDtFormInstanceChildData11": {
                "DtFormInstanceChildData11": {
                    "Bool01": null,
                    "Date01": null,
                    "Date02": null,
                    "String01": null,
                    "String02": null
                }
            },
            "ListOfDtFormInstanceChildData5": {
                "DtFormInstanceChildData5": {
                    "String12": null,
                    "String13": null,
                    "String14": null
                }
            }
        },
        "versions": {
            "1": {
                "omitFields": []
            },
            "2": {
                "omitFields": []
            }
        }
    },
    "CF0640" : {
        "rootName": "ListOfDtFormInstanceLw", 
        "subRoots": ["FormInstance"],
        "wrapperTags": [],
        "allowCheckboxWithNoChange": [],
        "omitFields": [],
        "addFields": {
            "ListOfPUBLead": {
                "PUBLead": {
                    "LeadID": null,
                    "Name": null,
                    "ListOfICMCPScreeningAssessment": {
                        "ICMCPScreeningAssessment": {
                            "DateApproved": null,
                            "GeneralNeglectC": null,
                            "GeneralNeglectFlag": null,
                            "Neglect": null,
                            "OverrideNPRA": null,
                            "OverrideNPRB": null,
                            "OverridePRA": null,
                            "OverrideReadOnlyCalc": null,
                            "Phone": null,
                            "PhysicalAbuseF": null,
                            "Position": null,
                            "ResponseNameExplanation": null,
                            "SevereNeglectFlag": null,
                            "SexualAbuseC": null,
                            "TLSummary": null,
                            "TeamLeaderPositionId": null
                        }
                    }
                }
            },
            "FormInstanceId": null,
            "SRNum": null,
            "CaseId": null,
            "IncidentNo": null,
            "SRId": null,
            "Template": null,
            "TemplateLocation": null
        },
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
        "rootName": "form1", 
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
        "addFields": {
            "SRSubType": null,
            "ParentGuardian": {
                "ApplicantMailingAddress": null
            }
        },
        "versions" : {
            "1" :{
                "omitFields": []
            },
            "2" : {
                "omitFields": []
            }
        }
    },
    "CF0926": {
        "rootName": "form1", 
        "subRoots": [],
        "wrapperTags": [],
        "allowCheckboxWithNoChange": [],
        "omitFields": [],
        "addFields": {},
        "versions": {
            "1": {
                "omitFields": []
            },
            "2": {
                "omitFields": []
            }
        }
    },
    "CF1070": {
        "rootName": "ListOfDtFormInstanceLw", 
        "subRoots": ["FormInstance"],
        "wrapperTags": [],
        "allowCheckboxWithNoChange": [],
        "omitFields": [],
        "addFields": {
            "Created": null,
            "FormInstanceId": null,
            "CreatedBy": null,
            "SRNum": null,
            "BenefitPlanId": null,
            "CaseId": null,
            "Category": null,
            "DocFileName": null,
            "DocFileSize": null,
            "DocFileSrcType": null,
            "FinalFlag": null,
            "MISCaseNum": null,
            "CaseNum": null,
            "SRId": null,
            "SubCategory": null,
            "Template": null,
            "RenderFlatFlag": null,
            "Bool01": null,
            "Bool02": null,
            "Bool03": null,
            "Bool04": null,
            "Bool05": null,
            "TemplateLocation": null,
            "Date01": null,
            "Date02": null,
            "Date03": null,
            "Date04": null,
            "Date05": null,
            "String01": null,
            "String02": null,
            "String03": null,
            "String04": null,
            "String05": null,
            "String06": null,
            "String07": null,
            "String08": null,
            "String09": null,
            "String10": null,
            "String11": null,
            "String12": null,
            "AuxName": null,
            "AuxType": null,
            "Number01": null,
            "Number02": null,
            "Number03": null,
            "Number04": null,
            "Number05": null,
            "Bool06": null,
            "Bool07": null,
            "Bool08": null,
            "Bool09": null,
            "Bool10": null,
            "Date06": null,
            "Date07": null,
            "Bool11": null,
            "Bool12": null,
            "Bool13": null,
            "Bool14": null,
            "Bool15": null,
            "Bool16": null,
            "Bool17": null,
            "Bool18": null,
            "Bool19": null,
            "Bool20": null,
            "Bool21": null,
            "Bool22": null,
            "Bool23": null,
            "Bool24": null,
            "Bool25": null,
            "Bool26": null,
            "Bool27": null,
            "Bool28": null,
            "Bool29": null,
            "Bool30": null,
            "Bool31": null,
            "Bool32": null,
            "Bool33": null,
            "Bool34": null,
            "Bool35": null,
            "Bool36": null,
            "Bool37": null,
            "Bool38": null,
            "Bool39": null,
            "Bool40": null,
            "Bool41": null,
            "Bool42": null,
            "Bool43": null,
            "Bool44": null,
            "Bool45": null,
            "Bool46": null,
            "Bool47": null,
            "Bool48": null,
            "Bool49": null,
            "Bool50": null,
            "String13": null,
            "String14": null,
            "String15": null,
            "String16": null,
            "String17": null,
            "String18": null,
            "String19": null,
            "String20": null,
            "String21": null,
            "String22": null,
            "String23": null,
            "String24": null,
            "String25": null,
            "String26": null,
            "String27": null,
            "String28": null,
            "String29": null,
            "String30": null,
            "String31": null,
            "String32": null,
            "String33": null,
            "String34": null,
            "String35": null,
            "String36": null,
            "String37": null,
            "String38": null,
            "String39": null,
            "String40": null,
            "String41": null,
            "String42": null,
            "String43": null,
            "String44": null,
            "String45": null,
            "String46": null,
            "String47": null,
            "String48": null,
            "String49": null,
            "String50": null,
            "String51": null,
            "String52": null,
            "String53": null,
            "String54": null,
            "String55": null,
            "String56": null,
            "String57": null,
            "String58": null,
            "String59": null,
            "String60": null,
            "String61": null,
            "String62": null,
            "String63": null,
            "String64": null,
            "String65": null,
            "ListOfEmployee": {
                "Employee": {
                    "EMailAddr": null,
                    "Emp": null,
                    "Fax": null,
                    "FirstName": null,
                    "FullName": null,
                    "FullNameMiddle": null,
                    "JobTitle": null,
                    "LastName": null,
                    "MiddleName": null,
                    "MiddleNameInitial": null,
                    "WorkPhoneNumber": null
                }
            },
            "ListOfTeamLeads": {
                "TeamLead": {
                    "EMailAddr": null,
                    "Emp": null,
                    "Fax": null,
                    "FirstName": null,
                    "FullName": null,
                    "FullNameMiddle": null,
                    "JobTitle": null,
                    "LastName": null,
                    "MiddleName": null,
                    "MiddleNameInitial": null,
                    "WorkPhoneNumber": null
                }
            },
            "ListOfOffice": {
                "Office": {
                    "OfficeName": null,
                    "OfficeRegion": null,
                    "OfficeAddressLine1": null,
                    "OfficeAddressLine2": null,
                    "OfficeAddressLine3": null,
                    "OfficeAddressCity": null,
                    "OfficeAddressProvince": null,
                    "OfficeAddressCountry": null,
                    "OfficeAddressPostalCode": null,
                    "OfficeAddressUnit": null,
                    "OfficePhone": null,
                    "OfficeFax": null,
                    "OfficeAddressComplete": null,
                    "OfficeAddressCompleteCity": null
                }
            },
            "ListOfPubHlsIncident": {
                "PubHlsIncident": {
                    "ListOfIcmIncidentSafetyAssessmentBc": {
                        "IcmIncidentSafetyAssessmentBc": {
                            "ApprovedtoFinalizeDate": null,
                            "FinalizedBy": null,
                            "FinalizedDate": null,
                            "SafetyFactorA": null,
                            "AssessmentId": null
                        }
                    },
                    "IncidentCity": null,
                    "IncidentLocation": null,
                    "IncidentPostalCode": null,
                    "Location": null,
                    "Name": null,
                    "ListOfIncidentContactBelow18": {
                        "IncidentContactBelow18": {
                            "ContactFullName": null,
                            "ContactFullNameMiddle": null,
                            "MiddleNameInitial": null,
                            "MiddleName": null,
                            "Number01": null,
                            "Number03": null
                        }
                    }
                }
            }
        },
        "versions": {
            "1": {
                "omitFields": []
            },
            "2": {
                "omitFields": []
            }
        }
    },
    "CF2900": {
        "rootName": "ListOfDtFormInstanceLw", 
        "subRoots": [],
        "wrapperTags": [
            {
                "ListofDependent": {
                    "Dependent": {
                        "CareArrangementsList": {
                            "CareArrangements": {
                                "licensed-group-b650d0a6-2871-433c-9a2b-9e80a2f7c9a8": 3,
                            }
                        },
                        "first-name-4f1d33c2-cd25-4801-9902-d1d33a0ba010": 1,
                        "middle-name-9db65275-66a0-4f3d-856b-9cd9ded0f385": 1,
                        "last-name-dc75eb1e-d57d-4383-a9e6-5e0a86513700": 1,
                        "date-of-birth-yyyy-mmm-dd-0e756b1c-47c9-482b-82fa-9c681c87ea55": 1,
                        "radiobuttonlist-d7ada287-f4af-4a1a-ad9f-daa893b8789f": 1,
                        "radiobuttonlist-bdbd4d0f-daf0-445e-abb0-4eb42f3e15c0": 1,
                        "licensed-group-b650d0a6-2871-433c-9a2b-9e80a2f7c9a8": 1,
                        "licensed-family-f14e4cd1-204e-41a7-b1b2-d7b910cc2ee4": 1,
                        "licensed-preschool-program-15821c42-4a1f-4fc4-98e0-6a0fedc6cf91": 1,
                        "registered-licence-not-required-455d1970-fe3a-4d7c-9ca0-d365f1177fb1": 1,
                        "licence-not-required-a0b0868e-c7e0-43d3-b688-d2569108c595": 1,
                        "in-childs-home-2b8a7f32-e472-4cad-aba5-254b33125844": 1,
                        "radiobuttonlist-28b592b7-aba8-46dc-8caf-815b8684fd31": 1,
                        "custody-details-e38e1e1a-4db9-460d-bde3-a9b626419173": 1
                    }
                }
            },
            {
                "ListReasonForCare": {
                    "ReasonForCare": {
                        "name-of-employers-school-training-program-or-dates-looking-for-work-3bb24589-196e-4a3b-bf9d-0b2616efec89": 1,
                        "start-date-yyyy-mmm-dd-a745b70e-8304-4814-be69-1b232c44beeb": 1,
                        "end-date-yyyy-mmm-dd-d2df073a-101d-4a68-bf42-1a040ebf7585": 1,
                        "week-days-andor-week-ends-317392fa-4395-401a-b9ec-fd60930177f1": 1,
                        "week-end-days-per-week-8baf2547-c051-4fc5-849a-5aa527fb326a": 1,
                        "week-end-hours-per-day-3afabfee-a210-4465-80e3-788bae3d59d4": 1,
                        "week-day-days-per-week-3176c7d7-751b-4753-871c-d53bf6128e3e": 1,
                        "week-day-hours-per-day-00303def-6fad-49d6-b72b-183abef2fbd5": 1,
                        "regular-schedule-73687eed-2e55-4aa7-821a-deab607da5d3": 1,
                        "start-time-0187c5ad-c8b0-420b-bded-595d2ecad5bd": 1,
                        "end-time-d7f384c0-f80f-4aa3-9430-7a86187897df": 1,
                        "additional-information-or-attach-a-schedule-77a4d493-0468-40a7-8d0e-af9ab9906085": 1,
                        "travel-time-c1ab5674-a91d-4ab2-b096-213b07bdb69d": 1
                    }
                }
            }
        ],
        "allowCheckboxWithNoChange": [],
        "omitFields": [],
        "addFields": {
            "AlternateIncomePresent": null,
            "ICMAssistance": null,
            "SpousalConsent": null,
            "SpouseAdditionalIncomeReported": null,
            "SpouseAlternateIncomePresent": null,
            "ApplicantSocialWorkerInvolvement": null,
            "ICMApplicantDateofBirth": null,
            "ApplicantGender": null,
            "ApplicantPrimaryPhoneNumberType": null,
            "ApplicantHomeApartment": null,
            "ApplicantHomeMAKID": null,
            "ApplicantMailingApartment": null,
            "ApplicantEmail": null,
            "CareArrangementUploaded": null,
            "ICMSpouseDateofBirth": null,
            "SpouseGender": null,
            "ListofDependent": {
                "Dependent": {
                    "CareArrangementsList": {
                        "CareArrangements": {
                            "LicenceNumber": null,
                            "MailingAddress": null,
                            "MailingCity": null,
                            "MailingPostalCode": null,
                            "CCAProviderComments": null,
                            "FacilityID": null,
                            "CCAProviderName": null,
                            "CCAProviderDaytimePhone": null,
                            "CCAProviderSecondaryPhone": null,
                            "FacilityName": null,
                            "ServiceAddress": null,
                            "ServiceCity": null,
                            "ServicePostalCode": null,
                            "CCACareType": null,
                            "SundayFlag": null,
                            "SaturdayFlag": null,
                            "CCASupplierNumber": null,
                            "CCAStartDate": null,
                            "CCAEndDate": null,
                            "MonthlyFee": null,
                            "DailyFee": null,
                            "SchoolClosureFee": null,
                            "EnrolledYN": null,
                            "SummerFlag": null,
                            "CCAChildRelatedFlag": null,
                            "CCAChildHomeFlag": null,
                            "CCARelativeFlag": null,
                            "CCARelationship": null,
                            "CCASameHomeFlag": null,
                            "CCAParentComments": null,
                            "ParentSumissionDate": null,
                            "ProviderSubmissionDate": null,
                            "ProviderBCeID": null,
                            "MondayFlag": null,
                            "MondayTime1Start": null,
                            "MondayTime1End": null,
                            "TuesdayFlag": null,
                            "TuesdayStart1Time": null,
                            "TuesdayEnd1Time": null,
                            "WednesdayFlag": null,
                            "WednesdayStart1Time": null,
                            "WednesdayEnd1Time": null,
                            "ThursdayFlag": null,
                            "ThursdayStart1Time": null,
                            "ThursdayEnd1Time": null,
                            "FridayFlag": null,
                            "FridayStart1Time": null,
                            "FridayEnd1Time": null,
                            "ProviderOrLicenseeName": null,
                            "FirstTimeApplyingFlag": null,
                            "ReplacingProviderFlag": null,
                            "ReplacingProviderName": null,
                            "AdditionalProviderFlag": null,
                            "OtherProviderName": null
                        }
                    },
                    "ICMDependantDateofBirth": null,
                    "DependantGender": null,
                    "DependantMinistryPlacement": null,
                    "ICMDependentCount": null
                }
            },
            "ListofIncome": {
                "AdditionalIncomeReported": null
            },
            "ListReasonForCare": {
                "ReasonForCare": {
                    "Role": null,
                    "CareType": null,
                    "ICMTravelTime": null,
                    "ICMStartDate": null,
                    "ICMCareType": null
                }
            },
            "ICMBCFlag": null,
            "ICMFerderalFlagSpouse": null,
            "ICMFederalFlag": null,
            "Field1": null,
            "ICMSpouseGUID": null,
            "CareArrangementExists": null,
            "CareArrangementDetailsPresent": null,
            "CRAFiled": null,
            "IncomeSameSinceTaxFiling": null,
            "SpouseCRAFiled": null,
            "SpouseIncomeSameSinceTaxFiling": null
        },
        "versions": {
            "1": {
                "omitFields": []
            },
            "2": {
                "omitFields": []
            }
        }
    },
    "HR0080": {
        "rootName": "Results", 
        "subRoots": [],
        "wrapperTags": [],
        "allowCheckboxWithNoChange": [],
        "omitFields": [],
        "addFields": {
            "OfficeCity": null,
            "FormInstanceId": null,
            "Sanctioned": null,
            "CanadianCitizen": null,
            "ApplicantTwoYearIndependence": null,
            "ApplicantTwoYearRationale": null,
            "SpouseTwoYearIndependence": null,
            "SpouseTwoYearRationale": null
        },
        "versions": {
            "1": {
                "omitFields": []
            },
            "2": {
                "omitFields": []
            }
        }
    },
    "HR3687E": {
        "rootName": "ListOfDtFormInstanceLw", 
        "subRoots": ["FormInstance"],
        "wrapperTags": [],
        "allowCheckboxWithNoChange": [],
        "omitFields": [],
        "addFields": {
            "FormInstanceId": null,
            "CreatedBy": null,
            "SRNum": null,
            "BenefitPlanId": null,
            "CaseId": null,
            "Category": null,
            "ContactId": null,
            "DocFileName": null,
            "DocFileSize": null,
            "DocFileSrcType": null,
            "FinalFlag": null,
            "ICPId": null,
            "MISCaseNum": null,
            "SRId": null,
            "SubCategory": null,
            "Template": null,
            "RenderFlatFlag": null,
            "Bool01": null,
            "Bool02": null,
            "Bool03": null,
            "Bool04": null,
            "Bool05": null,
            "TemplateLocation": null,
            "Date01": null,
            "Date02": null,
            "Date03": null,
            "Date04": null,
            "Date05": null,
            "String01": null,
            "String02": null,
            "String03": null,
            "String04": null,
            "String05": null,
            "String06": null,
            "String07": null,
            "String08": null,
            "String09": null,
            "String10": null,
            "String11": null,
            "String12": null,
            "AuxName": null,
            "AuxType": null,
            "Number01": null,
            "Number02": null,
            "Number03": null,
            "Number04": null,
            "Number05": null,
            "Bool06": null,
            "Bool07": null,
            "Bool08": null,
            "Bool09": null,
            "Bool10": null,
            "Date06": null,
            "Date07": null,
            "Bool11": null,
            "Bool12": null,
            "Bool13": null,
            "Bool14": null,
            "Bool15": null,
            "Bool16": null,
            "Bool17": null,
            "Bool18": null,
            "Bool19": null,
            "Bool20": null,
            "Bool21": null,
            "Bool22": null,
            "Bool23": null,
            "Bool24": null,
            "Bool25": null,
            "Bool26": null,
            "Bool27": null,
            "Bool28": null,
            "Bool29": null,
            "Bool30": null,
            "Bool31": null,
            "Bool32": null,
            "Bool33": null,
            "Bool34": null,
            "Bool35": null,
            "Bool36": null,
            "Bool37": null,
            "Bool38": null,
            "Bool39": null,
            "Bool40": null,
            "Bool41": null,
            "Bool42": null,
            "Bool43": null,
            "Bool44": null,
            "Bool45": null,
            "Bool46": null,
            "Bool47": null,
            "Bool48": null,
            "Bool49": null,
            "Bool50": null,
            "String13": null,
            "String14": null,
            "String15": null,
            "String16": null,
            "String17": null,
            "String18": null,
            "String19": null,
            "String20": null,
            "String21": null,
            "String22": null,
            "String23": null,
            "String24": null,
            "String25": null,
            "String26": null,
            "String27": null,
            "String28": null,
            "String29": null,
            "String30": null,
            "String31": null,
            "String32": null,
            "String33": null,
            "String34": null,
            "String35": null,
            "String36": null,
            "String37": null,
            "String38": null,
            "String39": null,
            "String40": null,
            "String41": null,
            "String42": null,
            "String43": null,
            "String44": null,
            "String45": null,
            "String46": null,
            "String47": null,
            "String48": null,
            "String49": null,
            "String50": null,
            "String51": null,
            "String52": null,
            "String53": null,
            "String54": null,
            "String55": null,
            "String56": null,
            "String57": null,
            "String58": null,
            "String59": null,
            "String60": null,
            "String61": null,
            "String62": null,
            "String63": null,
            "String64": null,
            "String65": null,
            "ListOfContact": {
                "Contact": {
                    "BirthDate": null,
                    "CaseRelTypeCode": null,
                    "ClientIDNumber": null,
                    "FullName": null,
                    "FullNameMiddle": null,
                    "MF": null,
                    "MiddleName": null,
                    "MiddleNameInitial": null,
                    "SIN": null,
                    "WorkPhone": null,
                    "ListOfContactAddresses": null
                },
                "ListOfCase": {
                    "Case": {
                        "PrimaryOrganizationName": null,
                        "Name": null,
                        "Status": null,
                        "AssignToFN": null,
                        "AssignToLN": null,
                        "ListOfICMCaseAddress": null
                    }
                },
                "ListOfEmployee": {
                    "Employee": {
                        "EMailAddr": null,
                        "Emp": null,
                        "Fax": null,
                        "FirstName": null,
                        "Login": null,
                        "FullName": null,
                        "FullNameMiddle": null,
                        "JobTitle": null,
                        "LastName": null,
                        "MiddleName": null,
                        "MiddleNameInitial": null,
                        "WorkPhoneNumber": null
                    }
                },
                "ListOfAttCreatedBy": {
                    "AttCreatedBy": {
                        "Id": null,
                        "Emp": null,
                        "FullName": null,
                        "JobTitle": null
                    }
                },
                "ListOfOffice": {
                    "Office": {
                        "OfficeRegion": null,
                        "OfficeAddressLine2": null,
                        "OfficeAddressLine3": null,
                        "OfficeAddressCountry": null,
                        "OfficeAddressUnit": null,
                        "OfficePhone": null,
                        "OfficeFax": null,
                        "OfficeAddressCompleteCity": null
                    }
                }
            }
        },
        "versions": {
            "1": {
                "omitFields": []
            },
            "2": {
                "omitFields": []
            }
        }
    },
    "HR3688E": {
        "rootName": "ListOfDtFormInstanceLw", 
        "subRoots": ["FormInstance"],
        "wrapperTags": [],
        "allowCheckboxWithNoChange": [],
        "omitFields": [],
        "addFields": {},
        "versions": {
            "1": {
                "omitFields": []
            },
            "2": {
                "omitFields": []
            }
        }
    },
    "HR3689E": { 
        "rootName": "ListOfDtFormInstanceLw", 
        "subRoots": ["FormInstance"],
        "wrapperTags": [],
        "allowCheckboxWithNoChange": [],
        "omitFields": [],
        "addFields": {},
        "versions": {
            "1": {
                "omitFields": []
            },
            "2": {
                "omitFields": []
            }
        }
    },
    "HR3690E": { 
        "rootName": "ListOfDtFormInstanceLw", 
        "subRoots": ["FormInstance"],
        "wrapperTags": [],
        "allowCheckboxWithNoChange": [],
        "omitFields": [],
        "addFields": {},
        "versions": {
            "1": {
                "omitFields": []
            },
            "2": {
                "omitFields": []
            }
        }
    },
    "HR3704E": {
        "rootName": "ListOfDtFormInstanceLw", 
        "subRoots": ["FormInstance"],
        "wrapperTags": [],
        "allowCheckboxWithNoChange": [],
        "omitFields": [],
        "addFields": {},
        "versions": {
            "1": {
                "omitFields": []
            },
            "2": {
                "omitFields": []
            }
        }
    }
};

module.exports = { formExceptions };