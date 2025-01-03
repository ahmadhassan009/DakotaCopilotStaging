@isTest 
Public class QuoteControllerLightning_Test {

 Private Static testmethod void QuoteControllerLightning(){ 

   Account acc = new Account();
   opportunity opp = new Opportunity();
   Contact con = new Contact();{
       
        con.FirstName = 'Test contact';
        con.LastName = 'Test contact';
        con.Email = 'ramesh@estuate.com';
        con.Accountid = acc.Id;
        con.Phone = '343434234';
      insert con;
  } 
  
    zqu__Quote__c quote = new zqu__Quote__c();{
    
        quote.Name = 'Test Quote';
        quote.zqu__SubscriptionType__c ='Amend Subscription';
        quote.zqu__StartDate__c = System.today();
        quote.zqu__ValidUntil__c = System.today();
        quote.zqu__Subscription_Term_Type__c = 'Termed';
        quote.zqu__InitialTerm__c = 12;
        quote.zqu__RenewalTerm__c = 12;
        quote.zqu__Account__c = (acc != null) ? acc.Id : null;
        quote.zqu__Opportunity__c = (opp != null) ? opp.Id : null;
        quote.zqu__BillToContact__c = con.Id; 
        quote.zqu__SoldToContact__c = con.Id;
        insert quote;
   } 
 
    zqu__Quote__c quote1 = new zqu__Quote__c();{
        quote1.Name = 'Test quote1';
        quote1.zqu__SubscriptionType__c ='Renew Subscription';
        quote1.zqu__StartDate__c = System.today();
        quote1.zqu__ValidUntil__c = System.today();
        quote1.zqu__Subscription_Term_Type__c = 'Termed';
        quote1.zqu__InitialTerm__c = 12;
        quote1.zqu__RenewalTerm__c = 12;
        quote1.zqu__Account__c = (acc != null) ? acc.Id : null;
        quote1.zqu__Opportunity__c = (opp != null) ? opp.Id : null;
        quote1.zqu__BillToContact__c = con.id;
        quote1.zqu__SoldToContact__c = con.id;      
        insert quote1 ;
      
    }
       test.StartTest();
    
        ApexPages.currentPage().getParameters().put('id',quote.id);
        ApexPages.StandardController stdLead = new ApexPages.StandardController(quote);
        QuoteControllerLightning QuoteCntrlghtng  = new QuoteControllerLightning(stdLead);
        QuoteCntrlghtng.autoRun();
      
       test.StopTest();
  }
  
}