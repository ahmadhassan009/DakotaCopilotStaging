@isTest
public class MockWebService_Test implements WebServiceMock {
    public void doInvoke(
        Object stub, Object request, Map<String, Object> response,
        String endpoint, String soapAction, String requestName,
        String responseNS, String responseName, String responseType) 
    {
        if(request instanceof MetadataService.retrieve_element)
            response.put('response_x', new MetadataService.retrieveResponse_element());
        else if(request instanceof MetadataService.checkDeployStatus_element)
            response.put('response_x', new MetadataService.checkDeployStatusResponse_element());
        else if(request instanceof MetadataService.listMetadata_element)
            response.put('response_x', new MetadataService.listMetadataResponse_element());
        else if(request instanceof MetadataService.checkRetrieveStatus_element)
            response.put('response_x', new MetadataService.checkRetrieveStatusResponse_element());
        else if(request instanceof MetadataService.describeMetadata_element)
            response.put('response_x', new MetadataService.describeMetadataResponse_element());
        else if(request instanceof MetadataService.deploy_element)
            response.put('response_x', new MetadataService.deployResponse_element());
        else if(request instanceof MetadataService.updateMetadata_element)
            response.put('response_x', new MetadataService.updateMetadataResponse_element());
        else if(request instanceof MetadataService.renameMetadata_element)
            response.put('response_x', new MetadataService.renameMetadataResponse_element());
        else if(request instanceof  MetadataService.cancelDeploy_element)
            response.put('response_x', new MetadataService.cancelDeployResponse_element());
        else if(request instanceof  MetadataService.deleteMetadata_element)
            response.put('response_x', new MetadataService.deleteMetadataResponse_element());
        else if(request instanceof  MetadataService.upsertMetadata_element)
            response.put('response_x', new MetadataService.upsertMetadataResponse_element());
        else if(request instanceof  MetadataService.createMetadata_element)
            response.put('response_x', new MetadataService.createMetadataResponse_element());
        else if(request instanceof  MetadataService.deployRecentValidation_element)
            response.put('response_x', new MetadataService.deployRecentValidationResponse_element());
        else if(request instanceof MetadataService.describeValueType_element)
            response.put('response_x', new MetadataService.describeValueTypeResponse_element());
        else if(request instanceof MetadataService.checkRetrieveStatus_element)
            response.put('response_x', new MetadataService.checkRetrieveStatusResponse_element());
        return;
    } 
    
    public List<MetadataService.FileProperties> listMetadata (List<MetadataService.ListMetadataQuery> reportQuery, Integer version) {
        List<MetadataService.FileProperties> reportFolders = new List<MetadataService.FileProperties>();
        for(Integer counter = 0; counter <=3 ; counter++) {
            MetadataService.FileProperties rFolder = new MetadataService.FileProperties();
            rFolder.fileName = 'reports/Test Folder' + counter;
            rFolder.createdDate = Date.newInstance(2021, 05, 1);
            reportFolders.add(rFolder);
        }
        return reportFolders;
    }
    
    public MetadataService.ReportFolder readMetadata(String folderType, String[] foldername) {
        MetadataService.SharedTo st = new MetadataService.SharedTo();
        st.allCustomerPortalUsers = 'allCustomerPortalUsers';
        List<MetadataService.FolderShare> fs = new List<MetadataService.FolderShare>();
        
        Id cUserId = UserInfo.getUserId() ;
        MetadataService.FolderShare folderShare = new MetadataService.FolderShare();
        folderShare.accessLevel = 'Manage';
        folderShare.sharedTo = cUserId;
        folderShare.sharedToType = 'User';
        fs.add(folderShare);
        
        MetadataService.ReportFolder rFolder = new MetadataService.ReportFolder();
        rFolder.fullName = 'Test_Folder_29_06_2021';
        rFolder.name = 'Test Folder 29 06 2021';
        rFolder.accessType = 'Shared';
        rFolder.type = 'ReportFolder';
        rFolder.folderShares = fs;
        rFolder.publicFolderAccess = 'ReadWrite';
        rFolder.sharedTo = st;
        
        return rFolder;
    }
}