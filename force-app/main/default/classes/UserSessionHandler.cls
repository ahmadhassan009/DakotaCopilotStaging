public class UserSessionHandler {
    
    public static String fetchUserSessionId() {
        return fetchUserSessionId(false, '');
    }
    
    public static String fetchUserSessionId(Boolean isTest, String mockContent) {
        String sSessionId = '';        
        String vfContent;
        if (isTest) {
            // Use test content instead of calling VF PageReference.getContent()
            vfContent = mockContent;
        } else {
            PageReference sessionIdPage = Page.UserSessionPage;
            vfContent = sessionIdPage.getContent().toString();
        }
        // Check if vfContent is null or empty (additional condition)
        if (vfContent == null || vfContent == '') {
            return sSessionId;
        }
        // Extract Session ID
        Integer startPosition = vfContent.indexOf('Start') + 'Start'.length();
        Integer endPosition = vfContent.indexOf('End');
        if (startPosition > 0 && endPosition > startPosition) {
            sSessionId = vfContent.substring(startPosition, endPosition).trim();
        } else {
            System.debug('Start or End position invalid, no session ID found.');
        }
        return sSessionId;
	}
}