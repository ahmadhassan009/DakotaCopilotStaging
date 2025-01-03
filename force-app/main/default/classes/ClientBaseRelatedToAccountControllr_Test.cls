@isTest 
public class ClientBaseRelatedToAccountControllr_Test {
    @isTest 
    public static void testClientBaseRelatedToAccountControllerMethods()
    {
        Account accountRecord = new Account();
        accountRecord.Name = 'Test Account Linked To Client Base';
        insert accountRecord;
        Client_Base__c[] clientBaseRecords = new List<Client_Base__c>();
        for(Integer i=0; i< 10; i++) {          
            Client_Base__c msObj = new Client_Base__c(
                                        Name = 'Test Client Base - ' + i, 
                                        Account__c = accountRecord.Id,
                                        AUM__c = i*i,
                                        Type__c = 'High Net Worth Individuals',
                                        Number_of_Clients__c=i
                                    );
            clientBaseRecords.add(msObj);            
        }
        insert clientBaseRecords;
        system.assertEquals(ClientBaseRelatedToAccountController.getAccountRelatedClientBaseCount(accountRecord.Id),10);
        system.assert(ClientBaseRelatedToAccountController.getAccountRelatedClientBaseRecords(accountRecord.Id, 'AUM__c', 'desc', 'LAST') != null);
    }
}