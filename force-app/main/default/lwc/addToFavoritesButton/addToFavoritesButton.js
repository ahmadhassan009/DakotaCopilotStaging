import {
    LightningElement,
    api,
    track,
    wire
} from 'lwc';
import getAllFavoriteRecords from '@salesforce/apex/RecordsFavoriteController.getAllFavoriteRecords';
import addToFavorites from '@salesforce/apex/RecordsFavoriteController.addToFavorites';
import removeFromFavorites from '@salesforce/apex/RecordsFavoriteController.removeFromFavorites';
import savePreferences from '@salesforce/apex/RecordsFavoriteController.savePreferences';
import Allowed_Follow_Record_Count from '@salesforce/label/c.Allowed_Follow_Record_Count';
import userId from '@salesforce/user/Id';
import {
    NavigationMixin
} from 'lightning/navigation';
import { CurrentPageReference } from 'lightning/navigation';
import { fireEvent, registerListener, unregisterAllListeners } from 'c/pubsub';
import communityURL from '@salesforce/label/c.Marketplace_Community_Base_URL';
import favCustomIconCSS from '@salesforce/resourceUrl/favCustomIconCSS';
import { loadStyle } from 'lightning/platformResourceLoader';;
import notificationIconName from "@salesforce/resourceUrl/Notification_Icon";
import getPreferences from '@salesforce/apex/RecordsFavoriteController.getPreferences';

export default class addToFavoriteButton extends NavigationMixin(LightningElement) {
    @api recordId;
    @api isFavIconDisabled;
    @api localStorage;
    @api isAccount;
    @api isGenBusinessAccount;
    @api isContact;
    @api isGenBusinessContact;
    @track displayedFavoriteRecords = [];
    @track allFavoriteRecords = [];
    @track showModal = false;
    @track showToast = false;
    @track themeInfo;
    @wire(CurrentPageReference) pageReference;
    title = '';
    toastmessage = '';
    iconName = '';
    alternativeText = '';
    toastMsgClasses = '';
    toastMsgIconClasses = '';
    addToFav = false;
    favouriteMetroAreaRecords;
    recordsExist = true;
    isFavRecord = false;
    favId = '';
    targetId;
    isDisabled = true;
    isDropDownDisabled = true;
    objectApiName;
    isModalOpen = false;
    isDeleteFavoriteModalOpen = false;
    queryTerm = '';
    showEditFavoritesPopup = false;
    favToBeRemovedId = '';
    favToBeRemovedName = '';
    favToBeRemovedSubtitle = '';
    favoritesExist = false;
    showNoFavoritesExistPopup = false;
    showNoResultsFoundPopup = false;
    favPopUpSpinner = false;
    firstTimeRendered = false;
    favIconTitle = 'Click To Follow';
    rightMargin = 'margin-right:auto;';
    favIconStyling = 'float: left !important; background-color: #f3f2f2; height: 30px !important; border : #919191 1px solid;border-top-left-radius: 4px;border-top-right-radius: 0px;border-bottom-left-radius: 4px;border-bottom-right-radius: 0px;';
    favIconPlacement = ' float: right;z-index: 999;position: relative;margin-top: -103px;margin-right: 130px;min-width: 59px;';
    iconDivClass = 'favIconWidth';
    dropdownMargin = '';
    notificationIconName;
    openNotificationsPopUp = false;
    @track buttonLabel = 'Off';
    @track buttonClass = 'slds-button slds-button_neutral';
    isContactToggleOn = false;
    isAccountToggleOn = false;
    isFundRaisingToggleOn = false;
    is13FToggleOn = false;
    isSearchToggleOn = true;
    isPrivateCreditToggleOn = true;
    isFixedIncomeToggleOn = true;
    isPrivateEquityToggleOn = true;
    isHedgeFundToggleOn = true;
    isPrivateRealEstateToggleOn = true;
    isEquitiesToggleOn = true;
    followingObjPreferences = [];
    maxFollowCount = Allowed_Follow_Record_Count;
    contactsUpdateValues = [];
    rightContactUpdates = [];
    leftContactUpdates = [];

    accountsUpdateValues = [];
    rightAccountUpdates = [];
    leftAccountUpdates = [];

    leftSearchesUpdates = [];
    rightSearchesUpdates = [];
    searchesUpdateValues = [];

    isPreferenceLoading = false;
    @track showEditEmailPreferencesPopup = false;
    accountCollapsed = true;
    contactCollapsed = false;
    searchCollapsed = false;
    isWeeklyToggleOn = false;
    offset = 0;
    @track recordsForUI = [];

    /* Method is executed when component is instantiated
    * All of the Favorite records are fetched via API call out
    */
    connectedCallback() {
        this.notificationIconName = notificationIconName;

        registerListener('updateFavList', this.updateFavList, this);
        Promise.all([
            loadStyle(this, favCustomIconCSS)
        ]);
        this.getAllFavoriteRecordsFromAPI();
        var URL = window.location.href;

        if (this.isFavIconDisabled == true) {
            this.favIconTitle = "This item can't be followed";
            this.favIconStyling = 'float:left !important; border:#D3D3D3 1px solid; border-top-left-radius:4px; border-top-right-radius:0px; border-bottom-left-radius:4px; border-bottom-right-radius:0px; --sds-c-icon-color-foreground-default:#D3D3D3; height:30px !important;';
        }
        if (URL == communityURL) {
            this.iconDivClass = 'favIconWidth favIconPlacementHome'
        }
        if (URL == communityURL + 'marketplace-academy') {
            this.favIconPlacement = 'float:right; z-index:999; position:relative; margin-top:-103px; margin-right:142px; min-width:59px;';
        }
        if (URL.includes(communityURL + 'conference/' + this.recordId)) {
            this.favIconPlacement = 'float:right; z-index:999; position:relative; margin-top:-103px; margin-right:118.5px; min-width:59px;';
        }
        if (URL.includes(communityURL + 'view-accountrelatedcontacts?recordId=' + this.recordId)) {
            this.favIconPlacement = 'float:right; z-index:999; position:relative; margin-top:-103px; margin-right:118.5px; min-width:59px;';
        }
    }

    get searchesUpdatesLeftOptions() {
        return [
            { label: 'Private Credit', value: 'Private Credit' },
            { label: 'Private Equity', value: 'Private Equity' },
            { label: 'Private Real Estate', value: 'Private Real Estate' },
            { label: 'Emerging Manager', value: 'Emerging Manager Searches' },
            // { label: 'DC Consultant', value: 'DC Consultant' },
            // { label: 'General Consultant', value: 'General Consultant' },
            // { label: 'Hedge Funds Consultant', value: 'Hedge Funds Consultant' },
            // { label: 'Private Credit Consultant', value: 'Private Credit Consultant' }
        ];
    }

