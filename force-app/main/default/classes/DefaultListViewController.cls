public class DefaultListViewController 
{
	@AuraEnabled
    public static List<Item> getDefaultListviews(String communityName)
    {
        List<Item> rtn = new List<Item>();
        List<Default_List_Views__mdt> config = [SELECT Id, Object__c, Listview__c FROM Default_List_Views__mdt where Community_Name__c = :communityName];
        
        Map<string, Listview> listviews = new Map<string, Listview>();
        
        Set<string> listviewDeveloperNames = new Set<string>();
        Set<string> listviewObjects = new Set<string>();
        for (Default_List_Views__mdt itm : config)
        {
            listviewDeveloperNames.add(itm.Listview__c);
            listviewObjects.add(itm.Object__c);
        }
        
        for (Listview lv : [SELECT Id, DeveloperName, SObjectType FROM Listview WHERE DeveloperName IN :listviewDeveloperNames AND SObjectType IN :listviewObjects])
        {
            listviews.put(getKey(lv.SobjectType, lv.DeveloperName), lv);
        }        
        
        for (Default_List_Views__mdt itm : config)
        {
            string obj = itm.Object__c.trim();
            string devname = itm.Listview__c.trim();

            if(listviews.containsKey(getKey(obj, devname))) {
                Listview lv = listviews.get(getKey(obj, devname));
            
                Item i = new Item();
                i.DefaultId = itm.Id;
                i.UserId = UserInfo.getUserId();
                i.ObjectName = lv.SobjectType;
                i.ListviewDeveloperName = lv.DeveloperName;
                i.ListviewId = lv.Id;
                rtn.add(i);
            }
        }
        
        return rtn;
    }
    
    private static string getKey(string obj, string devname)
    {
        return obj + ':' + devname;
    }
    
    public class Item
    {
        public Id DefaultId; 
        
        @AuraEnabled
        public string UserId { get; set; }
        
        @AuraEnabled
        public string ObjectName { get; set; }
        
        @AuraEnabled
        public string ListviewId { get; set; }
        
        @AuraEnabled
        public string ListviewDeveloperName { get; set; }
    }
}