// public class BatchToUpdateFileVisibility implements Database.Batchable<sObject>
// {
//     public String query = 'Select Id,Name from ';
//     public BatchToUpdateFileVisibility(String objName) {
//         this.query = this.query+objName;
//         System.debug(this.query);
//     }
//     public Database.QueryLocator start(Database.BatchableContext bc){
//         return Database.getQueryLocator(this.query);
//     }

//     public void execute(Database.BatchableContext bc, List<SObject> records){
//         Set<Id> recordIds = new Set<Id>();
//         for(SObject rec : records)
//         {
//             recordIds.add(rec.Id);
//         }
//         List<ContentDocumentLink> conDocLinks = [Select Id,ContentDocumentId,ShareType,Visibility from ContentDocumentLink
//                                                  Where LinkedEntityId In :recordIds];
        
//         for(ContentDocumentLink conLink : conDocLinks)
//         {
//             if(conLink.Visibility == 'AllUsers')
//             {
//                 conLink.Visibility = 'InternalUsers';
//             }
//         }
//         update conDocLinks;
//     }

//    public void finish(Database.BatchableContext bc){
//    }
// }





public class BatchToUpdateFileVisibility implements Database.Batchable<sObject>
{
    
    public Database.QueryLocator start(Database.BatchableContext bc){
        String query = 'SELECT id,Description, Investment_Firm_Description__c FROM Account where recordtype.name = \'Investment Firm\'';
        return Database.getQueryLocator(query);
    }

    public void execute(Database.BatchableContext bc, List<Account> accounts){
        for(Account acc: accounts)
        {
            //acc.Investment_Firm_Description__c = acc.Description;
            acc.Description = null;
        }
        Database.update(accounts, false);
    }
    public void finish(Database.BatchableContext bc){
    } 
}