    get searchesUpdatesRightOptions() {
        return [
            { label: 'Fixed Income', value: 'Fixed Income' },
            { label: 'Hedge Funds', value: 'Hedge Funds' },
            { label: 'Equities', value: 'Equities' },
            { label: 'International Equities', value: 'International Equities' },
            // { label: 'Private Equity Consultant', value: 'Private Equity Consultant' },
            // { label: 'Real Estate Consultant', value: 'Real Estate Consultant' },
            // { label: 'Real Assets Consultant', value: 'Real Assets Consultant' },
            // { label: 'Alternatives Consultant', value: 'Alternatives Consultant' }
        ];
    }

    get contactUpdatesLeftOptions() {
        return [
            { label: 'Job Changes', value: 'Job Changes' },
            { label: 'Role Changes', value: 'Role Changes' },
            { label: 'Email Changes', value: 'Email Changes' }
        ];
    }

    get contactUpdatesRightOptions() {
        return [
            { label: 'Dakota Content', value: 'Dakota Content' },
            { label: 'Field Consultants', value: 'Field Consultants' },
            { label: 'Asset Class Coverage', value: 'Asset Class Coverage' }
        ];
    }

    get accountUpdatesLeftOptions() {
        return [
            { label: 'Public Plan Minutes', value: 'Public Plan Minutes' },
            // { label: 'Meeting Materials', value: 'Meeting Materials' },
            { label: 'AUM', value: 'AUM' },
            { label: 'Custodians', value: 'Custodian' },
            { label: 'Child Accounts', value: 'Child Accounts' },
            { label: 'Fundraising News', value: 'Fundraising News' },
            { label: 'Field Consultants', value: 'Field Consultants' },
            { label: 'Consultants', value: 'Consultants' }
        ];
    }

    get accountUpdatesRightOptions() {
        return [
            { label: 'Investments', value: 'Investments' },
            { label: 'Performance', value: 'Performance' },
            { label: 'New Funds', value: 'New Funds' },
            { label: 'Presentation Deck', value: 'Presentation Deck' },
            { label: 'Contacts', value: 'Contacts' },
            { label: 'Client Base', value: 'Client Base' },
        ];
    }
    async handleNotificationIconClick() {
        if (document?.body?.style) {
            document.body.style.overflowX = 'hidden';
        }
        let totalWidth = window.innerWidth;
        if (totalWidth > 1759) {
            let marginRight = totalWidth - 1760; //The value that needs to be set in right width negative value
            marginRight = (marginRight / 2) + 195;
            this.rightMargin = 'height:' + window.innerHeight + 'px;' + 'right:' + '-' + marginRight.toString() + 'px;';
            this.dropdownMargin = 'right:' + (marginRight.toString() - 45) + 'px;';
        } else {
            this.rightMargin = 'height:' + window.innerHeight + 'px;';
            this.dropdownMargin = '';
        }
        if (this.openNotificationsPopUp) {
            this.openNotificationsPopUp = false;
        } else {
            this.openNotificationsPopUp = true;
            await this.getPreferences();
        }
    }

    async getPreferences() {
        this.isPreferenceLoading = true;
        let preferences = await getPreferences();
        const contactPreferences = preferences?.Contact_Updates_Selection__c?.split(';');
        const accountPreferences = preferences?.Account_Updates_Selection__c?.split(';');
        const searchPreferences = preferences?.Search_Updates_Selection__c?.split(';');
        this.isWeeklyToggleOn = preferences.Only_Weekly_Updates__c;
        if (this.isWeeklyToggleOn) {
            this.template.querySelector('[data-id="weekly-toggle"]')?.classList?.add('cstm_coloring');
        } else {
            this.template.querySelector('[data-id="weekly-toggle"]')?.classList?.remove('cstm_coloring');
        }
        if (contactPreferences?.length > 0) {
            this.leftContactUpdates = [];
            this.rightContactUpdates = [];
            contactPreferences?.forEach((p) => {
                if (this.contactUpdatesLeftOptions?.map(e => e.value)?.includes(p)) {
                    this.leftContactUpdates.push(p);
                } else if (this.contactUpdatesRightOptions?.map(e => e.value)?.includes(p)) {
                    this.rightContactUpdates.push(p);
                }
            });
            this.contactsUpdateValues = contactPreferences;
            this.isContactToggleOn = true;
        } else {
            this.leftContactUpdates = [];
            this.rightContactUpdates = [];
            this.contactsUpdateValues = [];
            this.isContactToggleOn = false;
        }
        if (this.isContactToggleOn) {
            this.template.querySelector('[data-id="contact-toggle"]')?.classList?.add('cstm_coloring');
        } else {
            this.template.querySelector('[data-id="contact-toggle"]')?.classList?.remove('cstm_coloring');
        }
        if (accountPreferences?.length > 0) {
            this.leftAccountUpdates = [];
            this.rightAccountUpdates = [];
            accountPreferences?.forEach((p) => {
                if (this.accountUpdatesLeftOptions?.map(e => e.value)?.includes(p)) {
                    this.leftAccountUpdates.push(p);
                } else if (this.accountUpdatesRightOptions?.map(e => e.value)?.includes(p)) {
                    this.rightAccountUpdates.push(p);
                }
            });
            this.accountsUpdateValues = accountPreferences;
            this.isAccountToggleOn = true;
        } else {
            this.leftAccountUpdates = [];
            this.rightAccountUpdates = [];
            this.accountsUpdateValues = [];
            this.isAccountToggleOn = false;
        }
        if (this.isAccountToggleOn) {
            this.template.querySelector('[data-id="account-toggle"]')?.classList?.add('cstm_coloring');
        } else {
            this.template.querySelector('[data-id="account-toggle"]')?.classList?.remove('cstm_coloring');
        }
        if (searchPreferences?.length > 0) {
            this.leftSearchesUpdates = [];
            this.rightSearchesUpdates = [];
            searchPreferences?.forEach((p) => {
                if (this.searchesUpdatesLeftOptions?.map(e => e.value)?.includes(p)) {
                    this.leftSearchesUpdates.push(p);
                } else if (this.searchesUpdatesRightOptions?.map(e => e.value)?.includes(p)) {
                    this.rightSearchesUpdates.push(p);
                }
            });
            this.searchesUpdateValues = searchPreferences;
            this.isSearchToggleOn = true;
        } else {
            this.leftSearchesUpdates = [];
            this.rightSearchesUpdates = [];
            this.searchesUpdateValues = [];
            this.isSearchToggleOn = false;
        }
        if (this.isSearchToggleOn) {
            this.template.querySelector('[data-id="search-toggle"]')?.classList?.add('cstm_coloring');
        } else {
            this.template.querySelector('[data-id="search-toggle"]')?.classList?.remove('cstm_coloring');
        }
        this.isPreferenceLoading = false;
    }

