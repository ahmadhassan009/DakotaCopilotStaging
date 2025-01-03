import { LightningElement, api,track,wire } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import checkActivityPermissions from '@salesforce/apex/ActivitiesCustomRelatedListHelper.checkActivityPermissions';
import { showNotification, setNotificationFlags } from "c/utils";

const TOGGLEBUTTONS = [
    { label: 'Open Activities', value: 'openActivites' },
    { label: 'Past Activities', value: 'pastActivities' }
];


export default class activitiesInAccAndCont extends NavigationMixin(LightningElement) {
    @api recordId;
    @track hasPermission = false;
    @api showPastActivities=false;
    showOpenActivities=true;
    isSpinner=false;
    showFooter=true;
    hasCreatePermission = false;
    totalRecords = '0';
    addPopup = false;
    addEventPopup = false;
    editEventPopup = false;
    toggleButtons = TOGGLEBUTTONS;
    selectedButton = 'openActivites';

    subscription = {};
    CHANNEL_NAME = '/event/RefreshComponents__e';
    //DSC-729: Permission message
    permissionErrMsg = 'You don\'t have necessary permissions to perform this action';

    showNotification = showNotification.bind(this);
    setNotificationFlags = setNotificationFlags.bind(this);

    libInitialized = false;
    isDisabled=false;
    @track sessionId;
    @track error;

    connectedCallback()
    {
        this.isSpinner = true;
        this.selectedButton = 'openActivites';
        checkActivityPermissions({
        }).then(permissionEnabled => {
            if(permissionEnabled == true){
                this.hasPermission = true;
            }
        }).catch(error => {
            console.log(error);
            this.isSpinner=false;
        });
    }

    async handlePermissionPopup() {
        await checkActivityPermissions().then(result => {
            this.setNotificationFlags(result); 
        }).catch(error => {
            console.log(error);
        })
    }
    /**
     * Create New record
     */
    async createNewTask(event) {
        await this.handlePermissionPopup();
        this.addPopup = this.hasCreatePermission;
        this.addEventPopup = false;
        this.isDisabled=false;
    }

    /**
     * Closes add popup for Task.
     */
    closeAddPopup()
    {
        this.addPopup = false;
    }

    /**
     * Open New Event Popup.
     */
    async createNewEvent(event) {
        await this.handlePermissionPopup();
        this.addEventPopup = this.hasCreatePermission;
        this.addPopup = false;
        this.isDisabled=false;
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
    refreshTable(){
        this.isSpinner=true;
        if(this.showPastActivities == true) {
            const objChild = this.template.querySelector('c-activities-history-in-accounts-and-contacts');
            objChild.refreshTable();
        }
        else if(this.showOpenActivities == true){
            const objChild = this.template.querySelector('c-activities-in-accounts');
            objChild.refreshTable();
        }
    }

    /**
     * Call save Task method from child component. 
     */
    saveTask(event){             
        this.isDisabled=true;
        const objChild = this.template.querySelector('c-create-new-task');
        objChild.saveNewTask();
    }
    
    /**
     * Call save Event method from child component. 
     */
    saveEvent(event){     
        this.isDisabled=true;
        const objChild = this.template.querySelector('c-create-new-event');
        objChild.saveNewEvent();
    }

    handleNotSaved()
    {
        this.isDisabled=false;
    }
    /**
     * Closes all popups and refresh table.
     */
    handleSave()
    {
        this.addPopup = false;
        this.addEventPopup = false;
        this.refreshTable();        
        this.isDisabled=false;
    }

    /**
     * Navigate to view all page of Activities.
     */
    handleShowFullRelatedList()
    {
        var url = '/view-all-in-acc-and-cont?recordId=' + this.recordId+'&showPastActivities='+this.showPastActivities;

            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: url
                }
            });
    }

    handleToggleButtonChange(event) {
        this.isSpinner=true;
        const selectedOption = event.detail.value;
        if(selectedOption == 'pastActivities') {
            this.showOpenActivities=false;
            this.showPastActivities=true;
        }
        else {
            this.showPastActivities=false;
            this.showOpenActivities=true;
        }
    }

    handleTotalRecordsValue(event)
    {
        this.totalRecords=event.detail;
        this.isSpinner=false;
        if(this.totalRecords != '0' && this.showFooter == false)
        {
            this.showFooter=true;
        }
        if(this.totalRecords == '0' && this.showFooter == true)
        {
            this.showFooter=false;
        }
    }
}