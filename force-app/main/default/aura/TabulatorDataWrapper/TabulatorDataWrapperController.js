({
    doInit: function(component, event, helper) {
        component.set("v.showTabulatorData", true);
        // window.onpopstate = function(event) {
        //     console.log("Browser back button clicked");
        //     // Custom logic for back button       
        // };
    },

    handlePageReferenceChange: function(component, event, helper) {

        console.log("Salesforce tab or URL changed");
        const pageRef = component.get("v.pageReference");
        component.set("v.showTabulatorData", pageRef.state.c__showTabulatorData);
        const showChildComponent = component.get("v.showTabulatorData");

        if(!showChildComponent){
            component.set("v.showTabulatorData", true);
        }
        // component.set("v.showTabulatorData", false);
        // // Use a slight delay to allow the component to detach before showing it again
        // setTimeout(() => {
        //     component.set("v.showTabulatorData", true);
        // }, 0); // Using 0 ms as minimal delay
    },
})