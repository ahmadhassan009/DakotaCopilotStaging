({
    init: function(cmp, evt, helper) {
        var recordId;
        var homeOffice;
        var recordName;
        var totalRelatedContactRecordCount;
        var isCommunity;

        var myPageRef = cmp.get("v.pageReference");

        if(myPageRef!=undefined) //For Salesforce
        {
            recordId = myPageRef.state.c__recordId;
            homeOffice = myPageRef.state.c__homeOffice;
            recordName = myPageRef.state.c__recordName;
            totalRelatedContactRecordCount = myPageRef.state.c__totalRelatedContactRecordCount;
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
                else if (sParameterName[0] === 'homeOffice') { 
                    sParameterName[1] === undefined ? '' : sParameterName[1];
                    homeOffice = sParameterName[1];
                }
                else if (sParameterName[0] === 'recordName') { 
                    sParameterName[1] === undefined ? '' : sParameterName[1];
                    recordName = sParameterName[1];
                }
                else if (sParameterName[0] === 'totalRelatedContactRecordCount') { 
                    sParameterName[1] === undefined ? '' : sParameterName[1];
                    totalRelatedContactRecordCount = sParameterName[1];
                }
                else if (sParameterName[0] === 'isCommunity') { 
                    sParameterName[1] === undefined ? '' : sParameterName[1];
                    isCommunity = sParameterName[1];
                }
            }
        }
console.log("totalRelatedContactRecordCount in Aura: " , totalRelatedContactRecordCount);
        cmp.set("v.recordId", recordId);
        cmp.set("v.homeOffice", homeOffice);
        cmp.set("v.recordName", recordName.split('+').join(' '));
        cmp.set("v.totalRelatedContactRecordCount", totalRelatedContactRecordCount);
        cmp.set("v.isCommunity", isCommunity);
    }
})