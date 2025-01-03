@isTest
public with sharing class DocuSignStatus_Test 
{
 public  static Account makeAccount() 
{
        Account testAcc = new Account();
        testAcc.Name = 'my test update account';
       // testAcc.Needs_Assessment_Call_Complete__c = True;
        insert testAcc;
        return testAcc;
}


public  static Contact makeContact(Account testAcc) 
{
        Contact testContact = new Contact();
        testContact.FirstName = 'Firstname';
        testContact.LastName = 'Lastname';
        testContact.Email = 'Email@mail.me';
        testContact.AccountId = testAcc.Id;
        insert testContact;
        return testContact;
 }


 public static Opportunity makeOpportunity(Account testAcc) 
 {
        Opportunity testOpp = new Opportunity();
        testOpp.Name = 'my test update opportunity';
        testOpp.StageName = '01- Qualified Lead';
        testOpp.CloseDate = System.today();
        testOpp.AccountId = testAcc.Id;
        insert testOpp;
        return testOpp;
    }
    
    public static zqu__Quote_Template__c makeQuoteTemplate() 
      {        
        zqu__Quote_Template__c testQuoteTemplate = new zqu__Quote_Template__c();     
        testQuoteTemplate.Name = 'my test quote template USD'; 
        testQuoteTemplate.zqu__Template_Id__c = '987654321abcdefg';  
        insert testQuoteTemplate;
        return testQuoteTemplate;
      }    
        

public static zqu__InvoiceTemplate__c makeInvoiceTemplate() 
      {        
        zqu__InvoiceTemplate__c testInvoiceTemplate = new zqu__InvoiceTemplate__c();     
        testInvoiceTemplate.Name = 'my test Invoice template USD'; 
        testInvoiceTemplate.zqu__ZuoraId__c = '987654321abcdefg';  
        insert testInvoiceTemplate;
        return testInvoiceTemplate;
      }       


public static zqu__Quote__c makeQuote1(Contact con,Opportunity testOpp,zqu__InvoiceTemplate__c InvTemp,zqu__Quote_Template__c quoteTemplate) 
{
        zqu__Quote__c testQuote = new zqu__Quote__c();
        testQuote.Name = 'my test update quote USD';
        testQuote.zqu__Opportunity__c = testOpp.Id;
        testQuote.zqu__Currency__c = 'USD';
        testQuote.zqu__QuoteTemplate__c = quoteTemplate.Id;
        testQuote.zqu__InvoiceTemplate__c = InvTemp.Id;
        testQuote.zqu__StartDate__c = date.today();
        testQuote.zqu__SoldToContact__c = con.Id;
        testQuote.zqu__BillToContact__c = con.Id;
        testQuote.zqu__InitialTerm__c = 12;
        testQuote.zqu__RenewalTerm__c = 12;
        insert testQuote;
        return testQuote;

    }
    
 public static dsfs__DocuSign_Status__c makeDocStatus(zqu__Quote__c quote) 
{
        dsfs__DocuSign_Status__c testDocStatus = new dsfs__DocuSign_Status__c();
        testDocStatus.dsfs__Subject__c = 'TestStatus';
        testDocStatus.dsfs__Envelope_Status__c = 'Sent';
        testDocStatus.ZQuote__c = quote.Id;
        insert testDocStatus;
        return testDocStatus;

    }
   

    static testMethod void myUnitTest() {
        Account acc = makeAccount();
        Contact con = makeContact(acc);
        Opportunity opp = makeOpportunity(acc);
        zqu__Quote_Template__c QuoteTemplate = makeQuoteTemplate();     
        zqu__InvoiceTemplate__c InvTemp = makeInvoiceTemplate();
        zqu__Quote__c quote = makeQuote1(con,opp,InvTemp,QuoteTemplate);
        dsfs__DocuSign_Status__c DocStatus = makeDocStatus(quote);
        DocStatus.dsfs__Envelope_Status__c = 'Completed';
        update DocStatus;   
        quote.zqu__ElectronicPaymentMethodId__c='987654321abcdefg';
        update quote;        

        Zuora__CustomerAccount__c custacc = new Zuora__CustomerAccount__c (Zuora__Account__c=acc.Id);
        insert custacc;

    }
    
}