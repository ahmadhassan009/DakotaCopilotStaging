import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';

import {loadStyle} from 'lightning/platformResourceLoader';
import newsInAccCSS from '@salesforce/resourceUrl/newsInAccCSS';

import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
import getDakotaNewsRecordCount from '@salesforce/apex/DakotaNewsRelatedToAccountController.getDakotaNewsRecordCount';
import getDakotaNewsRecords from '@salesforce/apex/DakotaNewsRelatedToAccountController.getDakotaNewsRecords';
import NAME_FIELD from '@salesforce/schema/Dakota_News__c.Name';
import DESCRIPTION_FIELD from '@salesforce/schema/Dakota_News__c.Description__c';
import PUBLISH_DATE_FIELD from '@salesforce/schema/Dakota_News__c.Publish_Date__c';

const COLUMNS = [{
        label: "Fundraising News Name",
        sortable: true,
        fieldName: "recordLink",
        type: "url",
        typeAttributes: {
            label: {
                fieldName: NAME_FIELD.fieldApiName
            },
            target: '_self',
            tooltip: {
                fieldName: NAME_FIELD.fieldApiName
            }
        }
    },
    {
        label: "Description",
        fieldName: DESCRIPTION_FIELD.fieldApiName,
        type: 'text'
    },
    {
        label: "Public Plan Minute",
        sortable: true,
        fieldName: "pubblicPlanLink",
        type: "url",
        typeAttributes: {
            label: {
                fieldName: 'publicPlanName'
            },
            target: '_self',
            tooltip: {
                fieldName: 'publicPlanName'
            }
        }
    },
    {
        label: "Publish Date",
        fieldName: PUBLISH_DATE_FIELD.fieldApiName,
        type: 'date',
        typeAttributes: {day: "numeric",month: "numeric", year: "numeric"},
        sortable: true
    }
];

export default class DakotaNewsRelatedToAccount extends NavigationMixin(LightningElement) {
    @api recordId;
    columns = COLUMNS;
    isLoading = true;
    baseURL = '';
    totalRecords = '0';
    offset = 0;
    limit = 10;
    dakotaNewsExist = false;
    sortedBy = PUBLISH_DATE_FIELD.fieldApiName;
    defaultSortDirection = 'desc';
    nameSortDir = this.defaultSortDirection;
    sortedDirection = 'desc';
    tempSortBy = '';
    nullOrder = 'LAST';
    isCommunity = false;
    dakotaNewsRecords;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    /**
     * Connected call hook
     * Gets executed when component is loaded
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
            loadStyle(this, newsInAccCSS)
        ]);

        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;

        this.columns = COLUMNS;

        getSFBaseUrl().then(baseURL => {
            if (baseURL) {
                this.baseURL = baseURL;
            }
            this.isLoading = false;
        })
        .catch(error => {
            this.isLoading = false;
        });

        //To fetch number of Dakota News records
        getDakotaNewsRecordCount({
            recordId: this.recordId
        })
        .then((totalCount) => {
            if (totalCount == 0) {
                this.dakotaNewsExist = false;
            } else {
                this.dakotaNewsExist = true;
            }
            if (totalCount > 10) {
                this.totalRecords = '10+';
            } else {
                this.totalRecords = totalCount;
            }

            if (totalCount > 0) {
                //To fetch Dakota News records
                this.setFieldSorting();
                this.getDakotaNewsRecords(this.recordId, this.tempSortBy, this.sortedDirection, this.limit, this.offset);
            }
        })
        .catch((error) => {
            console.log('Error for count : ', error);
            this.isLoading = false;
        });
    }

    /**
     * To get Dakota News records linked to the account
     * @param recordId current account record Id
     * @param sortedBy field to be sorted on (Default sorted on Name)
     * @param sortedDirection sorting direction
     */
    getDakotaNewsRecords(recordId, sortedBy, sortedDirection, limit, offset) {
        this.isLoading = true;
        if (sortedDirection == 'desc') {
            this.nullOrder = 'LAST';
        } else {
            this.nullOrder = 'FIRST';
        }
        //Getting Dakota News records based on the passed Account Id
        getDakotaNewsRecords({
            recordId: recordId,
            sortedBy: sortedBy,
            sortOrder: sortedDirection,
            recLimit: limit,
            offset: offset,
            nullOrder: this.nullOrder
        })
        .then((dakotaNewsData) => {
            if (dakotaNewsData) {
                let len = dakotaNewsData.length;
                let dakotaNewsRecordsList = [];
                for (let i = 0; i < len; i++) {
                    let tempDakotaNewsRecord = Object.assign({}, dakotaNewsData[i]); //cloning object
                    if (this.isCommunity) {
                        if (tempDakotaNewsRecord.Id != undefined)
                            tempDakotaNewsRecord.recordLink = "/" + this.communityName + "/s/dakota-news/" + tempDakotaNewsRecord.Id;
                        if (tempDakotaNewsRecord.Public_Plan_Minute__c != undefined)
                            tempDakotaNewsRecord.pubblicPlanLink = "/" + this.communityName + "/s/public-plan-minute/" + tempDakotaNewsRecord.Public_Plan_Minute__c;
                    } else {
                        if (tempDakotaNewsRecord.Id != undefined)
                            tempDakotaNewsRecord.recordLink = "/" + tempDakotaNewsRecord.Id;
                        if (tempDakotaNewsRecord.Public_Plan_Minute__c != undefined)
                            tempDakotaNewsRecord.pubblicPlanLink = "/" + tempDakotaNewsRecord.Public_Plan_Minute__c;
                    }
                    if (tempDakotaNewsRecord.Public_Plan_Minute__c != undefined) {
                        tempDakotaNewsRecord.publicPlanName = tempDakotaNewsRecord.Public_Plan_Minute__r.Name;
                    }

                    dakotaNewsRecordsList.push(tempDakotaNewsRecord);
                }
                this.dakotaNewsRecords = dakotaNewsRecordsList;
            } else {
                this.dakotaNewsRecords = null;
            }
            this.isLoading = false;
        })
        .catch((error) => {
            console.log('Error in fetching dakota news records : ', error);
            this.isLoading = false;
        });
    }

    /**
     * Set field api name before sorting data
     */
    setFieldSorting() {
        this.tempSortBy = this.sortedBy;
        if (this.sortedBy === 'recordLink') {
            this.tempSortBy = 'Name';
        } else if (this.sortedBy === 'pubblicPlanLink') {
            this.tempSortBy = 'Public_Plan_Minute__r.Name';
        }
    }

    /**
     * For sorting the table based on column and sort direction
     * @param {*} event 
     */
    updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;

        this.setFieldSorting();
        this.sortedDirection = this.nameSortDir === 'asc' ? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.getDakotaNewsRecords(this.recordId, this.tempSortBy, this.sortedDirection, this.limit, this.offset);
    }

    /**
     * For redirecting to Custom View All page
     */
    handleShowFullRelatedList() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordRelationshipPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Account',
                relationshipApiName: 'Dakota_News__r',
                actionName: 'view'
            }
        });
    }
}