({
    doInit: function(component, event, helper) {
        component.set("v.showTabulatorData", true);
    },

    handlePageReferenceChange: function(component, event, helper) {
        const pageRef = component.get("v.pageReference");
        component.set("v.showTabulatorData", pageRef.state.c__showTabulatorData);
        const showChildComponent = component.get("v.showTabulatorData");
        if(!showChildComponent){
            component.set("v.showTabulatorData", true);
        }
    },
})