    savePreferences() {
        this.openNotificationsPopUp = false;
        savePreferences({
            contactUpdatesSelection: this.contactsUpdateValues?.join(';'),
            accountUpdatesSelection: this.accountsUpdateValues?.join(';'),
            searchesUpdatesSelection: this.searchesUpdateValues?.join(';'),
            isWeaklyUpdates: this.isWeeklyToggleOn
        }).then(result => {
            if (result) {
                this.toastmessage = 'Preferences saved successfully.';
                this.title = 'success';
                this.alternativeText = 'success';
                this.showToast = true;
                this.iconName = 'utility:success';
                this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_success';
                this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-success slds-m-right_small slds-no-flex slds-align-top';
            } else {
                this.toastmessage = 'Error occured while saving the preferences. Please contact your admin.';
                this.title = 'error';
                this.alternativeText = 'error';
                this.showToast = true;
                this.iconName = 'utility:error';
                this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top';
            }
            setTimeout(() => {
                this.showToast = false;
            }, 2000);

        }).catch((error) => {
            console.log(error);
            this.toastmessage = 'Error occured while saving the preferences: ' + error;
            this.title = 'error';
            this.alternativeText = 'error';
            this.showToast = true;
            this.iconName = 'utility:error';
            this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
            this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top'
            setTimeout(() => {
                this.showToast = false;
            }, 2000);
        });

    }

    accountChevronButtonClicked() {
        this.accountCollapsed = !this.accountCollapsed;
    }

    contactChevronButtonClicked() {
        this.contactCollapsed = !this.contactCollapsed;
    }

