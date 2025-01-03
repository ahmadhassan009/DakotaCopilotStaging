import {
    LightningElement,
    api,
    track
} from 'lwc';
import {
    NavigationMixin
} from "lightning/navigation";
import updatePortalState from '@salesforce/apex/AppLauncherController.updatePortalState';
import getMessagePopStatus from '@salesforce/apex/AppLauncherController.getMessagePopStatus';
import getPopupNotificationMetadata from '@salesforce/apex/WelcomeMatController.getPopupNotificationMetadata';
import getCurrentUserName from '@salesforce/apex/WelcomeMatController.getCurrentUserName';
import USER_ID from '@salesforce/user/Id';

export default class AppLauncher extends NavigationMixin(LightningElement) {
    showWelcome = false;
    messageNotificationFlags = [];
    messageNotificationsMetadata;
    currentNotification;
    @track notificationViewStatus = false;
    userFirstName;
    currentNotificationMetadata;

    connectedCallback() {
        this.checkAndUpdatePortalState();
        this.getMessagePopUpStatuses();
        this.getMessagePopUpMetadata();
    }

    @api
    checkAndUpdatePortalState() {
        var currentPortalState = location.pathname.split('/')[1];
        if (currentPortalState != undefined) {
            updatePortalState({
                userId: USER_ID,
                portalState: currentPortalState
            }).then(userData => {
                if (userData != null) {
                    
                    if (userData.Portal_State__c == "Marketplace2") {
                        this.showWelcome = false;
                    } else {
                        this.showWelcome = (sessionStorage.getItem('firstVisit') != "1");
                    }
                } else {
                    this.showWelcome = (sessionStorage.getItem('firstVisit') != "1");
                }

                if (!this.showWelcome && userData.Portal_State__c != "Marketplace2") {
                    this.checkOtherNotificationFlags();
                }
                
            }).catch(error => {
                console.log("Error:", error);
            });
        }

    }

    /**
     * Function to check other notification flags
     * As welcome/trial mat is not shown so user name needs to be fetched
     * and next messages flags are checked
     */
    checkOtherNotificationFlags() {
        getCurrentUserName({
            userId: USER_ID
        }).then(userData => {
            if (userData) {
                var eventsDetailsArray = [];
                eventsDetailsArray.push({
                    userFirstName: userData[0]
                });
                let eventObj = {
                    detail: eventsDetailsArray
                };
                this.handleNextMessages(eventObj);
            }
        }).catch(error => {
            console.log("Error loading user:", error);
        });
    }

    /**
     * Get messages pop - up statuses for the current user
     */
    getMessagePopUpStatuses() {
        getMessagePopStatus({
            userId: USER_ID
        }).then(notificationFlags => {
            this.messageNotificationFlags = notificationFlags;

        }).catch(error => {
            console.log("Error in retrieving message pop-up status:", error);
        });
    }

    /**
     * Get messages pop - up metadata
     */
    getMessagePopUpMetadata() {
        getPopupNotificationMetadata({
            userId: USER_ID
        }).then(notificationMetadata => {
            this.messageNotificationsMetadata = notificationMetadata;
        }).catch(error => {
            console.log("Error in retrieving message pop-up metadata:", error);
        });
    }

    /**
     * Handler to check the messages pop-up after welcome/trial mat
     * @param {*} event 
     */
    handleNextMessages(event) {
        this.userFirstName = event.detail[0].userFirstName;
        this.processNotifications();
    }

    /**
     * Notification flags are traversed and appropriate pop-up is shown
     */
    processNotifications() {
        for (var i = 0; i < this.messageNotificationFlags.length; i++) {
            if (this.messageNotificationFlags[i].popUpProcessed) {
                continue;
            } else {
                if (!this.messageNotificationFlags[i].PopUpFlag && !this.messageNotificationFlags[i].popUpProcessed) {
                    this.currentNotification = this.messageNotificationFlags[i].MessagePopupType;
                    if (this.messageNotificationsMetadata.hasOwnProperty(this.messageNotificationFlags[i].MessagePopupType)) {
                        this.currentNotificationMetadata = this.messageNotificationsMetadata[this.messageNotificationFlags[i].MessagePopupType];
                    }
                    this.notificationViewStatus = true;
                    break;
                }
            }
        }

    }

    /**
     * Handler to check the next message notification
     * @param {*} event 
     */
    handleNextMessageNotification(event) {
        this.showWelcome = false;
        this.notificationViewStatus = false;
        for (var i = 0; i < this.messageNotificationFlags.length; i++) {
            if (this.messageNotificationFlags[i].MessagePopupType == this.currentNotification && !this.messageNotificationFlags[i].popUpProcessed) {
                this.messageNotificationFlags[i].popUpProcessed = true;
                break;
            }
        }
        // Used timeout as the view was not rendering based on 'notificationViewStatus' flag
        setTimeout(this.processNotifications.bind(this), 100);
    }
}