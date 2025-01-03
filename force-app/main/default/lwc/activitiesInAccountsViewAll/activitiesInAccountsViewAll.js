import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import activeCommunities from '@salesforce/label/c.active_communities';

import fetchActivities from '@salesforce/apex/ActivitiesInAccountsController.fetchActivities';
import deleteActivity from '@salesforce/apex/ActivitiesCustomRelatedListHelper.deleteActivity';
import getSFBaseUrl from '@salesforce/apex/ActivitiesCustomRelatedListHelper.getSFBaseUrl';
import recordExists from '@salesforce/apex/ActivitiesCustomRelatedListHelper.recordExists';
import checkActivityPermissions from '@salesforce/apex/ActivitiesCustomRelatedListHelper.checkActivityPermissions';
import getOrganizationId from '@salesforce/apex/ActivitiesCustomRelatedListHelper.getOrganizationId';
import Id from '@salesforce/user/Id';
import { showNotification, setNotificationFlags } from "c/utils";

const COLUMNS = [
    { label: 'Subject', fieldName: 'recordLink', sortable: "true", type: 'url', typeAttributes: { label: { fieldName: 'Subject' }, target: '_self', tooltip: { fieldName: 'Subject' }}},
    { label: 'Name', fieldName: 'WhoId', sortable: "true", type: 'url', typeAttributes: { label: { fieldName: 'WhoName' }, target: '_self', tooltip: { fieldName: 'WhoName' }}},
    { label: 'Related To', fieldName: 'WhatId', sortable: "true", type: 'url', typeAttributes: { label: { fieldName: 'WhatName' }, target: '_self', tooltip: { fieldName: 'WhatName' }}},
    { label: 'Due Date',fieldName: 'ActivityDate', sortable: "true", type: 'date-local',typeAttributes: {day: "numeric",month: "numeric", year: "numeric"}},
    { label: 'Status',fieldName: 'Status', type: 'text', sortable: "true"},
    { label: 'Priority',fieldName: 'Priority', type: 'text', sortable: "true"},
    { label: 'Task',fieldName: 'isTask', type: 'checkBox', sortable: "true"},
    { label: 'Setup By', sortable: "true",fieldName: 'SetUpByNewName', type: 'text', typeAttributes: { tooltip: { fieldName: 'SetUpByNewName' }}}
]
export default class ActivitiesInAccountsViewAll extends NavigationMixin(LightningElement) {
    @api recordId;
    @track hasPermission = false;
    hasCreatePermission = false;
    @track doesNotHasPermission = false;

    orgId;
    currentUserId = Id;
    recordsExists = false;
    columns;
    data;
    baseURL = '';
    recordToDel;
    panelStyling;
    isLoading=false;
    totalRecords = '0';
    listName = '';
    deletePopup = false;
    deleteRowId;
    recordName = '';
    accountLink;
    recNameAvailable = false;
    totalNumberOfRows;
    defaultSortDirection = 'asc';
    sortDirection = 'asc';
    sortedBy = 'ActivityDate';
    allRecords;
    limit=50;
    offset=0;
    plusSign = null;

    addPopup = false;
    addEventPopup = false;
    editEventPopup = false;
    eventDescription;
    taskDescription;

    editPopup = false;
    editActivityId;
    editableSubject;
    editableDueDate;
    editableStatus;
    editablePriority;

    editableAllDayEvent;
    editableStartDate;
    editableEndDate;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    
    //DSC-729: Permission error messages
    permissionErrMsg = 'You don\'t have necessary permissions to perform this action';
    listPermissionMsg = 'Page does not exist or you do not have permission to access this page. Please contact your Marketplace Administrator if you need further assistance.';
    showNotification = showNotification.bind(this);
    setNotificationFlags = setNotificationFlags.bind(this);

