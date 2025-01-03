public class TriggerOnTaskService {
    public static void provideAccessToAllUsers(List<Task> newTasks)
    {
        Id taskRecordTypeId = Schema.getGlobalDescribe().get('Task').getDescribe().getRecordTypeInfosByDeveloperName().get('Dakota_360_Task').getRecordTypeId();
        User user = [SELECT is_community_user__c, Contact.AccountId FROM User WHERE id=:UserInfo.getUserId() LIMIT 1];
        for(Task task: newTasks)
        {
            if(task.RecordTypeId == taskRecordTypeId) 
            {
                if(user.is_community_user__c == true && user.Contact !=null && user.Contact.AccountId !=null)
                {   
                    task.IsVisibleInSelfService = true;
                    task.Is_Community_Activity__c = true;
                }
            }
        }
    }
}