public class BatchToPopulateSubMetroAreas implements Database.Batchable<sObject> {
    String accountIds = '';
    public BatchToPopulateSubMetroAreas(String accountIdList)
    {
        this.accountIds = accountIdList;
    }
    public Database.QueryLocator start(Database.BatchableContext bc) 
    {
        String query = 'SELECT Id,MetroArea__c FROM Account WHERE X100_Marketplace__c = true AND Id IN  ('+ this.accountIds + ')';
        return Database.getQueryLocator(query);
    }
    public void execute(Database.BatchableContext bc, List<Account> accounts)
    {
        Set<Id> processAccountIds = new Set<Id>();
        Set<String> compositeKeys = new Set<String>();
        List<Sub_Metro_Area__c> subMetroAreasToBeCreated = new List<Sub_Metro_Area__c>();
        String errors = '';
        for(Account acct : accounts)
        {
            processAccountIds.add(acct.Id);
        }
        List<Contact> contacts = [Select Id,Name,Metro_Area__c,AccountId,Account.MetroArea__c from Contact 
                                  where Marketplace_Verified_Contact__c = true 
                                  and Metro_Area__c != null
                                  and AccountId In :processAccountIds];
        for(Contact cnct : contacts) 
        {
            String compositeKey = String.valueOf(cnct.AccountId)+String.valueOf(cnct.Metro_Area__c);
            if(!compositeKeys.contains(compositeKey) && cnct.Metro_Area__c != cnct.Account.MetroArea__c) 
            {
                compositeKeys.add(compositeKey);
                Sub_Metro_Area__c subMetroArea = new Sub_Metro_Area__c();
                subMetroArea.Account__c = cnct.AccountId;
                subMetroArea.Metro_Area__c = cnct.Metro_Area__c;
                subMetroAreasToBeCreated.add(subMetroArea);
            }
        }
        Database.SaveResult[] srList = Database.insert(subMetroAreasToBeCreated, false);
        
        // Iterate through each returned result
        for (Database.SaveResult sr : srList) {
            if (!sr.isSuccess()) {
                // Operation failed, so get all errors                
                for(Database.Error err : sr.getErrors()) {
                    System.debug('The following error has occurred.');                    
                    System.debug(err.getStatusCode() + ': ' + err.getMessage());
                    errors = errors + err.getStatusCode() + ': ' + err.getMessage() + ' | ' +err.getFields() + '\n';
                }
            }
        }
        if(errors != '' || Test.isRunningTest()) 
        {
            List<Messaging.SingleEmailMessage> lstAllMails = new List<Messaging.SingleEmailMessage>();
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setSubject('Error In SubMetroArea Population');
            mail.setToAddresses(new List<String> {'draftcrmdev@rolustech.com'});
            mail.setPlainTextBody(errors);
            mail.setSaveAsActivity(false);
            lstAllMails.add(mail);
            if(lstAllMails.size() > 0) 
            {
                Messaging.sendEmail(lstAllMails,false);
            }
        }
    }
    public void finish(Database.BatchableContext bc){
    } 
}