import { LightningElement, api, wire, track} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import fetchEventSubject from '@salesforce/apex/ActivitiesInAccountsController.fetchEventSubject';
import createEditEvent from '@salesforce/apex/ActivitiesInAccountsController.createEditEvent';
import getAccountName from '@salesforce/apex/ActivitiesCustomRelatedListHelper.getAccountName';
import getContactName from '@salesforce/apex/ActivitiesCustomRelatedListHelper.getContactName';
import getEventContacts from '@salesforce/apex/ActivitiesInAccountsController.getEventContacts';
import fetchUsers from '@salesforce/apex/ActivitiesInAccountsController.fetchUsers';
import getObjectName from '@salesforce/apex/ActivitiesCustomRelatedListHelper.getObjectName';
import USER_ID from '@salesforce/user/Id';
import NAME_FIELD from '@salesforce/schema/User.Name';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadStyle } from 'lightning/platformResourceLoader';
import pill_height from '@salesforce/resourceUrl/pill_height';


export default class CreateNewEvent extends NavigationMixin(LightningElement) {
    fromAccount;
    fromContact;
    @api accountId;
    @api orgId;
    @api selectedSubject;
    @api selectedStartDate;
    @api selectedEndDate;
    @api allDayEvent;
    @api selectedRelatedToId;
    @api selectedRelatedToName;
    @api selectedOwnerId;
    @api selectedOwnerName;
    @api eventDescription;
    @api eventSetupById;
    @api eventSetupByName;

    @api eventId;
    accountName;

    @track hasPermission = false;

    isLoading = false;
    selectedContact;
    selectedAccount;
    selectedUser;

    // Picklists
    subjectVals = [];
    selectedContacts = [];

    isValueSelected = false;
    selectedName;
    accountsData = null;

    dateVariant="";
    dateFieldType = "datetime";
    onlyDate = false;

    allUserRecords = null;
    isUserSelected = false;
    selectedUserName;
    isUserEmpty = false;
    isError = "";

    dateInterVal = false;
    hourInterVal = false;
    minInterVal = false;
    defaultInterval = 1;

