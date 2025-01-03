import {
    LightningElement,
    api
} from 'lwc';
import {
    NavigationMixin
} from "lightning/navigation";
import saveMessagePopUpPreference from '@salesforce/apex/WelcomeMatController.saveMessagePopUpPreference';
import checkFlagInUser from '@salesforce/apex/WelcomeMatController.checkFlagInUser';
import USER_ID from '@salesforce/user/Id';

export default class MessagePopUp extends NavigationMixin(LightningElement) {
    @api currentNotificationType;
    @api currentNotificationMetadata;
    @api userFirstName;

    showNotification = false;
    showMessagePopupButton = true;
    messageTitle;
    messageDescription;
    messageConclusion;
    conclusionStyle = 'centerConclusion';
    messageAction;
    showTermsAndCond = false;
    termsAndCondCheckboxDisabledFlag = false;
    termsAndCondText;
    termsAndCondURL;
    checkETNflagInUser = false;

    connectedCallback() {
        this.checkEventsTaskNotesFlagInUser();
    }

    /**
     * To set the pop-up metadata from the 
     */
    setPopUpMetadata() {
        if (Object.keys(this.currentNotificationMetadata).length > 0) {
            if (this.currentNotificationMetadata.Welcome_Modal_Name__c !== '' && this.userFirstName !== '' && this.userFirstName !== 'undefined') {
                var title = this.currentNotificationMetadata.Welcome_Modal_Name__c;
                this.messageTitle = title.replace('<User.FirstName!>', this.userFirstName + '!');
            }
            if (this.currentNotificationMetadata.Welcome_Modal_Name__c !== '' && this.userFirstName == 'undefined') {
                var title = this.currentNotificationMetadata.Welcome_Modal_Name__c;
                this.messageTitle = title.replace('<User.FirstName!>', '');
            }
            this.messageDescription = this.currentNotificationMetadata.Description__c;
            this.messageConclusion = this.currentNotificationMetadata.Events_Notes_Tasks_Info__c;
            this.messageAction = this.currentNotificationMetadata.Action_Name__c;
            if (this.currentNotificationType != 'Is_Message_Popup__c') {
                this.showTermsAndCond = true;
                this.conclusionStyle = 'leftConclusion';
                this.termsAndCondText = this.currentNotificationMetadata.Non_Customers_Agreement__c;
                this.termsAndCondURL = this.currentNotificationMetadata.Action_URL__c;
            } else {
                setTimeout(this.showMessageButton.bind(this), 7000);
            }
            this.showNotification = true;
        } else {
            this.showNotification = false;
        }
    }

    /**
     * Show the action button after delay
     */
    showMessageButton() {
        this.showMessagePopupButton = false;
    }

    /**
     * To process the saving of the user preference
     */
    processMessagePopupStatus() {
        //Hide the popup and save the response in user preference
        this.showNotification = false;
        if (this.currentNotificationType == 'Is_Message_Popup__c') {
            this.saveMessagePopupStatus();
        }
        // Event to parent component to display the next notification
        const messageEvent = new CustomEvent('getnotificationinteraction', {
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(messageEvent);
    }

    /**
     * To save the user preference
     */
    saveMessagePopupStatus() {
        this.termsAndCondCheckboxDisabledFlag = true;
        this.showMessageButton();
        saveMessagePopUpPreference({
            userId: USER_ID,
            popupMessageType: this.currentNotificationType,
            flag: true
        }).then(preferenceSavedResult => {}).catch(error => {
            console.log("Error saving User Preference: ", error);
        });
    }

    /**
     * To check for "Events, Tasks, Notes Access" flag in User object.
     */
    checkEventsTaskNotesFlagInUser() {
        checkFlagInUser({
            userId: USER_ID
        })
        .then((flag) => {
            this.checkETNflagInUser = flag;
            if((this.currentNotificationType == 'Events_Notes_Tasks_Notification__c' && this.checkETNflagInUser) || 
                this.currentNotificationType != 'Events_Notes_Tasks_Notification__c') {
                this.setPopUpMetadata();
            } else if(this.currentNotificationType == 'Events_Notes_Tasks_Notification__c' && !this.checkETNflagInUser) {
                this.processMessagePopupStatus();
            }
        })
        .catch((error) => {
            console.log('Error : ', error);
        })
    }
}