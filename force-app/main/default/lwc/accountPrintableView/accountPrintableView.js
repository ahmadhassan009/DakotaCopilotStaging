import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import lastOddChildCSS from '@salesforce/resourceUrl/AccountPrintViewCSS';
import { loadStyle } from 'lightning/platformResourceLoader';
import getRelatedContactRecords from '@salesforce/apex/AccountPrintableViewController.getRelatedContactRecords';
import getAccountName from '@salesforce/apex/ContactRelatedToAccountController.getAccountName';
import getAccountRecordDetails from '@salesforce/apex/AccountPrintableViewController.getAccountRecordDetails';
import CURRENCY from '@salesforce/i18n/currency';
import LOCALE from '@salesforce/i18n/locale';

export default class AccountPrintableView extends NavigationMixin(LightningElement) {
    @api recordId;
    data = [];
    relatedContactsRecords = [];
    recordName = '';
    isLoading = true;
    recordsExist = false;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    contactsExists = false;
    contactsNotExists = false;
    BillingAddress = '';
    wordBreakProperty = "word-break: unset;";
    async connectedCallback() {
        Promise.all([
            loadStyle(this, lastOddChildCSS)
        ]);

        getAccountName({
            recordId: this.recordId
        }).then(returnedAccount => {
            if (returnedAccount != null) {
                document.title = 'Print: ' + returnedAccount.Name;
                this.recordName = returnedAccount.Name;
            }
        });

        getAccountRecordDetails({
            recordId: this.recordId
        }).then(returnedAccount => {
            if (returnedAccount != null) {
                this.recordsExist = true;
                for (let key in returnedAccount) {
                    if (returnedAccount[key] != null && key != 'Id' && key != 'MetroArea__r') {
                        if (key === 'BillingAddress') {
                            let addr = '';
                            if (returnedAccount.BillingAddress['street'] != null && returnedAccount.BillingAddress['street'] != undefined) {

                                addr = addr + returnedAccount.BillingAddress['street'] + '\n';
                            }
                            if (returnedAccount.BillingAddress['city'] != null && returnedAccount.BillingAddress['city'] != undefined) {
                                addr = addr + returnedAccount.BillingAddress['city'] + '\n';
                            }
                            if (returnedAccount.BillingAddress['state'] != null && returnedAccount.BillingAddress['state'] != undefined) {
                                addr = addr + returnedAccount.BillingAddress['state'] + '\n';
                            }
                            if (returnedAccount.BillingAddress['postalCode'] != null && returnedAccount.BillingAddress['postalCode'] != undefined) {
                                addr = addr + returnedAccount.BillingAddress['postalCode'] + '\n';
                            }
                            if (returnedAccount.BillingAddress['country'] != null && returnedAccount.BillingAddress['country'] != undefined) {
                                addr = addr + returnedAccount.BillingAddress['country'] + '\n';
                            }
                            if (addr != '') {
                                this.data.push({ key: 'Billing Address', value: addr, wordBreakProperty: this.wordBreakProperty });
                            }
                        }
                        else if (key === 'Platform_Description__c') {
                            this.data.push({ key: 'Platform Description', value: returnedAccount[key], wordBreakProperty: this.wordBreakProperty });
                        }
                        else if (key === 'Name') {
                            this.data.push({ key: 'Account Name', value: returnedAccount[key], wordBreakProperty: this.wordBreakProperty });
                        }
                        else if (key === 'Alternative_Platform_Description__c') {
                            this.data.push({ key: 'Alternative Platform Description', value: returnedAccount[key], wordBreakProperty: this.wordBreakProperty });
                        }
                        else if (key === 'MetroArea__c') {
                            this.data.push({ key: 'Metro Area', value: returnedAccount['MetroArea__r'].Name, wordBreakProperty: this.wordBreakProperty });
                        }
                        
                        else if (key === 'AUM__c') {
                            var number = Math.round(parseFloat((returnedAccount[key])));

                            if (number < 0) {
                                number = Math.abs(number);
                            }
                            var AUM = new Intl.NumberFormat(LOCALE, {
                                style: 'currency',
                                currency: CURRENCY,
                                currencyDisplay: 'symbol'
                            }).format(number);
                            AUM = AUM.replace('.00', '');
                            this.data.push({ key: 'AUM', value: AUM, wordBreakProperty: 'word-break: break-all;' });
                        }
                        else if (key === 'Number_of_QPs__c') {
                            this.data.push({ key: '# of QPs', value: returnedAccount[key], wordBreakProperty: this.wordBreakProperty });
                        }
                        else if (key === 'CRD__c') {
                            this.data.push({ key: 'CRD#', value: returnedAccount[key], wordBreakProperty: 'word-break: break-all;' });
                        }
                        else if (key === 'Website' || key === 'Phone') {
                            this.data.push({ key: key, value: returnedAccount[key], wordBreakProperty: 'word-break: break-all;' });
                        }
                        else {
                            this.data.push({ key: key, value: returnedAccount[key], wordBreakProperty: this.wordBreakProperty });
                        }
                    }
                }
            }
            else {
                this.recordsExist = false;
            }
        });
        // Get related Contacts records for account
        getRelatedContactRecords({
            recordId: this.recordId
        }).then(relatedContacts => {

            if (relatedContacts) {
                if (relatedContacts.length == 0) {
                    this.contactsExists = false;
                    this.isLoading = false;
                    this.contactsNotExists = true;
                }
                else {
                    this.contactsExists = true;
                    this.relatedContactsRecords = relatedContacts;
                    this.isLoading = false;
                }
            }
            else {
                this.contactsNotExists = true;
                this.contactsExists = false;
                this.isLoading = false;
            }
        }).catch(error => {
            this.isLoading = false;
        });
    }

    openPrintWindow() {
        window.print();
    }

    openAccountRecord() {
        let navigationURL = "/" + this.communityName + "/s/detail/" + this.recordId;
        window.open(navigationURL, '_parent');
    }
}