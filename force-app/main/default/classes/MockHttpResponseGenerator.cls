@isTest
global class MockHttpResponseGenerator implements HttpCalloutMock {
    global HTTPResponse respond(HTTPRequest req) {
        String host = System.Url.getOrgDomainUrl().toExternalForm();
        String endPointURL = host + '/services/data/v50.0/ui-api/favorites/';
        HttpResponse res = new HttpResponse();
        if(req.getMethod() =='GET')
        {
            String body = '{"favorites" :[{"accessCount": "1","iconColor": "7F8DE1", "iconUrl": "https://dakotanetworks--dev.my.salesforce.com/img/icon/t4v35/standard/account_120.png",';
            body = body + '"id": "0MVK000000002TUOAY","lastAccessDate": "2022-05-18T10:20:31.000Z","name": "Test Insurance","objectType": "Account",';
            body = body + '"sortOrder": "1","subtitle": "Account","target": "001K000001dcPg8IAE","targetType": "Record"}]}';
            res.setHeader('Content-Type', 'application/json');
            res.setBody(body);
            res.setStatusCode(200);
        }
        else if(req.getMethod() =='POST')
        {
            String body = '{"accessCount": "1","iconColor": "7F8DE1", "iconUrl": "https://dakotanetworks--dev.my.salesforce.com/img/icon/t4v35/standard/account_120.png",';
            body = body + '"id": "0MVK000000002TUOAY","lastAccessDate": "2022-05-18T10:20:31.000Z","name": "Test Insurance","objectType": "Account",';
            body = body + '"sortOrder": "1","subtitle": "Account","target": "001K000001dcPg8IAE","targetType": "Record"}';
            res.setHeader('Content-Type', 'application/json');
            res.setBody(body);
            res.setStatusCode(201);
        }
        else if(req.getMethod() =='DELETE')
        {
            res.setStatusCode(200);
        }
        return res;
    }
}