    connectedCallback()
    {
        this.isLoading=true;
        getOrganizationId({
        }).then(responseId => {
            this.orgId = responseId;
            this.columns = COLUMNS.slice();
            this.columns.push({ type: 'action', typeAttributes: { rowActions: this.getRowActions }});
            getSFBaseUrl().then(baseURL => {
                if(baseURL) {
                    this.baseURL = baseURL;
                    this.getAllData();
                }
                this.isLoading = false;
            })
            .catch(error => {
                this.isLoading = false;
                console.log(error);
            });
        }).catch(error => {
            console.log(error);
            this.isLoading=false;
        });
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

    /**
     * 
     * @param {*} returnedData
     * @description function takes fetch response and checks if the user has permissions 
     */
    checkPermissionsAfterFetch(returnedData) {
        this.setNotificationFlags(returnedData);
    }

    /**
     * Fetch All Open Activities from Database
     */
    getAllData()
    {
        this.isLoading = true;
        fetchActivities({
            recordId : this.recordId,
            orgId: this.orgId,
            recLimit: 50000
        }).then(returnedData => {
            //checking user have permissions to access events or tasks
            this.checkPermissionsAfterFetch(returnedData);
            if (returnedData!=null && returnedData.length>0) {
                
                    if(this.baseURL) {
                        this.isLoading = false;
                        for(var i=0; i<returnedData.length; i++)
                        {
                            if(returnedData[i].SetUpByNewId!=null && returnedData[i].SetUpByNewId==this.currentUserId)
                            {
                                returnedData[i].addActions = true;
                            }
                            else
                            {
                                returnedData[i].addActions = false;
                            }
                            if(returnedData[i].Subject!=null)
                            {
                                returnedData[i].recordLink = "/"+this.communityName+'/s/event-and-task-detail-page?recordId=' + returnedData[i].Id + '&objectId=' + this.recordId + '&viewAll=true';
                            }
                            if(returnedData[i].WhoId!=null)
                            {
                                returnedData[i].WhoId = "/"+this.communityName+'/s/contact/'+returnedData[i].WhoId;
                            }
                            if(returnedData[i].WhatId!=null)
                            {
                                returnedData[i].RelatedtToId = returnedData[i].WhatId;
                                returnedData[i].WhatId = "/"+this.communityName+'/s/account/'+returnedData[i].WhatId;
                            }
                        }
                        this.allRecords = returnedData;
                        this.sortDirection = 'asc';
                        this.sortedBy = 'ActivityDate';
                        this.sortAllRecords(this.sortedBy, this.sortDirection);
                        this.setDefaultRecords();
                    }
            }
            else
            {
                this.data = null;
                this.isLoading = false;
                this.offset = 0;
            }

            const total=new CustomEvent("gettotalrecords",{
                detail:{
                    offset:this.offset,
                    plusSign:this.plusSign
                }
            });
            this.dispatchEvent(total);

        }).catch(error => {
            this.isLoading = false;
            console.log(error);
        });

       
    }

    /**
    * Helper method to set records on the basis of offset and limit
    */
    setDefaultRecords()
    {
        this.limit=50;
        this.offset=0;
        this.plusSign = null;
        this.totalNumberOfRows = this.allRecords.length;
        var tempList = [];  
        var recslength = this.allRecords.length;
        if(recslength > this.limit)
            recslength = this.limit;
        for (var i = 0; i < recslength; i++) 
        {
            let temObj = Object.assign({}, this.allRecords[i]);
            tempList.push(temObj);
        }
        if(this.allRecords.length > 0) 
        {
            this.data = tempList;
            this.offset = recslength;
            if((this.offset) >= this.totalNumberOfRows)
            {
                this.plusSign = '';
            }
            else
            {
                this.plusSign = '+';
            }
        }
    }

    /**
     * Handle row actions for datatable
     * @param {*} event 
     */
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
            case 'delete':
                this.openDeletePopup(row);
                break;
            case 'edit':
                this.navigateToRecordEditPage(row);
                break;
            default:
        }
    }

    openDeletePopup(row)
    {
        this.deleteRowId = JSON.stringify(row.Id).replace(/['"]+/g, '');
        this.deletePopup = true;
    }
    /**
     * Delete record.
     * @param {*} row 
     */
    deleteRow() {
        this.deletePopup = false;
        this.isLoading=true;
        recordExists({
            recordId : this.deleteRowId
        }).then(response => {
            if(response)
            {
                deleteActivity({
                    recordId : this.deleteRowId
                }).then(response => {
                    if(this.deleteRowId.startsWith('00T')) {
                        this.toastMessage = 'Task Deleted Successfully.';
                    } else {
                        this.toastMessage =  'Event Deleted Successfully.';
                    }
                    this.deleteRowId = null;
                    this.isLoading=false;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: this.toastMessage,
                            variant: 'success'
                        })
                        );
                    return refreshApex(this.getAllData());
                }).catch(error => {
                    console.log(error);
                    if(error && error.body && error.body.message && !error.body.message.includes("You don't have necessary permissions")) {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error deleting record',
                                message: 'Error occured while deleting Activity.',
                                variant: 'error'
                            })
                        );
                    }
                    this.isLoading=false;
                    return refreshApex(this.getAllData());
                });
            }
            else
            {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'The Activity you are trying to delete doesn’t exist.',
                        variant: 'error'
                    })
                );
                this.refreshTable();
            }
        }).catch(error => {
            console.log(error);
               this.dispatchEvent(
                   new ShowToastEvent({
                       title: 'Error',
                       message: 'An error occured. Please refresh the list.',
                       variant: 'error'
                   })
               );
        });        
        
    }

    /**
     * Closes delete confirmation popup.
     */
     closeDeletePopup()
     {
        this.deletePopup = false;
     }
    
     /**
     * Edit Record Data for event and Task
     */
    async navigateToRecordEditPage(row) {
        //DSC-729: Permission Handling
        await this.handlePermissionPopup();
        if(!this.hasCreatePermission) return;

        this.isLoading=true;
        let {Id} = row;
        this.editActivityId = Id;
        if(this.editActivityId!=null)
        {
            recordExists({
                recordId : this.editActivityId
            }).then(response => {
                this.isLoading=false;
                if(response)
                {
                    for(var i=0; i<this.data.length; i++)
                    {
                        if(this.data[i].Id == this.editActivityId)
                        {
                            this.editableSubject = this.data[i].Subject;
                            this.editableRelatedToName = this.data[i].WhatName;
                            this.editableRelatedToId = this.data[i].RelatedtToId;
                            this.eventDescription = this.data[i].eventDescription;
                            this.taskDescription = this.data[i].taskDescription;
                            this.editableOwnerName = this.data[i].OwnerName;
                            this.editableOwnerId = this.data[i].OwnerId;
                            this.editableSetUpByNewId = this.data[i].SetUpByNewId;
                            this.editableSetUpByNewName = this.data[i].SetUpByNewName;
                            if(this.editActivityId.startsWith('00T'))
                            {
                                this.editableDueDate = this.data[i].ActivityDate;
                                this.editableStatus = this.data[i].Status;
                                this.editablePriority = this.data[i].Priority;
                            }
                            else
                            {
                                this.editableAllDayEvent = this.data[i].allDayEvent;
                                this.editableStartDate = this.data[i].startDateTime;
                                this.editableEndDate = this.data[i].endDateTime;
                            }
                            break;
                        }
                    }
                    if(this.editActivityId.startsWith('00T'))
                    {
                        this.editPopup = true;
                    }
                    else
                    {
                        this.editEventPopup = true;
                    }
                }
                else
                {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: 'The Activity you are trying to edit doesn’t exist.',
                            variant: 'error'
                        })
                    );
                    this.isLoading=false;
                }
                return refreshApex(this.getAllData());
            }).catch(error => {
                console.log(error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'An error occured. Please refresh the list.',
                        variant: 'error'
                    })
                );
                this.isLoading=false;
                return refreshApex(this.getAllData());
            });
        }
    }

    async handlePermissionPopup() {
        await checkActivityPermissions().then(result => {
            this.setNotificationFlags(result);
        }).catch(error => {
            console.log(error);
        })
    }

    /**
     * Closes edit popup for Task and Event.
     */
    closeEditPopup()
    {
        this.editPopup = false;
        this.editEventPopup = false;
    }
   
    /**
     * Refresh handler for Activities
     */
    @api
    async refreshTable(){
        this.isLoading = true;
        //DSC-729: Permission Handling
        await this.handlePermissionPopup();
        if(!this.hasCreatePermission){ 
            this.isLoading = true;
            return;
        }
        this.isLoading = true;
        this.totalNumberOfRows = null;
        this.allRecords = null;
        this.data = null;
        var table = this.template.querySelector('c-custom-datatable');
        if(table!=null)
            table.enableInfiniteLoading=true;
        this.getAllData();
    }

    /**
     * Sort records on the basis or field and direction.
     */
     sortBy(field, reverse, primer) {
        const key = primer
            ? function (x) {
                  return primer(x[field]);
              }
            : function (x) {
                  return x[field];
              };

        return function (a, b) {
            var a = key(a) ? key(a) : '';
            var b = key(b) ? key(b) : '';
            if(field != 'isTask')
            {
                a = (""+a).toLowerCase();
                b = (""+b).toLowerCase();
            }
            return reverse * ((a > b) - (b > a));
        };
    }
    
    /**
     * Sort records of the basis of keyword and use other helper methods to set data.
     */
    onHandleSort(event) {
        var { fieldName: sortedBy, sortDirection } = event.detail;
        this.sortedBy = sortedBy;
        this.sortDirection = sortDirection;
        if(this.allRecords!=null && this.allRecords.length>0)
        {
            this.isLoading = true;
            if (sortedBy == 'recordLink') {
                sortedBy = 'Subject';
            }
            else if (sortedBy == 'WhoId') {
                sortedBy = 'WhoName';
            }
            else if (sortedBy == 'WhatId') {
                sortedBy = 'WhatName';
            }
            this.sortAllRecords(sortedBy,sortDirection);
            this.tableElement = event.target;
            this.tableElement.enableInfiniteLoading = true;
            this.setDefaultRecords();
            this.isLoading = false;
            if(this.sortedBy === 'Subject')
                this.sortedBy = 'recordLink';
            else if (this.sortedBy == 'WhoName') {
                this.sortedBy = 'WhoId';
            }
            else if (this.sortedBy == 'WhatName') {
                this.sortedBy = 'WhatId';
            }
        }
    }

    /**
     * Loads next 100 records on the basis of offset and limit.
     * Updates time of listview.
     */
    loadMoreData(event){
        if(this.offset < this.totalNumberOfRows)
        {
            if(this.data!=null && event.target){
                this.isLoading = true;
            }
            this.tableElement = event.target;
            this.loadMoreStatus = 'Loading';
            if(this.allRecords.length > this.data.length)
            {
                var tempList = [];  
                var recslength = parseInt(this.offset ) + parseInt(this.limit);
                if(recslength > this.allRecords.length)
                    recslength = this.allRecords.length;
                for (var i = this.offset; i < recslength; i++) 
                {
                    let temObj = Object.assign({}, this.allRecords[i]);
                    tempList.push(temObj);
                }
                if(this.data)
                    this.data =  this.data.concat(tempList);
                if((this.offset+(this.limit))>=this.totalNumberOfRows)
                {
                    this.offset = this.totalNumberOfRows;
                    this.plusSign = '';
                }
                else
                {
                    this.offset = parseInt(this.offset ) + parseInt(this.limit);
                    this.plusSign = '+';
                }
                this.loadMoreStatus = '';
                if (this.data!=null && this.data.length  >= this.totalNumberOfRows) {
                    this.tableElement.enableInfiniteLoading = false;
                    this.loadMoreStatus = 'No more data to load';
                }
                else if(this.data==null)
                {
                    this.tableElement.enableInfiniteLoading = false;
                    this.loadMoreStatus = 'No more data to load';

                }

                if(this.tableElement){
                    this.isLoading = false;
                }  

                const total=new CustomEvent("gettotalrecords",{
                    detail:{
                        offset:this.offset,
                        plusSign:this.plusSign
                    }
                });
                this.dispatchEvent(total);
            }
        }
    }
    /**
     * Helper method to set properties for sorting
     */
     sortAllRecords(sortedBy, sortDirection)
     {
         const cloneData = [...this.allRecords];
         cloneData.sort(this.sortBy(sortedBy, sortDirection === 'asc' ? 1 : -1));
         this.allRecords = cloneData;
         this.sortDirection = sortDirection;
         this.sortedBy = sortedBy;
     }

    /**
     * Call save Task method from child component. 
     */
    saveTask(event){
        const objChild = this.template.querySelector('c-create-new-task');
        objChild.saveNewTask();
    }

    /**
     * Call save Event method from child component. 
     */
    saveEvent(event){
        const objChild = this.template.querySelector('c-create-new-event');
        objChild.saveNewEvent();
    }
    
    /**
     * Closes all popups and refresh table.
     */
    handleSave()
    {
        this.editPopup = false;
        this.addPopup = false;
        this.addEventPopup = false;
        this.editEventPopup = false;
        this.refreshTable();
    }

}