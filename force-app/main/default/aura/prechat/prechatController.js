({
    /**
     * Reference Link: https://blog.enree.co/2018/11/salesforce-dealing-with-the-running-user-on-einstein-bot-dialogs.html
     * @param {*} component 
     * @param {*} event 
     * @param {*} helper 
     */
    doInit: function(component, event, helper) {
        var action = component.get("c.getCurrentUser");
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                var result = JSON.parse(response.getReturnValue());
                component.set('v.userId', result.userId);
                if(result.userId){
                    component.set('v.firstName', result.firstName);
                    component.set('v.lastName', result.lastName);
                    component.set('v.email', result.email);
                    helper.startChat(component, event, helper);
                }
            } else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.log("Error message: " +
                                 errors[0].message);
                    }
                } else {
                    console.log("Unknown error");
                }
            }
        });
        $A.enqueueAction(action);
    },
    onStartButtonClick: function(component, event, helper) {
        //handling errors
        if(!component.get('v.firstName')
          || !component.get('v.lastName')
           || !component.get('v.email')) return alert('Missing fields.');
        helper.startChat(component, event, helper);
    }
});