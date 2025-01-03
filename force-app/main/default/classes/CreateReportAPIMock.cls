@isTest
public class CreateReportAPIMock implements HttpCalloutMock {
    
    // This method simulates the response for an HTTP request
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');

        // Simulate a POST request with a mock report creation response
        if (req.getMethod() == 'POST') {
            res.setStatusCode(200);
            res.setBody('{"attributes": {"reportId": "00O5g00000XXXXXXX"}}');
        } 
        // Simulate a GET request with a mock report fetching response
        else if (req.getMethod() == 'GET') {
            res.setStatusCode(200);
            res.setBody('{"totalSize": 1, "done": true, "records": [{"Id": "00O5g00000XXXXXXX", "Name": "Sample Report"}]}');
        } 
        // Any other request types
        else {
            res.setStatusCode(400); // Bad request if other methods are used
            res.setBody('{"error": "Invalid request method"}');
        }
        
        return res;
    }
}