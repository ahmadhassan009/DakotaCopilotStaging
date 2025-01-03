public class TriggerOnContactHelper {
    public static Boolean checkIfMailingAddressPopulated(Contact con,Map<Id, Contact> oldContacts)
    {
        if(((con.MailingStreet != oldContacts.get(con.Id).MailingStreet && oldContacts.get(con.Id).MailingStreet == null) ||
           (con.MailingCity != oldContacts.get(con.Id).MailingCity && oldContacts.get(con.Id).MailingCity == null) || 
           (con.MailingPostalCode != oldContacts.get(con.Id).MailingPostalCode  && oldContacts.get(con.Id).MailingPostalCode == null) ||
           (con.MailingCountry != oldContacts.get(con.Id).MailingCountry && oldContacts.get(con.Id).MailingCountry == null)) && ((con?.California_Privacy_Regulation_Tracker__c !=null &&
           !con?.California_Privacy_Regulation_Tracker__c?.contains('Address')) || con?.California_Privacy_Regulation_Tracker__c ==null ))
        {
            return true;
        }
        return false;
    }
    
    public static Boolean checkMailingAddressValues(Contact con) 
    {             
        if (con.MailingStreet != null) return true;
        if (con.MailingCity != null) return true; 
        if (con.MailingPostalCode != null) return true;  
        if (con.MailingCountry != null) return true;
        return false;
    }
}