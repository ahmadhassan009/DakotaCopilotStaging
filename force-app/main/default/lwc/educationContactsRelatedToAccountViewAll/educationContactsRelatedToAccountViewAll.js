import {
    LightningElement,
    api
} from 'lwc';
import {
    NavigationMixin
} from "lightning/navigation";
import {
    loadStyle
} from 'lightning/platformResourceLoader';
import EducationCSS from '@salesforce/resourceUrl/EducationCSS';
import activeCommunities from '@salesforce/label/c.active_communities';

import getAccountName from '@salesforce/apex/EducationRelatedToAccountController.getAccountName';
import getRecordsCount from '@salesforce/apex/EducationRelatedToAccountController.getRecordsCount';
import getEducationRecordsViewAll from '@salesforce/apex/EducationRelatedToAccountController.getEducationRecordsViewAll';

import DEGREE_FIELD from '@salesforce/schema/Education__c.Degree_Distinction__c';
import YEAR_FIELD from '@salesforce/schema/Education__c.Year_Graduated__c';

const COLUMNS = [

    { label: 'Contact Name', sortable: true, fieldName: "contactId", type: 'url', typeAttributes: {label: { fieldName: 'contactName' }, tooltip:  { fieldName: 'contactName' }, target: '_self'}},
    { label: 'Account', sortable: true, fieldName: "conAccountId", type: 'url', typeAttributes: {label: { fieldName: 'conAccountName' }, tooltip:  { fieldName: 'conAccountName' }, target: '_self'}},
    { label: 'Type', sortable: true, fieldName: "accType", type: 'text'},
    { label: 'Title', sortable: true, fieldName: "conTitle", type: 'text'},
    { label: 'Metro Area', sortable: true, fieldName: "conMetroAreaId", type: 'url', typeAttributes: {label: { fieldName: 'conMetroAreaName' }, tooltip:  { fieldName: 'conMetroAreaName' }, target: '_self'}},
    { label: 'Email', sortable: true, fieldName: "conEmail", type: 'email'},
    { label: 'Year Graduated', sortable: true, fieldName: YEAR_FIELD.fieldApiName, type: 'text'}
]

export default class EducationContactsRelatedToAccountViewAll extends NavigationMixin(LightningElement) {
    @api recordId;
    @api isCommunity;
    offset = 0;
    limit = 50;
    columns = COLUMNS;
    accountNameLink;
    recordName;
    totalEducationCount;
    dataSorting = false;
    fromLoadMore = false;
    infiniteLoading = false;
    isLoading = true;
    plusSign;
    totalRecords = '0';
    nullOrder = 'LAST';
    isCommunity = false;
    tempSortBy = '';
    defaultSortDirection = 'desc';
    sortedBy = YEAR_FIELD.fieldApiName;
    nameSortDir = this.defaultSortDirection;
    sortedDirection = 'desc';
    educationRecords;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    /**
     * Connected call hook
     * Gets executed when component is loaded
     * Fetching record count and first 50 records of Education
     */
    connectedCallback() {
        this.setRecordsInInitialState();
    }

    /**
     * Function to set records when the component is loaded/refreshed 
     */
    setRecordsInInitialState() {
        this.isLoading = true;

        Promise.all([
            loadStyle(this, EducationCSS)
        ]);

        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;

        this.columns = COLUMNS;

        this.setLinks();

        // Get Parent Account's name
        getAccountName({
            recordId: this.recordId
        }).then(returnedAccount => {
            if (returnedAccount != null) {
                this.recordName = returnedAccount.Name;
            }
        });

        //To fetch number of Education records
        getRecordsCount({
            recordId: this.recordId
        }).then(educationCount => {
            if (educationCount)
                this.totalEducationCount = educationCount;
            //To fetch Education records
            this.setFieldSorting();
            this.getEducationRecordsViewAll(this.recordId, this.tempSortBy, this.sortedDirection, this.limit, this.offset);
            this.sortedDirection = 'desc';
            this.sortedBy = YEAR_FIELD.fieldApiName;
        }).catch(error => {
            console.log("Error in fetching total count of Education records : ", error);
        });
    }

    /**
     * Set field api name before sorting data
     */
    setFieldSorting() {
        this.tempSortBy = this.sortedBy;
        if(this.sortedBy === 'contactId') {
            this.tempSortBy = 'Contact__r.Name';
        }else if(this.sortedBy === 'conAccountId') {
            this.tempSortBy = 'Contact__r.Account.Name';
        }else if(this.sortedBy === 'accType') {
            this.tempSortBy = 'College__r.Type';
        }else if(this.sortedBy === 'conTitle') {
            this.tempSortBy = 'Contact__r.Title';
        }else if(this.sortedBy === 'conMetroAreaId') {
            this.tempSortBy = 'Contact__r.Metro_Area__r.Name';
        }else if(this.sortedBy === 'conEmail') {
            this.tempSortBy = 'Contact__r.Email';
        }else if(this.sortedBy === 'Year_Graduated__c') {
            this.tempSortBy = YEAR_FIELD.fieldApiName;
        }
    }

