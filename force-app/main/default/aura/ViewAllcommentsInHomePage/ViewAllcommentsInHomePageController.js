({
    init : function(cmp, event, helper) {
        var myPageRef = cmp.get("v.pageReference");
        if(myPageRef!=undefined)
        {
            if( myPageRef.state.c__objectName!=null)
                cmp.set("v.objectName", myPageRef.state.c__objectName);
            if( myPageRef.state.c__recordName!=null)
                cmp.set("v.recordName", myPageRef.state.c__recordName);
            if( myPageRef.state.c__recordId!=null)
                cmp.set("v.recordId", myPageRef.state.c__recordId);

            if(myPageRef.state.c__homePage!=null)
            {
                if(myPageRef.state.c__homePage == 'true')
                {
                    cmp.set("v.homePage", true);
                }
                else if(myPageRef.state.c__homePage == 'false')
                {
                    cmp.set("v.homePage", false);
                }  
            }
        }
    }
})