import { LightningElement, api,track,wire } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import fetchPastActivities from '@salesforce/apex/ActivitiesInAccountsController.fetchPastActivities';
import deleteActivity from '@salesforce/apex/ActivitiesCustomRelatedListHelper.deleteActivity';
import recordExists from '@salesforce/apex/ActivitiesCustomRelatedListHelper.recordExists';
import getSFBaseUrl from '@salesforce/apex/ActivitiesCustomRelatedListHelper.getSFBaseUrl';
import checkActivityPermissions from '@salesforce/apex/ActivitiesCustomRelatedListHelper.checkActivityPermissions';
import getOrganizationId from '@salesforce/apex/ActivitiesCustomRelatedListHelper.getOrganizationId';
import getSessionId from '@salesforce/apex/ActivitiesCustomRelatedListHelper.getSessionId';
import activeCommunities from '@salesforce/label/c.active_communities';

import cometdlwc from "@salesforce/resourceUrl/cometd";
import Id from '@salesforce/user/Id';
import { loadScript } from "lightning/platformResourceLoader";
import { showNotification, setNotificationFlags } from "c/utils";


const COLUMNS = [
    { label: 'Subject', sortable: "true", fieldName: 'recordLink', type: 'url', typeAttributes: { label: { fieldName: 'Subject' }, target: '_self', tooltip: { fieldName: 'Subject' }}},
    { label: 'Name', sortable: "true", fieldName: 'WhoId', type: 'url', typeAttributes: { label: { fieldName: 'WhoName' }, target: '_self', tooltip: { fieldName: 'WhoName' }}},
    { label: 'Related To', sortable: "true", fieldName: 'WhatId', type: 'url', typeAttributes: { label: { fieldName: 'WhatName' }, target: '_self', tooltip: { fieldName: 'WhatName' }}},
    { label: 'Due Date', sortable: "true",fieldName: 'ActivityDate', type: 'date-local',typeAttributes: {day: "numeric",month: "numeric", year: "numeric"}},
    { label: 'Status', sortable: "true",fieldName: 'Status', type: 'text'},
    { label: 'Priority', sortable: "true",fieldName: 'Priority', type: 'text'},
    { label: 'Task', sortable: "true",fieldName: 'isTask', type: 'checkBox'},
    { label: 'Setup By', sortable: "true",fieldName: 'SetUpByNewName', type: 'text', typeAttributes: { tooltip: { fieldName: 'SetUpByNewName' }}}
]

export default class ActivitiesHistoryInAccountsAndContacts extends NavigationMixin(LightningElement) {
    @api recordId;
    @track hasPermission = false;
    hasCreatePermission = false;
    orgId;
    currentUserId = Id;
    recordsExists = false;
    columns;
    data;
    baseURL = '';
    recordToDel;
    panelStyling;
    totalRecords = '0';
    listName = '';
    deletePopup = false;
    deleteRowId;
    addPopup = false;
    addEventPopup = false;
    editEventPopup = false;

    editPopup = false;
    editActivityId;
    editableName;
    editableSubject;
    editableDueDate;
    editableStatus;
    editablePriority;
    editableRelatedTo;

    editableAllDayEvent;
    editableStartDate;
    editableEndDate;
    eventDescription;
    taskDescription;

    totalNumberOfRows;
    defaultSortDirection = 'asc';
    sortDirection = 'asc';
    sortedBy = 'ActivityDate';
    allRecords;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    subscription = {};
    CHANNEL_NAME = '/event/RefreshComponents__e';
    //DSC-729: Permission message
    permissionErrMsg = 'You don\'t have necessary permissions to perform this action';

    showNotification = showNotification.bind(this);
    setNotificationFlags = setNotificationFlags.bind(this);

    libInitialized = false;
    @track sessionId;
    @track error;


    @wire(getSessionId)
    wiredSessionId({ error, data }) {
        if (data) {
            this.sessionId = data;
            this.error = undefined;
            loadScript(this, cometdlwc)
            .then(() => {
                this.initializecometd();
            });
        } else if (error) {
            console.log(error);
            this.error = error;
            this.sessionId = undefined;
        }
    }

