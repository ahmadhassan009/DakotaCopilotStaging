@RestResource(urlMapping='/DakotaCustomSendToZuora')
global with sharing class DakotaCustomSendToZuora {

    @HttpPost
    global static void Send(String qteId, String envelopeId, Boolean send)  {
        List<dsfs__DocuSign_Status__c> DocuSignStatusList = [SELECT Id 
                                                            FROM dsfs__DocuSign_Status__c
                                                            WHERE dsfs__DocuSign_Envelope_ID__c = :envelopeId
                                                            LIMIT 1];
        if (DocuSignStatusList.size() != 0) {
            dsfs__DocuSign_Status__c DocuSignStatus = DocuSignStatusList[0];
            DocuSignStatus.dsfs__Envelope_Status__c = 'Completed';
            DocuSignStatus.dsfs__Completed_Date_Time__c = Datetime.now();
            update DocuSignStatus;
        }
        if (send)
          {
             AutoSendToZBilling.sendQuotesToZuora(qteId, 'New');
           
          }
        
    }

 }