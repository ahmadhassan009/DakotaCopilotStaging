import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import { loadStyle } from 'lightning/platformResourceLoader';
import getRelatedContactRecords from '@salesforce/apex/MetroAreaListViewController.getRelatedContactRecords';
import getRelatedContactCount from '@salesforce/apex/MetroAreaListViewController.getRelatedContactCount';
import { refreshApex } from '@salesforce/apex';
import CONTACT_NAME_FIELD from '@salesforce/schema/Contact.Name';
import TITLE_FIELD from '@salesforce/schema/Contact.Title';
import EMAIL_FIELD from '@salesforce/schema/Contact.Email';
import CONTACT_TYPE_FIELD from '@salesforce/schema/Contact.Contact_Type__c';

import metroAreaByStateCSS from '@salesforce/resourceUrl/metroAreaByStateCSS';

const COLUMNS = [
    { label: 'Name', sortable: true, fieldName: "recordLink", type: "url", typeAttributes: { label: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, tooltip: { fieldName: CONTACT_NAME_FIELD.fieldApiName }, target: '_self' } },
    { label: 'Metro Area', sortable: true, fieldName: 'MetroAreaLink', type: 'url', typeAttributes: { label: { fieldName: 'MetroAreaName' }, tooltip: { fieldName: 'MetroAreaName' }, target: '_self' } },
    { label: 'Account Name', sortable: true, fieldName: 'AccountLink', type: 'url', typeAttributes: { label: { fieldName: 'AccountName' }, tooltip: { fieldName: 'AccountName' }, target: '_self' } },
    { label: 'Account Type', sortable: true, fieldName: 'AccountType', type: 'Picklist' },
    { label: 'Title', sortable: true, fieldName: TITLE_FIELD.fieldApiName, type: 'Text' },
    { label: 'Email', sortable: true, fieldName: EMAIL_FIELD.fieldApiName, type: 'email' },
    { label: 'Contact Type', sortable: true, fieldName: CONTACT_TYPE_FIELD.fieldApiName, type: 'Picklist' }
]

export default class MetroAreaStatesAllContactsViewAll extends NavigationMixin(LightningElement) {
    @api stateName;
    @api homeOffice;
    isLoading = false;
    defaultSortDirection = 'asc';
    columns = COLUMNS;
    totalRelatedContactCount = 0;
    relatedContactRecords=[];
    isCommunity = false;
    sortedDirection = 'asc';
    sortedBy = 'recordLink';
    offset = 0;
    limit = 50;
    baseURL = '';
    collapsed = true;
    panelStyling;
    fromEditEvent = true;
    fromLoadMore = false;
    fromRefresh =false;
    fieldsMapping;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        this.isLoading = true;
        this.setFieldMappings();
        Promise.all([
            loadStyle(this, metroAreaByStateCSS)
        ]);

        this.maNameLink = "/"+this.communityName + '/s/metro-area/Metro_Area__c/Default';
        this.recordLink = "/"+this.communityName + '/s/state-detail-page?stateName=' + this.stateName;
        this.getTotalRecordCount();
        this.getRelatedContacts(this.stateName, this.fieldsMapping.get(this.sortedBy), this.sortedDirection,this.limit, this.offset, this.homeOffice);
    }

    getTotalRecordCount() {
        //To get count of related records
        getRelatedContactCount({
            stateName: this.stateName,
            homeOffice:this.homeOffice,
        }).then(contactRecordCount => {
            if (contactRecordCount) {
                this.totalRelatedContactCount = contactRecordCount;
            }
        }).catch(error => {
            console.log('Error : ', error);
        });
    }

    getRelatedContacts(stateName,sortBy,sortdirection, limit, offset, homeOffice) {
        getRelatedContactRecords({
            stateName: stateName,
            sortedBy:sortBy,
            sortedDirection:sortdirection,
            recordLimit: limit,
            offset: offset,
            homeOffice:homeOffice,
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

                if(this.offset==0){
                    this.fromRefresh = false;
                }
                
                if ((this.offset + this.limit) >= this.totalRelatedContactCount ) {
                    this.plusSign = '';
                } else {
                    this.plusSign = '+';
                }
                this.offset += tempContactList.length;
                if(this.fromLoadMore){
                    this.relatedContactRecords = this.relatedContactRecords.concat(tempContactList);

                    this.fromLoadMore = false;
                    if (this.tableElement) {
                        this.tableElement.isLoading = false;
                      }
                }
                else
                {
                    this.relatedContactRecords=[];
                    this.relatedContactRecords = tempContactList;
                }
                this.isLoading = false;
            }
        }).catch(error => {
            this.isLoading = false;
            console.log('Error : ', error);
        });

    }

    onHandleSort(event) {

        const {
            fieldName: sortedBy,
            sortDirection
        } = event.detail;
        this.offset = 0;
        this.limit = 50;
        this.isLoading = true;

        this.sortedBy = sortedBy
        this.sortedDirection = sortDirection;
        this.getRelatedContacts(this.stateName,this.fieldsMapping.get(this.sortedBy), this.sortedDirection, this.limit, this.offset,this.homeOffice);
    }

    loadMoreData(event) {
        if(this.totalRelatedContactCount != this.offset && this.offset>0) {
            //Display a spinner to signal that data is being loaded
            if(!this.fromRefresh) {
            if(this.relatedContactRecords != null && event.target){
                event.target.isLoading = true;
            }

            this.tableElement = event.target;
            this.fromLoadMore = true;
            this.offset = this.relatedContactRecords.length;
            this.getRelatedContacts(this.stateName,this.fieldsMapping.get(this.sortedBy), this.sortedDirection, this.limit, this.offset,this.homeOffice);

        }
        }
    }

    refreshTable(event)
    {
        this.isLoading = true;
        this.infiniteLoading = true;
        this.offset = 0;
        this.limit = 50;
        this.fromRefresh = true;
        this.sortedDirection = 'asc';
        this.sortedBy = 'recordLink';
         var table = this.template.querySelector('lightning-datatable');
         if(table!=null)
            table.enableInfiniteLoading = true;
        return refreshApex(this.getRelatedContacts(this.stateName,this.fieldsMapping.get(this.sortedBy), this.sortedDirection, this.limit, this.offset,this.homeOffice));
    }

    setFieldMappings() {
        this.fieldsMapping = new Map();
        this.fieldsMapping.set("recordLink", 'Name');
        this.fieldsMapping.set("AccountLink", 'Account.Name');
        this.fieldsMapping.set("AccountType", 'Account.Type');
        this.fieldsMapping.set("Title", 'Title');
        this.fieldsMapping.set("Email", 'Email');
        this.fieldsMapping.set("Contact_Type__c", 'Contact_Type__c');
        this.fieldsMapping.set("MetroAreaLink", 'Metro_Area__r.Name');
      }

}