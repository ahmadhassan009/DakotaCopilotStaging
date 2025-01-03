@istest
public class DakotaCustomSendToZuora_Test {
	static testMethod void testDakotaCustomSendToZuora(){
        RestRequest request = new RestRequest();
        request.requestUri ='/services/apexrest/DakotaCustomSendToZuora';
        request.httpMethod = 'POST';
        RestContext.request = request;
        String statusId = 'ok';
       
        Test.startTest();
        DakotaCustomSendToZuora.Send('b0im0000005szdY', 'test', true);
        System.assert(statusId != null );
        Test.stopTest();
   }
}