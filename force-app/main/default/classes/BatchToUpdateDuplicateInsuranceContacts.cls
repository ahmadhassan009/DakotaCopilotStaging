global class BatchToUpdateDuplicateInsuranceContacts implements Database.Batchable<sObject>,Database.stateful {
    private Map<String,Set<Id>> accountWithIndirectContact = new Map<String,Set<Id>>();
    Map<String,Contact> uniqueInsuranceContNameToId = new Map<String,Contact>();
    
    global List<Contact> start(Database.BatchableContext bc) {
        
        Map<Id,Contact> insuranceContMap = new Map<Id,Contact>([Select id, Name,Account.Parent_Account__c,Account.Parent_Account__r.id, AccountId,Account.Type, Account.Copyright__c 
                                                                from contact 
                                                                where AccountId != null AND Account.Copyright__c Like '%A.M.%' 
                                                                AND Account.Type ='Insurance Company General Account' 
                                                                AND Account.Parent_Account__c =null 
                                                                AND CreatedById='0053m00000Av30uAAB'
                                                               and Marketplace_Verified_Contact__c = false]);
        
        
        Map<String,Contact> uniqueInsuranceContactsMap = new Map<String,Contact>();
        Map<String,Contact> dupInsuranceContactsMap = new Map<String,Contact>();
        Map<Id,Contact> dupInsuranceContactsMapwithID = new Map<Id,Contact>();
        Set<Id> indirectAccounttIds = new Set<Id>();
        
        for(Contact con:insuranceContMap.values()) 
        {
            if(uniqueInsuranceContactsMap.get(con.Name) == null) 
            {
                uniqueInsuranceContactsMap.put(con.Name,con); 
            }
            else 
            {
                if(dupInsuranceContactsMap.get(con.Name) == null) 
                {
                    dupInsuranceContactsMap.put(con.Name,con);
                    dupInsuranceContactsMapwithID.put(con.Id,con);
                    indirectAccounttIds = new Set<Id>();
                    indirectAccounttIds.add(con.AccountId);
                    this.accountWithIndirectContact.put(con.Name,indirectAccounttIds);
                }
                else 
                {
                    dupInsuranceContactsMapwithID.put(con.Id,con);
                    indirectAccounttIds = this.accountWithIndirectContact.get(con.Name);
                    indirectAccounttIds.add(con.AccountId);
                    this.accountWithIndirectContact.put(con.Name,indirectAccounttIds);
                }
            }
        }
        this.uniqueInsuranceContNameToId = uniqueInsuranceContactsMap;
        return dupInsuranceContactsMapwithID.values();
    }
    
    global void execute(Database.BatchableContext bc, List<Contact> contactsToBeDeleted) {
        for(Contact con : contactsToBeDeleted)
        {
            con.TBD_Insurance_Contacts__c = true;
        }
        update contactsToBeDeleted;
        
        if(this.accountWithIndirectContact.keySet().size() > 0)
        {
            Set<String> contactsKeySet = this.accountWithIndirectContact.keySet();
            List<String> contactsNameList = new List<String>(contactsKeySet);
            List<Account_Contact_Relation__c> newInsuranceContactsList = new List<Account_Contact_Relation__c>();
            
            for(integer i=0; i<100 && i < contactsNameList.size(); i++)
            {
                if (this.accountWithIndirectContact.get(contactsNameList[i]) != null) {
                    Set<Id> oldContactIdRelatedToOldAccounts = this.accountWithIndirectContact.get(contactsNameList[i]);
                    for (Id accId : oldContactIdRelatedToOldAccounts) {
                        Account_Contact_Relation__c accConRel = new Account_Contact_Relation__c();
                        accConRel.Account__c = accId;
                        accConRel.Contact__c = this.uniqueInsuranceContNameToId.get(contactsNameList[i]).Id;
                        accConRel.Is_Insurance_record__c = true;
                        newInsuranceContactsList.add(accConRel);
                    }
                }
                this.accountWithIndirectContact.remove(contactsNameList[i]);
            }
            insert newInsuranceContactsList;
        }
    }

    
    global void finish(Database.BatchableContext bc) {}
}