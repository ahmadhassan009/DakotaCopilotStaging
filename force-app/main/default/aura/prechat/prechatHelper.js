({
    startChat: function(component, event, helper){
        var fields = [
            {
                label: 'FirstName',
                name: 'FirstName',
                value: component.get('v.firstName')
            },
            {
                label: 'LastName',
                name: 'LastName',
                value: component.get('v.lastName')
            },
            {
                label: 'Email',
                name: 'Email',
                value: component.get('v.email')
            },
            {
                label: 'Username',
                name: 'Username__c',
                value: component.get('v.userId'),
            }
        ];
        if(component.find("prechatAPI").validateFields(fields).valid) {
            component.find("prechatAPI").startChat(fields);
        }
    }
});