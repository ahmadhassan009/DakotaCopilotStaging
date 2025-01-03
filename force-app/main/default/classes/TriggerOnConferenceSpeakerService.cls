public class TriggerOnConferenceSpeakerService {
    public static void setconferenceSpeakerName (List<Conference_Speaker__c> newConferenceSpeaker,Map<ID, Conference_Speaker__c> oldConferenceSpeaker)
    {
        List<Conference_Speaker__c> newUpdatedOrInsertedConferenceSpeakerList=new List<Conference_Speaker__c>();
        Map<ID,Contact> contMap = new Map<ID,Contact>(); 
        Map<ID,Conference__c> confMap  =new Map<ID,Conference__c>(); 

        for(Conference_Speaker__c csc : newConferenceSpeaker)
        {
            if((Trigger.isInsert ) || 
            (Trigger.isUpdate && (csc.Contact__c != oldConferenceSpeaker.get(csc.ID).Contact__c || csc.Conference__c!=oldConferenceSpeaker.get(csc.ID).Conference__c)))
            {
                newUpdatedOrInsertedConferenceSpeakerList.add(csc);
               
                contMap.put(csc.Contact__c,null);
                confMap.put(csc.Conference__c,null);
            }
        }

        if(newUpdatedOrInsertedConferenceSpeakerList.size() !=0)
        {
            contMap = new Map<ID,Contact>([Select ID, Name from Contact where ID IN :contMap.keySet()]);
            confMap = new Map<ID,Conference__c>([Select ID, Name from Conference__c where ID IN :confMap.keySet()]);

            for(Conference_Speaker__c cs : newUpdatedOrInsertedConferenceSpeakerList)
            {
                String conferenceSpeakerName='';
                if( contMap.containsKey(cs.Contact__c) && confMap.containsKey(cs.Conference__c))
                {
                    conferenceSpeakerName = contMap.get(cs.Contact__c).Name + ' - '  + confMap.get(cs.Conference__c).Name;                
                } 
                if(conferenceSpeakerName.length()>80 )
                {  
                    conferenceSpeakerName=conferenceSpeakerName.substring(0,80);
                }
                if(conferenceSpeakerName!='')
                {
                    cs.Name=conferenceSpeakerName;
                }
            }
        }          
    }
}