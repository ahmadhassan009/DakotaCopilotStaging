({
   init: function(cmp) {
       //DSC-729 Permission handling
       const checkActivityFunc = cmp.get('c.checkActivityAccess');
       $A.enqueueAction(checkActivityFunc);
   },
   closePopup: function(cmp, event, helper) {
       $A.get("e.force:closeQuickAction").fire();
   },

   saveEvent: function(cmp, event, helper) {
       cmp.find('createNewEvent').saveNewEvent();
   },

   handleSave: function(cmp, event, helper) {
       $A.get("e.force:closeQuickAction").fire();
   },

   /**
    * @description DSC-729 Permission handling
    */
   checkActivityAccess: function(cmp, event, helper) {
       var action = cmp.get("c.checkActivityPermissions");
       action.setCallback(this, function(response) {
           var state = response.getState();
           if (state === "SUCCESS") {
               cmp.set("v.hasPermission", response.getReturnValue());
               if (!response.getReturnValue()) {
                   cmp.set("v.doesNotHasPermission", true);
               }
           } else if (state === "ERROR") {
               var errors = response.getError();
               if (errors) {
                   if (errors[0] && errors[0].message) {
                       console.log("Error message: " + errors[0].message);
                   }
               } else {
                   console.log("Unknown error");
               }
           }
       });
       $A.enqueueAction(action);
   }
})