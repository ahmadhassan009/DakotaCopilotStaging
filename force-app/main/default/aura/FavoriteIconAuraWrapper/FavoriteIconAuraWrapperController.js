({
	init: function(cmp, event, helper) {
		cmp.set("v.localStorage", JSON.stringify(window.localStorage));
		var disableURLs = ["view-relatedaccounts","view-all", "custom-list-view-all"];
		var pathname = window?.location?.pathname?.split('/');
		var recId = cmp.get("v.recordId");
		if(pathname.length> 2 && disableURLs.includes(pathname[3]) ) 
		{
			recId = undefined;
			cmp.set("v.recordId",recId);
		}
		if (recId != undefined && (recId.startsWith("001") || recId.startsWith("003") || recId.startsWith("a2X"))) {
			var objName;
			if (recId.startsWith("001")) {
				objName = "Account";
				cmp.set("v.isAccount", true);
			} else {
				objName = "Contact";
				cmp.set("v.isContact", true);
			}
			var action = cmp.get("c.checkRecordType");
			action.setParams({
				objectName: objName,
				recordId: recId
			});
			action.setCallback(this, function(response) {
				var state = response.getState();
				if (state === "SUCCESS") {
					if (cmp.get("v.isAccount") == true && response.getReturnValue() == true) {
						cmp.set("v.isGenBusinessAccount", true);
					} else if (cmp.get("v.isContact") == true && response.getReturnValue() == true) {
						cmp.set("v.isGenBusinessContact", true);
					}
					cmp.set("v.renderFavIcon", true);
				}
			});
			$A.enqueueAction(action);
		} else {
			cmp.set("v.renderFavIcon", true);
		}
	},
})