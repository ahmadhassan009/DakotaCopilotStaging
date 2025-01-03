public class BatchToUpdateAssetClassAvgTicketSize implements Database.Batchable<sObject> {
public Database.QueryLocator start(Database.BatchableContext bc) 
    {
        String query = 'SELECT Id, Name, AUM__c, Record_To_Exclude__c, Hedge_Fund_Avg_Ticket_Size__c, Private_Equity_Average_Ticket_Size__c, Private_Real_Estate_Average_Ticket_Size__c, Real_Assets_Average_Ticket_Size__c, Private_Credit_Average_Ticket_Size__c, Hedge_Funds__c, Private_Equity__c, Private_Real_Estate__c, Real_Assets__c, Private_Credit__c FROM Account WHERE Record_To_Exclude__c = false AND X100_Marketplace__c = true';
        return Database.getQueryLocator(query);
    }
    public void execute(Database.BatchableContext bc, List<Account> accounts)
    {
        double fiftyBillion = double.valueOf('50000000000');
        double tenBillion = double.valueOf('10000000000');
        double fiveBillion = double.valueOf('5000000000');
        double oneAndHalfBillion = double.valueOf('1500000000');
        double oneBillion = double.valueOf('1000000000');
        double oneFortyNineMillion = double.valueOf('149000000');
        for(Account acc: accounts) {
            acc.Hedge_Fund_Avg_Ticket_Size__c = 0;
            acc.Private_Equity_Average_Ticket_Size__c = 0;
            acc.Private_Real_Estate_Average_Ticket_Size__c = 0;
            acc.Real_Assets_Average_Ticket_Size__c = 0;
            acc.Private_Credit_Average_Ticket_Size__c = 0;
            if(acc.AUM__c >= fiftyBillion) {
                updateAverageTicketSizeByAssetClass(acc, 100000000);
            } else if(acc.AUM__c < fiftyBillion && acc.AUM__c >= tenBillion) {
                updateAverageTicketSizeByAssetClass(acc, 50000000);
            } else if(acc.AUM__c < tenBillion && acc.AUM__c >= fiveBillion) {
                updateAverageTicketSizeByAssetClass(acc,  25000000);
            } else if(acc.AUM__c < fiveBillion && acc.AUM__c >= oneAndHalfBillion) {
                updateAverageTicketSizeByAssetClass(acc,  20000000);
            } else if(acc.AUM__c < oneAndHalfBillion && acc.AUM__c >= oneBillion) {
                updateAverageTicketSizeByAssetClass(acc,  10000000);
            } else if(acc.AUM__c < oneBillion && acc.AUM__c >= oneFortyNineMillion) {
                updateAverageTicketSizeByAssetClass(acc,  5000000);
            }
        }
        update accounts;
    }
    public void finish(Database.BatchableContext bc){
    }
    
    private void updateAverageTicketSizeByAssetClass (Account acc, Double value) {
        if(acc.Hedge_Funds__c == 'Yes') {
            acc.Hedge_Fund_Avg_Ticket_Size__c = value;
        }
        if(acc.Private_Equity__c == 'Yes') {
            acc.Private_Equity_Average_Ticket_Size__c = value;
        }
        if(acc.Private_Real_Estate__c == 'Yes') {
            acc.Private_Real_Estate_Average_Ticket_Size__c = value;
        }
        if(acc.Real_Assets__c == 'Yes') {
            acc.Real_Assets_Average_Ticket_Size__c = value;
        }
        if(acc.Private_Credit__c == 'Yes') {
            acc.Private_Credit_Average_Ticket_Size__c = value;
        }
    }
    
    public static void updateAverageTicketSizeForExcludedRecords (Account acc, Double value) {
        if(acc.Hedge_Funds__c == 'Yes' && (acc.Hedge_Fund_Avg_Ticket_Size__c == null || acc.Hedge_Fund_Avg_Ticket_Size__c == 0)) {
            acc.Hedge_Fund_Avg_Ticket_Size__c = value;
        }
        if(acc.Private_Equity__c == 'Yes' && (acc.Private_Equity_Average_Ticket_Size__c == null || acc.Private_Equity_Average_Ticket_Size__c == 0)) {
            acc.Private_Equity_Average_Ticket_Size__c = value;
        }
        if(acc.Private_Real_Estate__c == 'Yes' && (acc.Private_Real_Estate_Average_Ticket_Size__c == null || acc.Private_Real_Estate_Average_Ticket_Size__c == 0)) {
            acc.Private_Real_Estate_Average_Ticket_Size__c = value;
        }
        if(acc.Real_Assets__c == 'Yes' && (acc.Real_Assets_Average_Ticket_Size__c == null || acc.Real_Assets_Average_Ticket_Size__c == 0)) {
            acc.Real_Assets_Average_Ticket_Size__c = value;
        }
        if(acc.Private_Credit__c == 'Yes' && (acc.Private_Credit_Average_Ticket_Size__c == null || acc.Private_Credit_Average_Ticket_Size__c == 0)) {
            acc.Private_Credit_Average_Ticket_Size__c = value;
        }
	}
}