({
    init: function(cmp, evt, helper) {
        var stateName;
        var objectName;
        var accountType;
        var accountTypeLabel;
        var totalRecordCount;
        var subAccountType;
        var homeOffice;
        var myPageRef = cmp.get("v.pageReference");

        if (myPageRef != undefined) //For Salesforce
        {
            stateName = myPageRef.state.c__stateName;
            objectName = myPageRef.state.c__objectName;
            accountType = myPageRef.state.c__accountType;
            accountTypeLabel = myPageRef.state.c__accountTypeLabel;
            totalRecordCount = myPageRef.state.c__totalRecordCount;

        } else //For Community
        {
            var sPageURL = decodeURIComponent(window.location.search.substring(1)); //You get the whole decoded URL of the page.
            var sURLVariables = sPageURL.split('&'); //Split by & so that you get the key value pairs separately in a list
            var sParameterName;
            var i;
            for (i = 0; i < sURLVariables.length; i++) {
                sParameterName = sURLVariables[i].split('='); //to split the key from the value.
                if (sParameterName[0] === 'stateName') {
                    sParameterName[1] === undefined ? '' : sParameterName[1];
                    stateName = sParameterName[1];
                }
                else if(sParameterName[0] === 'objectName') {
                    sParameterName[1] === undefined ? '' : sParameterName[1];
                    objectName = sParameterName[1];
                } else if (sParameterName[0] === 'accountType') {
                    sParameterName[1] === undefined ? '' : sParameterName[1];
                    accountType = sParameterName[1];
                } else if (sParameterName[0] === 'accountTypeLabel') {
                    sParameterName[1] === undefined ? '' : sParameterName[1];
                    accountTypeLabel = sParameterName[1];
                } else if (sParameterName[0] === 'totalRecordCount') {
                    sParameterName[1] === undefined ? '' : sParameterName[1];
                    totalRecordCount = sParameterName[1];
                }
                else if(sParameterName[0] === 'homeOffice') {
                    sParameterName[1] === undefined ? '' : sParameterName[1];
                    homeOffice = sParameterName[1];
                }
                else if(sParameterName[0] === 'subAccountType') {
                    sParameterName[1] === undefined ? '' : sParameterName[1];
                    subAccountType = sParameterName[1];
                }
            }
        }

        cmp.set("v.stateName", stateName);
        cmp.set("v.objectName", objectName);
        cmp.set("v.accountType", accountType);
        cmp.set("v.accountTypeLabel", accountTypeLabel);
        cmp.set("v.totalRecordCount", totalRecordCount);
        cmp.set("v.homeOffice", homeOffice);
        cmp.set("v.subAccountType", subAccountType);

        if(objectName == 'Account') {
            cmp.set("v.accountsViewAll", true);
        } else if (objectName == 'Contact') {
            cmp.set("v.contactsViewAll", true);
        }
        else if (objectName == 'Dakota_Content__c') {
            cmp.set("v.dakotaContentViewAll", true);
        }
        else if (objectName == 'Marketplace_Searches__c') {
            cmp.set("v.dakotaSearchesViewAll", true);
        }
        

        if(accountType != null || accountType != undefined) {
            cmp.set("v.accountTypesViewAll", true);
        }
        
    }
})