    /**
     * To get Education records linked to the account
     * @param recordId current account record Id
     * @param sortedBy field to be sorted on (Default sorted on Year Graduated Field)
     * @param sortedDirection sorting direction
     * @param limit record limit
     * @param offset record offset
     */
     getEducationRecordsViewAll(recordId, sortedBy, sortedDirection, limit, offset) {
        if (sortedDirection == 'desc') {
            this.nullOrder = 'LAST';
        } else {
            this.nullOrder = 'FIRST';
        }
        //Getting Education records based on the passed Account Id
        getEducationRecordsViewAll({
                recordId: recordId,
                sortedBy: sortedBy,
                sortOrder: sortedDirection,
                recLimit: limit,
                offset: offset,
                nullOrder: this.nullOrder
            })
            .then((educationRecords) => {
                if (educationRecords) {
                    let len = educationRecords.length;
                    let educationList = [];
                    for (let i = 0; i < len; i++) {
                        let returnedData = Object.assign({}, educationRecords[i]); //cloning object

                        if(returnedData.Contact__c) {
                            returnedData.contactId = "/" + this.communityName + '/s/contact/' + returnedData.Contact__c;
                            returnedData.contactName = returnedData.Contact__r.Name;
                        }
                        if(returnedData.Contact__r.AccountId) {
                            returnedData.conAccountId = "/" + this.communityName + '/s/account/' + returnedData.Contact__r.AccountId;
                            returnedData.conAccountName = returnedData.Contact__r.Account.Name;
                        }
                        if(returnedData.College__r.Type) {
                            returnedData.accType = returnedData.College__r.Type;
                        }
                        if(returnedData.Contact__r.Title) {
                            returnedData.conTitle = returnedData.Contact__r.Title;
                        }
                        if(returnedData.Contact__r.Metro_Area__c) {
                            returnedData.conMetroAreaId = "/" + this.communityName + '/s/metro-area/' + returnedData.Contact__r.Metro_Area__c;
                            returnedData.conMetroAreaName = returnedData.Contact__r.Metro_Area__r.Name;
                        }
                        if(returnedData.Contact__r.Email) {
                            returnedData.conEmail = returnedData.Contact__r.Email;
                        }
                        educationList.push(returnedData);
                    }

                    if (this.fromLoadMore) {
                        if (this.educationRecords)
                            this.educationRecords = this.educationRecords.concat(educationList);
                        if ((this.offset + this.limit) >= this.totalEducationCount || (this.offset) == 0) {
                            this.offset = this.totalEducationCount;
                            this.totalRecords = this.offset;
                        } else {
                            this.offset = parseInt(this.offset) + parseInt(this.limit);
                            this.totalRecords = this.offset + '+';
                        }

                        if (this.tableElement) {
                            this.tableElement.isLoading = false;
                        }
                        this.fromLoadMore = false;
                        this.infiniteLoading = false;
                    } else {
                        this.educationRecords = educationList;
                    }

                    this.offset = this.educationRecords.length;
                    if ((this.educationRecords.length) >= this.totalEducationCount) {
                        this.plusSign = '';
                    } else {
                        this.plusSign = '+';
                    }
                } else {
                    this.educationRecords = null;
                }
                this.isLoading = false;
                if (this.dataSorting) {
                    this.dataSorting = false;
                }
            })
            .catch((error) => {
                console.log('Error in fetching education records : ', error);
                this.isLoading = false;
                this.infiniteLoading = false;
            });
    }

    /**
     * For sorting the table based on column and sort direction
     * @param {*} event 
     */
    updateColumnSorting(event) {
        this.isLoading = true;
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.dataSorting = true;
        this.educationRecords = [];

        this.setFieldSorting();

        this.sortedDirection = this.nameSortDir === 'asc' ? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.getEducationRecordsViewAll(this.recordId, this.tempSortBy, this.sortedDirection, this.offset, 0);
    }

    /**
     * For loading more records on scroll down
     * @param {*} event 
     */
    loadMoreData(event) {
        if (this.totalEducationCount > this.offset) {
            if (this.infiniteLoading) {
                return;
            }
            if (this.dataSorting) {
                return;
            }
            this.infiniteLoading = true;
            //Display a spinner to signal that data is being loaded
            if (this.educationRecords != null && event.target) {
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            this.fromLoadMore = true;
            this.setFieldSorting();
            this.getEducationRecordsViewAll(this.recordId, this.tempSortBy, this.sortedDirection, this.limit, this.offset);

        }
    }

    /**
     * Method is called when Refresh button on related list is clicked
     */
    refreshTable() {
        this.offset = 0;
        this.limit = 50;
        this.plusSign = '';
        this.sortedDirection = 'desc';
        this.defaultSortDirection = 'desc';
        this.nameSortDir = this.defaultSortDirection;
        this.sortedBy = YEAR_FIELD.fieldApiName;
        this.educationRecords = [];
        this.setRecordsInInitialState();
    }

    // Set breadcrumb links
    setLinks() {
        if (this.isCommunity) {
            this.recordLink = "/" + this.communityName + "/s/account/" + this.recordId;
            this.accountNameLink = "/" + this.communityName + '/s/account/Account/Default';
        } else {
            this.recordLink = '/' + this.recordId;
            this.accountNameLink = '/one/one.app#/sObject/Account/list?filterName=Recent';
        }
    }
}