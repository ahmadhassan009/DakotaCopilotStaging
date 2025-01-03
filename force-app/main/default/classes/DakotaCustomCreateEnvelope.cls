@RestResource(urlMapping='/DakotaCustomCreateEnvelope')
global with sharing class DakotaCustomCreateEnvelope {
	
    @HttpPost
    global static void CreateEnvelopeStatus(String qteId, String envelopeId) {
        dsfs__DocuSign_Status__c docstatus = new dsfs__DocuSign_Status__c();
        docstatus.dsfs__Envelope_Status__c = 'Sent';
        docstatus.ZQuote__c = qteId;
        docstatus.dsfs__DocuSign_Envelope_ID__c = envelopeId;
        docstatus.dsfs__Sent_Date_Time__c = Datetime.now();
        insert docstatus;
    }

}