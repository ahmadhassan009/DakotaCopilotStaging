global with sharing class BatchForFormAdvOwners implements Database.Batchable<sObject>, Database.AllowsCallouts{

    public static Id directOwnersId = Schema.SObjectType.Form_ADV_Owner__c.getRecordTypeInfosByDeveloperName().get('Direct_Owners').getRecordTypeId();
    public static Id indirectOwnersId = Schema.SObjectType.Form_ADV_Owner__c.getRecordTypeInfosByDeveloperName().get('Indirect_Owners').getRecordTypeId();
    public static List<Form_ADV_Owner__c> formAdvOwnersList = new List<Form_ADV_Owner__c>(); 

    global Database.QueryLocator start(Database.BatchableContext bc)
    {
        return Database.getQueryLocator([select Id,CRD_No__c,form_ADV_Owners_Flag__c from Form_ADV__c where form_ADV_Owners_Flag__c=false limit 20]);
    }
    global void execute(Database.BatchableContext bc, List<Form_ADV__c> formADVFirmList)
    {   
        Integer count=0;
        for(Form_ADV__c formADVFirm : formADVFirmList)
        {
            parseAndSaveOwners(formADVFirm.Id,formADVFirm.CRD_No__c,true);
            parseAndSaveOwners(formADVFirm.Id,formADVFirm.CRD_No__c,false);
            formADVFirm.form_ADV_Owners_Flag__c=true;
            count++;
            if(math.mod(count, 5) == 0) 
            {
                datetime start=system.now();
                while(system.now() < start.addseconds(2)){}
            }
        }
        System.enqueueJob(new QueueableClassFormAdvAndItsChilds(formADVFirmList,formAdvOwnersList,null));
    }
    
    global void finish(Database.BatchableContext BC) {
        Database.executeBatch(new BatchForGetPrivateFundsData());
    }

    public static void parseAndSaveOwners(Id formAdvId,String crdNumber,Boolean isDirect) {
        String directOrIndirect = isDirect == true ? 'a-' : 'b-in';
        String endpointUrl = System.Label.Form_ADV_API_End_Point +'schedule-'+  directOrIndirect +'direct-owners/' + crdNumber + '?token='+System.Label.Form_D_Authorization_Url;
        HttpRequest request = new HttpRequest();
        request.setEndpoint(endpointUrl);
        request.setMethod('GET');
        HttpResponse response = new Http().send(request);
        if (response.getStatusCode() == 200  && !String.isBlank(response.getBody())) {
            String responseBody = response.getBody();
            storOwnerData(responseBody,formAdvId,crdNumber,isDirect);
        } else {            
            System.debug('Error: ' + response.getStatusCode() + ' - ' + response.getBody());
        }
    }

    public static Void storOwnerData(String result,Id formAdvId, String crdNumber,Boolean isDirect ) {
        List<Object> jsonObjects = (List<Object>)JSON.deserializeUntyped(result);
        for (Object jsonObject : jsonObjects) {        
            Map<String, Object> jsonMap = (Map<String, Object>)jsonObject;  
            String ownerName =  jsonMap.get('name') != null ? (String)jsonMap.get('name') : '';

            Form_ADV_Owner__c firmOwner = new Form_ADV_Owner__c(  
                Name = ownerName.length() > 80 ? ownerName.substring(0,80) : ownerName,
                Form_ADV__c =  formAdvId,
                recordTypeId =  isDirect == true ? directOwnersId : indirectOwnersId,     
                CRD_Number__c = Integer.valueOf(crdNumber),
                Owner_Name__c = (String)jsonMap.get('name'),
                Owner_Type__c = (String)jsonMap.get('ownerType'),
                Entity_Owned__c = isDirect == true ? null : (String)jsonMap.get('entityOwned'),
                Owner_Status__c = isDirect == true ? (String)jsonMap.get('titleStatus') : (String)jsonMap.get('status'),
                date_Status_Acquired__c = isDirect == true ? (String)jsonMap.get('dateTitleStatusAcquired') : (String)jsonMap.get('dateStatusAcquired'),
                ownership_Code__c = (String)jsonMap.get('ownershipCode'),
                is_Control_Person__c = (Boolean)jsonMap.get('isControlPerson'),
                is_Public_Reporting__c = (Boolean)jsonMap.get('isPublicReporting'),
                owner_CRD__c = (String)jsonMap.get('crd')
            );
            formAdvOwnersList.add(firmOwner);
        }
    }
}