@isTest
public class HttpRequestMockFactory implements HttpCalloutMock {

    private HttpResponse mockResponse;

    // Constructor to initialize the mock response
    public HttpRequestMockFactory(HttpResponse mockResponse) {
        this.mockResponse = mockResponse;
    }

    // This method is called whenever a callout is made in the code and it returns the mocked HttpResponse
    public HttpResponse respond(HttpRequest request) {
        System.debug('Mocking HTTP request to: ' + request.getEndpoint());
        System.debug('Mocking response with status code: ' + mockResponse.getStatusCode());
        return mockResponse;
    }
}