public class UserSessionHandler
 {
    public static String fetchUserSessionId(){
        String sSessionId = '';        
        PageReference sessionIdPage = Page.UserSessionPage;
        // Get the content of the VF page
        String vfContent = sessionIdPage.getContent().toString();
        // Find the position of Start and End
        Integer startPosition = vfContent.indexOf('Start') + 'Start'.length();
        Integer endPosition = vfContent.indexOf('End');
        // Get the Session Id
        sSessionId = vfContent.substring(startPosition, endPosition);
        System.debug('sessionId '+sSessionId);
        // Return Session Id
        return sSessionId;
    }
}