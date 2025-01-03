global class FieldHistoryHandler implements Schedulable  {
    
    public List<String> allObjects=new List<String>{'AccountHistory', 'ContactHistory'};
        public static Datetime accDate;
    public static Datetime conDate;
    
    global void execute(SchedulableContext ctx) {        
        List<fieldHistoryLastRecord__c> fieldsDate=[SELECT Id,accountLastRecord__c,contactLastRecord__c FROM fieldHistoryLastRecord__c];
        if(fieldsDate.size()>0)
        {
            List<Datetime> dates=new List<Datetime>{fieldsDate[0].AccountLastRecord__c,fieldsDate[0].contactLastRecord__c};            
            for(Integer i=0;i<allObjects.size();i++)
            {
                insertAllHistoryRecord(allObjects[i],dates[i]);
            }
        }
        else
        {
            for(Integer i=0;i<allObjects.size();i++)
            {             
                insertAllHistoryRecord(allObjects[i],null);
            }
        }
    }
    
    @future
    public static void insertAllHistoryRecord(String objName,Datetime dateTim)
    {
        List<String> exludedDataTypes =  new List<String>{'EntityId'};
            String dynamicQuery;
        List<SObject> historyRecord=new List<SObject>();
        Set<String> accountIds = new Set<String>();
        Set<String> contactIds = new Set<String>();
        //Map<Id, Account> presentAccountsMap;
        Set<ID> accIDsList= new Set<ID>();        
        Set<ID> conIDsList = new Set<ID>();  
        Map<Id, Account> presentAccountsMap;
        Map<Id, Contact> presentContactsMap;
        if(objName=='AccountHistory')
        {
            if(dateTim==null)
            {
                historyRecord=[SELECT Id,AccountId,NewValue,OldValue,DataType,createddate,Field,CreatedById FROM AccountHistory WHERE
                               DataType not in : exludedDataTypes order by createddate Asc LIMIT 1000];                
            }
            else
            {               
                historyRecord=[SELECT Id,AccountId,Account.recordtypeId,NewValue,OldValue,DataType,createddate,Field,CreatedById FROM AccountHistory WHERE 
                               DataType not in :exludedDataTypes AND createddate > :dateTim order by createddate Asc LIMIT 1000];                
            }
            
            List<String> acc = new List<String>(); 
            
            for(SObject o:historyRecord)
            {
                acc.add(String.valueOf(o.get('AccountId')));
            }
            presentAccountsMap = new Map <Id, Account>([SELECT id from account where id in :acc]);             
        }
        
        
        else if(objName=='ContactHistory')
        {            
            if(dateTim==null)
            {                
                historyRecord=[SELECT Id,ContactId,NewValue,OldValue,DataType,createddate,Field,CreatedById FROM ContactHistory WHERE 
                               DataType not in :exludedDataTypes order by createddate Asc LIMIT 1000];
                
            } 
            else
            {
                historyRecord=[SELECT Id,ContactId,NewValue,OldValue,DataType,createddate,Field,CreatedById FROM ContactHistory WHERE 
                               DataType not in :exludedDataTypes AND createddate > :dateTim order by createddate Asc LIMIT 1000];                
            }
            List<String> con = new List<String>(); 
            
            for(SObject o:historyRecord)
            {
                con.add(String.valueOf(o.get('ContactId')));
            }
            presentContactsMap=new Map<Id, Contact> ([SELECT id from Contact where id in :con]);              
        }
        
        List<Update__c> recordHistory=new List<Update__c>();
        
        for(SObject o:historyRecord)
        {                                            
            Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();
            
            String oldValue='';
            String newValue='';
            
            if(String.valueOf(o.get('DataType'))=='StringPlusClob')
            {
                newValue = 'CHANGED';
            }
            else if(String.valueOf(o.get('DataType'))=='Currency')
            {
                String oldCurrency = String.valueOf(o.get('OldValue'));
                String newCurrency = String.valueOf(o.get('NewValue'));
                List<String> args = new String[]{'0','number','###,###,##0'};
                    
                    if(oldCurrency!=null)
                {
                    oldValue = '$'+String.format(Decimal.valueOf(oldCurrency).format(), args);
                }
                
                if(newCurrency!=null)
                {
                    newValue = '$'+String.format(Decimal.valueOf(newCurrency).format(), args);                    
                }                
            }
            else
            {
                oldValue = String.valueOf(o.get('OldValue'));
                newValue = String.valueOf(o.get('NewValue'));                
            }
            
            if(objName=='AccountHistory')
            {
                Object a =String.valueOf(o.get('AccountId'));
                if(presentAccountsMap.containsKey(String.valueOf(o.get('AccountId'))))
                {
                    String fieldLabel = String.valueOf(o.get('Field')) == 'RecordType' ? 'Account Record Type' : String.valueOf(o.get('Field'));
                    Map<String, Schema.SObjectField> fieldMap = schemaMap.get('Account').getDescribe().fields.getMap();
                    if(fieldLabel != 'created') 
                    {
                        if(fieldLabel == 'TextName') 
                        {
                            fieldLabel = fieldMap.get('Name').getDescribe().getLabel();
                        }
                        else if(fieldMap.get(fieldLabel) != null)
                        {
                            fieldLabel = fieldMap.get(fieldLabel).getDescribe().getLabel();
                        }
                        
                        Update__c rh=new Update__c(Last_Updated_Date__c=Datetime.valueOf(o.get('createddate')),
                                                   FieldHistoryId__c=String.valueOf(o.get('id')),
                                                   Account__c=String.valueOf(o.get('AccountId')),
                                                   RecordChangedBy__c= String.valueOf(o.get('CreatedById')),
                                                   Old_Value__c=  oldValue,
                                                   New_Value__c= newValue,
                                                   Field_Name__c= fieldLabel, Type__c = 'Marketplace Data Updates');
                        recordHistory.add(rh);
                        accDate=Datetime.valueOf(historyRecord[historyRecord.size()-1].get('createddate'));
                        accountIds.add(String.valueof(o.get('AccountId')));
                    }
                }  
            }
            else if(objName=='ContactHistory')
            {
                Object a =String.valueOf(o.get('ContactId'));
                if(presentContactsMap.containsKey(String.valueOf(o.get('ContactId'))))
                {
                    String fieldLabel = String.valueOf(o.get('Field')) == 'RecordType' ? 'Contact Record Type' : String.valueOf(o.get('Field'));
                    Map<String, Schema.SObjectField> fieldMap = schemaMap.get('Contact').getDescribe().fields.getMap();
                    if(fieldLabel != 'created') 
                    {
                        fieldLabel = (fieldMap.get(fieldLabel) != null ? fieldMap.get(fieldLabel).getDescribe().getLabel() : fieldLabel);
                        
                        Update__c rh=new Update__c(Last_Updated_Date__c=Datetime.valueOf(o.get('createddate')),
                                                   FieldHistoryId__c=String.valueOf(o.get('id')),
                                                   Contact__c=String.valueOf(o.get('ContactId')),
                                                   RecordChangedBy__c= String.valueOf(o.get('CreatedById')),
                                                   Old_Value__c= oldValue,
                                                   New_Value__c= newValue,
                                                   Field_Name__c= fieldLabel,
                                                   Type__c = 'Marketplace Data Updates');
                        recordHistory.add(rh);
                        conDate=Datetime.valueOf(historyRecord[historyRecord.size()-1].get('createddate'));                    
                        contactIds.add(String.valueof(o.get('ContactId')));
                    }
                }
            }
        }
        
        
        List<fieldHistoryLastRecord__c> fieldsDate=[SELECT Id,accountLastRecord__c,contactLastRecord__c FROM fieldHistoryLastRecord__c];
        List<fieldHistoryLastRecord__c> listDateToUpdate=new List<fieldHistoryLastRecord__c>();
        if(objName=='AccountHistory' &&  historyRecord.size()>0)
        {
            accDate=Datetime.valueOf(historyRecord[historyRecord.size()-1].get('createddate'));
            fieldHistoryLastRecord__c fhr=new fieldHistoryLastRecord__c(AccountLastRecord__c=accDate);
            listDateToUpdate.add(fhr);
        }
        else if(objName=='ContactHistory' &&  historyRecord.size()>0)
        {
            conDate=Datetime.valueOf(historyRecord[historyRecord.size()-1].get('createddate'));
            fieldHistoryLastRecord__c fhr=new fieldHistoryLastRecord__c(contactLastRecord__c=conDate);            
            listDateToUpdate.add(fhr);
        }
        if(fieldsDate.size()>0 && listDateToUpdate.size()>0)
        {
            listDateToUpdate[0].id=fieldsDate[0].id;
            update listDateToUpdate;
        }
        else if(listDateToUpdate.size()>0)
        {
            insert listDateToUpdate;
        }
        
        Id investmentFirmAccountRecTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('Dakota_360_Account').getRecordTypeId();
        Id investmentFirmContactRecTypeId = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Dakota_360_Contact').getRecordTypeId();
        Map<Id,Account> activityStreamAccounts = new Map<Id,Account>([Select Id,X100_Marketplace__c,RecordTypeId,Name,Type from Account where Id in: accountIds]);
        Map<Id,Contact> activityStreamContacts = new Map<Id,Contact>([Select Id,Marketplace_Verified_Contact__c,RecordTypeId,Title,Name,Account.Name,Salutation,Account.Website,AccountId from Contact where Id in: contactIds]);        
        
        for(Update__c activityStream:recordHistory)
        {
            if(activityStream.Account__c != null && activityStreamAccounts.size() > 0 && activityStreamAccounts.containsKey(activityStream.Account__c))
            {
                Account acc = activityStreamAccounts.get(activityStream.Account__c);
                activityStream.Is_Accessible__c = acc.X100_Marketplace__c;
                activityStream.Is_Accessible_Everest__c = acc.RecordTypeId == investmentFirmAccountRecTypeId ? true : false;
            }
            else if(activityStream.Contact__c != null && activityStreamContacts.size() > 0 && activityStreamContacts.containsKey(activityStream.Contact__c))
            {
                Contact con = activityStreamContacts.get(activityStream.Contact__c);
                activityStream.Is_Accessible__c = con.Marketplace_Verified_Contact__c;
                activityStream.Is_Accessible_Everest__c = con.RecordTypeId == investmentFirmContactRecTypeId ? true : false;
            }
        }
        
        
        Schema.SObjectField uniqueHistory = Update__c.Fields.FieldHistoryId__c;        
        Database.upsert(recordHistory,uniqueHistory);
    }
}