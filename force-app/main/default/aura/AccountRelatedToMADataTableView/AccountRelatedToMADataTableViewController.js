({
    init: function(cmp, evt, helper) {
        var recordId;
        var recordName;
        var totalRelatedSearchesCount;
        var isCommunity;

        var myPageRef = cmp.get("v.pageReference");

        if(myPageRef!=undefined) //For Salesforce
        {
            recordId = myPageRef.state.c__recordId;
            recordName = myPageRef.state.c__recordName;
            isCommunity = myPageRef.state.c__isCommunity
        }
        else //For Community
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
                else if (sParameterName[0] === 'recordName') { 
                    sParameterName[1] === undefined ? '' : sParameterName[1];
                    recordName = sParameterName[1];
                }
                else if (sParameterName[0] === 'isCommunity') { 
                    sParameterName[1] === undefined ? '' : sParameterName[1];
                    isCommunity = sParameterName[1];
                }
            }
        }

        cmp.set("v.recordId", recordId);
        cmp.set("v.recordName", recordName);
        cmp.set("v.isCommunity", isCommunity);
    }
})