@isTest
public class DefaultListViewController_Test {
    public static testMethod void testMarketplaceListViews()
    {
        Map<Id, Default_List_Views__mdt> config = new Map<Id, Default_List_Views__mdt>([SELECT Id, Object__c, Listview__c 
                                                                                        FROM Default_List_Views__mdt 
                                                                                        where Community_Name__c = 'Marketplace']);
        
        Test.startTest();
        List<DefaultListViewController.Item> items = DefaultListViewController.getDefaultListviews('Marketplace');
        Test.stopTest();
        
        DefaultListViewController.Item itm = items[0];
        Default_List_Views__mdt dlv = config.get(itm.DefaultId);
        
        system.assertEquals(dlv.Listview__c, itm.ListviewDeveloperName);
        system.assertEquals(dlv.Object__c, itm.ObjectName);
        system.assertEquals([SELECT Id FROM Listview WHERE SObjectType = :itm.ObjectName AND DeveloperName = :itm.ListviewDeveloperName].Id, itm.ListviewId);
    }
    
    public static testMethod void testEverestListViews()
    {
        Map<Id, Default_List_Views__mdt> config = new Map<Id, Default_List_Views__mdt>([SELECT Id, Object__c, Listview__c 
                                                                                        FROM Default_List_Views__mdt 
                                                                                        where Community_Name__c = 'Everest']);
        
        Test.startTest();
        List<DefaultListViewController.Item> items = DefaultListViewController.getDefaultListviews('Everest');
        Test.stopTest();
        
        DefaultListViewController.Item itm = items[0];
        Default_List_Views__mdt dlv = config.get(itm.DefaultId);
        
        system.assertEquals(dlv.Listview__c, itm.ListviewDeveloperName);
        system.assertEquals(dlv.Object__c, itm.ObjectName);
        system.assertEquals([SELECT Id FROM Listview WHERE SObjectType = :itm.ObjectName AND DeveloperName = :itm.ListviewDeveloperName].Id, itm.ListviewId);
    }
}