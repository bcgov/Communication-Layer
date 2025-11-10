/* List of interfaces based on server config
 */
const interfaces = {
    NETportals: {
        interface: [
            {
                type: "button",
                label: "Submit",
                mode: ["portalEdit"],
                style: "",
                actions: [
                    {
                        action_type: "javascript",
                        script: `if (!validateAllFields()) 
                        { setModalTitle("Validation Error"); 
                        setModalMessage("Please clear the errors in the form before submitting."); 
                        setPrimaryButton("");   
                        setSecondaryButton(""); 
                        setModalOpen(true); 
                        return false; }`
                    },
                    {
                        action_type: "javascript",
                        script: `const confirmed = await confirmModal();
                        if (!confirmed) return false;`
                    },         
                    {
                        action_type: "endpoint",
                        api_path: "API.saveButtonAction",
                        body: "tokenId: params[\"id\"],savedForm: JSON.stringify(createSavedData())",
                        type: "POST"
                    },
                    {
                        action_type: "endpoint",
                        api_path: "API.submitButtonAction",
                        body: "tokenId: params[\"id\"]",
                        type: "POST"
                    }
                    ,{
                        action_type: "javascript",
                        script: `await handleSubmit();`
                    }
                ]
            },
            {
                type: "button",
                label: "Print",
                mode: ["portalView"],
                style: "",
                actions: [
                    {
                        action_type: "javascript",
                        script: `handlePrint();`
                    }]
            },
            {
                type: "button",
                label: "Cancel",
                mode: ["portalEdit","portalView"],
                style: "",
                actions: [
                    {
                        action_type: "endpoint",
                        api_path: "API.cancelButtonAction",
                        body: `tokenId: params["id"]`,
                        type: "POST"
                    },
                    {
                        action_type: "javascript",
                        script: `await handleCancel();`
                    }]
            },


        ]
    },
    CAREGIVER: {
        interface: [    
	    {
        mode: [
            "portalNew",
            "portalEdit"
        ],
       type: "button",
      label: "Save",
      style: "",
      actions: [
        {
          script: "setFormErrors({});if (!validateAllFields()){ window.parent.postMessage(JSON.stringify({ \"event\": \"error\" }), \"*\"); return true; }",
          action_type: "javascript"
        },
        {
          body: "tokenId: params[\"id\"],savedForm: JSON.stringify(createSavedData())",
          path: "/application-forms/saveDraft",
          type: "POST",
          api_path: "API.saveButtonAction",
          action_type: "endpoint"
        }        
      ]
    },
	{
      mode: [
        "portalNew",
        "portalEdit"
      ],
      type: "button",
      label: "Complete",
      style: "",
      actions: [
        {
          script: "setFormErrors({});if (!validateAllFields()){ window.parent.postMessage(JSON.stringify({ \"event\": \"error\" }), \"*\"); return false; }",
          action_type: "javascript"
        },
        {
          body: "tokenId: params[\"id\"],savedForm: JSON.stringify(createSavedData())",
          path: "/application-forms/submit",
          type: "POST",
          api_path: "API.saveButtonAction",
          action_type: "endpoint"
        },
        {
          script: "await handleSubmit();",
          action_type: "javascript"
        }       
      ]
    }
  ]
    }
};

module.exports = { interfaces };