    initializecometd() {
        var outerThis = this;
        if (this.libInitialized) {
            return;
        }
        this.libInitialized = true;

        //inintializing cometD object/class
        var cometdlib = new window.org.cometd.CometD();
                
        //Calling configure method of cometD class, to setup authentication which will be used in handshaking
        cometdlib.configure({
            url: window.location.protocol + '//' + window.location.hostname + '/cometd/47.0/',
            requestHeaders: { Authorization: 'OAuth ' + this.sessionId},
            appendMessageTypeToURL : false,
            logLevel: 'debug'
        });

        cometdlib.websocketEnabled = false;

        cometdlib.handshake(function(status) {
            if (status.successful) {
                // Successfully connected to the server.
                // Now it is possible to subscribe or send messages
                cometdlib.subscribe('/event/Refresh_Activities__e', function (message) {
                        outerThis.refreshTable();
            });
            } else {
                /// Cannot handshake with the server, alert user.
                console.error('Error in handshaking: ' + JSON.stringify(status));
            }
        });
    }

    connectedCallback()
    {
        getOrganizationId({
        }).then(responseId => {
            this.orgId = responseId;
            this.columns = COLUMNS.slice();
            this.columns.push({ type: 'action', typeAttributes: { rowActions: this.getRowActions }});
            getSFBaseUrl().then(baseURL => {
                if(baseURL) {
                    this.baseURL = baseURL;
                    this.fetchAllActivitiesData();
                }
            })
            .catch(error => {
                console.log(error);
            });
        }).catch(error => {
            console.log(error);
        });
    }

    fetchAllActivitiesData()
    {
        fetchPastActivities({
            recordId : this.recordId,
            orgId: this.orgId,
            recLimit: 50000
        }).then(returnedData => {
            //user have permissions to access events or tasks
            if(returnedData != null) {
                this.hasPermission = true;
            }
            if (returnedData!=null && returnedData.length>0) {
                if(this.baseURL) {
                    if(returnedData.length > 10) {
                        this.totalRecords = '10+';
                    } 
                    else {
                        this.totalRecords = returnedData.length;
                    }

                    this.recordsExists = true;
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
                            returnedData[i].recordLink = "/"+this.communityName+'/s/event-and-task-detail-page?recordId=' + returnedData[i].Id + '&objectId=' + this.recordId + '&viewAll=false';
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
                //user does not have permissions to access events or tasks
                if(returnedData === null) {
                    this.hasPermission = false;
                }
                this.recordsExists = false;
                this.totalRecords = '0';
                this.data = null;
            }
            const total=new CustomEvent("gettotalrecords",{
                detail:this.totalRecords
            });
            this.dispatchEvent(total);

        }).catch(error => {
            console.log(error);
        });
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
    
    setDefaultRecords()
    {
        var tempList = [];  
        var recslength = this.allRecords.length;
        if(recslength > 10)
            recslength = 10;
        for (var i = 0; i < recslength; i++) 
        {
            let temObj = Object.assign({}, this.allRecords[i]);
            tempList.push(temObj);
        }
        if(this.allRecords.length > 0) 
        {
            this.data = tempList;
        }
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
     * Handle row actions for datatable
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
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: this.toastMessage,
                            variant: 'success'
                        })
                    );
                    return refreshApex(this.fetchAllActivitiesData());
                }).catch(error => {
                    console.log(error);
                    let errorMsg = 'Error occured while deleting Activity.';
                    if(error && error.body && error.body.message && error.body.message.includes("You don't have necessary permissions")) {
                        errorMsg = error.body.message;
                    }
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error deleting record',
                            message: errorMsg,
                            variant: 'error'
                        })
                    );
                    return refreshApex(this.fetchAllActivitiesData());
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
        await this.handlePermissionPopup();
        if(!this.hasCreatePermission) return;

        let {Id} = row;
        this.editActivityId = Id;
        if(this.editActivityId!=null)
        {
            recordExists({
                recordId : this.editActivityId
            }).then(response => {
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
     * Closes add popup for Task.
     */
    closeAddPopup()
    {
        this.addPopup = false;
    }


    /**
     * Closes New Event Popup.
     */
    closeEventAddPopup()
    {
        this.addEventPopup = false;
    }

    /**
     * Refresh handler for Activities
     */
    @api
    refreshTable(){
        this.fetchAllActivitiesData();
    }

    /**
     * Navigate to view all page of Activities.
     */
    handleShowFullRelatedList()
    {
        var url = '/view-all-in-acc-and-cont?recordId=' + this.recordId;

            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: url
                }
            });
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
        this.addPopup = false;
        this.editPopup = false;
        this.addEventPopup = false;
        this.editEventPopup = false;
        this.refreshTable();
    }

    
}