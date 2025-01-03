({
    doInit: function(component, event, helper) {
        var urlEvent = $A.get("e.force:navigateToURL");
        var recId = component.get("v.recordId");
        urlEvent.setParams({
            "url": '/account-print-view?recordId='+recId
        });
        urlEvent.fire();
        
    },
    doneRendering: function(cmp, event, helper) {
       $A.get("e.force:closeQuickAction").fire();
    }
})