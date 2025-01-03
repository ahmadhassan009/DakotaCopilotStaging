import { LightningElement, api, track, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import fetchNotes from '@salesforce/apex/NotesInAccountAndContactController.fetchNotes';
import getTotalNotesRecordsCount from '@salesforce/apex/NotesInAccountAndContactController.getTotalNotesRecordsCount';
import getObjectName from '@salesforce/apex/NotesInAccountAndContactController.getObjectName';
import getUserProfileName from '@salesforce/apex/NotesInAccountAndContactController.getUserProfileName';
import deleteNote from '@salesforce/apex/NotesInAccountAndContactController.deleteNote';
import getSFBaseUrl from '@salesforce/apex/NotesInAccountAndContactController.getSFBaseUrl';
import Id from '@salesforce/user/Id';
import activeCommunities from '@salesforce/label/c.active_communities';
import fetchParentRecord from '@salesforce/apex/NotesInAccountAndContactController.fetchParentRecord';
import checkDakotaNotesPermissions from '@salesforce/apex/NotesInAccountAndContactController.checkDakotaNotesPermissions';
import { showNotification, setNotificationFlags } from "c/utils";

const COLUMNS = [
    { label: 'Title', fieldName: 'recordLink', type: 'url', sortable: 'true', typeAttributes: { label: { fieldName: 'Title' }, target: '_self', tooltip: { fieldName: 'Title' }}},
    { label: 'Comments', fieldName: 'TextPreview', type: 'richText', wrapText: true },
    { label: 'Created By',fieldName: 'CreatedByName',sortable: 'true', type: 'text', typeAttributes: { tooltip: { fieldName: 'CreatedByName' }}},
    { label: 'Last Modified',fieldName: 'LastModifiedDate', sortable: 'true', type: 'date-local',typeAttributes: {day: "numeric",month: "numeric", year: "numeric"}},
    { label: 'Last Modified By',fieldName: 'LastModifiedByName',sortable: 'true', type: 'text', typeAttributes: { tooltip: { fieldName: 'LastModifiedByName' }}},
]
export default class NotesInAccountsAndContacts extends LightningElement {
    @api recordId;
    @api objType;

    @track hasPermission = false;
    @track doesNotHasPermission = false;
    hasCreatePermission = false;

    columns;
    data;
    baseURL = '';
    isLoading=false;
    listName = '';
    deletePopup = false;
    deleteRowId;

    editPopup = false;
    showEditModal = false;

    recordNameLink;
    recordName = '';
    recordLink;

    recNameAvailable = false;
    @track totalNumberOfRows;
    defaultSortDirection = 'desc';
    sortedDirection = 'desc';
    sortedBy = 'LastModifiedDate';
    limit=50;
    offset=0;
    plusSign = null;
    isAdmin = false;

    areDetailsVisible=false;
    showCreateModal = false;
    isLoadingCreateCon=false;
    isAccount = false;
    isContact = false;
    currentUserId = Id;
    editNoteId;

    //DSC-729: Permission error messages
    permissionErrMsg = 'You don\'t have necessary permissions to perform this action';
    toastMessage = 'Unknown Error Occured';
    showNotification = showNotification.bind(this);
    setNotificationFlags = setNotificationFlags.bind(this);

    isCommunity = false;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    
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
            this.setLinks();
        })

        getUserProfileName().then(profileName => {
            if(profileName == 'System Administrator') {
                this.isAdmin = true;
            }
        })

        this.checkIsCommunityInstance();
        this.columns = COLUMNS.slice();
        this.columns.push({ type: 'action', typeAttributes: { rowActions: this.getRowActions }});
        this.getAllData();
    }

    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
    }

    /**
     * function prepare data and lines for community and non community users
     */
    perpareNotesData(returnedData) {
        var tempSortedNotesList = [];  
        for(var i=0; i<returnedData.length; i++)
        {
            let tempNoteRecord = Object.assign({}, returnedData[i]); //cloning object
            if((tempNoteRecord.OwnerId!=null && tempNoteRecord.OwnerId==this.currentUserId) || this.isAdmin == true) {
                tempNoteRecord.addActions = true;
            } else {
                tempNoteRecord.addActions = false;
            }
            if(this.isCommunity) {
                if(tempNoteRecord.Title!=null)
                {
                    tempNoteRecord.recordLink  = "/"+this.communityName+"/s/detail/" +tempNoteRecord.Id;
                }
            } else {
                if(tempNoteRecord.Title!=null)
                {
                    tempNoteRecord.recordLink ='/'+tempNoteRecord.Id;
                }
            }
            tempSortedNotesList.push(tempNoteRecord);
        }
        return tempSortedNotesList;
    }

    async handlePermissionPopup() {
        await checkDakotaNotesPermissions().then(result => {
            this.setNotificationFlags(result);
        }).catch(error => {
            console.log(error);
        })
    }

    /**
     * 
     * @param {*} returnedData
     * @description function takes fetch response and checks if the user has permissions 
     */
    checkPermissionsAfterFetch(returnedData) {
        this.setNotificationFlags(returnedData);
    }

    /**
     * function return all data for provided offset and limit, also with default filter if not set any
     */
    getAllData()
    {
        //To get count of related notes records
        getTotalNotesRecordsCount({
            recordId: this.recordId
        }) .then (returnedCount => {
            if(returnedCount) {
                this.totalNumberOfRows = returnedCount;
            }
        })

        this.setLinks();
        this.isLoading = true;
        let sortedField = this.getSortingField();
        fetchNotes({
            recordId : this.recordId,
            recLimit: this.limit,
            offset: this.offset,
            sortby: sortedField,
            sortDirection: this.sortedDirection

        }).then(returnedData => {
            //cehcking user have permissions to access Dakota Notes
            this.checkPermissionsAfterFetch(returnedData);
            if (returnedData!=null && returnedData.length>0) {
                getSFBaseUrl().then(baseURL => {
                    if(baseURL) {
                        this.isLoading = false;
                        let tempSortedNotesList =  this.perpareNotesData(returnedData);
                        this.data = tempSortedNotesList;
                        this.offset = tempSortedNotesList.length; 
                        this.isLoading = false;
                    }
                    this.isLoading = false;
                    // For showing + sign with count
                    if((this.offset) >= this.totalNumberOfRows || (this.offset) == 0)
                    {
                        this.plusSign = '';
                    }
                    else
                    {
                        this.plusSign = '+';
                    }
                    this.infiniteLoading = false;
                })
                .catch(error => {
                    this.isLoading = false;
                    console.log(error);
                });
            }
            else
            {
                this.data = null;
                this.isLoading = false;
                this.totalNumberOfRows = 0;
                this.offset = 0;
            }
        }).catch(error => {
            this.isLoading = false;
            console.log(error);
        });

        fetchParentRecord({
            recordId : this.recordId
        }).then(returnedData => {
            if(returnedData != null)
            {
                this.recordName = returnedData.Name;
                this.recNameAvailable = true;
            }
        });
    }

    onHandleSort(event) {
        this.isLoading = true;
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        let sortedField = this.getSortingField();
        // Get related marketplace notes records
        fetchNotes({
            recordId: this.recordId,
            recLimit: this.offset,
            offset: 0,
            sortby: sortedField,
            sortDirection: this.sortedDirection
        }).then (returnedData => {
            this.checkPermissionsAfterFetch(returnedData);
            if (returnedData) {
                let tempSortedNotesList =  this.perpareNotesData(returnedData);
                this.data = tempSortedNotesList;
                this.offset = tempSortedNotesList.length; 
                this.isLoading = false;
            }
        }) .catch(error => {
            console.log('error ', error);
            this.isLoading=false;
        });
    }

    getSortingField() {
        let tempSortBy;
        if(this.sortedBy === 'recordLink') {
            tempSortBy = 'Name';
        } else if(this.sortedBy === 'CreatedByName') {
            tempSortBy = 'Created_By_User__c';
        }else if(this.sortedBy === 'LastModifiedDate') {
            tempSortBy = 'lastmodifieddate';
        }else if(this.sortedBy === 'LastModifiedByName') {
            tempSortBy = 'lastmodifiedBy.Name'; 
        } else {
            tempSortBy = this.sortedBy;
        }
        return tempSortBy;
    }

    loadMoreData(event) {
        if(this.totalNumberOfRows > this.offset) {
            if (this.infiniteLoading) 
                return;
            this.infiniteLoading = true;
            //Display a spinner to signal that data is being loaded
            if(this.data != null && event.target){
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            //Display "Loading" when more data is being loaded
            this.loadMoreStatus = 'Loading';
            let sortedField = this.getSortingField();
            fetchNotes({
                recordId: this.recordId,
                recLimit: this.limit,
                offset: this.offset,
                sortby: sortedField,
                sortDirection: this.sortedDirection
            }) .then (returnedData => {
                this.checkPermissionsAfterFetch(returnedData);
                let tempSortedNotesList = this.perpareNotesData(returnedData);
             
                if(this.data)
                    this.data =  this.data.concat(tempSortedNotesList);
                if((this.offset+50) >= this.totalNumberOfRows || (this.offset) == 0)
                {
                    this.offset = this.totalNumberOfRows;
                    this.plusSign = '';
                } else {
                    this.offset = parseInt(this.offset ) + parseInt(this.limit);
                    this.plusSign = '+';
                }

                this.loadMoreStatus = '';
                if(this.tableElement){
                    this.tableElement.isLoading = false;
                }
                this.infiniteLoading = false;    
            }) .catch(error => {
                this.infiniteLoading = false;
                console.log("Error:" , error);
            });
        }
    }

     setLinks() {
        if(this.objType == 'Contact') {
            if(this.isCommunity) {
                this.recordLink = "/"+this.communityName+"/s/contact/" + this.recordId;
                this.recordNameLink = "/"+this.communityName + '/s/contact/Contact/Default';
            } else {
                this.recordLink = '/'+this.recordId;
                this.recordNameLink ='/one/one.app#/sObject/Contact/list?filterName=Recent';
            }  
            
        } else  if(this.objType == 'Account') {
            if(this.isCommunity) {
                this.recordLink = "/"+this.communityName+"/s/account/" + this.recordId;
                this.recordNameLink = "/"+this.communityName + '/s/account/Account/Default';
            } else {
                this.recordLink = '/'+this.recordId;
                this.recordNameLink ='/one/one.app#/sObject/Account/list?filterName=Recent';
            }
        }
    }

    recordViewHandler() {
        this.areDetailsVisible = true;
    }

    /**
     * 
     * Open confirmation Delete Popup
     */
    async openDeletePopup(row)
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
                        message: 'Note Deleted Successfully.',
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
        //DSC-729: if the user dont have neccesary permissions, just calling refresh table will show the toast message
        //no need to show toast here
        if(!this.toastMessage.includes('dont have necessary Permissions')) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error deleting record',
                    message:this.toastMessage,
                    variant: 'error'
                })
            );
        }
        this.isLoading=false;
        return refreshApex(this.refreshTable());
    }

    /**
     * Closes delete confirmation popup.
     */
     closeDeletePopup()
     {
        this.deletePopup = false;
     }


    /**
     * Refresh handler for Activities
     */
    async refreshTable(){
        //DSC-729: Permission Handling
        this.isLoading = true;
        await this.handlePermissionPopup();
        if(!this.hasCreatePermission) {
            this.isLoading = false;
            this.offset = 0;
            return;
        }
        this.isLoading = false;

        this.closeEditModal();
        this.infiniteLoading = true;
        this.totalNumberOfRows = null;
        this.data = null;
        this.offset = 0;
        this.limit = 50;
        this.sortedBy = 'LastModifiedDate';
        this.sortedDirection = this.defaultSortDirection;

        var table = this.template.querySelector('c-custom-datatable');
        if(table!=null)
            table.enableInfiniteLoading=true;
        this.getAllData();
    }

    /**
     * Closes all popups and refresh table.
     */
    handleSave()
    {
        this.addPopup = false;
        this.editPopup = false;
        this.refreshTable();
    }


    getRowActions(row, doneCallback) {
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

    handleSuccess() {
        this.isLoadingCreateCon = false;
        this.showCreateModal = false;
        this.refreshTable();
        this.showEditModal = false;
    }

    async openCreateModal() {
        //DSC-729: Permission Handling
        await this.handlePermissionPopup();
        if(!this.hasCreatePermission) return;

        this.areDetailsVisible = false;
        this.showCreateModal = true;
    }
 
    closeCreateModal() {
        this.showCreateModal = false;
    }

    async openEditModal() {
        //DSC-729: Permission Handling
        await this.handlePermissionPopup();
        if(!this.hasCreatePermission) return;

        this.areDetailsVisible = false;
        this.showEditModal = true;
        
    }
 
    closeEditModal() {
        this.showEditModal = false;
    }

}