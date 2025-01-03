@isTest 
public class TriggerOnCPRATrackingService_Test {
    @TestSetup
    static void makeData(){

        Contact con = new Contact();
        con.LastName = 'Test Contact A';
        con.title = 'new test title';
        con.Phone = '8888888';
        con.Email = 'abc@gmail.com';
        con.MailingState = 'CA';
        insert con;
        
        CPRA_Tracking__c cpra =  new CPRA_Tracking__c();
        cpra.Contact__c = con.id;
        cpra.Contact_Field__c = 'Email';
        cpra.source__c = 'www.google.com';
        insert cpra;
        
        CPRA_Tracking__c cpra2 =  new CPRA_Tracking__c();
        cpra2.Contact__c = con.id;
        cpra2.Contact_Field__c = 'Title';
        cpra2.source__c = 'www.google.com';
        insert cpra2;
    }
   
	@isTest 
    public static void testUpdateCPRTrackerInContact()
    {        
        
        List<CPRA_Tracking__c> spraList = [SELECT Id, Contact_Field__c FROM CPRA_Tracking__c WHERE Contact_Field__c = 'Title'];
        spraList[0].Contact_Field__c = 'Phone';
        update spraList;

        List<CPRA_Tracking__c> spraList2 = [SELECT Id, Contact_Field__c FROM CPRA_Tracking__c WHERE Contact_Field__c = 'Email'];
        delete spraList2[0];
        
    }
}