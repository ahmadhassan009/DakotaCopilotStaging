({
    init: function(cmp, evt, helper)
    {
        if(localStorage.getItem('exportCount') && localStorage.getItem('exportCount')>0 )
        {
            cmp.set("v.exportCount", localStorage.getItem('exportCount'));
        }
    },

    handleExportClick: function(cmp, event, helper) {
        var exportCount = event.getParam('count');        
        localStorage.setItem('exportCount', exportCount);  
    },

    handleExportCount: function(cmp, event, helper) {
        cmp.set("v.exportCount", localStorage.getItem('exportCount'));
    },

    
})