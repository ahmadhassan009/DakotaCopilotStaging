@isTest
public with sharing class MassFollowSharePageController_Test {

    @isTest
    static void testMassFollowShareAction() {
        MassFollowSharePageController controller = new MassFollowSharePageController(null);
        Test.startTest();
        controller.massFollowShareAction();
        Test.stopTest();
        System.assertEquals('Only community users can follow or share.', controller.message);
        System.assertEquals('error', controller.type);
        System.assertEquals(true, controller.renderToast);
    }

    @isTest
    static void testGetRecordsViewAll() {
        Test.startTest();
        Account acc = New Account(
            Name = 'test 76'
        );
        insert acc;
        Account acct = [Select Id,RecordTypeId From Account Where Name = 'test 76' Limit 1];

        List<String> recordIdList=new List<String>();
        recordIdList.add(acct.Id);

        System.assertEquals(true, MassFollowSharePageController.getRecordsViewAll('Id, Name','Account','Name','desc',5,0,'LAST','all') != null);
        MassFollowSharePageController.getRecordsViewAll('Id, Name','Account','Name','desc',5,0,'LAST','Recent');
        System.assertEquals(true, MassFollowSharePageController.getOptionsFromApex('Account') != null);
        Test.stopTest();
    }

    @isTest
    static void testGetRecordsCountViewAll() {
        Test.startTest();
        Account acc = New Account(
            Name = 'test 76'
        );
        insert acc;

        System.assertEquals(true, MassFollowSharePageController.getRecordCountViewAll('Account','Name','desc','LAST','all') !=null);
        MassFollowSharePageController.getRecordCountViewAll('Account','Name','desc','LAST','Recent');
        Test.stopTest();
    }

    @isTest
    static void testUsersExportAccess() {
        Test.startTest();
        System.assertEquals(true, MassFollowSharePageController.usersExportAccess() !=null);
        Test.stopTest();
    }
}