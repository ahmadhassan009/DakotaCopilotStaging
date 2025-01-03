import { LightningElement, api, track, wire } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import fetchNotes from '@salesforce/apex/NotesInAccountAndContactController.fetchNotes';
import getUserProfileName from '@salesforce/apex/NotesInAccountAndContactController.getUserProfileName';
import getObjectName from '@salesforce/apex/NotesInAccountAndContactController.getObjectName';
import deleteNote from '@salesforce/apex/NotesInAccountAndContactController.deleteNote';
import getSFBaseUrl from '@salesforce/apex/NotesInAccountAndContactController.getSFBaseUrl';
import checkDakotaNotesPermissions from '@salesforce/apex/NotesInAccountAndContactController.checkDakotaNotesPermissions';
import activeCommunities from '@salesforce/label/c.active_communities';
import Id from '@salesforce/user/Id';
import { showNotification, setNotificationFlags } from "c/utils";


const COLUMNS = [
    { label: 'Title', fieldName: 'recordLink', type: 'url', sortable: 'true', typeAttributes: { label: { fieldName: 'Title' }, target: '_self', tooltip: { fieldName: 'Title' }}},
    { label: 'Comments', fieldName: 'TextPreview', type: 'richText', wrapText: true },
    { label: 'Created By',fieldName: 'CreatedByName',sortable: 'true', type: 'text', typeAttributes: { tooltip: { fieldName: 'CreatedByName' }}},
    { label: 'Last Modified',fieldName: 'LastModifiedDate', sortable: 'true', type: 'date'},
    { label: 'Last Modified By',fieldName: 'LastModifiedByName',sortable: 'true', type: 'text', typeAttributes: { tooltip: { fieldName: 'LastModifiedByName' }}},
]

export default class NotesInAccounts extends NavigationMixin(LightningElement) {
    @api recordId;
    @api recordName;
    @api objType;
    @track recordsExists = false;
    @track hasPermission = false;
    hasCreatePermission = false;
    toastMessage = 'Unknown Error Occured';
    @track headerPosition = 'header-position';

    columns;
    data;
    baseURL = '';
    recordToDel;
    isLoading=false;
    totalRecords = '0';
    deletePopup = false;
    deleteRowId;
    editPopup = false;
    @track areDetailsVisible=false;
    @track showCreateModal = false;
    @track isLoadingCreateCon=false;
    @track showEditModal = false;
    isAccount = false;
    isContact = false;
    currentUserId = Id;
    editNoteId;
    isAdmin = false;
    isCommunity = false;
    defaultSortDirection = 'desc';
    sortedDirection = 'desc';
    sortedBy = 'LastModifiedDate';
    nameSortDir = this.defaultSortDirection;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    //DSC-729: Permission message
    permissionErrMsg = 'You don\'t have necessary permissions to perform this action';

    showNotification = showNotification.bind(this);
    setNotificationFlags = setNotificationFlags.bind(this);


