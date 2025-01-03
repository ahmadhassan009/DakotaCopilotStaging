({
    init: function (component, event, helper) {
        var id;
        var sPageURL = decodeURIComponent(window.location.search.substring(1));
        var sURLVariables = sPageURL.split('&');

        var sParameterName;
        for (var i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] === 'id') {
                sParameterName[1] === undefined ? '' : sParameterName[1];
                id = sParameterName[1];
            }
        }
        component.set("v.Id", id);
    }
})