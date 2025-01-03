public class UpdateSearchesCheckboxController {
    public static String recordId ='';
    
    public UpdateSearchesCheckboxController(ApexPages.StandardController controller)
    {
        recordId = apexpages.currentpage().getparameters().get('id');
    }
		
    public static PageReference UpdateSearchesCheckbox(){

        Marketplace_Searches__c searchesRecord= [SELECT Id, Name, Send_Alert__c  From Marketplace_Searches__c where id=:recordId];

        if(searchesRecord.Send_Alert__c == false)
        {
            searchesRecord.Send_Alert__c = true;
            update(searchesRecord);
        }

        PageReference pageRef = new PageReference('/'+recordId);
        pageRef.setRedirect(true);
       	return pageRef;
    }
    
    
}