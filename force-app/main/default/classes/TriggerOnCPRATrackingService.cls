public with sharing class TriggerOnCPRATrackingService {

    public static void updateCPRTrackerInContact (List<CPRA_Tracking__c> newCPRATrackingeList,Map<ID, CPRA_Tracking__c> oldCPRATrackingMap)
    {      
        Map<ID,Contact> contactMap = new Map<ID,Contact>();
        Map<ID,List<CPRA_Tracking__c>> contactToCPRAMap = new Map<ID,List<CPRA_Tracking__c>>();
        List<Contact> contactsToUpdate = new List<Contact>();
        List<CPRA_Tracking__c> CPRATrackingList= new List<CPRA_Tracking__c>();
        List<CPRA_Tracking__c> triggeredCPRARecords = new List<CPRA_Tracking__c> ();
        if(Trigger.IsInsert || Trigger.IsUpdate)
        {
            triggeredCPRARecords = newCPRATrackingeList;
        }
        else if(Trigger.isDelete)
        {
            triggeredCPRARecords = oldCPRATrackingMap.values();
        }
        for(CPRA_Tracking__c cpra : triggeredCPRARecords)
        { 
             contactMap.put(cpra.Contact__c,null);
        }

        List<Contact> conWithCPRAList = [SELECT Id,(SELECT Id, Contact_Field__c,Contact__c FROM CPRA_Tracking__r) 
                                    FROM Contact WHERE Id IN :contactMap.keySet() AND (MailingState ='CA'OR MailingState ='California')];

        for(Contact con : conWithCPRAList)
        {
               if(contactToCPRAMap.containsKey(con.Id))
               {
                   contactToCPRAMap.get(con.Id).add(con.CPRA_Tracking__r);
               } 
               else {  
                    CPRATrackingList= new List<CPRA_Tracking__c>();
                    CPRATrackingList.addAll(con.CPRA_Tracking__r);
                    contactToCPRAMap.put(con.Id, CPRATrackingList ); 
               } 
        }

        contactMap = new Map<ID,Contact>([Select ID, California_Privacy_Regulation_Tracker__c,
                                          Phone, Biography__c, Email, Title from Contact where ID IN :contactToCPRAMap.keySet()]);
        
        for(CPRA_Tracking__c cpra : triggeredCPRARecords)
        {
            String tempCPRT = '';
            if ((Trigger.isUpdate && cpra.Contact_Field__c != oldCPRATrackingMap.get(cpra.ID).Contact_Field__c) || Trigger.isDelete || Trigger.isInsert)
            {
                if(contactToCPRAMap != null && contactToCPRAMap?.size() > 0 && !contactToCPRAMap.get(cpra.Contact__c).isEmpty() && contactToCPRAMap.get(cpra.Contact__c).size() > 0)
                {
                    tempCPRT = getMissingContactFields(contactToCPRAMap.get(cpra.Contact__c), contactMap);

                }
            }
            if(tempCPRT != '')
            {
                contactMap.get(cpra.Contact__c).California_Privacy_Regulation_Tracker__c = tempCPRT;
            }
            else{
               if( Trigger.isDelete && contactToCPRAMap.get(cpra.Contact__c).isEmpty() && contactToCPRAMap.get(cpra.Contact__c).size() < 1)
                {
                   
                     Set<String> CPRA_Options = new Set<String>{'Title','Bio','Email','Phone'};
                     if(contactMap.get(cpra.Contact__c).Email == null) CPRA_Options.remove('Email');
                     if(contactMap.get(cpra.Contact__c).Title == null) CPRA_Options.remove('Title');
                     if(contactMap.get(cpra.Contact__c).Phone == null) CPRA_Options.remove('Phone');
                     if(contactMap.get(cpra.Contact__c).Biography__c == null) CPRA_Options.remove('Bio');
                     contactMap.get(cpra.Contact__c).California_Privacy_Regulation_Tracker__c = CPRA_Options.size() > 0 ? String.join(new List<String>(CPRA_Options),';') : null;
                }
                else
                {
                    if(contactMap.get(cpra.Contact__c)!=null)
                    {
                           contactMap.get(cpra.Contact__c).California_Privacy_Regulation_Tracker__c = 'All Information Publicly Available';
                    }
                }
            }
            contactsToUpdate.add(contactMap.get(cpra.Contact__c));
        }
        if(contactsToUpdate !=null && contactsToUpdate[0] !=null && contactsToUpdate.size() > 0)
        {
            update contactsToUpdate;
        }
    }
     
    public static String getMissingContactFields(List<CPRA_Tracking__c> contactToCPRA, Map<ID,Contact> contactMap ) {
        String updatedCaliforniaPrivacyRegulationTracker = '';
        for(CPRA_Tracking__c cpra : contactToCPRA)
        {
            updatedCaliforniaPrivacyRegulationTracker = cpra.Contact_Field__c !=null ? updatedCaliforniaPrivacyRegulationTracker + ';'+ cpra.Contact_Field__c : updatedCaliforniaPrivacyRegulationTracker;
            
        }
        
        updatedCaliforniaPrivacyRegulationTracker = removeDuplicateSubstrings(updatedCaliforniaPrivacyRegulationTracker);

        
        List<String> listOfCPRTValues = updatedCaliforniaPrivacyRegulationTracker.split(';',0);
        List<String> pickListValuesList= new List<String>();
        Schema.DescribeFieldResult fieldResult = Contact.California_Privacy_Regulation_Tracker__c.getDescribe();
        List<Schema.PicklistEntry> ple = fieldResult.getPicklistValues();
        for( Schema.PicklistEntry pickListVal : ple){
            pickListValuesList.add(pickListVal.getValue());
        } 
        String missingContactFields = '';
        for (String plv : pickListValuesList) {
            if (!listOfCPRTValues.contains(plv)) {
                missingContactFields = missingContactFields == '' ? plv : missingContactFields+';'+plv ;
            }
        }
        missingContactFields = missingContactFields.replace('All Information Publicly Available', '');
        missingContactFields = missingContactFields.startsWith(';') ?  missingContactFields.substring(1) : missingContactFields;
        missingContactFields = missingContactFields.replaceAll(';+$', '');
        if((contactToCPRA!=null && contactToCPRA.size() > 0) && (missingContactFields.contains('Email;') || missingContactFields.contains('Email')) && contactMap.get(contactToCPRA[0].Contact__c).Email == null)
        {
            missingContactFields = missingContactFields.replace('Email;', '');
            missingContactFields = missingContactFields.replace('Email', '');
        }
        if( (contactToCPRA!=null && contactToCPRA.size() > 0) && (missingContactFields.contains('Title;') || missingContactFields.contains('Title')) && contactMap.get(contactToCPRA[0].Contact__c).Title == null)
        {
            missingContactFields = missingContactFields.replace('Title;', '');
            missingContactFields = missingContactFields.replace('Title', '');
        }
        if( (contactToCPRA!=null && contactToCPRA.size() > 0) &&(missingContactFields.contains('Bio;') || missingContactFields.contains('Bio')) && contactMap.get(contactToCPRA[0].Contact__c).Biography__c == null)
        {
            missingContactFields = missingContactFields.replace('Bio;', '');
            missingContactFields = missingContactFields.replace('Bio', '');
        }
        if( (contactToCPRA!=null && contactToCPRA.size() > 0) &&(missingContactFields.contains('Phone;') || missingContactFields.contains('Phone')) && contactMap.get(contactToCPRA[0].Contact__c).Phone == null)
        {
            missingContactFields = missingContactFields.replace('Phone;', '');
            missingContactFields = missingContactFields.replace('Phone', '');
        }

		return missingContactFields;
    }
    
    public static String removeDuplicateSubstrings(String californiaPrivacyRegulationTracker) {
        Set<String> seenSubstrings = new Set<String>();
        String[] substrings = californiaPrivacyRegulationTracker.split(';'); 
        String resultString = '';
        for (String substring : substrings) {
            if (!seenSubstrings.contains(substring)) {
                seenSubstrings.add(substring);
                resultString += substring + ';';
            }
        }
        if (resultString.endsWith(';')) {
            resultString = resultString.substring(0, resultString.length() - 1);
        }
        return resultString;
    }
}