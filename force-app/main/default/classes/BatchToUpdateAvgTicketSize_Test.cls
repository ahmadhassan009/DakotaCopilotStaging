@isTest
public class BatchToUpdateAvgTicketSize_Test {
	@testSetUp
    public static void createData()
    {     
        double fiftyBillion = double.valueOf('50000000000');
        double tenBillion = double.valueOf('10000000000');
        double fiveBillion = double.valueOf('5000000000');
        double oneAndHalfBillion = double.valueOf('1500000000');
        double oneBillion = double.valueOf('1000000000');
        double oneFortyNineMillion = double.valueOf('149000000');
        
        Account acct = new Account();
        acct.Name = 'Test Account';
        acct.X100_Marketplace__c = true;
        acct.Hedge_Funds__c = 'Yes';
        acct.Private_Equity__c = 'Yes';
        acct.Private_Real_Estate__c = 'Yes';
        acct.Real_Assets__c = 'Yes';
        acct.Record_To_Exclude__c = false;
        acct.Hedge_Fund_Avg_Ticket_Size__c = 0;
        acct.Private_Equity_Average_Ticket_Size__c = 0;
        acct.Private_Real_Estate_Average_Ticket_Size__c = 0;
        acct.Real_Assets_Average_Ticket_Size__c = 0;
        acct.Private_Credit_Average_Ticket_Size__c = 0;
        acct.AUM__c = fiftyBillion;
        insert acct;
        
        Account acct1 = new Account();
        acct1.Name = 'Test Account';
        acct1.X100_Marketplace__c = true;
        acct1.Hedge_Funds__c = 'Yes';
        acct1.Private_Equity__c = 'Yes';
        acct1.Private_Real_Estate__c = 'Yes';
        acct1.Real_Assets__c = 'Yes';
        acct1.Record_To_Exclude__c = false;
        acct1.Hedge_Fund_Avg_Ticket_Size__c = 0;
        acct1.Private_Equity_Average_Ticket_Size__c = 0;
        acct1.Private_Real_Estate_Average_Ticket_Size__c = 0;
        acct1.Real_Assets_Average_Ticket_Size__c = 0;
        acct1.Private_Credit_Average_Ticket_Size__c = 0;
        acct1.AUM__c = tenBillion;
        insert acct1;
        
        Account acct2 = new Account();
        acct2.Name = 'Test Account';
        acct2.X100_Marketplace__c = true;
        acct2.Hedge_Funds__c = 'Yes';
        acct2.Private_Equity__c = 'Yes';
        acct2.Private_Real_Estate__c = 'Yes';
        acct2.Real_Assets__c = 'Yes';
        acct2.Hedge_Fund_Avg_Ticket_Size__c = 0;
        acct2.Private_Equity_Average_Ticket_Size__c = 0;
        acct2.Private_Real_Estate_Average_Ticket_Size__c = 0;
        acct2.Real_Assets_Average_Ticket_Size__c = 0;
        acct2.Private_Credit_Average_Ticket_Size__c = 0;
        acct2.Record_To_Exclude__c = false;
        acct2.AUM__c = fiveBillion;
        insert acct2;
        
        Account acct3 = new Account();
        acct3.Name = 'Test Account';
        acct3.X100_Marketplace__c = true;
        acct3.Hedge_Funds__c = 'Yes';
        acct3.Private_Equity__c = 'Yes';
        acct3.Private_Real_Estate__c = 'Yes';
        acct3.Real_Assets__c = 'Yes';
        acct3.Record_To_Exclude__c = false;
        acct3.Hedge_Fund_Avg_Ticket_Size__c = 0;
        acct3.Private_Equity_Average_Ticket_Size__c = 0;
        acct3.Private_Real_Estate_Average_Ticket_Size__c = 0;
        acct3.Real_Assets_Average_Ticket_Size__c = 0;
        acct3.Private_Credit_Average_Ticket_Size__c = 0;
        acct3.AUM__c = oneAndHalfBillion;
        insert acct3;
        
        Account acct4 = new Account();
        acct4.Name = 'Test Account';
        acct4.X100_Marketplace__c = true;
        acct4.Hedge_Funds__c = 'Yes';
        acct4.Private_Equity__c = 'Yes';
        acct4.Private_Real_Estate__c = 'Yes';
        acct4.Real_Assets__c = 'Yes';
        acct4.Record_To_Exclude__c = false;
        acct4.AUM__c = oneBillion;
        insert acct4;
        
        Account acct5 = new Account();
        acct5.Name = 'Test Account';
        acct5.X100_Marketplace__c = true;
        acct5.Hedge_Funds__c = 'Yes';
        acct5.Private_Equity__c = 'Yes';
        acct5.Private_Real_Estate__c = 'Yes';
        acct5.Real_Assets__c = 'Yes';
        acct5.Record_To_Exclude__c = false;
        acct5.AUM__c = oneFortyNineMillion;
        insert acct5;
    }
    
    @isTest
    public static void testBatchToUpdateAssetClassAvgTicketSize()
    {
        List<Account> acct = [SELECT Id, Name, AUM__c, Record_To_Exclude__c, Hedge_Fund_Avg_Ticket_Size__c, Private_Equity_Average_Ticket_Size__c, Private_Real_Estate_Average_Ticket_Size__c, Real_Assets_Average_Ticket_Size__c,Private_Credit_Average_Ticket_Size__c, Hedge_Funds__c, Private_Equity__c, Private_Real_Estate__c, Real_Assets__c, Private_Credit__c FROM Account WHERE Record_To_Exclude__c = false AND X100_Marketplace__c = true];
        Test.startTest();
        BatchToUpdateAssetClassAvgTicketSize.updateAverageTicketSizeForExcludedRecords(acct[0],1000000);
        BatchToUpdateAssetClassAvgTicketSize btch = new BatchToUpdateAssetClassAvgTicketSize();
        Database.executeBatch(btch, 10);
        Test.stopTest();
    }
}