    searchChevronButtonClicked() {
        this.searchCollapsed = !this.searchCollapsed;
    }

closeNotificationPopup() {
    this.openNotificationsPopUp = false;
}

closeNotificationModal() {
    this.openNotificationsPopUp = false;
    this.showEditEmailPreferencesPopup = null;
    this.showEditEmailPreferencesPopup = false;
}

handleContactUpdatesChange(e) {
    if (e.currentTarget.name == 'RightContacts') {
        this.rightContactUpdates = e?.detail?.value;
    } else if (e.currentTarget.name == 'LeftContacts') {
        this.leftContactUpdates = e?.detail?.value;
    }
    this.contactsUpdateValues = this.rightContactUpdates?.concat(this.leftContactUpdates);
    this.isContactToggleOn = (this.contactsUpdateValues?.length > 0);
    if (this.isContactToggleOn) {
        this.template.querySelector('[data-id="contact-toggle"]')?.classList?.add('cstm_coloring');
    } else {
        this.template.querySelector('[data-id="contact-toggle"]')?.classList?.remove('cstm_coloring');
    }
}

handleSearchesUpdateChange(e) {
    if (e.currentTarget.name == 'RightSearches') {
        this.rightSearchesUpdates = e?.detail?.value;
    } else if (e.currentTarget.name == 'LeftSearches') {
        this.leftSearchesUpdates = e?.detail?.value;
    }
    this.searchesUpdateValues = this.rightSearchesUpdates?.concat(this.leftSearchesUpdates);
    this.isSearchToggleOn = (this.searchesUpdateValues?.length > 0);
    if (this.isSearchToggleOn) {
        this.template.querySelector('[data-id="search-toggle"]')?.classList?.add('cstm_coloring');
    } else {
        this.template.querySelector('[data-id="search-toggle"]')?.classList?.remove('cstm_coloring');
    }
}

handleAccountUpdatesChange(e) {
    if (e.currentTarget.name == 'RightAccounts') {
        this.rightAccountUpdates = e?.detail?.value;
    } else if (e.currentTarget.name == 'LeftAccounts') {
        this.leftAccountUpdates = e?.detail?.value;
    }
    this.accountsUpdateValues = this.rightAccountUpdates?.concat(this.leftAccountUpdates);
    this.isAccountToggleOn = (this.accountsUpdateValues?.length > 0);
    if (this.isAccountToggleOn) {
        this.template.querySelector('[data-id="account-toggle"]')?.classList?.add('cstm_coloring');
    } else {
        this.template.querySelector('[data-id="account-toggle"]')?.classList?.remove('cstm_coloring');
    }
}

handleContactToggleClick() {
    this.isContactToggleOn = !this.isContactToggleOn;
    if (!this.isContactToggleOn) {
        this.leftContactUpdates = [];
        this.rightContactUpdates = [];
        this.contactsUpdateValues = [];
        this.template.querySelector('[data-id="contact-toggle"]')?.classList?.remove('cstm_coloring');
    } else {
        this.leftContactUpdates = this.contactUpdatesLeftOptions?.map(e => e.value);
        this.rightContactUpdates = this.contactUpdatesRightOptions?.map(e => e.value);
        this.contactsUpdateValues = this.leftContactUpdates?.concat(this.rightContactUpdates);
        this.template.querySelector('[data-id="contact-toggle"]')?.classList?.add('cstm_coloring');
    }
}

handleAccountToggleClick() {
    this.isAccountToggleOn = !this.isAccountToggleOn;
    if (!this.isAccountToggleOn) {
        this.leftAccountUpdates = [];
        this.rightAccountUpdates = [];
        this.accountsUpdateValues = [];
        this.template.querySelector('[data-id="account-toggle"]')?.classList?.remove('cstm_coloring');
    } else {
        this.leftAccountUpdates = this.accountUpdatesLeftOptions?.map(e => e.value);
        this.rightAccountUpdates = this.accountUpdatesRightOptions?.map(e => e.value);
        this.accountsUpdateValues = this.leftAccountUpdates?.concat(this.rightAccountUpdates);
        this.template.querySelector('[data-id="account-toggle"]')?.classList?.add('cstm_coloring');
    }
}

handleSearchToggleClick() {
    this.isSearchToggleOn = !this.isSearchToggleOn;
    if (!this.isSearchToggleOn) {
        this.leftSearchesUpdates = [];
        this.rightSearchesUpdates = [];
        this.searchesUpdateValues = [];
        this.template.querySelector('[data-id="search-toggle"]')?.classList?.remove('cstm_coloring');
    } else {
        this.leftSearchesUpdates = this.searchesUpdatesLeftOptions?.map(e => e.value);
        this.rightSearchesUpdates = this.searchesUpdatesRightOptions?.map(e => e.value);
        this.searchesUpdateValues = this.leftSearchesUpdates?.concat(this.rightSearchesUpdates);
        this.template.querySelector('[data-id="search-toggle"]')?.classList?.add('cstm_coloring');
    }
}

handleWeeklyToggleClick() {
    this.isWeeklyToggleOn = !this.isWeeklyToggleOn;
    const weeklyToggleElement = this.template.querySelector('[data-id="weekly-toggle"]');
    if (!this.isWeeklyToggleOn) {
        weeklyToggleElement?.classList?.remove('cstm_coloring');
    } else {
        weeklyToggleElement?.classList?.add('cstm_coloring');
    }
}

handlePreferencesClick(e) {
    this.openNotificationsPopUp = false;
    this.showEditEmailPreferencesPopup = true;
}

updateFavList(objPayLoad) {
    this.getAllFavoriteRecordsFromAPI();
}
/**
 * Method is executed when component is rendered
 * Adding different styling class if component is loaded on Account/Contact detail page
 */
renderedCallback() {
    var URL = window.location.href;
    if (!this.firstTimeRendered) {
        if (this.recordId != null && this.recordId != undefined && !URL.includes(communityURL + 'conference/' + this.recordId) && !URL.includes(communityURL + 'view-accountrelatedcontacts?recordId=' + this.recordId) && ((this.isAccount && !this.isGenBusinessAccount) || (this.isContact && !this.isGenBusinessContact))) {
            this.favIconPlacement = 'float: right;z-index: 999;position: relative;margin-top: -103px;margin-right: 130px;min-width: 70px;';
            this.firstTimeRendered = true;
        }
        if (this.recordId != null && this.recordId != undefined && URL.includes(communityURL + 'conference/' + this.recordId)) {
            this.favIconPlacement = 'float: right;z-index: 999;position: relative;margin-top: -103px;margin-right: 118.5px;min-width: 70px;';
            this.firstTimeRendered = true;
        }
        if (this.recordId != null && this.recordId != undefined && URL.includes(communityURL + 'view-accountrelatedcontacts?recordId=' + this.recordId)) {
            this.favIconPlacement = 'float: right;z-index: 999;position: relative;margin-top: -103px;margin-right: 118.5px;min-width: 70px;';
            this.firstTimeRendered = true;
        }
    }
}

parentSectionClicked(event) {
    if (this.isModalOpen) {
        this.isModalOpen = false;
    }
    if (this.showNoFavoritesExistPopup) {
        this.showNoFavoritesExistPopup = false;
    }
    if (this.openNotificationsPopUp) {
        this.openNotificationsPopUp = false;
    }
    this.recordsForUI = [];
    this.offset = 0;
    if (document?.body?.style) {
        document.body.style.overflowX = '';
    }
}

stopPropagation(event) {
    event.stopPropagation();
}

/**
 * This method is called from connected callback or when a new record is marked as favorite
 * This method calls apex method to fetch all favorite records via REST UI API call
 * It also checks if the current record is a favorite record or not
 */
getAllFavoriteRecordsFromAPI() {
    if (this.recordId == null || this.recordId == undefined) {
        this.getListViewId();
    } else {
        this.targetId = this.recordId;
    }

    getAllFavoriteRecords({}).then(returnedfavouriteRecords => {

        if (returnedfavouriteRecords != null && returnedfavouriteRecords.length > 0) {
            let checkIfFav = false;
            let favTargetId = this.targetId;
            if (this.targetId == 'Recent') {
                favTargetId = this.objectApiName;
            }
            for (var i = 0; i < returnedfavouriteRecords.length; i++) {

                returnedfavouriteRecords[i].Icon_Color__c = 'background-color:#' + returnedfavouriteRecords[i].Icon_Color__c;
                if (returnedfavouriteRecords[i].Subtitle__c == 'Accounts') {
                    returnedfavouriteRecords[i].Subtitle__c = 'Account List';
                } else if (returnedfavouriteRecords[i].Subtitle__c == 'Contacts') {
                    returnedfavouriteRecords[i].Subtitle__c = 'Contact List';
                } else if (returnedfavouriteRecords[i].Subtitle__c == 'Updates') {
                    returnedfavouriteRecords[i].Subtitle__c = 'Updates List';
                } else if (returnedfavouriteRecords[i].Subtitle__c == 'Marketplace Searchs') {
                    returnedfavouriteRecords[i].Subtitle__c = 'Marketplace Searches List';
                } else if (returnedfavouriteRecords[i].Subtitle__c == 'Investments') {
                    returnedfavouriteRecords[i].Subtitle__c = 'Investments List';
                } else if (returnedfavouriteRecords[i].Subtitle__c == 'University Alumnis') {
                    returnedfavouriteRecords[i].Subtitle__c = 'University Alumni List';
                } else if (returnedfavouriteRecords[i].Subtitle__c == 'Form D Filings') {
                    returnedfavouriteRecords[i].Subtitle__c = 'Form D Filing List';
                }

                if (returnedfavouriteRecords[i].Target_Id__c == favTargetId) {
                    this.isFavRecord = true;
                    this.favId = returnedfavouriteRecords[i].Target_Id__c;
                    checkIfFav = true;
                }
            }

            if (checkIfFav == false) {
                this.isFavRecord = false;
                this.favId = '';
            }
            this.displayedFavoriteRecords = returnedfavouriteRecords;
            this.allFavoriteRecords = this.displayedFavoriteRecords;
            this.favoritesExist = true;
            this.showNoResultsFoundPopup = false;
        } else if (returnedfavouriteRecords?.length == 0 && (this.isFavRecord && this.favId)) {
            this.displayedFavoriteRecords = [];
            this.allFavoriteRecords = [];
            this.showNoResultsFoundPopup = true;
            this.favoritesExist = false;
            this.isFavRecord = false;
            this.favId = '';
        } else if (returnedfavouriteRecords?.length == 0) {
            this.displayedFavoriteRecords = [];
            this.allFavoriteRecords = [];
            this.showNoResultsFoundPopup = true;
            this.favoritesExist = false;
            this.isFavRecord = false;
            this.favId = '';
        }
        if (this.isFavIconDisabled == true) {
            this.isDisabled = true;
            this.isDropDownDisabled = false;
        } else {
            this.isDisabled = false;
            this.isDropDownDisabled = false;
        }

    }).catch((error) => {
        if (this.isFavIconDisabled == true) {
            this.isDisabled = true;
            this.isDropDownDisabled = false;
        } else {
            this.isDisabled = false;
            this.isDropDownDisabled = false;
        }
        console.log('Error ', error);

        //Custom toast message
        this.toastmessage = 'Error fetching followed record.Contact your administrator for help. ';
        this.title = 'error';
        this.alternativeText = 'error';
        this.iconName = 'utility:error';
        this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
        this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top';
        setTimeout(() => {
            this.showToast = false;
        }, 2000);
    });
}

/**
 * An API/Public method which is called from head script when URL changes(list veiw changes)
 * Gets the current list view Id from URL/local storage and check if this list view is already a favorite or not
 */
@api
changeInURL() {
    this.isDisabled = true;
    this.isDropDownDisabled = true;
    this.getListViewId();
    this.checkForFavorite();
}

@api
setNotificationButtonStyling(right) {
    const marginRight = `${right ? right + 36 : 36}px !important`;
    this.favIconPlacement = `float: right;z-index: 999;position: relative;margin-top: -103px;margin-right: ${marginRight};min-width: 59px;display: block !important`;
}

/**
 * DSC-1283 Issue#1
 * An API/Public method which is called from head script when URL changes to Contacts view all list view from Metro Area
 * Mark the Contacts view all list view as not fav 
 */
@api
markContactsViewAllListViewAsNotFavourite() {
    this.isFavRecord = false;
}

/**
 * Method is called from URL change method or when records are fetched from API call
 * Get currently loaded list view Id for Account,Contact,Marketplace Searches,Investments list view
 * Either the Id is extracted from the URL or Id is fetched from the local storage 
 */
getListViewId() {
    var URL = window.location.href;
    //Account List View
    if (URL.includes('account/Account/')) {
        this.objectApiName = 'Account';
        //Get list view Id from local storage
        if (URL.endsWith('account/Account/Default')) {
            this.setTargetIdForDefaultListView('Account');
        } else if (URL.includes('?Account-filterId=')) {
            let queryParametrs = URL.split('?')[1];
            let listViewId = queryParametrs.split('=')[1];
            this.targetId = listViewId;
        } else if (URL.includes('/s/account/Account') && !URL.includes('?Account-filterId=')) {
            let urlTokens = URL.split('/');
            this.targetId = urlTokens[urlTokens.length - 1];
        }
    }

    //Contact List View
    else if (URL.includes('contact/Contact/')) {
        this.objectApiName = 'Contact';
        //Get list view Id from local storage
        if (URL.endsWith('contact/Contact/Default')) {
            this.setTargetIdForDefaultListView('Contact');
        } else if (URL.includes('?Contact-filterId=')) {
            let queryParametrs = URL.split('?')[1];
            let listViewId = queryParametrs.split('=')[1];
            this.targetId = listViewId;
        } else if (URL.includes('/s/contact/Contact') && !URL.includes('?Contact-filterId=')) {
            let urlTokens = URL.split('/');
            this.targetId = urlTokens[urlTokens.length - 1];
        }
    }

    //Marketplace Searches List View
    else if (URL.includes('marketplace-searches/Marketplace_Searches__c/')) {
        this.objectApiName = 'Marketplace_Searches__c';
        //Get list view Id from local storage
        if (URL.endsWith('marketplace-searches/Marketplace_Searches__c/Default')) {
            this.setTargetIdForDefaultListView('Marketplace_Searches__c');
        } else if (URL.includes('?Marketplace_Searches__c-filterId=')) {
            let queryParametrs = URL.split('?')[1];
            let listViewId = queryParametrs.split('=')[1];
            this.targetId = listViewId;
        } else if (URL.includes('/s/marketplace-searches/Marketplace_Searches__') && !URL.includes('?Marketplace_Searches__c-filterId=')) {
            let urlTokens = URL.split('/');
            this.targetId = urlTokens[urlTokens.length - 1];
        }
    }

    //Investments List View
    else if (URL.includes('investment/Investment__c/')) {
        this.objectApiName = 'Investment__c';
        //Get list view Id from local storage
        if (URL.endsWith('investment/Investment__c/Default')) {
            this.setTargetIdForDefaultListView('Investment__c');
        } else if (URL.includes('?Investment__c-filterId=')) {
            let queryParametrs = URL.split('?')[1];
            let listViewId = queryParametrs.split('=')[1];
            this.targetId = listViewId;
        } else if (URL.includes('/s/investment/Investment__c') && !URL.includes('?Investment__c-filterId=')) {
            let urlTokens = URL.split('/');
            this.targetId = urlTokens[urlTokens.length - 1];
        }
    }

    //Updates List View
    else if (URL.includes('update/Update__c/')) {
        this.objectApiName = 'Update__c';
        //Get list view Id from local storage
        if (URL.includes('Default?Update__c-filterId=') || URL.includes('Update__c-filterId')) {
            let queryParametrs = URL.split('?')[1];
            let listViewId = queryParametrs.split('=')[1];
            this.targetId = listViewId;
        } else {
            let urlTokens = URL.split('/');
            this.targetId = urlTokens[urlTokens.length - 1];
        }
    }

    else if (URL.includes('university-alumni/University_Alumni__c/')) {
        this.objectApiName = 'University_Alumni__c';
        //Get list view Id from local storage
        if (URL.endsWith('university-alumni/University_Alumni__c/Default')) {
            this.setTargetIdForDefaultListView('University_Alumni__c');
        } else if (URL.includes('?University_Alumni__c-filterId=')) {
            let queryParametrs = URL.split('?')[1];
            let listViewId = queryParametrs.split('=')[1];
            this.targetId = listViewId;
        } else if (URL.includes('/s/university-alumni/University_Alumni__') && !URL.includes('?University_Alumni__c-filterId=')) {
            let urlTokens = URL.split('/');
            this.targetId = urlTokens[urlTokens.length - 1];
        }
    }
    else if (URL.includes('form-d-offering/Form_D_Offering__c/')) { 
        this.objectApiName = 'Form_D_Offering__c';
        //Get list view Id from local storage
        if (URL.endsWith('form-d-offering/Form_D_Offering__c/Default')) {
            this.setTargetIdForDefaultListView('Form_D_Offering__c');
        } else if (URL.includes('?Form_D_Offering__c-filterId=')) {
            let queryParametrs = URL.split('?')[1];
            let listViewId = queryParametrs.split('=')[1];
            this.targetId = listViewId;
        } else if (URL.includes('/s/form-d-offering/Form_D_Offering__') && !URL.includes('?Form_D_Offering__c-filterId=')) {
            let urlTokens = URL.split('/');
            this.targetId = urlTokens[urlTokens.length - 1];
        }
    }
}

/**
 * In case of default list view this method is called as Id is not present in the URL
 * This method gets Id from local storage and store in targetId
 * @param {*} objectName Name of the object whose list view is loaded
 */
setTargetIdForDefaultListView(objectName) {
    let allLocalStorage = [];
    allLocalStorage = JSON.parse(this.localStorage);
    if (allLocalStorage != [] && allLocalStorage != undefined && allLocalStorage['objectHomeStateManager'] != null &&
        allLocalStorage['objectHomeStateManager'] != undefined) {
        let pinnedListViews = [];
        pinnedListViews = allLocalStorage['objectHomeStateManager'];

        if (pinnedListViews != null && pinnedListViews != '') {
            let listViewId;
            var listViewName = 'PinnedListView_' + userId + '_' + objectName;
            if (JSON.parse(pinnedListViews)[listViewName] != undefined) {
                listViewId = JSON.parse(pinnedListViews)[listViewName]['state']['listViewId'];
                this.targetId = listViewId;
            }
        }
    }
}

/**
 * This method is called where it is required to check if current record is favorite or not
 * It checks if the current record is a favorite or not and set the icon color accordingly
 */
checkForFavorite() {
    let checkIfFav = false;
    let favTargetId = this.targetId;
    if (this.targetId == 'Recent') {
        favTargetId = this.objectApiName;
    }

    for (var i = 0; i < this.allFavoriteRecords.length; i++) {
        if (this.allFavoriteRecords[i].Target_Id__c == favTargetId) {
            this.isFavRecord = true;
            this.favId = this.allFavoriteRecords[i].id;
            checkIfFav = true;
            break;
        }
    }

    if (checkIfFav == false) {
        this.isFavRecord = false;
        this.favId = '';
    }
    if (this.isFavIconDisabled == true) {
        this.isDisabled = true;
        this.isDropDownDisabled = false;
    } else {
        this.isDisabled = false;
        this.isDropDownDisabled = false;
    }
}

/**
 * This method is called when favorite icon is clicked from the front end
 * If the record was not a favorite, then API call is made via Apex method to create favorite entry and icon color is changed
 * Id the record is already favorite, then API call is made via Apex method to remove favorite entry and icon color is changed
 */
handleFavIconClick() {
    this.isDisabled = true;
    if (this.isModalOpen == true) {
        this.isModalOpen = false;
    }

    //Marking record as favorite
    if (this.isFavRecord == false && this.favId == '') {
        if (this.allFavoriteRecords.length >= Number(this.maxFollowCount)) {
            //Custom toast message
            this.toastmessage = 'You cannot follow more than '+this.maxFollowCount+' records.';
            this.title = 'error';
            this.alternativeText = 'error';
            this.showToast = true;
            this.iconName = 'utility:error';
            this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
            this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top'
            setTimeout(() => {
                this.showToast = false;
            }, 2000);
            this.isDisabled = false;
        } else {
            this.isFavRecord = true;
            let favTargetType = 'Record';
            let favTargetId = this.targetId;
            if (this.recordId == null || this.recordId == undefined) {
                favTargetType = 'ListView';
                if (this.targetId == 'Recent') {
                    favTargetId = this.objectApiName;
                }
            }

            addToFavorites({
                recordId: favTargetId,
                targetType: favTargetType
            }).then((createdFavouriteRecord) => {
                if (createdFavouriteRecord) {
                    if (this.favoritesExist == false) {
                        this.favoritesExist = true;
                        this.showNoFavoritesExistPopup = false;
                    }
                    this.getAllFavoriteRecordsFromAPI();
                    this.favId = createdFavouriteRecord.id;

                    //Custom toast  message
                    this.toastmessage = 'Successfully Followed.';
                    this.title = 'success';
                    this.alternativeText = 'success';
                    this.showToast = true;
                    this.iconName = 'utility:success';
                    this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_success';
                    this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-success slds-m-right_small slds-no-flex slds-align-top'
                    fireEvent(this.objPageReference, 'updateButtonState', '');
                    setTimeout(() => {
                        this.showToast = false;
                    }, 2000);
                }
            }).catch((error) => {
                this.isFavRecord = false;
                if (error && error.body && error.body.message && error.body.message.includes("Already added in the followed list")) {
                    this.toastmessage = 'Already following this record. Please refresh your page.';
                    this.title = 'info';
                    this.alternativeText = 'info';
                    this.showToast = true;
                    this.iconName = 'utility:info';
                    this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_info';
                    this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-info slds-m-right_small slds-no-flex slds-align-top'
                    setTimeout(() => {
                        this.showToast = false;
                    }, 2000);
                }
                else {
                    //Custom toast message
                    this.toastmessage = 'Cannot add this record to Followed items. Contact your administrator for help.';
                    this.title = 'error';
                    this.alternativeText = 'error';
                    this.showToast = true;
                    this.iconName = 'utility:error';
                    this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                    this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top'
                    setTimeout(() => {
                        this.showToast = false;
                    }, 2000);
                }

                if (this.isFavIconDisabled == true) {
                    this.isDisabled = true;
                    this.isDropDownDisabled = false;
                } else {
                    this.isDisabled = false;
                    this.isDropDownDisabled = false;
                }
            });

        }
    }

    //Removing record from favorite
    else if (this.isFavRecord == true && this.favId != '') {
        this.isFavRecord = false;
        removeFromFavorites({
            favId: (this.targetId == 'Recent') ? this.objectApiName : this.targetId
        }).then(() => {
            this.favToBeRemovedId = (this.targetId == 'Recent') ? this.objectApiName : this.targetId
            this.helperToRemoveDeletedRecordFromArrays();
            this.favId = '';
            this.favToBeRemovedId = '';

            if (this.allFavoriteRecords.length == 0 && this.displayedFavoriteRecords.length == 0) {
                this.favoritesExist = false;
            }

            //Custom toast message
            this.toastmessage = 'Successfully Unfollowed.';
            this.title = 'info';
            this.alternativeText = 'info';
            this.showToast = true;
            this.iconName = 'utility:info';
            this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_info';
            this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-info slds-m-right_small slds-no-flex slds-align-top'
            setTimeout(() => {
                this.showToast = false;
            }, 2000);
            fireEvent(this.objPageReference, 'updateButtonState', '');
            if (this.isFavIconDisabled == true) {
                this.isDisabled = true;
                this.isDropDownDisabled = false;
            } else {
                this.isDisabled = false;
                this.isDropDownDisabled = false;
            }
        }).catch((error) => {
            console.log('Error ', error);
            this.isFavRecord = true;
            //Custom toast message
            this.toastmessage = 'Cannot remove this record from Followed items. Contact your administrator for help. ';
            this.title = 'error';
            this.alternativeText = 'error';
            this.showToast = true;
            this.iconName = 'utility:error';
            this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
            this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top'
            setTimeout(() => {
                this.showToast = false;
            }, 2000);

            if (this.isFavIconDisabled == true) {
                this.isDisabled = true;
                this.isDropDownDisabled = false;
            } else {
                this.isDisabled = false;
                this.isDropDownDisabled = false;
            }
        });
    }
}

/**
 * This method is called when dropdown icon is clicked
 * It displays the favorite records if present otherwise shows appropiate message
 */
handleDropDown() {
    this.displayedFavoriteRecords = [];
    this.showNoResultsFoundPopup = false;
    this.favPopUpSpinner = true;
    if (this.favoritesExist) {
        this.isModalOpen = !this.isModalOpen;
    } else {
        this.showNoFavoritesExistPopup = !this.showNoFavoritesExistPopup;
    }
    let totalWidth = window.innerWidth;
    if (totalWidth > 1759) {
        let marginRight = totalWidth - 1760; //The value that needs to be set in right width negative value
        marginRight = (marginRight / 2) + 195;
        this.rightMargin = 'height:' + window.innerHeight + 'px;' + 'right:' + '-' + marginRight.toString() + 'px;';
        this.dropdownMargin = 'right:' + marginRight.toString() + 'px;';
    } else {
        this.rightMargin = 'height:' + window.innerHeight + 'px;';
        this.dropdownMargin = '';
    }
    if (this.isModalOpen) {
            if (this.displayedFavoriteRecords.length < this.allFavoriteRecords.length) {
                this.displayedFavoriteRecords = this.allFavoriteRecords;
            }
    } else {
        if (this.displayedFavoriteRecords.length < this.allFavoriteRecords.length) {
            this.displayedFavoriteRecords = this.allFavoriteRecords;
        }
    }
    if (document?.body?.style) {
        document.body.style.overflowX = 'hidden';
    }
    const arrayForDropDown = JSON.parse(JSON.stringify(this.displayedFavoriteRecords));
    this.recordsForUI = arrayForDropDown?.splice(this.offset, 100);
    this.offset = this.offset + 100;
    this.favPopUpSpinner = false;
}

onScroll(event) {
    const scrollY = event?.target?.scrollHeight - event?.target?.scrollTop;
    const height = event?.target?.offsetHeight;
    const offset = height - scrollY;
    if ((-1 <= offset && offset <= 1) && (this.offset < this.displayedFavoriteRecords?.length) && (this.recordsForUI?.length < this.displayedFavoriteRecords?.length)) {
        this.favPopUpSpinner = true;
        setTimeout(() => {
            const arrayForDropDown = JSON.parse(JSON.stringify(this.displayedFavoriteRecords));
            this.recordsForUI = this.recordsForUI.concat(arrayForDropDown?.splice(this.offset, 100));
            this.offset = this.offset + 100;
            this.favPopUpSpinner = false;            
        }, 200);
    }
}

/**
 * This method is called when any favorite record is click in the dropdown
 * It opens that clicked record/listview in a new tab
 * @param {*} event Click Event
 */
navigateToRecord(event) {
    event.stopPropagation();
    var currentRecordId = event.currentTarget.dataset.id;
    var currentObjectAPIName = '';
    var currentTargetType = '';
    var currentFilterName = '';

    for (var i = 0; i < this.displayedFavoriteRecords.length; i++) {
        if (currentRecordId == this.displayedFavoriteRecords[i].Target_Id__c) {
            currentObjectAPIName = this.displayedFavoriteRecords[i].Object_Name__c;
            currentTargetType = this.displayedFavoriteRecords[i].Target_Type__c;
            if (currentTargetType == 'ListView') {
                this.displayedFavoriteRecords[i].Follow_Record_Name__c == 'Recently Viewed' ?
                    currentFilterName = 'Recent' : currentFilterName = this.displayedFavoriteRecords[i].Target_Id__c;
            }
            break;
        }
    }

    //Redirecting to record
    if (currentTargetType == 'Record') {
        this[NavigationMixin.GenerateUrl]({
            type: 'standard__recordPage',
            attributes: {
                recordId: currentRecordId,
                objectApiName: currentObjectAPIName,
                actionName: 'view'
            }
        }).then(url => {
            window.open(url)
        });
    }

    //Redirecting to list views
    else if (currentTargetType == 'ListView') {
        var objectApiNameStartsWithSmall = currentObjectAPIName.charAt(0).toLowerCase() + currentObjectAPIName.slice(1);
        if (objectApiNameStartsWithSmall.includes('__c', objectApiNameStartsWithSmall.length - 3)) {
            objectApiNameStartsWithSmall = objectApiNameStartsWithSmall.slice(0, -3);
        }
        if (objectApiNameStartsWithSmall.includes('_S') == true) {
            objectApiNameStartsWithSmall = objectApiNameStartsWithSmall.replace('_S', '-s');
        }
        if (objectApiNameStartsWithSmall.includes('_A') == true) {
            objectApiNameStartsWithSmall = objectApiNameStartsWithSmall.replace('_A', '-a');
        }
        if (objectApiNameStartsWithSmall.includes('form_D_Offering') == true) {
            objectApiNameStartsWithSmall = objectApiNameStartsWithSmall.replace('form_D_Offering', 'form-d-offering');
        }
        window.open(communityURL + objectApiNameStartsWithSmall + '/' + currentObjectAPIName + '/Default' + '?' + currentObjectAPIName + '-filterId=' + currentFilterName, '_self');
    }
}

/**
 * This method is called when Edit Favorites link is clicked in the dropdown
 * It opens all the favorite records in a pop up
 */
handleEditFavorites() {
    if (document?.body?.style) {
        document.body.style.overflowX = '';
    }
    this.offset = 0;
    this.displayedFavoriteRecords = [];
    this.recordsForUI = [];
    this.isModalOpen = false;
    this.showEditFavoritesPopup = true;
    this.showNoResultsFoundPopup = false;
    this.favPopUpSpinner = true;
    if (this.displayedFavoriteRecords.length < this.allFavoriteRecords.length) {
        this.displayedFavoriteRecords = this.allFavoriteRecords;
    }
    const arrayForDropDown = JSON.parse(JSON.stringify(this.displayedFavoriteRecords));
    this.recordsForUI = this.recordsForUI.concat(arrayForDropDown?.splice(this.offset, 100));
    this.offset = this.offset + 100;
    this.favPopUpSpinner = false;
}

/**
 * This method is called when any text is added in the searh box
 * It filters the favorite records based on the search term
 * @param {*} event OnChange Event
 */
handleSearch(event) {
    this.favPopUpSpinner = true;
    this.recordsForUI = [];
    this.queryTerm = event.target.value.trim();
    const isBackspaceKey = event.keyCode === 8;
    let searchedKeyWordList = [];

    if (isBackspaceKey) {
        if (this.allFavoriteRecords.length > 0) {
            this.displayedFavoriteRecords = this.allFavoriteRecords;
        }
    }
    if (this.queryTerm != '') {
        searchedKeyWordList = JSON.parse(JSON.stringify(this.displayedFavoriteRecords))?.filter(a => a.Follow_Record_Name__c?.toLowerCase()?.includes(this.queryTerm?.toLowerCase())) || [];
        if (searchedKeyWordList.length < 1 && this.displayedFavoriteRecords.length > 0) {
            this.showNoResultsFoundPopup = true;
        }
        if (searchedKeyWordList.length > 0) {
            this.showNoResultsFoundPopup = false;
            this.displayedFavoriteRecords = searchedKeyWordList;
        }
    } else {
        this.displayedFavoriteRecords = this.allFavoriteRecords;
        this.showNoResultsFoundPopup = false;
    }
    let arrayForDropDown = JSON.parse(JSON.stringify(this.displayedFavoriteRecords));
    this.recordsForUI = this.recordsForUI.concat(arrayForDropDown?.splice(0, 100));
    this.offset = 100;
    this.favPopUpSpinner = false;
}

/**
 * This method is called when either Done button is pressed or cross icon is clicked
 * It closes the Edit favorite popup
 */
closePopup() {
    this.recordsForUI = [];
    this.offset = 0;
    this.showEditFavoritesPopup = false;
    if (document?.body?.style) {
        document.body.style.overflowX = '';
    }
}

/**
 * This method is called when click on cross icon on edit favorites popup
 * It shows another popup to user in order to confirm the deletion
 * @param {*} event Click Event
 */
openDeleteFavoriteModal(event) {
    this.favToBeRemovedId = event.target.dataset.id;
    this.favToBeRemovedName = event.target.dataset.name;
    this.favToBeRemovedSubtitle = event.target.dataset.subtitle;
    this.isDeleteFavoriteModalOpen = true;
    this.template.querySelector('.slds-backdrop').classList.add('greyBackground');
}

/**
 * This method is called when user cancels the deletion operation
 * It closes the delete confirmation pop up
 */
closeDeleteFavoriteModal() {
    this.isDeleteFavoriteModalOpen = false;
    this.template.querySelector('.slds-backdrop').classList.remove('greyBackground');
}

/**
 * This method is called when user confirms the deletion operation
 * It makes an API callout via apex method to remove record from favorite
 * It also check different scenario like if the deleted record was the last record etc.
 */
removeFromFavoritesList() {
    this.favPopUpSpinner = true;
    this.template.querySelector('.slds-backdrop').classList.remove('greyBackground');
    this.isDeleteFavoriteModalOpen = false;
    if (this.favToBeRemovedId != '') {
        removeFromFavorites({
            favId: this.favToBeRemovedId
        }).then(() => {
            this.helperToRemoveDeletedRecordFromArrays();
            if (this.allFavoriteRecords.length == 0 && this.displayedFavoriteRecords.length == 0) {
                this.favoritesExist = false;
                this.showEditFavoritesPopup = false;
            } else if (this.displayedFavoriteRecords.length == 0 && this.allFavoriteRecords.length > 0) {
                this.showNoResultsFoundPopup = true;
            }
            if (this.favId == this.favToBeRemovedId) {
                this.favId = '';
                this.isFavRecord = false;
            }

            //Custom toast message
            this.toastmessage = 'Successfully Unfollowed.';
            this.title = 'info';
            this.alternativeText = 'info';
            this.showToast = true;
            this.iconName = 'utility:info';
            this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_info';
            this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-info slds-m-right_small slds-no-flex slds-align-top'
            setTimeout(() => {
                this.showToast = false;
            }, 2000);

            if (this.favToBeRemovedSubtitle == "Metro Area") {
                fireEvent(this.objPageReference, 'updateMetroAreaList', this.favToBeRemovedId);
            }
            else if (this.favToBeRemovedSubtitle == 'Contact') {
                fireEvent(this.objPageReference, 'updateContactList', this.favToBeRemovedId);
            }
            else if (this.favToBeRemovedSubtitle == 'Account') {
                fireEvent(this.objPageReference, 'updateAccountList', this.favToBeRemovedId);
            }
            fireEvent(this.objPageReference, 'updateButtonState', '');
            this.favToBeRemovedSubtitle = '';
            this.favToBeRemovedId = '';
            this.favToBeRemovedName = '';
            this.favPopUpSpinner = false;

        }).catch((error) => {
            console.log('Error ', error);
            this.isFavRecord = true;
            this.favPopUpSpinner = false;

            //Custom toast message
            this.toastmessage = 'Cannot remove this record from Followed items. Contact your administrator for help. ';
            this.title = 'error';
            this.alternativeText = 'error';
            this.showToast = true;
            this.iconName = 'utility:error';
            this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
            this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top'
            setTimeout(() => {
                this.showToast = false;
            }, 2000);
        });
    }
}

/**
 * This is a helper method and it is called from different methods
 * It removes the deleted favorite record from JS arrays
 */
helperToRemoveDeletedRecordFromArrays() {
    this.allFavoriteRecords.forEach((element, index) => {
        if (element.Target_Id__c == this.favToBeRemovedId) {
            this.allFavoriteRecords.splice(index, 1);
            return;
        }
    });

    this.displayedFavoriteRecords.forEach((element, index) => {
        if (element.Target_Id__c == this.favToBeRemovedId) {
            this.displayedFavoriteRecords.splice(index, 1);
            return;
        }
    });
    this.recordsForUI.forEach((element, index) => {
        if (element.Target_Id__c == this.favToBeRemovedId) {
            this.recordsForUI.splice(index, 1);
            return;
        }
    });
}

closeToast() {
    this.showToast = false;
}

disconnectedCallback() {
    unregisterAllListeners(this);
}
}