    showRelatedContact = false;
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
            if(this.eventId!=null && this.selectedOwnerId!=null)
            {
                // this.selectedUser = this.selectedOwnerId;
                // this.selectedUserName = this.selectedOwnerName;
                this.selectedUser = this.eventSetupById;
                this.selectedUserName = this.eventSetupByName;
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
        try {
            Promise.all([
                loadStyle(this, pill_height)
            ]);
            this.isLoading = true;
            if(this.eventDescription)this.eventDescription = this.eventDescription.replace(/<br\s*\/?>/gi, '\n');
            
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
            
            if(this.eventId!=null)
            {
                if(this.selectedRelatedToId!=null)
                {
                    this.selectedName = this.selectedRelatedToName;
                    
                    this.selectedAccount = this.selectedRelatedToId;
                    this.isValueSelected = true;
                }
    
                if(this.allDayEvent == true)
                {
                    this.dateVariant = "label-hidden";
                    this.dateFieldType = "date";
                    this.onlyDate = true;
                }
                //DSC-727: re-calculating start and end date time intervals
                this.calculateStartEndTimeIntervals();
                await getEventContacts({
                    eventId : this.eventId
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
            else
            {
                this.allDayEvent = false;
                this.setDateTime('datetime');
                if(this.fromContact)
                {
                    getContactName({
                        recordId : this.accountId
                    }).then(returnedData => {
                        if(returnedData != null)
                        {
                            let newsObject = { 'Id' : returnedData.Id ,'Name' : returnedData.Name };
                            this.selectedContacts.push(newsObject);
                            this.showRelatedContact = true;
                        }
                    }).catch(error => {
                        console.log(error);
                    });
                }
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
    
            fetchEventSubject().then(returnedData => {
                var subjectOptions = [];
                for(var i=0; i<returnedData.length; i++)
                {
                    subjectOptions.push({ label: returnedData[i], value: returnedData[i] });
                }
                this.subjectVals = subjectOptions;
                this.isLoading = false;
            })
            .catch(error => {
                this.isLoading = false;
                console.log(error);
            });
        } catch(error) {
            console.log(error);
        }
    }

    handleSubjectChange(event) {
        this.selectedSubject = event.detail.value;
    }

    handleStartDateChange(event) {
        this.selectedStartDate = event.detail.value;
        if(this.selectedStartDate) {
            this.setEndDateTime();
        }
    }

    handleEndDateChange(event) {
        this.selectedEndDate = event.detail.value;
        if(this.selectedEndDate) {
            this.setStartDateTime();
        }
    }

    /**
     * DSC-727
     * function gets called when start date-time is updated
     * set the end date-time with respect to selected interval
     */
    setEndDateTime() {
        //converting string to Date object with newly selected start date
        const newDate = new Date(this.selectedStartDate);
        if(this.dateInterVal) {//check to see if any inteval is already defined
            newDate.setDate(newDate.getDate() + parseInt(this.dateInterVal));//add the number of days interval in start date
        }
        //check to see if any hour interval is set
        if(this.hourInterVal) {  
            newDate.setHours(newDate.getHours() + parseInt(this.hourInterVal));//add the number of hours interval in start date
        } else if(!this.allDayEvent) {// in case of all day event no need to add default interval
            newDate.setHours(newDate.getHours() + this.defaultInterval);//adding default interval of one hour
        }
        //check to see if any minutes interval is set
        if(this.minInterVal) {
            newDate.setMinutes(newDate.getMinutes() + this.minInterVal);//add the number of minutes interval in start date
        }
        this.selectedEndDate = newDate.toISOString(); // converting datetime object to string
        if(this.allDayEvent) {//incase of all day event only date is required
            this.selectedEndDate = this.selectedEndDate.slice(0, 10);
        } 
    }

    /**
     * DSC-727
     * function Calculates interval when end date-time field is updated.
     */
    calculateStartEndTimeIntervals() {
        //Only calculAte Intervals when End date-time is greater than start date-time
        if(this.selectedEndDate >= this.selectedStartDate) {
            const startDateTime = new Date(this.selectedStartDate);
            const endDateTime = new Date(this.selectedEndDate);
            //calculate days interval 
            const timeDiffrence = Math.abs(endDateTime.getTime() - startDateTime.getTime());
            const differDays = Math.round(timeDiffrence / (1000 * 3600 * 24)); // Math.round is used in case when start and end date are the same
            this.dateInterVal = differDays;
            if(!this.allDayEvent){//calculating hour and minutes interval
                this.hourInterVal = Math.floor(endDateTime.getHours() - startDateTime.getHours());
                this.minInterVal = Math.floor(endDateTime.getMinutes() - startDateTime.getMinutes());
            }
        }
    }

    /**
     * DSC-727
     * function gets called when end date-time is updated
     * set the start date-time with respect to selected interval
     */
    setStartDateTime() {
        this.calculateStartEndTimeIntervals();
        //converting string to Date object with newly selected end date
        const newDate = new Date(this.selectedEndDate);
        if(this.dateInterVal) {//check to see if any interval is already defined
            newDate.setDate(newDate.getDate() - parseInt(this.dateInterVal));//subtract the number of days interval in end date
        }

        if(this.hourInterVal === false && !this.allDayEvent) {
            newDate.setHours(newDate.getHours() - 1); //subtracting default interval of one hour from end date-time
        } else if(!this.allDayEvent) {
            newDate.setHours(newDate.getHours() - parseInt(this.hourInterVal)); //subtract the number of hours interval in end date
        }

        if(this.minInterVal) {
            newDate.setMinutes(newDate.getMinutes() - this.minInterVal);//subtract the number of minutes interval in end date
        }

        //when start and end dates are exact same, default interval is reset
        if(this.selectedEndDate == this.selectedStartDate && !this.allDayEvent) {
            this.hourInterVal = this.defaultInterval;
        } 

        this.selectedStartDate = newDate.toISOString();// converting datetime object to string
        if(this.allDayEvent) {//incase of all day event only date is required
            this.selectedStartDate = this.selectedStartDate.slice(0, 10);
        }
    }

    handleAllDayEventChange(event) {
        this.allDayEvent = event.detail.checked;
        if(this.allDayEvent)
        {
            this.onlyDate = true;
            this.dateVariant = "label-hidden";
            this.dateFieldType = "date";
            this.setDateTime('date');
            //DSC-727: When All Day event checkbox is selected all set intervals are removed
            this.hourInterVal = false;
            this.minInterVal = false;
        }
        else
        {
            this.onlyDate = false;
            this.dateVariant = "";
            this.dateFieldType = "datetime";
            this.setDateTime('datetime');
        }
    }

    handleValueSelcted(event) {
        this.selectedContact = event.detail;
    }

    @api
    saveNewEvent() 
    {
        if (!this.validateFields())
        {
            this.dispatchEvent(new CustomEvent('notsaved'));
            return;
        }
        var contactIdsList = '';
        if(this.selectedContact!=null && this.selectedContact.length !=0)
        {
            for(var i=0; i<this.selectedContact.selRecords.length; i++)
            {
                contactIdsList = contactIdsList + this.selectedContact.selRecords[i].Id + ',';
            }
        }
        contactIdsList = contactIdsList.slice(0, -1);

        var recId = null;
        if(this.selectedAccount!=null)
            recId = this.selectedAccount;

        var assignedToId = USER_ID;
        if(this.selectedUser!=null)
        {
            assignedToId = this.selectedUser;
        } 
        else
        {
            return;
        }
        this.isLoading = true;
        this.eventDescription = this.template.querySelector("[data-field='eventDescription']").value;
        createEditEvent({
            eventId: this.eventId,
            subject: this.selectedSubject,
            startDate: this.selectedStartDate,
            endDate: this.selectedEndDate,
            userId: assignedToId,
            accountId: recId,
            contactIds:  contactIdsList,
            allDayEvent: this.allDayEvent,
            eventDescription: this.eventDescription
        }).then(result => {
            this.isLoading = false;
            if(result == true)
            {
                if(this.eventId != null) {
                    this.toastMessage = 'Event Updated Successfully.';
                } else {
                    this.toastMessage =  'Event Created Successfully.';
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
            let toastText ;
            let errorText = error.body.message;
            if(errorText.includes('An event can\'t last longer than 14 days.')){
                toastText = 'An event can\'t last longer than 14 days.';
            }
            else if(errorText.includes('Event duration cannot be negative')){
                toastText = 'An event\'s End date must be greater than Start date.';
            }
            else{
                toastText = errorText;
            }
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: toastText,
                    variant: 'error'
                })
            );
        });
    }

    validateFields() {
        return [...this.template.querySelectorAll("lightning-combobox, lightning-input")].reduce((validSoFar, field) => {
            // Return whether all fields up to this point are valid and whether current field is valid
            // reportValidity returns validity and also displays/clear message on element based on validity
            return (validSoFar && field.reportValidity());
        }, true);
    }

    setDateTime(type)
    {
        if(type == 'datetime')
        {
            var newDate = new Date();
            newDate.setMinutes(0);
            //DSC-727: For some reasons seconds and milliseconds were coming in start date-time, 
            //so had to set seconds and milliseconds to '0' before comparing during Interval calculation
            newDate.setSeconds(0);
            newDate.setMilliseconds(0);
            newDate.setHours( newDate.getHours() + 1 );
            if(this.selectedStartDate!=null)
            {
                var oldStartDate = new Date(this.selectedStartDate);
                oldStartDate.setHours(newDate.getHours());
                this.selectedStartDate = oldStartDate.toISOString();
            }
            else
            {
                this.selectedStartDate = newDate.toISOString();
            }
            if(this.selectedEndDate!=null)
            {
                var oldEndDate = new Date(this.selectedEndDate);
                newDate.setTime(newDate.getTime() + 1 * 60 * 60 * 1000);
                oldEndDate.setHours(newDate.getHours());
                this.selectedEndDate = oldEndDate.toISOString();
            }
            else
            {
                newDate.setTime(newDate.getTime() + 1 * 60 * 60 * 1000);
                this.selectedEndDate = newDate.toISOString();
            }
        }
        else
        {
            this.selectedStartDate = this.selectedStartDate.slice(0, 10);
            this.selectedEndDate =  this.selectedEndDate.slice(0, 10);
        }
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