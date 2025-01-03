@isTest
public class TriggerOnFormDService_Test {

    @testSetUp
    public static void createData()
    {
        Account acc = TestDataFactory.createAccount();
        Investment_Strategy__c investmentStategy = new Investment_Strategy__c (
            Name = 'Test Strategy',
            Account__c = acc.Id
        );
        insert investmentStategy;

        Form_D_Offering__c formD = new Form_D_Offering__c(
            Entity_Type__c = 'Limited Partnership',
            Act_of_1940__c = true,
            Name_Issuer__c ='test',
            Account__c = acc.Id,
            Filed_At__c = Datetime.valueOf('2024-01-10 12:00:00.0000+00:00')
        );
        insert formD;
    }
    
    @isTest
    public static void testInsertFormdMpVeifiedCheckbox() {
        List<Form_D_Offering__c> fd = [SELECT id,Marketplace_verified__c from Form_D_Offering__c where Filed_At__c >= 2024-01-01T12:00:00.0000+00:00 and (Entity_Type__c in ('Limited Partnership', 'General Partnership') or  Act_of_1940__c =true)  and New_Notice__c =true and (NOT Name_Issuer__c LIKE '%a series%') and (NOT Name_Issuer__c LIKE '%spv%') and (Account__c <> null and Account__r.Name <> '') and Not_Applicable__c <> true ];
        System.assertEquals(true, fd[0].Marketplace_verified__c);
    }
    @isTest
    public static void testUpdateFormdMpVeifiedCheckbox() {
        List<Form_D_Offering__c> fd = [SELECT id,Marketplace_verified__c from Form_D_Offering__c where Filed_At__c >= 2024-01-01T12:00:00.0000+00:00 and (Entity_Type__c in ('Limited Partnership', 'General Partnership') or  Act_of_1940__c =true)  and New_Notice__c =true and (NOT Name_Issuer__c LIKE '%a series%') and (NOT Name_Issuer__c LIKE '%spv%') and (Account__c <> null and Account__r.Name <> '') and Not_Applicable__c <> true ];
        fd[0].Account__c = null;
        update fd;
        List<Form_D_Offering__c> fdd = [SELECT id,Marketplace_verified__c from Form_D_Offering__c where Filed_At__c >= 2024-01-01T12:00:00.0000+00:00 and (Entity_Type__c in ('Limited Partnership', 'General Partnership') or  Act_of_1940__c =true)  and New_Notice__c =true and (NOT Name_Issuer__c LIKE '%a series%') and (NOT Name_Issuer__c LIKE '%spv%') and (Account__c = null ) and Not_Applicable__c <> true ];
        System.assertEquals(false, fdd[0].Marketplace_verified__c);
    }
    @isTest
    public static void testUpdateRelatedRecordsMpVerifiedCheck() {
        List<Form_D_Offering__c> fd = [SELECT id,Marketplace_verified__c from Form_D_Offering__c where Filed_At__c >= 2024-01-01T12:00:00.0000+00:00 and (Entity_Type__c in ('Limited Partnership', 'General Partnership') or  Act_of_1940__c =true)  and New_Notice__c =true and (NOT Name_Issuer__c LIKE '%a series%') and (NOT Name_Issuer__c LIKE '%spv%') and (Account__c <> null and Account__r.Name <> '') and Not_Applicable__c <> true ];
        delete fd;
    }


    
}