import {
    LightningElement,
    api,
    track,
} from 'lwc';
import savePreferences from '@salesforce/apex/RecordsFavoriteController.savePreferences';
import getPreferences from '@salesforce/apex/RecordsFavoriteController.getPreferences';

import {
    NavigationMixin
} from 'lightning/navigation';
import favCustomIconCSS from '@salesforce/resourceUrl/favCustomIconCSS';
import { loadStyle } from 'lightning/platformResourceLoader';;

export default class addToFavoriteButton extends NavigationMixin(LightningElement) {
    @api recordId;
    @track showToast = false;
    title = '';
    toastmessage = '';
    iconName = '';
    alternativeText = '';
    toastMsgClasses = '';
    toastMsgIconClasses = '';

    isContactToggleOn = false;
    isAccountToggleOn = false;
    isFundRaisingToggleOn = false;
    is13FToggleOn = false;
    isSearchToggleOn = true;

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

    /**
     * Method is executed when component is instantiated
     * All of the Favorite records are fetched via API call out
     */
    async connectedCallback() {
        Promise.all([
            loadStyle(this, favCustomIconCSS)
        ]);
        await this.getPreferences();
    }

    get searchesUpdatesLeftOptions() {
        return [
            { label: 'Private Credit', value: 'Private Credit' },
            { label: 'Private Equity', value: 'Private Equity' },
            { label: 'Private Real Estate', value: 'Private Real Estate' },
            { label: 'Emerging Manager', value: 'Emerging Manager' },
            { label: 'General', value: 'General' }
        ];
    }

    get searchesUpdatesRightOptions() {
        return [
            { label: 'Fixed Income', value: 'Fixed Income' },
            { label: 'Hedge Fund', value: 'Hedge Fund' },
            { label: 'Equities', value: 'Equities' },
            { label: 'International Equities', value: 'International Equities' }
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
            { label: 'Meeting Materials', value: 'Meeting Materials' },
            { label: 'AUM', value: 'AUM' },
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

    savePreferences() {
        this.isPreferenceLoading = true;
        const preferencesString = this.computePreferences();
        if (preferencesString) {
            savePreferences({
                preferencesString: preferencesString,
                contactUpdatesSelection: this.contactsUpdateValues?.join(';'),
                accountUpdatesSelection: this.accountsUpdateValues?.join(';'),
                searchesUpdatesSelection: this.searchesUpdateValues?.join(';')
            }).then(result => {
                if (result) {
                    this.toastmessage = 'Preferences saved successfully.';
                    this.title = 'success';
                    this.alternativeText = 'success';
                    this.showToast = true;
                    this.iconName = 'utility:success';
                    this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_success';
                    this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-success slds-m-right_small slds-no-flex slds-align-top';
                    setTimeout(() => {
                        this.showToast = false;
                        this.closeNotificationPopup();
                    }, 2000);
                } else {
                    this.toastmessage = 'Error occured while saving the preferences. Please contact your admin.';
                    this.title = 'error';
                    this.alternativeText = 'error';
                    this.showToast = true;
                    this.iconName = 'utility:error';
                    this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                    this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top';
                    this.isPreferenceLoading = false;
                    setTimeout(() => {
                        this.showToast = false;
                    }, 2000);
                }
            }).catch((error) => {
                console.log(error);
                this.toastmessage = 'Error occured while saving the preferences: ' + error;
                this.title = 'error';
                this.alternativeText = 'error';
                this.showToast = true;
                this.iconName = 'utility:error';
                this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top';
                this.isPreferenceLoading = false;
                setTimeout(() => {
                    this.showToast = false;
                }, 2000);
            });
        }
    }

    computePreferences() {
        let preferences = [];
        if (this.isAccountToggleOn) {
            preferences.push('Accounts');
        }
        if (this.is13FToggleOn) {
            preferences.push('13F');
        }
        if (this.isFundRaisingToggleOn) {
            preferences.push('Fundraising_News');
        }
        return preferences?.join(';');
    }

    closeNotificationPopup() {
        this.dispatchEvent(new CustomEvent('closenotificationmodal', { detail: true }));
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
        } else {
            this.leftContactUpdates = this.contactUpdatesLeftOptions?.map(e => e.value);
            this.rightContactUpdates = this.contactUpdatesRightOptions?.map(e => e.value);
            this.contactsUpdateValues = this.leftContactUpdates?.concat(this.rightContactUpdates);
        }
        if (this.isContactToggleOn) {
            this.template.querySelector('[data-id="contact-toggle"]')?.classList?.add('cstm_coloring');
        } else {
            this.template.querySelector('[data-id="contact-toggle"]')?.classList?.remove('cstm_coloring');
        }
    }

    handleAccountToggleClick() {
        this.isAccountToggleOn = !this.isAccountToggleOn;
        const accountToggle = this.template.querySelector('[data-id="account-toggle"]');
        if (!this.isAccountToggleOn) {
            this.leftAccountUpdates = [];
            this.rightAccountUpdates = [];
            this.accountsUpdateValues = [];
            accountToggle?.classList?.remove('cstm_coloring');
        } else {
            this.leftAccountUpdates = this.accountUpdatesLeftOptions?.map(e => e.value);
            this.rightAccountUpdates = this.accountUpdatesRightOptions?.map(e => e.value);
            this.accountsUpdateValues = this.leftAccountUpdates?.concat(this.rightAccountUpdates);
            accountToggle?.classList?.add('cstm_coloring');
        }
    }

    handleSearchToggleClick() {
        this.isSearchToggleOn = !this.isSearchToggleOn;
        if (!this.isSearchToggleOn) {
            this.leftSearchesUpdates = [];
            this.rightSearchesUpdates = [];
            this.searchesUpdateValues = [];
        } else {
            this.leftSearchesUpdates = this.searchesUpdatesLeftOptions?.map(e => e.value);
            this.rightSearchesUpdates = this.searchesUpdatesRightOptions?.map(e => e.value);
            this.searchesUpdateValues = this.leftSearchesUpdates?.concat(this.rightSearchesUpdates);
        }
        if (this.isSearchToggleOn) {
            this.template.querySelector('[data-id="search-toggle"]')?.classList?.add('cstm_coloring');
        } else {
            this.template.querySelector('[data-id="search-toggle"]')?.classList?.remove('cstm_coloring');
        }
    }

    parentSectionClicked(event) {

    }

    stopPropagation(event) {
        event.stopPropagation();
    }

    async getPreferences() {
        this.isPreferenceLoading = true;
        let preferences = await getPreferences();
        const contactPreferences = preferences?.Contact_Updates_Selection__c?.split(';');
        const accountPreferences = preferences?.Account_Updates_Selection__c?.split(';');
        const searchPreferences = preferences?.Search_Updates_Selection__c?.split(';');
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

    closeToast() {
        this.showToast = false;
    }
}