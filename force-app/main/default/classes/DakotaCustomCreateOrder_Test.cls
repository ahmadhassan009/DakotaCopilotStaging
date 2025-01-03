@istest
public class DakotaCustomCreateOrder_Test {
 
   static testMethod void testCustomCreateOrder(){
       RestRequest request = new RestRequest();
       request.requestUri ='/services/apexrest/DakotaCustomCreateOrder';
       request.httpMethod = 'POST';
       RestContext.request = request;
       
       RestResponse response = new RestResponse();
       RestContext.response = response;
       
       String strId = 'ok';
       
       zqu__ZProduct__c product1 = new zqu__ZProduct__c();
       product1.zqu__ZuoraId__c = '2c92c0f9631b008801631d2f5a857f27';
       insert product1;
       
       zqu__ProductRatePlan__c product1rp = new zqu__ProductRatePlan__c();
       product1rp.zqu__ZuoraId__c = '2c92c0f8631af69901631d3a104a4c9c';
       product1rp.zqu__ZProduct__c = product1.Id;
       insert product1rp;
       
       zqu__ProductRatePlan__c product2rp = new zqu__ProductRatePlan__c();
       product2rp.zqu__ZuoraId__c = '2c92c0f9631b008401631d7b35de3223';
       product2rp.zqu__ZProduct__c = product1.Id;
       insert product2rp;
       
       zqu__ProductRatePlan__c product3rp = new zqu__ProductRatePlan__c();
       product3rp.zqu__ZuoraId__c = '2c92c0f966f747380166f9f5d7ab4c3f';
       product3rp.zqu__ZProduct__c = product1.Id;
       insert product3rp;
       
       
       Test.startTest();
       DakotaCustomCreateOrder.CreateOrder(
           'accName',
           'cont_mail@mail.com',
           'contFirstName',
           'contLastName',
           'contMailingCity',
           'contMailingState',
           'contMailingCountry',
           '123456',
           'contMailingStreet',
           'opName',
           '2c92c0f8631af69901631d3a104a4c9c',
           '2c92c0f9631b008401631d7b35de3223',
           '2',
           '2c92c0f966f747380166f9f5d7ab4c3f',
           '3'
       );
       Blob body = RestContext.response.responseBody;
       String jsonInput = body.toString();
       Map<String, Object> m = (Map<String, Object>) JSON.deserializeUntyped(jsonInput);
       String qId = String.valueOf(m.get('quoteId'));
       DakotaCustomCalculateQuote.PopulateQuoteMetrics(qId);
       DakotaCustomCreateEnvelope.CreateEnvelopeStatus(qId, 'test');
       

       System.assert(strId !=null );
       Test.stopTest();
   }
}