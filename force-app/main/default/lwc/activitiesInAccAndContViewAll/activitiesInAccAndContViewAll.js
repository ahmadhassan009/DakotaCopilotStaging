import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import checkActivityPermissions from '@salesforce/apex/ActivitiesCustomRelatedListHelper.checkActivityPermissions';
import fetchParentRecord from '@salesforce/apex/ActivitiesCustomRelatedListHelper.fetchParentRecord';
import { showNotification, setNotificationFlags } from "c/utils";


const TOGGLEBUTTONS = [
    { label: 'Open Activities', value: 'openActivites' },
    { label: 'Past Activities', value: 'pastActivities' }
];

export default class ActivitiesInAccAndContViewAll extends NavigationMixin(LightningElement) {
    @api recordId;
    @track hasPermission = false;
    @api showPastActivities;
    showOpenActivities=true;
    hasCreatePermission = false;
    @track doesNotHasPermission = false;

    objName;
    recordLink;
    recordNameLink;
    recNameAvailable = false;

    isLoading=false;
    totalRecords = '0';
    totalNumberOfRows;
    offset=0;
    plusSign = null;

    toggleButtons = TOGGLEBUTTONS;
    selectedButton = '';

    addPopup = false;
    addEventPopup = false;
    
    isDisabled=false;

    //DSC-729: Permission error messages
    permissionErrMsg = 'You don\'t have necessary permissions to perform this action';
    listPermissionMsg = 'Page does not exist or you do not have permission to access this page. Please contact your Marketplace Administrator if you need further assistance.';
    showNotification = showNotification.bind(this);
    setNotificationFlags = setNotificationFlags.bind(this);
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback()
    {
        this.isLoading=true;
        this.showPastActivities = this.showPastActivities == 'false' ? false : true;
        this.selectedButton = this.showPastActivities == true ? 'pastActivities' : 'openActivites';
        this.showOpenActivities = this.showPastActivities == true ? false : true;
        this.setLinks();
        checkActivityPermissions({
        }).then(permissionEnabled => {
            if(permissionEnabled == true){
                this.hasPermission = true;
            }
        }).catch(error => {
            console.log(error);
            this.isLoading=false;
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

    /** 
     * Set breadcrumb links
     * */ 
    setLinks() {
        if(this.recordId.startsWith('003'))
        {
            this.objName = 'Contact';
            this.recordLink = "/"+this.communityName+"/s/contact/" + this.recordId;
            this.recordNameLink = "/"+this.communityName + '/s/contact/Contact/Default';
        }
        else
        {
            this.objName = 'Account';
            this.recordLink = "/"+this.communityName+"/s/account/" + this.recordId;
            this.recordNameLink = "/"+this.communityName + '/s/account/Account/Default';
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
     * Open New Task Popup.
     */
    async createNewTask(event) {
        //DSC-729: Permission Handling
        await this.handlePermissionPopup();
        this.addPopup = this.hasCreatePermission;
        this.addEventPopup = false;
        this.isDisabled=false;
    }

    /**
     * Open New Event Popup.
     */
    async createNewEvent(event) {
        //DSC-729: Permission Handling
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
    async refreshTable(){
        this.isLoading = true;
        //DSC-729: Permission Handling
        await this.handlePermissionPopup();
        if(this.showPastActivities == true) {
            const objChild = this.template.querySelector('c-activities-history-in-acc-and-cont-view-all');
            objChild.refreshTable();
        }
        else if(this.showOpenActivities == true){
            const objChild = this.template.querySelector('c-activities-in-accounts-view-all');
            objChild.refreshTable();
        }
        if(!this.hasCreatePermission){ 
            this.isLoading = true;
            return;
        }
    }

     /**
      * Closes New Task Popup.
      */
    closeAddPopup()
    {
        this.addPopup = false;
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


    handleToggleButtonChange(event) {
        this.isLoading=true;
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
        this.offset=event.detail.offset;
        this.plusSign=event.detail.plusSign;
        this.isLoading=false;
    }

}