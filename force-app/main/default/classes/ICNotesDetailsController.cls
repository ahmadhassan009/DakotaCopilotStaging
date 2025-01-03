public class ICNotesDetailsController {
    public Static List<ICNotesInfo> getNotes()
    {
        String paramIds = ApexPages.currentPage().getParameters().get('notesIds');
        List<Id> notesIds = paramIds.split(',');
        // Map to keep account and related consultants Ids
        Map<Id, Map<String, Id>> accountConsultantsMap = new Map<Id, Map<String, Id>>{};
        List<Public_Plan_Minute__c> icNotesList = [SELECT Id, Name,Meeting_Date__c, 
                                                            Meeting_Note_Summary__c, Account__r.Name,Account__r.AUM__c, 
                                                            Account__r.General_Consultant_Name__c,
                                                            Account__r.General_Consultant__c, 
                                                            Account__r.General_Consultant_2_Name__c,
                                                            Account__r.General_Consultant_2__c,
                                                            Account__r.Real_Estate_Consultant_Name__c,
                                                            Account__r.Real_Estate_Consultant__c,
                                                            Account__r.Private_Equity_Consultant__c,
                                                            Account__r.Private_Equity_Consultant_Name__c,
                                                            Account__r.Private_Credit_Consultant__c,
                                                            Account__r.Private_Credit_Consultant_Name__c,  
                                                            Account__r.Hedge_Fund_Consultant__c,
                                                            Account__r.Hedge_Fund_Consultant_Name__c,
                                                            Account__r.MetroArea__r.Name,
                                                            Account__r.General_Consultant__r.X100_Marketplace__c,
                                                            Account__r.General_Consultant_2__r.X100_Marketplace__c,
                                                            Account__r.Real_Estate_Consultant__r.X100_Marketplace__c,
                                                            Account__r.Private_Equity_Consultant__r.X100_Marketplace__c,
                                                            Account__r.Private_Credit_Consultant__r.X100_Marketplace__c,
                                                            Account__r.Hedge_Fund_Consultant__r.X100_Marketplace__c
                                                            FROM Public_Plan_Minute__c
                                                            where ID IN: notesIds 
                                                            ORDER BY Posted_Date__c DESC];

        List<Id> accountIDs = new List<Id>();

        for(Public_Plan_Minute__c icNote: icNotesList) {
            accountIDs.add(icNote.Account__r.Id);
            //Map for account record and its consultant's Ids
            if(accountConsultantsMap.containsKey(icNote.Account__r.Id)){
                accountConsultantsMap.get(icNote.Account__r.Id).put('General Consultant', icNote.Account__r.General_Consultant__c);
                accountConsultantsMap.get(icNote.Account__r.Id).put('General Consultant 2' , icNote.Account__r.General_Consultant_2__c);
                accountConsultantsMap.get(icNote.Account__r.Id).put('Real Estate Consultant', icNote.Account__r.Real_Estate_Consultant__c);
                accountConsultantsMap.get(icNote.Account__r.Id).put('Private Equity Consultant', icNote.Account__r.Private_Equity_Consultant__c);
                accountConsultantsMap.get(icNote.Account__r.Id).put('Private Credit Consultant', icNote.Account__r.Private_Credit_Consultant__c);
                accountConsultantsMap.get(icNote.Account__r.Id).put('Hedge Funds Consultant', icNote.Account__r.Hedge_Fund_Consultant__c);
            } else {
                Map<String, String> innerConsultantMap = new Map<String, String>();
                innerConsultantMap.put('General Consultant', icNote.Account__r.General_Consultant__c);
                innerConsultantMap.put('General Consultant 2' , icNote.Account__r.General_Consultant_2__c);
                innerConsultantMap.put('Real Estate Consultant', icNote.Account__r.Real_Estate_Consultant__c);
                innerConsultantMap.put('Private Equity Consultant', icNote.Account__r.Private_Equity_Consultant__c);
                innerConsultantMap.put('Private Credit Consultant', icNote.Account__r.Private_Credit_Consultant__c);
                innerConsultantMap.put('Hedge Funds Consultant', icNote.Account__r.Hedge_Fund_Consultant__c);
                accountConsultantsMap.put(icNote.Account__r.Id, innerConsultantMap);
            }
        }

        /**
         * Get all the records from Account Contact Relation object where role is not empty and linked Contact record is marketplace verified and Investor Allocator record type
         */
        String query = '';
        query = 'SELECT Id, AccountId, ContactId, Contact.Name, Contact.Marketplace_Verified_Contact__c, Contact.AccountId, Contact.RecordType.DeveloperName, Roles  FROM AccountContactRelation WHERE AccountId IN (' + '\'' + String.join(accountIDs, '\',\'') + '\'' + ') AND Roles != null AND Contact.Marketplace_Verified_Contact__c = true AND Contact.RecordType.DeveloperName = \'Dakota_Investments_Contact\'';
        List<AccountContactRelation> contactListToReturn = Database.query(query);
        // Role map contains consultants contacts for the account
        Map<String, String> roleMap = new Map<String, String>{};
        for(AccountContactRelation accConRelation: contactListToReturn) {
            String[] allRoles = accConRelation.Roles.split(';');
            for(String role : allRoles) {
                // Key contains the account Id and role e.g '123123__General Consultant'
                String mapKey = accConRelation.AccountId + '__' + role;
                if(role == 'General Consultant')
                {
                    // Check that the contact's account is same as the General Consultant of the account linked to the IC note record
                    if(accountConsultantsMap.containsKey(accConRelation.AccountId)) {
                        if(accountConsultantsMap.get(accConRelation.AccountId).containsKey('General Consultant')) {
                            if(accConRelation.Contact.AccountId == accountConsultantsMap.get(accConRelation.AccountId).get('General Consultant')) {
                                if(roleMap.containsKey(mapKey)) {
                                    String consultant  = roleMap.get(mapKey) + ', ' + accConRelation.Contact.Name;
                                    roleMap.put(mapKey, consultant);
                                } else {
                                    roleMap.put(mapKey, accConRelation.Contact.Name);
                                }
                            }
                        }
                    }
                    // Check that the contact's account is same as the General Consultant 2 of the account linked to the IC note record
                    if(accountConsultantsMap.containsKey(accConRelation.AccountId)) {
                        if(accountConsultantsMap.get(accConRelation.AccountId).containsKey('General Consultant 2')) {
                            if(accConRelation.Contact.AccountId == accountConsultantsMap.get(accConRelation.AccountId).get('General Consultant 2')) {
                                mapKey = accConRelation.AccountId + '__General Consultant 2';
                                if(roleMap.containsKey(mapKey)) {
                                    String consultant  = roleMap.get(mapKey) + ', ' + accConRelation.Contact.Name;
                                    roleMap.put(mapKey, consultant);
                                } else {
                                    roleMap.put(mapKey, accConRelation.Contact.Name);
                                }
                            }
                        }
                    }
                } else if (role == 'Real Estate Consultant') {
                    // Check that the contact's account is same as the Real Estate Consultant of the account linked to the IC note record
                    if(accountConsultantsMap.containsKey(accConRelation.AccountId)) {
                        if(accountConsultantsMap.get(accConRelation.AccountId).containsKey('Real Estate Consultant')) {
                            if(accConRelation.Contact.AccountId == accountConsultantsMap.get(accConRelation.AccountId).get('Real Estate Consultant')) {
                                if(roleMap.containsKey(mapKey)) {
                                    String consultant  = roleMap.get(mapKey) + ', ' + accConRelation.Contact.Name;
                                    roleMap.put(mapKey, consultant);
                                } else {
                                    roleMap.put(mapKey, accConRelation.Contact.Name);
                                }
                            }
                        }
                    }
                } else if (role == 'Private Equity Consultant') {
                    // Check that the contact's account is same as the Private Equity Consultant of the account linked to the IC note record
                    if(accountConsultantsMap.containsKey(accConRelation.AccountId)) {
                        if(accountConsultantsMap.get(accConRelation.AccountId).containsKey('Private Equity Consultant')) {
                            if(accConRelation.Contact.AccountId == accountConsultantsMap.get(accConRelation.AccountId).get('Private Equity Consultant')) {
                                if(roleMap.containsKey(mapKey)) {
                                    String consultant  = roleMap.get(mapKey) + ', ' + accConRelation.Contact.Name;
                                    roleMap.put(mapKey, consultant);
                                } else {
                                    roleMap.put(mapKey, accConRelation.Contact.Name);
                                }
                            }
                        }
                    }
                } else if (role == 'Private Credit Consultant') {
                    // Check that the contact's account is same as the Private Credit Consultant of the account linked to the IC note record
                    if(accountConsultantsMap.containsKey(accConRelation.AccountId)) {
                        if(accountConsultantsMap.get(accConRelation.AccountId).containsKey('Private Credit Consultant')) {
                            if(accConRelation.Contact.AccountId == accountConsultantsMap.get(accConRelation.AccountId).get('Private Credit Consultant')) {
                                if(roleMap.containsKey(mapKey)) {
                                    String consultant  = roleMap.get(mapKey) + ', ' + accConRelation.Contact.Name;
                                    roleMap.put(mapKey, consultant);
                                } else {
                                    roleMap.put(mapKey, accConRelation.Contact.Name);
                                }
                            }
                        }
                    }
                } else if (role == 'Hedge Funds Consultant') {
                    // Check that the contact's account is same as the Hedge Funds Consultant of the account linked to the IC note record
                    if(accountConsultantsMap.containsKey(accConRelation.AccountId)) {
                        if(accountConsultantsMap.get(accConRelation.AccountId).containsKey('Hedge Funds Consultant')) {
                            if(accConRelation.Contact.AccountId == accountConsultantsMap.get(accConRelation.AccountId).get('Hedge Funds Consultant')) {
                                if(roleMap.containsKey(mapKey)) {
                                    String consultant  = roleMap.get(mapKey) + ', ' + accConRelation.Contact.Name;
                                    roleMap.put(mapKey, consultant);
                                } else {
                                    roleMap.put(mapKey, accConRelation.Contact.Name);
                                }
                            }
                        }
                    }
                }
            }
        }

        if(icNotesList!=null && icNotesList.size()>0)
        {
            List<ICNotesInfo> notesInfoList = new List<ICNotesInfo>();
            for(Public_Plan_Minute__c note: icNotesList)
            {
                ICNotesInfo icnote = new ICNotesInfo();
                // noteConsultantKey is the key to find the consultant
                String noteConsultantKey = '';
                if(note.Account__c!=null)
                {
                    icnote.AccountName = note.Account__r.Name;
                    if(note.Account__r.AUM__c!=null)
                    {
                        List<String> args = new String[]{'0', 'number', '###,###,##0.00'};
                        String commaDelimetedAsset = String.format(note.Account__r.AUM__c.format(), args);
                        icnote.AccountAUM = commaDelimetedAsset;
                    }
                    
                    if(note.Account__r.General_Consultant__c!=null && note.Account__r.General_Consultant__r.X100_Marketplace__c == true) 
                    {
                        noteConsultantKey = (String) note.Account__r.Id + '__General Consultant';
                        icnote.AccountGeneralConsultant = note.Account__r.General_Consultant_Name__c;
                        if(roleMap.get(noteConsultantKey) != null) {
                            icnote.AccountGeneralConsultant = icnote.AccountGeneralConsultant + ':  ' + roleMap.get(noteConsultantKey);
                        } else {
                            icnote.AccountGeneralConsultant = icnote.AccountGeneralConsultant;
                        }
                    }
                    if(note.Account__r.General_Consultant_2__c!=null && note.Account__r.General_Consultant_2__r.X100_Marketplace__c == true) 
                    {
                        noteConsultantKey = (String) note.Account__r.Id + '__General Consultant 2';
                        icnote.AccountGeneralConsultant2 = note.Account__r.General_Consultant_2_Name__c;
                        if(roleMap.get(noteConsultantKey) != null) {
                            icnote.AccountGeneralConsultant2 = icnote.AccountGeneralConsultant2 + ':  ' + roleMap.get(noteConsultantKey);
                        } else {
                            icnote.AccountGeneralConsultant2 = icnote.AccountGeneralConsultant2;
                        }
                    }
                    if(note.Account__r.Real_Estate_Consultant__c!=null && note.Account__r.Real_Estate_Consultant__r.X100_Marketplace__c == true)
                    {
                        noteConsultantKey = (String) note.Account__r.Id + '__Real Estate Consultant';
                        icnote.AccountRealEstateConsultant = note.Account__r.Real_Estate_Consultant_Name__c;
                        if(roleMap.get(noteConsultantKey) != null) {
                            icnote.AccountRealEstateConsultant = icnote.AccountRealEstateConsultant + ':  ' + roleMap.get(noteConsultantKey);
                        } else {
                            icnote.AccountRealEstateConsultant = icnote.AccountRealEstateConsultant;
                        }
                    }
                    if(note.Account__r.Private_Equity_Consultant__c!=null && note.Account__r.Private_Equity_Consultant__r.X100_Marketplace__c == true)
                    {
                        noteConsultantKey = (String) note.Account__r.Id + '__Private Equity Consultant';
                        icnote.AccountPrivateEquityConsultant = note.Account__r.Private_Equity_Consultant_Name__c;
                        if(roleMap.get(noteConsultantKey) != null) {
                            icnote.AccountPrivateEquityConsultant = icnote.AccountPrivateEquityConsultant + ':  ' + roleMap.get(noteConsultantKey);
                        } else {
                            icnote.AccountPrivateEquityConsultant = icnote.AccountPrivateEquityConsultant;
                        }
                    }
                    if(note.Account__r.Private_Credit_Consultant__c!=null && note.Account__r.Private_Credit_Consultant__r.X100_Marketplace__c == true)
                    {
                        noteConsultantKey = (String) note.Account__r.Id + '__Private Credit Consultant';
                        icnote.AccountPrivateCreditConsultant = note.Account__r.Private_Credit_Consultant_Name__c;
                        if(roleMap.get(noteConsultantKey) != null) {
                            icnote.AccountPrivateCreditConsultant = icnote.AccountPrivateCreditConsultant + ':  ' + roleMap.get(noteConsultantKey);
                        } else {
                            icnote.AccountPrivateCreditConsultant = icnote.AccountPrivateCreditConsultant;
                        }
                    }
                    if(note.Account__r.Hedge_Fund_Consultant__c!=null && note.Account__r.Hedge_Fund_Consultant__r.X100_Marketplace__c == true)
                    {
                        noteConsultantKey = (String) note.Account__r.Id + '__Hedge Funds Consultant';
                        icnote.AccountHedgeFundConsultant = note.Account__r.Hedge_Fund_Consultant_Name__c;
                        if(roleMap.get(noteConsultantKey) != null) {
                            icnote.AccountHedgeFundConsultant = icnote.AccountHedgeFundConsultant + ':  ' + roleMap.get(noteConsultantKey);
                        } else {
                            icnote.AccountHedgeFundConsultant = icnote.AccountHedgeFundConsultant;
                        }
                    }

                    if(note.Account__r.MetroArea__c!=null)
                        icnote.AccountMetroArea = note.Account__r.MetroArea__r.Name;
                }
                if(note.Meeting_Note_Summary__c!=null)
                {
                    icnote.MeetingSummary = note.Meeting_Note_Summary__c;
                    //DSC-527 : Summary font issue fix
                    icnote.MeetingSummary = icnote.MeetingSummary.replaceAll('style="','style="font-family: sans-serif !important; white-space: pre-line; font-size: 14px !important;');
                    icnote.MeetingSummary = '<div style="font-family : sans-serif  !important; font-size: 14px  !important;">' +
                                            icnote.MeetingSummary + '</div>';
                } else {
                    icnote.MeetingSummary = '<br/>';
                }
                if(note.Meeting_Date__c!=null)
                    icnote.MeetingDate = note.Meeting_Date__c;

                notesInfoList.add(icnote);
            }
            return notesInfoList;
        }
        return null;
    }
    public class ICNotesInfo {
        public String AccountName {get;set;} 
        public String AccountAUM {get;set;} 
        public String AccountGeneralConsultant {get;set;}
        public String AccountGeneralConsultant2 {get;set;}
        public String AccountRealEstateConsultant {get;set;}
        public String AccountPrivateEquityConsultant {get;set;}
        public String AccountPrivateCreditConsultant {get;set;}
        public String AccountHedgeFundConsultant {get;set;} 
        public String AccountMetroArea {get;set;} 
        public String MeetingSummary {get;set;} 
        public date MeetingDate {get;set;}
        public ICNotesInfo(){
            AccountName = '';
            AccountAUM = '';
            AccountGeneralConsultant = '';
            AccountRealEstateConsultant = '';
            AccountPrivateEquityConsultant = '';
            AccountPrivateCreditConsultant = '';
            AccountHedgeFundConsultant = '';
            AccountMetroArea = '';
            MeetingSummary = '';
            MeetingDate = null;
        }
    }
}