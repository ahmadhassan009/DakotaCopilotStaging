({
    init: function(cmp, evt, helper) {
        var recordId;

        var myPageRef = cmp.get("v.pageReference");

        if (myPageRef != undefined) //For Salesforce
        {
            recordId = myPageRef.state.c__recordId;
        } else //For Community
        {
            var sPageURL = decodeURIComponent(window.location.search.substring(1)); //You get the whole decoded URL of the page.
            var sURLVariables = sPageURL.split('&'); //Split by & so that you get the key value pairs separately in a list
            var sParameterName;
            var i;
            for (i = 0; i < sURLVariables.length; i++) {
                sParameterName = sURLVariables[i].split('='); //to split the key from the value.

                if (sParameterName[0] === 'recordId') {
                    sParameterName[1] === undefined ? '' : sParameterName[1];
                    recordId = sParameterName[1];
                }
            }
        }

        cmp.set("v.recordId", recordId);
    }
})