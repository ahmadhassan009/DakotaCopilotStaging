import {
    LightningElement,
    api
} from 'lwc';
import {
    NavigationMixin
} from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import {
    loadStyle
} from 'lightning/platformResourceLoader';
import getRelatedAccountRecords from '@salesforce/apex/MetroAreaListViewController.getRelatedAccountRecords';
import getRelatedAccountCount from '@salesforce/apex/MetroAreaListViewController.getRelatedAccountCount';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import TYPE from '@salesforce/schema/Account.Type';
import AUM from '@salesforce/schema/Account.AUM__c';
import WEBSITE from '@salesforce/schema/Account.Website';
import BILLINGCITY from '@salesforce/schema/Account.BillingCity';
import DESCRIPTION from '@salesforce/schema/Account.Description';
import metroAreaByStateCSS from '@salesforce/resourceUrl/metroAreaByStateCSS';

const noActions = [
    { label: 'No actions availble', name: 'No actions availble', disabled:true }
];
const COLUMNS = [{
    label: 'Account Name',
    fieldName: "recordLink",
    type: "url",
    typeAttributes: {
        label: {
            fieldName: NAME_FIELD.fieldApiName
        },
        tooltip: {
            fieldName: NAME_FIELD.fieldApiName
        },
        target: '_self'
    }
},
{
    label: 'Type',
    fieldName: TYPE.fieldApiName,
    type: 'Picklist'
},
{
    label: 'Metro Area',
    fieldName: 'MetroAreaLink',
    type: 'url',
    typeAttributes: { label: { fieldName: 'MetroAreaName' }, tooltip: { fieldName: 'MetroAreaName' }, target: '_self' }
},
{
    label: 'AUM',
    fieldName: AUM.fieldApiName,
    type: 'currency',
    typeAttributes: {
        minimumFractionDigits: '0'
    }
},
{
    label: 'Website',
    fieldName: WEBSITE.fieldApiName,
    type: "url"
},
{
    label: 'Billing City',
    fieldName: BILLINGCITY.fieldApiName,
    type: 'Address'
},
{
    label: 'Description',
    fieldName: DESCRIPTION.fieldApiName,
    type: 'Long Text Area'
},
{
    type: 'action',
    typeAttributes: { rowActions: noActions },
}
]
export default class MetroAreaStatesAllAccounts extends NavigationMixin(LightningElement) {
    @api stateName;
    isLoading = false;
    columns = COLUMNS;
    totalRelatedAccountsCount = 0;
    relatedAccountsRecords = [];
    offset = 0;
    limit = 10;
    sortedDirection = 'desc';
    sortedBy = AUM.fieldApiName;
    collapsed = true;
    panelStyling;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        this.isLoading = true;

        Promise.all([
            loadStyle(this, metroAreaByStateCSS)
        ]);

        this.getRelatedAccountCount();
    }

    getRelatedAccountCount() {
        //To get count of related records
        getRelatedAccountCount({
            stateName: this.stateName
        }).then(accountsCount => {
            if (accountsCount) {
                this.totalRelatedAccountsCount = accountsCount;

                //To set panel height based total number of records
                if (this.totalRelatedAccountsCount >= 10) {
                    this.panelStyling = 'height : 305px;';
                } else if (this.totalRelatedAccountsCount == 1) {
                    this.panelStyling = 'height : 62px;';
                } else if (this.totalRelatedAccountsCount == 2) {
                    this.panelStyling = 'height : 90px;';
                } else if (this.totalRelatedAccountsCount == 3) {
                    this.panelStyling = 'height : 115px;';
                } else if (this.totalRelatedAccountsCount == 4) {
                    this.panelStyling = 'height : 142px;';
                } else if (this.totalRelatedAccountsCount == 5) {
                    this.panelStyling = 'height : 170px;';
                } else if (this.totalRelatedAccountsCount == 6) {
                    this.panelStyling = 'height : 196px;';
                } else if (this.totalRelatedAccountsCount == 7) {
                    this.panelStyling = 'height : 225px;';
                } else if (this.totalRelatedAccountsCount == 8) {
                    this.panelStyling = 'height : 250px;';
                } else if (this.totalRelatedAccountsCount == 9) {
                    this.panelStyling = 'height : 280px;';
                }
            }
        }).catch(error => {
            console.log('Error : ', error);
        });
    }
    
    getRelatedAccounts() {
        this.isLoading = true;
        // Get related marketplace searches records
        getRelatedAccountRecords({
            stateName: this.stateName,
            sortedBy: this.sortedBy,
            sortedDirection: this.sortedDirection,
            recordLimit: this.limit,
            offset: this.offset
        }).then(relatedAccounts => {
            if (relatedAccounts) {
                var tempAccountsList = [];
                for (var i = 0; i < relatedAccounts.length; i++) {
                    let tempRecord = Object.assign({}, relatedAccounts[i]); //cloning object  
                    tempRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempRecord.Id;
                    if (tempRecord.MetroArea__c != undefined) {
                        tempRecord.MetroAreaLink = "/" + this.communityName + "/s/detail/" + tempRecord.MetroArea__c;
                        tempRecord.MetroAreaName = tempRecord.MetroArea__r.Name;
                    }
                    tempAccountsList.push(tempRecord);
                }
                this.relatedAccountsRecords = tempAccountsList; 
                this.offset = tempAccountsList.length;      
                this.isLoading = false;
            }
        }).catch(error => {
            this.isLoading = false;
            console.log('Error : ', error);
        });
    }

    chevronButtonClicked() {
        this.collapsed = !this.collapsed;
        this.relatedAccountsRecords = [];
        this.offset=0;
        if(!this.collapsed) {
            this.getRelatedAccounts();
        }
    }

    

    handleShowFullRelatedList() {
        var url = '/metro-area-state-view-all?stateName=' + this.stateName + '&objectName=Account';
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: url
            }
        });
    }
}