    connectedCallback()
    {
        //getting object type (Accont or Contact)
        getObjectName({
            recordId: this.recordId
        }) .then (returnedName => {
            if(returnedName) {
                this.objType = returnedName;
            }
            if(this.objType == 'Account') {
                this.isAccount = true;
            } else if(this.objType == 'Contact') {
                this.isContact = true;
            }
        });

        getUserProfileName().then(profileName => {
            if(profileName == 'System Administrator') {//incase of sys admin give edit and delete permissions of notes
                this.isAdmin = true;
            }
        })

        this.sortedDirection = 'desc';
        this.sortedBy = 'LastModifiedDate';
        this.fetchAllNotesData(this.recordId, this.sortedBy, this.sortedDirection);
        this.checkIsCommunityInstance(); //check if its community or not

        this.columns = COLUMNS.slice();
        this.columns.push({ type: 'action', typeAttributes: { rowActions: this.getRowActions }});
       
    }

    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
    }

    async handlePermissionPopup() {
        await checkDakotaNotesPermissions().then(result => {
            this.setNotificationFlags(result);
        }).catch(error => {
            console.log(error);
        })
    }

    fetchAllNotesData(recordId, sortedBy, sortedDirection)
    {
        this.isLoading = true;
        fetchNotes({
            recordId : recordId,
            recLimit: 11,
            offset: 0,
            sortby: sortedBy,
            sortDirection: sortedDirection
        }).then(returnedData => {
            //user have permissions to access Dakota Notes
            if(returnedData != null) {
                this.hasPermission = true;
            }
            
            if (returnedData!=null && returnedData.length>0) {
                getSFBaseUrl().then(baseURL => {
                    if(baseURL) {
                        this.isLoading = false;
                        if(returnedData.length > 10) {
                            this.totalRecords = '10+';
                        } 
                        else {
                            this.totalRecords = returnedData.length;
                        }
                        if(returnedData.length > 10){
                            returnedData.pop();
                        }
                        this.recordsExists = true;
                        this.baseURL = baseURL;
                        for(var i=0; i<returnedData.length; i++)
                        {   
                            if((returnedData[i].OwnerId!=null && returnedData[i].OwnerId==this.currentUserId) || this.isAdmin)
                            {
                                returnedData[i].addActions = true;
                            }
                            else
                            {
                                returnedData[i].addActions = false;
                            }
                            if(this.isCommunity) {
                                if(returnedData[i].Title!=null)
                                {
                                    returnedData[i].recordLink  = "/"+this.communityName+"/s/detail/" +returnedData[i].Id;
                                }
                            } else {
                                if(returnedData[i].Title!=null)
                                {
                                    returnedData[i].recordLink = '/'+returnedData[i].Id;
                                }
                            }
                        }
                    this.data = returnedData;
                    }
                    this.isLoading = false;
                })
                .catch(error => {
                    this.isLoading = false;
                });
            }
            else
            {
                //user does not have permissions to access Dakota Notes
                if(returnedData === null) {
                    this.hasPermission = false;
                }
                if(returnedData.length == 0) {
                    this.totalRecords = 0;
                }
                this.recordsExists = false;
                this.isLoading = false;
                this.data = null;
            }
        }).catch(error => {
            this.isLoading = false;
        });
    }

    /**
     * 
     * Open confirmation Delete Popup
     */
    openDeletePopup(row)
    {
        this.deleteRowId = JSON.stringify(row.Id).replace(/['"]+/g, '');
        this.deletePopup = true;
    }
    /**
     * Delete record helper.
     */
     deleteRow() {
        this.deletePopup = false;
        this.isLoading=true;
        deleteNote({
            recordId : this.deleteRowId
        }).then(response => {
            if(response)
            {
                this.deleteRowId = null;
                this.isLoading=false;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Note deleted successfully',
                        variant: 'success'
                    })
 
                 );
                return refreshApex(this.refreshTable());
            } else {
                this.toastMessage = 'The Note you are trying to delete doesn’t exist.';
                this.showErroToast();
            }
        }).catch(error => {
            this.toastMessage = 'Error in Deleting Note';
            if(error && error.body && error.body.message) {
                this.toastMessage = error.body.message;
            }

            this.showErroToast();
        });

    }

    showErroToast() {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error deleting record',
                message:this.toastMessage,
                variant: 'error'
            })
        );
        this.isLoading=false;
        return refreshApex(this.refreshTable());
    }


    /**
     * Refresh handler for Activities
     */
    refreshTable(){
        this.closeEditModal();
        this.sortedDirection = 'desc';
        this.sortedBy = 'LastModifiedDate';
        this.fetchAllNotesData(this.recordId, this.sortedBy, this.sortedDirection);
    }

    /**
     * Navigate to view all page of Activities.
     */
    handleShowFullRelatedList()
    {

        var navigationURL = this.baseURL +'/lightning/cmp/c__NotesRelatedToAccountAndContactDataTableView?c__recordId='+this.recordId+'&c__isCommunity='+ this.isCommunity;
        var url = '/view-accountrelatedsearches?recordId=' + this.recordId + '&isCommunity=' + this.isCommunity;

        if(this.objType == 'Account') {
            var url = '/view-account-notes?recordId=' + this.recordId + '&isCommunity=' + this.isCommunity;
        } else  {
            var url = '/view-contact-notes?recordId=' + this.recordId + '&isCommunity=' + this.isCommunity;
        }
        if(this.isCommunity)
        {
            this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
                attributes: {
                    url: url
                }
            });
        }
        else
        {
            window.open(navigationURL,"_self");
        }
    }

    /**
     * Closes all popups and refresh table.
     */
    handleSave()
    {
        this.editPopup = false;
        this.refreshTable();
    }


    getRowActions(row, doneCallback){
        if(row.addActions === true) {
            doneCallback([{ label: 'Edit', name: 'edit' },
            { label: 'Delete', name: 'delete' }]);
        }
        else {
            doneCallback([{ label: 'No Actions Available', name: 'NoActions' }]);
        }
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
            case 'delete':
                this.openDeletePopup(row);
                break;
            case 'edit':
                this.openEditModal();
                let {Id} = row;
                this.editNoteId = Id
                break;
            default:
        }
    }

    /**
     * Function removes the spinner once the form is loaded
     */
    recordViewHandler() {
        this.areDetailsVisible = true;
    }

    handleSuccess() {
        this.isLoadingCreateCon = false;
        this.showCreateModal = false;
        this.sortedDirection = 'desc';
        this.sortedBy = 'LastModifiedDate';
        this.fetchAllNotesData(this.recordId, this.sortedBy, this.sortedDirection);
        this.showEditModal = false;
    }

     /**
     * Closes delete confirmation popup.
     */
      closeDeletePopup()
      {
         this.deletePopup = false;
      }

    async openCreateModal() {
        await this.handlePermissionPopup();
        if(!this.hasCreatePermission) return;

        this.areDetailsVisible = false;  
        this.showCreateModal = true;
    }
 
    closeCreateModal() {
        this.showCreateModal = false;
    }

    async openEditModal() {
        await this.handlePermissionPopup();
        if(!this.hasCreatePermission) return;
        this.areDetailsVisible = false;
        this.showEditModal = true;
    }
 
    closeEditModal() {
        this.showEditModal = false;
    }

    /**
     * For sorting the table
     * @param {*} event 
     */
     updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        
        let tempSortBy = this.sortedBy;
        if(this.sortedBy === 'recordLink') {
            tempSortBy = 'Name';
        } else if(this.sortedBy === 'CreatedByName') {
            tempSortBy = 'Created_By_User__c';
        }else if(this.sortedBy === 'LastModifiedDate') {
            tempSortBy = 'lastmodifieddate';
        }else if(this.sortedBy === 'LastModifiedByName') {
            tempSortBy = 'lastmodifiedBy.Name'; 
        }

        this.sortedDirection = this.nameSortDir === 'asc'? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.fetchAllNotesData(this.recordId, tempSortBy, this.sortedDirection);
    }
}