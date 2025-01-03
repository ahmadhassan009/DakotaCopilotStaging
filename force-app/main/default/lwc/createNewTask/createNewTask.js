import { LightningElement, api, wire, track} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import fetchPickLists from '@salesforce/apex/ActivitiesInAccountsController.fetchPickLists';
import createEditTask from '@salesforce/apex/ActivitiesInAccountsController.createEditTask';
import getAccountName from '@salesforce/apex/ActivitiesCustomRelatedListHelper.getAccountName';
import getContactName from '@salesforce/apex/ActivitiesCustomRelatedListHelper.getContactName';
import getTaskContacts from '@salesforce/apex/ActivitiesInAccountsController.getTaskContacts';
import getObjectName from '@salesforce/apex/ActivitiesCustomRelatedListHelper.getObjectName';
import fetchUsers from '@salesforce/apex/ActivitiesInAccountsController.fetchUsers';
import USER_ID from '@salesforce/user/Id';
import NAME_FIELD from '@salesforce/schema/User.Name';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadStyle } from 'lightning/platformResourceLoader';
import pill_height from '@salesforce/resourceUrl/pill_height';

export default class CreateNewTask extends NavigationMixin(LightningElement) {
    fromAccount;
    fromContact;
    @api accountId;
    @api orgId;
    @api selectedSubject;
    @api selectedDueDate;
    @api selectedPriority;
    @api selectedStatus;
    @api selectedRelatedToId;
    @api selectedRelatedToName;
    @api selectedOwnerId;
    @api selectedOwnerName;
    @api taskDescription;
    @api taskSetupById;
    @api taskSetupByName;

    @api taskId;
    accountName;

    isLoading = false;
    selectedContact;
    selectedAccount;

    // Picklists
    priorityVals = [];
    subjectVals = [];
    statusVals = [];
    selectedContacts = [];
    showRelatedContact = false;
    isValueSelected = false;
    selectedName;
    accountsData = null;

    allUserRecords = null;
    isUserSelected = false;
    selectedUserName;
    isUserEmpty = false;
    isError = "";
    contactsExist = false;
    

    @track error;
    @wire(getRecord, {
         recordId: USER_ID,
         fields: [NAME_FIELD]
    }) wireuser({
         error,
         data
     }) {
         if (error) {
            this.error = error ; 
         } else if (data) {
            if(this.taskId!=null && this.selectedOwnerId!=null)
            {
                // this.selectedUser = this.selectedOwnerId;
                // this.selectedUserName = this.selectedOwnerName;
                this.selectedUser = this.taskSetupById;
                this.selectedUserName = this.taskSetupByName;
                this.isUserSelected = true;
            }
            else
            {
                this.selectedUser = USER_ID;
                this.selectedUserName = data.fields.Name.value;
                this.isUserSelected = true;
            }
         }
    }

    async connectedCallback()
    {
        Promise.all([
            loadStyle(this, pill_height)
        ]);
        this.isLoading = true;
        if(this.taskDescription)this.taskDescription = this.taskDescription.replace(/<br\s*\/?>/gi, '\n');
        //getting object type (Accont or Contact)
        const objName = await getObjectName({recordId: this.accountId });
        if(objName == 'Account') {
            this.fromContact = false;
            this.fromAccount = true;
        } else if(objName == 'Contact') {
            this.fromContact = true;
            this.fromAccount = false;
        }
        
        fetchUsers({
            orgId: this.orgId
        }).then(returnedData => {
            this.allUserRecords = returnedData;
            this.isLoading = false;
        })
        .catch(error => {
            this.isLoading = false;
            console.log(error);
        });

        if(this.taskId!=null)
        {
            if(this.selectedRelatedToId!=null)
            {
                this.selectedName = this.selectedRelatedToName;
                this.selectedAccount = this.selectedRelatedToId;
                this.isValueSelected = true;
            }
           await getTaskContacts({
                taskId : this.taskId
            }).then(returnedData => {
                if(returnedData != null)
                {
                    for(let i = 0; i < returnedData.length; i++)
                    {
                        if(returnedData[i].RelationId!=null)
                        {
                            let newsObject = { 'Id' : returnedData[i].RelationId ,'Name' : returnedData[i].Relation.Name };
                            this.selectedContacts.push(newsObject);
                            this.showRelatedContact = true;
                        }
                    }
                }
            }).catch(error => {
                console.log(error);
            });
        }
        
        if(this.fromAccount)
        {
            getAccountName({
                recordId : this.accountId
            }).then(returnedName => {
                if(returnedName != null)
                {                     
                    this.selectedName = returnedName.Name;   
                    this.selectedAccount = this.accountId;
                    this.isValueSelected = true;
                }
                this.showRelatedContact = true;
            }).catch(error => {
                console.log(error);
            });
        }
        else
        {
            getContactName({
                recordId : this.accountId
            }).then(returnedData => {
                if(returnedData != null)
                {
                    let newsObject = { 'Id' : returnedData.Id ,'Name' : returnedData.Name};
                    this.selectedContacts.push(newsObject);
                    this.showRelatedContact = true;
                }
            }).catch(error => {
                console.log(error);
            });
        }

        fetchPickLists().then(returnedData => {
            var subjectOptions = [];
            for(var i=0; i<returnedData['Subject'].length; i++)
            {
                subjectOptions.push({ label: returnedData['Subject'][i], value: returnedData['Subject'][i] });
            }
            this.subjectVals = subjectOptions;
            
            var priorituOptions = [];
            for(var i=0; i<returnedData['Priority'].length; i++)
            {
                priorituOptions.push({ label: returnedData['Priority'][i], value: returnedData['Priority'][i] });
            }
            this.priorityVals = priorituOptions;

            var statusOptions = [];
            for(var i=0; i<returnedData['Status'].length; i++)
            {
                statusOptions.push({ label: returnedData['Status'][i], value: returnedData['Status'][i] });
            }
            this.statusVals = statusOptions;
            this.isLoading = false;
        })
        .catch(error => {
            this.isLoading = false;
            console.log(error);
        });
    }

