global class BatchToCreatePlanAdminContacts implements Database.Batchable<sObject> 
{
    private Set<String> alphabets;
    private Set<String> skippedTitles;
    private Set<String> skippedTitlesWithCommas;
    
    public BatchToCreatePlanAdminContacts() {
        this.alphabets = new Set<String>{'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','A.','B.','C.','D.','E.','F.','G.','H.','I.','J.','K.','L.','M.','N.','O.','P.','Q.','R.','S.','T.','U.','V.','W.','X.','Y.','Z.'};
        this.skippedTitles =  new Set<String>{'CFO','JR.','JR','VP','TA','IV','J.R.','III','ST.','M.W.','SR','DIR','HR','OPS','HMSC','OED','EXEC','M.D.','CEO','MD','II','AST','LEA','MD','JO','DR.','CPO','J.F','SR','LLP','REP','CORP.','EVP','IV','DE','LA','I.S.T.','CPA','INC.','P.M.','TAX','C.F.O.','CMA','ULI','CPC','QPA','ERPA'};
        this.skippedTitlesWithCommas =  new Set<String>{',CFO',',JR.',',JR',',VP',',TA',',IV',',J.R.',',III',',ST.',',M.W.',',SR',',DIR',',HR',',OPS',',HMSC',',OED',',EXEC',',M.D.',',CEO',',MD',',II',',AST',',LEA',',MD',',JO',',DR.',',CPO',',J.F',',SR',',LLP',',REP',',CORP.',',EVP',',IV',',DE',',LA',',I.S.T.',',CPA',',INC.',',P.M.',',TAX',',C.F.O.',',CMA',',ULI',',CPC',',QPA',',ERPA'};             
    } 
    
    global Database.QueryLocator start(Database.BatchableContext bc) {
        String query = 'SELECT Id,Is_Processed__c,Spons_DFE_Phone_Num__c,Account__c,Plan_Administrator_Contact_Name__c,Admin_Manual_Signed_Name__c,Admin_Name__c,DFE_Manual_Signed_Name__c,DFE_Signed_Name__c,Spons_Manual_Signed_Name__c,Spons_Signed_Name__c FROM Form_5500_Additional_Information__c where Account__c != null and Is_Processed__c = false';
        return Database.getQueryLocator(query);
    }
    
    global void execute(Database.BatchableContext bc, List<Form_5500_Additional_Information__c> form5500Records){
        try {
            
            Map<String,Set<Id>> conNametoAccIds = new Map<String,Set<Id>>();
            Map<String,String> conNametoPhone = new Map<String,String>();
            List<String> planContactNames = new List<String>();
            List<Form_5500_Additional_Information__c> updateForm5500Records = new List<Form_5500_Additional_Information__c>();
            
            //Create map of contact name to contact phone
            //Create map of contact name to parent account Ids
            for(Form_5500_Additional_Information__c form5500 : form5500Records)
            {
                Form_5500_Additional_Information__c updateRec = new Form_5500_Additional_Information__c();
                updateRec.Id = form5500.Id;
                updateRec.Is_Processed__c = true;
                updateForm5500Records.add(updateRec);
                
                if(form5500.Plan_Administrator_Contact_Name__c != null && form5500.Plan_Administrator_Contact_Name__c != '')
                {
                    planContactNames = form5500.Plan_Administrator_Contact_Name__c.split('#');
                    for(String conName : planContactNames)
                    {
                        conName = conName.trim();
                        conNametoPhone.put(conName,form5500.Spons_DFE_Phone_Num__c);
                        //If map doesnot contains contact name then create new set and add account Id in it
                        if(!conNametoAccIds.containsKey(conName)) 
                        {
                            Set<Id> accountIds = new Set<Id>{form5500.Account__c};
                                conNametoAccIds.put(conName,accountIds);
                        }
                        //else add account Id to existing account Ids
                        else 
                        {
                            Set<Id> accountIds = conNametoAccIds.get(conName);
                            accountIds.add(form5500.Account__c);
                            conNametoAccIds.put(conName,accountIds);
                        } 
                        System.debug(conName);
                    }
                    planContactNames = new List<String>();
                }
            }
            if(conNametoAccIds.size() > 0)
            {
                //Fetch existing contact records with the same contact names
                List<Contact> existingPlanContacts = [Select Id,Name,AccountId from Contact where Name In :conNametoAccIds.keySet()];
                System.debug(existingPlanContacts.size());
                Map<String,Contact> conNameToContact = new Map<String,Contact>();
                //Create map of existing contact name to contact
                for(Contact cnct : existingPlanContacts)
                {
                    System.debug(cnct.Name);
                    String cnctName = cnct.Name.toLowerCase();
                    conNameToContact.put(cnctName,cnct);
                }
                
                Map<String,AccountContactRelation> accountContactRelationships = new Map<String,AccountContactRelation>();
                List<Contact> contactsToBeCreated = new List<Contact>();
                Id investmentContactRecordType = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_Investments_Contact').getRecordTypeId();
                //Loop through the initially created map in order to prepare account-contact relationship record or contact records
                for(String conName : conNametoAccIds.keySet())
                {
                    if(conName != null && conName != '')
                    {
                        //if contact already exists then created relationship with accounts
                        String planConName = conName.toLowerCase();
                        if(conNameToContact.containsKey(planConName)) {
                            for(Id accId : conNametoAccIds.get(conName))
                            {
                                if(accId != conNameToContact.get(planConName).AccountId) {
                                    String acctConKey = String.valueOf(accId)+String.valueOf(conNameToContact.get(planConName).Id);
                                    AccountContactRelation accConRel = new AccountContactRelation();
                                    accConRel.AccountId = accId;
                                    accConRel.ContactId = conNameToContact.get(planConName).Id;
                                    accConRel.Roles = 'Plan Administrator Contact';
                                    accountContactRelationships.put(acctConKey,accConRel);
                                }
                            }
                        }
                        //otherwise create contact first
                        else 
                        {
                            List<String> splitConName = conName.split(' ');
                            List<String> formatedConName = new List<String>();
                            
                            if(splitConName.size() > 0 && conNametoAccIds.get(conName).size() > 0) 
                            {
                                List<Id> accountIds = new List<Id>(conNametoAccIds.get(conName));
                                
                                Contact cnct = new Contact();
                                Boolean createContact = false;
                                for(String conNameToken : splitConName)
                                {
                                    if(!helperToSkipDecapitilization(conNameToken)) {
                                        conNameToken = conNameToken.toLowerCase();
                                        conNameToken = conNameToken.capitalize();
                                    }
                                    formatedConName.add(conNameToken);
                                }
                                if(formatedConName.size() == 1) 
                                {
                                    createContact = true;
                                    cnct.LastName = formatedConName[0];
                                }
                                if(formatedConName.size() == 2) 
                                {
                                    createContact = true;
                                    cnct.FirstName = formatedConName[0];
                                    cnct.LastName = formatedConName[1];
                                }
                                else if(formatedConName.size() == 3)
                                {
                                    createContact = true;
                                    cnct.FirstName = formatedConName[0];
                                    cnct.MiddleName = formatedConName[1];
                                    cnct.LastName = formatedConName[2];
                                }
                                else if(formatedConName.size() > 3)
                                {
                                    createContact = true;
                                    cnct.FirstName = formatedConName[0];
                                    cnct.MiddleName = formatedConName[1];
                                    formatedConName.remove(0);
                                    formatedConName.remove(0);
                                    cnct.LastName = String.join(formatedConName, ' ');
                                }
                                if(createContact == true)
                                {
                                    cnct.Phone = conNametoPhone.get(conName);
                                    cnct.AccountId = accountIds[0];
                                    cnct.RecordTypeId = investmentContactRecordType;
                                    cnct.Form_5500_Contact__c = true;
                                    cnct.Title = 'Plan Administrator Contact';
                                    contactsToBeCreated.add(cnct);
                                }
                            }
                        }
                    }
                }
                
                if(contactsToBeCreated.size() > 0)
                {
                    insert contactsToBeCreated;
                }
                
                List<AccountContactRelation> directRelationOfNewContacts = [Select Id,Roles from AccountContactRelation where ContactId In :contactsToBeCreated and IsDirect = true];
                for(AccountContactRelation accConRel : directRelationOfNewContacts)
                {
                    accConRel.Roles = 'Plan Administrator Contact';
                }
                if(directRelationOfNewContacts.size() > 0)
                {
                    update directRelationOfNewContacts;
                }
                
                //create relationship with the newly created contacts
                for(Contact cnct : contactsToBeCreated)
                {
                    if(conNametoAccIds.containsKey(cnct.Name)) {
                        for(Id accId : conNametoAccIds.get(cnct.Name))
                        {
                            if(accId != cnct.AccountId) {
                                String acctConKey = String.valueOf(accId)+String.valueOf(cnct.Id);
                                AccountContactRelation accConRel = new AccountContactRelation();
                                accConRel.AccountId = accId;
                                accConRel.ContactId = cnct.Id;
                                accConRel.Roles = 'Plan Administrator Contact';
                                accountContactRelationships.put(acctConKey,accConRel);
                            }
                        }
                    }
                }
                
                if(accountContactRelationships.values().size() > 0)
                {
                    insert accountContactRelationships.values();
                }
            }
            if(updateForm5500Records.size() > 0)
            {
                update updateForm5500Records;
            }
        }
        catch(Exception ex) {
            System.debug(ex.getMessage());
        }
    }
    
    private boolean helperToSkipDecapitilization(String conNameToken)
    {
        if(this.alphabets.contains(conNameToken) || this.skippedTitles.contains(conNameToken) || this.skippedTitlesWithCommas.contains(conNameToken)) {
            return true;
        }
        return false;
    }
    global void finish(Database.BatchableContext bc){
    }
}