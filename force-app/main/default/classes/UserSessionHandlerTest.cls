@isTest
public class UserSessionHandlerTest {
    
    //Test Case 1: Valid Scenario (Start and End exist)
    @isTest
    static void testFetchUserSessionId_ValidCase() {
        String testVFContent = 'SomeTextBeforeStartSESSION123EndSomeTextAfter';
        String sessionId = UserSessionHandler.fetchUserSessionId(true, testVFContent);
        System.assertEquals('SESSION123', sessionId, 'Session ID extraction failed!');
    }

    //Test Case 2: Missing "Start" in VF Content
    @isTest
    static void testFetchUserSessionId_MissingStart() {
        String testVFContent = 'SomeTextBeforeSESSION123EndSomeTextAfter';
        String sessionId = UserSessionHandler.fetchUserSessionId(true, testVFContent);
        System.assertEquals('TextBeforeSESSION123', sessionId, 'Expected Session ID when "Start" is missing!');
    }

    //Test Case 3: Missing "End" in VF Content
    @isTest
    static void testFetchUserSessionId_MissingEnd() {
        String testVFContent = 'SomeTextBeforeStartSESSION123';
        String sessionId = UserSessionHandler.fetchUserSessionId(true, testVFContent);
        System.assertEquals('', sessionId, 'Expected empty Session ID when "End" is missing!');
    }

    //Test Case 4: Empty VF Content
    @isTest
    static void testFetchUserSessionId_EmptyContent() {
        String testVFContent = '';
        String sessionId = UserSessionHandler.fetchUserSessionId(true, testVFContent);
        System.assertEquals('', sessionId, 'Expected empty Session ID when content is empty!');
    }
}