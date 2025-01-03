({
    /**
     * This method checks if the user has permission for global copilot or not.
     * @param {Object} component
     * @param {Object} event
     * @param {Object} helper
     */
    doInit: function (component, event, helper) {
        helper.initGlobalCopilotModal();
        //helper.initializeModalIcon(component);
    }
});