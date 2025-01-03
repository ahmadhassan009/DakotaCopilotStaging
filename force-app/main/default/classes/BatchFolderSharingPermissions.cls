global with sharing class BatchFolderSharingPermissions implements Database.Batchable<String>, Database.AllowsCallouts, Database.stateful{
    /**
    * DSC-373 : Reports Folder Default Sharing for Internal Users
    */
    global Iterable<String> start(Database.BatchableContext BC) {
        String reportFolderPrefix = 'MP';
        String pubFolder = 'unfiled$public';
        Datetime folderCreatedDate;
        Datetime lastSchedulerExeDate = Date.newInstance(2000, 1, 1);
        MetadataService.FileProperties[] reportFolderProperties;

        List<Folder_Permission_Scheduler__c> lastFireDate = Folder_Permission_Scheduler__c.getall().values();
        if(lastFireDate.size() > 0) {
            lastSchedulerExeDate = lastFireDate[0].Last_Sync_Date__c;
        }

        MetadataService.MetadataPort mdService = new MetadataService.MetadataPort();
        List<MetadataService.ListMetadataQuery> reportFolderQuery = new List<MetadataService.ListMetadataQuery>();
        mdService.SessionHeader = new MetadataService.SessionHeader_element();
        mdService.SessionHeader.sessionId = UserInfo.getSessionId();

        MetadataService.ListMetadataQuery queryFolder = new MetadataService.ListMetadataQuery();
        queryFolder.type_x = 'ReportFolder';
        reportFolderQuery.add(queryFolder);
        if(Test.isRunningTest()) {
            MockWebService_Test wsMock = new MockWebService_Test();
            reportFolderProperties = wsMock.listMetadata(reportFolderQuery, 30);
        } else {
            reportFolderProperties = mdService.listMetadata(reportFolderQuery, 30);
        }
        List<String> folderNames = new List<String>();
        for(MetadataService.FileProperties folderProperty : reportFolderProperties){
            String reportFolderName = '';
            folderCreatedDate = folderProperty.createdDate;
            reportFolderName = folderProperty.fileName.replace('reports/', '');
            if(!reportFolderName.startsWith(reportFolderPrefix) && !reportFolderName.contains(pubFolder) && lastSchedulerExeDate < folderCreatedDate) {
                folderNames.add(reportFolderName);
            }
        }
        return folderNames;
    }
    
    global void execute(Database.BatchableContext BC, List<String> folderNames) {
        
        MetadataService.MetadataPort mdService = new MetadataService.MetadataPort();
        mdService.SessionHeader = new MetadataService.SessionHeader_element();
        mdService.SessionHeader.sessionId = UserInfo.getSessionId();

        for (String rFolder : folderNames) {
            if(String.isNotBlank(rFolder)==true || rFolder != '') {
                
                MetadataService.ReportFolder reportFolderAccess;
                if(Test.isRunningTest()) {
                    MockWebService_Test wsMock = new MockWebService_Test();
                    reportFolderAccess = wsMock.readMetadata('ReportFolder', new String[]{rFolder});
                }
                else {
                    reportFolderAccess = (MetadataService.ReportFolder) mdService.readMetadata('ReportFolder', new String[]{rFolder}).getRecords()[0];
                }
                MetadataService.FolderShare folderShareService = new MetadataService.FolderShare();
                folderShareService.accessLevel = 'Manage';
                folderShareService.sharedTo = 'AllInternalUsers';
                folderShareService.sharedToType = 'Organization';
                if(reportFolderAccess.folderShares !=null) {
                    
                    reportFolderAccess.folderShares.add(folderShareService);
                }
                else {
                    List<MetadataService.FolderShare> fs= new List<MetadataService.FolderShare>();
                    fs.add(folderShareService);
                    reportFolderAccess.folderShares = fs;
                }
                if(!Test.isRunningTest()) {
                    mdService.updateMetadata( new MetadataService.Metadata[] { reportFolderAccess });
                }
            }
        }
    }
    
    global void finish(Database.BatchableContext BC) {
        List<Folder_Permission_Scheduler__c> lastFireDate = Folder_Permission_Scheduler__c.getall().values();
        if(lastFireDate.size() > 0) {
            lastFireDate[0].Last_Sync_Date__c = System.now();
            update lastFireDate;
        }
    }
}