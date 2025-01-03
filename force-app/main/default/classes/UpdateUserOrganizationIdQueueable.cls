public with sharing class UpdateUserOrganizationIdQueueable implements Queueable {
    
    Map<Id, Id> communitytUserIdMap;

    public UpdateUserOrganizationIdQueueable(Map<Id, Id> communitytUserIdMap) {
        this.communitytUserIdMap = communitytUserIdMap;
    }

    public void execute(QueueableContext context) {
        //community user list to update
        List<User> communityUsersList = new List<User>();
        for(Id userCommId : communitytUserIdMap.keySet()) { 
            User newUser = new User(Id = userCommId, Organization_Id__c = communitytUserIdMap.get(userCommId));
            communityUsersList.add(newUser);
        }
        //updating community users with new OrgId
        if(communityUsersList.size() > 0) {
            update communityUsersList;
        }
    }
}