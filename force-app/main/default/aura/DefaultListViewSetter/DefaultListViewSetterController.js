({
	init : function(cmp, event, helper) {
        var urlString = window.location.href;
        var communityName;
        if(urlString.includes('dakotaMarketplace')) {
            communityName = 'Marketplace';
        }
        else {
            communityName = 'Everest';
        }

        var action = cmp.get('c.getDefaultListviews');
        action.setParams({
            communityName : communityName
        });
                
        action.setCallback(this, function(response)
        {
            var items = response.getReturnValue();
            var existingPins = window.localStorage.getItem('objectHomeStateManager');
            var updatedPins = JSON.parse(existingPins);
            if (updatedPins == null)
            {
                updatedPins = {};
            }

            for (var item of items)
            {
                var key = 'PinnedListView_' + item.UserId + '_' + item.ObjectName;
                
                if (!(key in updatedPins))
                {
                    var obj = {};
                    obj.state = {};
                    obj.state.listViewId = item.ListviewId;
                    obj.state.developerName = item.ListviewDeveloperName;
                    obj.state.isDefault = true;
                    
                    updatedPins[key] = obj;
                }
            }
            window.localStorage.setItem('objectHomeStateManager', JSON.stringify(updatedPins));
		});
        $A.enqueueAction(action);
	}
})