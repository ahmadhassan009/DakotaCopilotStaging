({
    doInit : function(component, event, helper) {
        component.set("v.Spinner",true);
        var recId = component.get("v.recordId");
        var action = component.get("c.changeAccountTrialStatus");
        var toastEvent = $A.get("e.force:showToast");
        action.setParams({ 
            "recordId" : recId
        });
        
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                if(response.getReturnValue() == true)
                { 
                    component.set("v.Spinner",false); 
                    toastEvent.setParams({
                        type: 'Success',
                        message:  "Trial Activated Successfully!"
                    });
                    toastEvent.fire();
                    $A.get('e.force:refreshView').fire();
                    $A.get("e.force:closeQuickAction").fire();
                }
                else
                {
                    component.set("v.Spinner",false);
                    toastEvent.setParams({
                        type: 'Success',
                        message:  "Trial Deactivated Successfully!"
                    });
                    toastEvent.fire();
                    $A.get('e.force:refreshView').fire();
                    $A.get("e.force:closeQuickAction").fire();
                }
            }
            else {
                component.set("v.Spinner",false);
                var errors = response.getError();
                toastEvent.setParams({
                    "Subject" : "Error",
                    "type": "Error",
                    "message":  errors[0].message
                });
                toastEvent.fire();
                $A.get("e.force:closeQuickAction").fire();
            }
        });
        $A.enqueueAction(action);
    }
})