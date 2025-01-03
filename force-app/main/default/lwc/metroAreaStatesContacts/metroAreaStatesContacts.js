import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import { loadStyle } from 'lightning/platformResourceLoader';
import copygetRelatedContactRecords from '@salesforce/apex/MetroAreaListViewController.getRelatedContactRecords';
import getRelatedContactCount from '@salesforce/apex/MetroAreaListViewController.getRelatedContactCount';
import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
import CONTACT_NAME_FIELD from '@salesforce/schema/Contact.Name';
import TITLE_FIELD from '@salesforce/schema/Contact.Title';
import EMAIL_FIELD from '@salesforce/schema/Contact.Email';
import CONTACT_TYPE_FIELD from '@salesforce/schema/Contact.Contact_Type__c';
import metroAreaByStateCSS from '@salesforce/resourceUrl/metroAreaByStateCSS';

const noActions = [
    { label: 'No actions availble', name: 'No actions availble', disabled:true }
];

const COLUMNS = [
    { label: 'Name', fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, tooltip: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, target: '_self' } },
    { label: 'Metro Area', fieldName: 'MetroAreaLink', type: 'url', typeAttributes: { label: { fieldName: 'MetroAreaName' }, tooltip: { fieldName: 'MetroAreaName' }, target: '_self' } },
    { label: 'Account Name', fieldName: "AccountLink", type: 'url', typeAttributes: { label: { fieldName: 'AccountName' }, tooltip: { fieldName: 'AccountName' }, target: '_self' } },
    { label: 'Account Type', fieldName: 'AccountType', type: 'Picklist' },
    { label: 'Title', fieldName: TITLE_FIELD.fieldApiName, type: 'Text' },
    { label: 'Email', fieldName: EMAIL_FIELD.fieldApiName, type: 'email' },
    { label: 'Contact Type', fieldName: CONTACT_TYPE_FIELD.fieldApiName, type: 'Picklist' },
    {
        type: 'action',
        typeAttributes: { rowActions: noActions },
    }
]

export default class MetroAreaStatesContacts extends NavigationMixin(LightningElement) {
    @api stateName;
    @api recordName;
    @api panelName;
    @api homeOffice;
    isLoading = false;
    columns = COLUMNS;
    totalRelatedContactCount = 0;
    relatedContactRecords;
    isCommunity = false;
    offset = 0;
    limit = 10;
    baseURL = '';
    collapsed = true;
    panelStyling;
    fromEditEvent = true;
    fromLoadMore = false;
    fieldsMapping;
    sortedDirection = 'asc';
    sortedBy = 'recordLink';
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        this.isLoading = true;

        Promise.all([
            loadStyle(this, metroAreaByStateCSS)
        ]);
        this.getRelatedContactCount();
        if(this.homeOffice == 'true') {
            //this.panelName += ' Home Office in '+ this.stateName; 
            this.panelName = 'All Contacts'; 
        }
        else if(this.homeOffice == 'false'){
            this.panelName += ' - Home Office not in '+ this.stateName; 
        }
    }

    getRelatedContactCount() {
        getRelatedContactCount({
            stateName: this.stateName,
            homeOffice: this.homeOffice,
        }).then(contactRecordCount => {
            if (contactRecordCount) {
                this.totalRelatedContactCount = contactRecordCount;

                //To set panel height based total number of records 
                if (this.totalRelatedContactCount >= 10) {
                    this.panelStyling = 'height : 305px;';
                }
                else if (this.totalRelatedContactCount == 1) {
                    this.panelStyling = 'height : 62px;';
                }
                else if (this.totalRelatedContactCount == 2) {
                    this.panelStyling = 'height : 90px;';
                }
                else if (this.totalRelatedContactCount == 3) {
                    this.panelStyling = 'height : 115px;';
                }
                else if (this.totalRelatedContactCount == 4) {
                    this.panelStyling = 'height : 142px;';
                }
                else if (this.totalRelatedContactCount == 5) {
                    this.panelStyling = 'height : 170px;';
                }
                else if (this.totalRelatedContactCount == 6) {
                    this.panelStyling = 'height : 196px;';
                }
                else if (this.totalRelatedContactCount == 7) {
                    this.panelStyling = 'height : 225px;';
                }
                else if (this.totalRelatedContactCount == 8) {
                    this.panelStyling = 'height : 250px;';
                }
                else if (this.totalRelatedContactCount == 9) {
                    this.panelStyling = 'height : 280px;';
                }
            }
        }).catch(error => {
            console.log('Error : ', error);
        });

        getSFBaseUrl()
        .then(baseURL => {
            if (baseURL) {
                this.baseURL = baseURL;
            }
        })
        .catch(error => {
            console.log("Error:", error);
        });
    }

    getRelatedContacts() {
        this.isLoading = true;
        copygetRelatedContactRecords({
            stateName: this.stateName,
            sortedBy:'Name',
            sortedDirection:this.sortedDirection,
            recordLimit: this.limit,
            offset: this.offset,
            homeOffice: this.homeOffice,
        }).then(relatedContacts => {
            if (relatedContacts) {
                var tempContactList = [];
                for (var i = 0; i < relatedContacts.length; i++) {
                    let tempContactRecord = Object.assign({}, relatedContacts[i]); //cloning object
                    tempContactRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempContactRecord.Id;
                    if (tempContactRecord.AccountId != undefined)
                        tempContactRecord.AccountLink = "/" + this.communityName + "/s/detail/" + tempContactRecord.AccountId;
                    if (tempContactRecord.Account != undefined) {
                        tempContactRecord.AccountName = tempContactRecord.Account.Name;
                        tempContactRecord.AccountType = tempContactRecord.Account.Type;
                    }
                    if (tempContactRecord.Metro_Area__c != undefined) {
                        tempContactRecord.MetroAreaLink = "/" + this.communityName + "/s/detail/" + tempContactRecord.Metro_Area__c;
                        tempContactRecord.MetroAreaName = tempContactRecord.Metro_Area__r.Name;
                      }
                    tempContactList.push(tempContactRecord);
                }
                this.relatedContactRecords = tempContactList;
                this.offset = this.relatedContactRecords.length;
                this.isLoading = false;
            }
        }).catch(error => {
            this.isLoading = false;
            console.log('Error : ', error);
        });
    }

    chevronButtonClicked() {
        this.collapsed = !this.collapsed;
        this.relatedContactRecords = [];
        this.offset=0;
        if(!this.collapsed) {
            this.getRelatedContacts();
        }
    }


    handleShowFullRelatedList() {
        var url = '/metro-area-state-view-all?stateName=' + this.stateName + '&homeOffice='+this.homeOffice+'&objectName=Contact';
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
                attributes: {
                    url: url
                }
            });
    }

    setFieldMappings() {
        this.fieldsMapping = new Map();
        this.fieldsMapping.set("recordLink", 'Name');
        this.fieldsMapping.set("AccountLink", 'Account.Name');
        this.fieldsMapping.set("AccountType", 'Account.Type');
        this.fieldsMapping.set("Title", 'Title');
        this.fieldsMapping.set("Email", 'Email');
        this.fieldsMapping.set("Contact_Type__c", 'Contact_Type__c');
    }

}