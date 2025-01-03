({
    init: function(cmp, evt, helper) {
        var recordId;
        var accountType;
        var accountTypeLabel;
        var recordName;
        var totalRecordCount;
        var isCommunity;
        var subAccountType;

        var myPageRef = cmp.get("v.pageReference");

        if(myPageRef!=undefined) //For Salesforce
        {
            recordId = myPageRef.state.c__recordId;
            accountType = myPageRef.state.c__accountType;
            accountTypeLabel = myPageRef.state.c__accountTypeLabel;
            recordName = myPageRef.state.c__recordName;
            totalRecordCount = myPageRef.state.c__totalRecordCount;
            isCommunity = myPageRef.state.c__isCommunity
            subAccountType =myPageRef.state.subAccountType
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
                else if (sParameterName[0] === 'accountType') { 
                    sParameterName[1] === undefined ? '' : sParameterName[1];
                    accountType = sParameterName[1];
                }
                else if (sParameterName[0] === 'accountTypeLabel') { 
                    sParameterName[1] === undefined ? '' : sParameterName[1];
                    accountTypeLabel = sParameterName[1];
                }
                else if (sParameterName[0] === 'recordName') { 
                    sParameterName[1] === undefined ? '' : sParameterName[1];
                    recordName = sParameterName[1];
                }
                else if (sParameterName[0] === 'totalRecordCount') { 
                    sParameterName[1] === undefined ? '' : sParameterName[1];
                    totalRecordCount = sParameterName[1];
                }
                else if (sParameterName[0] === 'isCommunity') { 
                    sParameterName[1] === undefined ? '' : sParameterName[1];
                    isCommunity = sParameterName[1];
                }
                else if (sParameterName[0] === 'subAccountType') { 
                    sParameterName[1] === undefined ? '' : sParameterName[1];
                    subAccountType = sParameterName[1];
                }
            }
        }
        cmp.set("v.recordId", recordId);
        cmp.set("v.accountType",  accountType.split('+').join(' '));
        cmp.set("v.accountTypeLabel", accountTypeLabel.split('+').join(' '));
        cmp.set("v.recordName", recordName);
        cmp.set("v.totalRecordCount", totalRecordCount);
        cmp.set("v.isCommunity", isCommunity);
        cmp.set("v.subAccountType", subAccountType);

    }
})