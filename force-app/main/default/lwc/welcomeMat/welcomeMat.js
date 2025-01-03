import {
    LightningElement,
    api,
    track
} from 'lwc';
import {
    NavigationMixin
} from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getWelcomeMatMetadata from '@salesforce/apex/WelcomeMatController.getWelcomeMatMetadata';
import getCurrentUserName from '@salesforce/apex/WelcomeMatController.getCurrentUserName';
import saveUserPreference from '@salesforce/apex/WelcomeMatController.saveUserPreference';
import getUserPreference from '@salesforce/apex/WelcomeMatController.getUserPreference';
import USER_ID from '@salesforce/user/Id';

export default class WelcomeMat extends NavigationMixin(LightningElement) {
    @api recordId;
    @track name;
    @api rightPanelRecords;
    isLoading = true;
    showModal = false;
    welcomeMatActive = false;
    leftTitle;
    leftDescription;
    leftButtonLabel;
    leftButtonLink;
    leftNonCustomerAgreement;
    nonCustomerMat = false;
    userPreference = true;
    agreementButtonStatus = true;
    checkboxDisabledFlag = false;
    trialCheckboxDisabledFlag = false;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    closeModal(event) {
        this.showModal = false;
        this.checkAdditionalMessagesPopUp();
    }

    connectedCallback() {
        getCurrentUserName({
            userId: USER_ID
        }).then(userData => {
            if (userData) {
                this.nonCustomerMat = userData[1] === 'true' ? true : false;
                this.name = userData[0];

                getWelcomeMatMetadata({
                    matType: userData[1]
                }).then(matRecords => {
                    if (matRecords) {
                        if (matRecords.length > 0) {
                            this.welcomeMatActive = true;
                            var panelRecords = [];
                            for (var i = 0; i < matRecords.length; i++) {
                                let tempRecord = Object.assign({}, matRecords[i]); //cloning object  
                                if (i == 0) {
                                    if (tempRecord.Welcome_Modal_Name__c !== '' && this.name !== '' && this.name !== 'undefined') {
                                        var title = tempRecord.Welcome_Modal_Name__c;
                                        this.leftTitle = title.replace('<User.FirstName!>', this.name + '!');
                                    }
                                    if (tempRecord.Welcome_Modal_Name__c !== '' && this.name == 'undefined') {
                                        var title = tempRecord.Welcome_Modal_Name__c;
                                        this.leftTitle = title.replace('<User.FirstName!>', '');
                                    }
                                    this.leftDescription = tempRecord.Description__c;
                                    this.leftButtonLabel = tempRecord.Action_Name__c;
                                    this.leftButtonLink = tempRecord.Action_URL__c;
                                    this.leftNonCustomerAgreement = tempRecord.Non_Customers_Agreement__c;
                                } else {
                                    panelRecords.push(tempRecord);
                                }
                            }
                            this.rightPanelRecords = panelRecords;
                        } else {
                            this.welcomeMatActive = false;
                            this.showModal = false;
                        }
                        var currentUrl = window.location.href;
                        // If non-customer user just check the user preference and not in sesssion storage
                        if (this.nonCustomerMat) {
                            if (currentUrl.indexOf(this.communityName) > -1) {
                                if (this.welcomeMatActive) {
                                    this.getUserPreferenceForNonCustomer();
                                } else {
                                    this.showModal = false;
                                    this.checkAdditionalMessagesPopUp();
                                }
                            } else {
                                this.showModal = true;
                            }
                        } else {
                            if (currentUrl.indexOf(this.communityName) > -1) {
                                if (this.welcomeMatActive) {
                                    if (sessionStorage.getItem('firstVisit') === "1") {
                                        this.showModal = false;
                                        this.checkAdditionalMessagesPopUp();
                                    } else if (this.userPreference) {
                                        this.getUserPreferenceStatus();
                                    } else {
                                        this.showModal = true;
                                        sessionStorage.setItem('firstVisit', '1');
                                    }
                                } else {
                                    this.showModal = false;
                                    this.getUserPreferenceStatus();
                                }
                            } else {
                                this.showModal = true;
                            }
                        }
                    }
                    this.isLoading = false;
                }).catch(error => {
                    console.log("Error:", error);
                });
            } else {
                this.isLoading = false;
            }
        }).catch(error => {
            console.log("Error loading user:", error);
        });
    }

    /**
     * Once welcome/trial mat is shown, check for additional messages
     * Event to parent component to display the next notifications pop-up
     */
    checkAdditionalMessagesPopUp() {
        var arrayToPassToParent = [];
        arrayToPassToParent.push({
            userFirstName: this.name
        });
        const welcomeEvent = new CustomEvent("getwelcomematinteraction", {
            detail: arrayToPassToParent
        });
        this.dispatchEvent(welcomeEvent);
    }

    openVideo() {
        if (this.leftButtonLink != '') {
            window.open(this.leftButtonLink, "_blank");
        } else {
            const evt = new ShowToastEvent({
                type: 'Error',
                title: 'Error',
                message: 'No link',
                variant: 'error',
                mode: 'sticky'
            });
            this.dispatchEvent(evt);
        }

    }
    openRightPanelVideos(event) {
        var buttonLink = event.currentTarget.dataset.url;
        window.open(buttonLink, "_blank");
    }

    saveUserPreference(event) {
        //Remove Disabled attribute from button as user agreed to terms
        var flagValue;
        if (this.nonCustomerMat) {
            flagValue = this.template.querySelector('[data-id="dontShowAgainNonCust"]').checked;
            this.agreementButtonStatus = flagValue === true ? false : true;
            this.trialCheckboxDisabledFlag = true;
        } else {
            flagValue = this.template.querySelector('[data-id="dontShowAgain"]').checked;
            this.checkboxDisabledFlag = true;
        }

        saveUserPreference({
            userId: USER_ID,
            welcomeMatFlag: flagValue,
            flagType: this.nonCustomerMat
        }).then(preferenceSavedResult => {
            this.checkboxDisabledFlag = false;
        }).catch(error => {
            console.log("Error:", error);
        });
    }

    getUserPreferenceStatus() {
        getUserPreference({
            userId: USER_ID,
            flagType: this.nonCustomerMat
        }).then(Result => {
            if (!Result) {
                sessionStorage.setItem('firstVisit', '1');
                this.showModal = false;
                this.checkAdditionalMessagesPopUp();
            } else {
                if (sessionStorage.getItem('firstVisit') === "1") {
                    this.showModal = false;
                    this.checkAdditionalMessagesPopUp();
                } else {
                    this.showModal = true;
                    sessionStorage.setItem('firstVisit', '1');
                }
            }
        }).catch(error => {
            console.log("Error:", error);
        });
    }

    getUserPreferenceForNonCustomer() {
        getUserPreference({
            userId: USER_ID,
            flagType: this.nonCustomerMat
        }).then(Result => {
            if (!Result) {
                sessionStorage.setItem('firstVisit', '1');
                this.showModal = false;
                this.checkAdditionalMessagesPopUp();
            } else {
                this.showModal = true;
            }
        }).catch(error => {
            console.log("Error fetching User Preferences: ", error);
        });
    }
}