    handleSubjectChange(event) {
        this.selectedSubject = event.detail.value;
    }

    handlePriorityChange(event) {
        this.selectedPriority = event.detail.value;
    }

    handleStatusChange(event) {
        this.selectedStatus = event.detail.value;
    }

    handleDateChange(event) {
        this.selectedDueDate = event.detail.value;
    }

    handleValueSelcted(event) {
       
        this.selectedContact = event.detail;
    }

    @api
    saveNewTask() 
    {
        if (!this.validateFields())
        {
            this.dispatchEvent(new CustomEvent('notsaved'));
            return;
        }
            
        var contactIdsList = '';
        if(this.selectedContact!=null && this.selectedContact.length !=0)
        {
            for(var i=0; i<this.selectedContact.selRecords.length; i++ )
            {
                contactIdsList = contactIdsList + this.selectedContact.selRecords[i].Id + ',';
            }
        }
        contactIdsList = contactIdsList.slice(0, -1);
        var assignedToId = USER_ID;
        if(this.selectedUser!=null)
        {
            assignedToId = this.selectedUser;
        } 
        else
        {
            return;
        }
        var recId = null;
        if(this.selectedAccount!=null)
            recId = this.selectedAccount;

        this.isLoading = true;
        this.taskDescription = this.template.querySelector("[data-field='taskDescription']").value;
        createEditTask({
            taskId: this.taskId,
            subject: this.selectedSubject,
            dueDate: this.selectedDueDate,
            priority: this.selectedPriority, 
            status: this.selectedStatus,
            userId: assignedToId,
            accountId: recId,
            contactIds:  contactIdsList,
            taskDescription: this.taskDescription
        }).then(result => {
            this.isLoading = false;
            if(result == true)
            {
                if(this.taskId != null) {
                    this.toastMessage = 'Task Updated Successfully.';
                } else {
                    this.toastMessage =  'Task Created Successfully.';
                }
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: this.toastMessage,
                        variant: 'success'
                    })
                 );
                this.dispatchEvent(new CustomEvent('saved'));
            }
        }).catch(error => {
            this.isLoading = false;
            let errorText = error.body.message;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: errorText,
                    variant: 'error'
                })
            );
        });
    }

    validateFields() {
        return [...this.template.querySelectorAll("lightning-combobox")].reduce((validSoFar, field) => {
            // Return whether all fields up to this point are valid and whether current field is valid
            // reportValidity returns validity and also displays/clear message on element based on validity
            return (validSoFar && field.reportValidity());
        }, true);
    }

    handleAccountSelection(event)
    {
        this.selectedAccount = event.detail;
    }

    handleUserSelection(event)
    {
        this.selectedUser = event.detail;
        if(this.selectedUser!=null)
        {
            this.isUserEmpty = false;
            this.isError = "";
        } 
        else
        {
            this.isUserEmpty = true;
            this.isError = '--slds-c-input-color-border: #ea001e; --slds-c-input-shadow: #ea001e 0 0 0 1px inset;';
        }
    }
}