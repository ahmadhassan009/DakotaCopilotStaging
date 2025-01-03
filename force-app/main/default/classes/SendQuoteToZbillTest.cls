@istest
public class SendQuoteToZbillTest{

 public static Account makeAccount(){
    Account testacc = new Account();
     testacc.Name = 'Test Account';
     insert testacc;
     return testacc;
 }
 
 public static Contact makecontact(Account testacc){
   Contact testcon = new Contact();
   testcon.FirstName = 'Test';
   testcon.LastName = 'Contact';
   testcon.Email = 'testt@gmail.com';
   testcon.AccountId = testacc.Id;
   insert testcon;
   return testcon;
 }
 Public Static Opportunity makeopportunity(Account testacc){
    
   Opportunity opp = new Opportunity();
   opp.Name  = 'Test Opp';
   opp.StageName = 'Qualification';
   opp.CloseDate = date.today();
   opp.AccountId = testacc.Id;
   //opp.
   insert opp;
   return opp;
 }
  
 Public static zqu__Quote__c makeQuote1(Account testacc,Contact testcon,Opportunity opp){
 
   zqu__Quote__c testqte = new zqu__Quote__c();
   
   testqte.Name = 'Test Quote';
   testqte.zqu__Opportunity__c = opp.Id;
   testqte.zqu__ValidUntil__c = date.today();
   testqte.zqu__SoldToContact__c = testcon.Id;
   testqte.zqu__BillToContact__c = testcon.Id;
   testqte.zqu__PaymentMethod__c = 'Check';
   testqte.zqu__Currency__c = 'USD';
   testqte.zqu__StartDate__c = date.today();
   testqte.zqu__InitialTerm__c = 12;
   testqte.zqu__RenewalTerm__c = 6;
   testqte.zqu__Account__c = testacc.Id;
  // testqte.Send_to_Zuora__c = false;
   
   testqte.zqu__Status__c = 'Sent to Z-Billing';
   insert testqte;
   return testqte;
  
   }
   
    Public static zqu__Quote__c makeQuote2(Account testacc,Contact testcon,Opportunity opp){
 
   zqu__Quote__c testqte1 = new zqu__Quote__c();
   
   testqte1.Name = 'Test Quote';
   testqte1.zqu__Opportunity__c = opp.Id;
   testqte1.zqu__ValidUntil__c = date.today();
   testqte1.zqu__SoldToContact__c = testcon.Id;
   testqte1.zqu__BillToContact__c = testcon.Id;
   testqte1.zqu__PaymentMethod__c = 'Check';
   testqte1.zqu__Currency__c = 'USD';
   testqte1.zqu__StartDate__c = date.today();
   testqte1.zqu__InitialTerm__c = 12;
   testqte1.zqu__RenewalTerm__c = 6;
   testqte1.zqu__Account__c = testacc.Id;
  
   
   testqte1.zqu__Status__c = 'New';
   insert testqte1;
   return testqte1;
   }
   Public static dsfs__DocuSign_Status__c makeDocStatus(zqu__Quote__c testqte){
   
    dsfs__DocuSign_Status__c docstatus = new dsfs__DocuSign_Status__c();
    docstatus.dsfs__Envelope_Status__c = 'Sent';
    docstatus.ZQuote__c = testqte.Id;
    //docstatus.
    insert docstatus;
    return docstatus;
   }
   Public static dsfs__DocuSign_Status__c makeDocStatus1(zqu__Quote__c testqte1){
   
    dsfs__DocuSign_Status__c docstatus1 = new dsfs__DocuSign_Status__c();
    docstatus1.dsfs__Envelope_Status__c = 'Completed';
    docstatus1.ZQuote__c = testqte1.Id;
    //docstatus.
    insert docstatus1;
    return docstatus1;
   }

  Static testmethod void sendQuotesToZuora(){
    Account acc = makeAccount();
    Contact con = makecontact(acc);
    Opportunity Oppt = makeOpportunity(acc);
    zqu__Quote__c quote = makeQuote1(acc,con,Oppt); 
    dsfs__DocuSign_Status__c Docstatus = makeDocStatus(quote);
    Docstatus.dsfs__Envelope_Status__c = 'Completed';
    Update Docstatus;
    quote.zqu__ElectronicPaymentMethodId__c = '987654321abcdefg';
    update quote;
    Zuora__CustomerAccount__c zAccount  = makezuoraAcc(acc);
    
    zqu__Quote__c quote1 = makeQuote2(acc,con,Oppt); 
    dsfs__DocuSign_Status__c Docstatus1 = makeDocStatus(quote1);
    Docstatus1.dsfs__Envelope_Status__c = 'Completed';
    Update Docstatus1;
    quote1.zqu__ElectronicPaymentMethodId__c = '987654321abcdefg';
    update quote1;
    //Zuora__CustomerAccount__c zAccount  = makezuoraAcc(acc);
  }
  Public static Zuora__CustomerAccount__c makezuoraAcc(Account testacc){ 
   Zuora__CustomerAccount__c zcustmracc = new Zuora__CustomerAccount__c();
   zcustmracc.Name = 'Test ACCOUNT';
   zcustmracc.Zuora__Zuora_Id__c = '2c92c0f963f800a90163f87c58922b4e';
   zcustmracc.Zuora__Account__c =  testacc.Id;
   
   insert zcustmracc;
   return zcustmracc;
  }
}