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
                        script: `
                        await handleSubmit();`
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
    }
};

module.exports = { interfaces };