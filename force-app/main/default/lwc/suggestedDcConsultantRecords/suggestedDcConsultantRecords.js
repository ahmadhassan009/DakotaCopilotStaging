import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";

import activeCommunities from '@salesforce/label/c.active_communities';
import getSuggestedDcConsultants from '@salesforce/apex/RelatedDcConsultantContOfAccController.getSuggestedDcConsultants';

export default class SuggestedDcConsultantRecords extends NavigationMixin(LightningElement) {
    @api recordId;
    @api suggestedConsultantRecordCount;
    @api unAccessibleContactIds;
    @api accountInfo;
    @api columns;
    isLoading = true;
    totalRecords = '0';
    sortedBy = 'ContactLink';
    sortedDirection = 'asc';
    defaultSortDirection = 'asc';
    data;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    suggestedConsultantCollapsed = true;

    connectedCallback() {
        this.isLoading = true;
        this.fetchSuggestedDcConsultants(this.recordId, 'Contact__r.Name', this.sortedDirection);
    }

    /**
     * @param recordId current account record Id
     * @param sortedBy field to be sorted on (Default sorted on Row Order P1)
     * @param sortedDirection sorting direction
    */
    fetchSuggestedDcConsultants(recordId, sortedBy, sortedDirection) {
        this.isLoading = true;
        getSuggestedDcConsultants({
            recordId: recordId,
            sortedBy: sortedBy,
            sortOrder: sortedDirection,
            unAccessibleContactIds: this.unAccessibleContactIds,
            accMetroArea: this.accountInfo.MetroArea__c,
            accState: this.accountInfo.BillingState,
        }).then((Records) => {
            if (Records) {
                var tempContactList = [];
                for (var i = 0; i < Records.length; i++) {
                    let tempContactRecord = Object.assign({}, Records[i]); //cloning object

                    if (tempContactRecord.ContactId) {
                        tempContactRecord.ContactLink = "/" + this.communityName + "/s/detail/" + tempContactRecord.ContactId;
                        tempContactRecord.ContactName = tempContactRecord.ContactName;
                    }

                    if (tempContactRecord.ContactAccId) {
                        tempContactRecord.ContactCompanyLink = "/" + this.communityName + "/s/detail/" + tempContactRecord.ContactAccId;
                        tempContactRecord.ContactCompanyName = tempContactRecord.ContactAccName;
                    }

                    if (tempContactRecord.ContactEducationCollege) {
                        tempContactRecord.CollegeLink = "/" + this.communityName + "/s/detail/" + tempContactRecord.ContactEducationCollege;
                        tempContactRecord.CollegeName = tempContactRecord.ContactEducationCollegeName;
                    }

                    if (tempContactRecord.ContactMetroArea) {
                        tempContactRecord.MetroAreaLink = "/" + this.communityName + "/s/detail/" + tempContactRecord.ContactMetroArea;
                        tempContactRecord.MetroAreaofContact = tempContactRecord.ContactMetroAreaName;
                    }

                    tempContactList.push(tempContactRecord);
                }
                this.data = tempContactList;
            } else {
                this.data = null;
            }
            this.isLoading = false;
        })
            .catch((error) => {
                console.log('Error in fetching Contact record : ', error);
                this.isLoading = false;
            });
    }

    suggestedConsultantChevronButtonClicked() {
        this.suggestedConsultantCollapsed = !this.suggestedConsultantCollapsed;
    }

    /**
     * For sorting the table based on column and sort direction
     * @param {*} event 
    */
    updateColumnSorting(event) {
        this.isLoading = true;
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        let tempSortBy = this.sortedBy;

        if (this.sortedBy === 'ContactLink') {
            tempSortBy = 'Contact__r.Name';
        } else if (this.sortedBy === 'ContactEmail') {
            tempSortBy = 'Contact__r.Email';
        } else if (this.sortedBy === 'ContactTitle') {
            tempSortBy = 'Contact__r.Title';
        } else if (this.sortedBy === 'ContactCompanyLink') {
            tempSortBy = 'Contact__r.Account.Name';
        } else if (this.sortedBy === 'ContactPhone') {
            tempSortBy = 'Contact__r.Phone';
        } else if (this.sortedBy === 'MetroAreaLink') {
            tempSortBy = 'Contact__r.Metro_Area__r.Name';
        }

        this.fetchSuggestedDcConsultants(this.recordId, tempSortBy, this.sortedDirection);
    }

    handleShowFullRelatedList() {
        var url = '/suggested-advisors?recordId=' + this.recordId;

        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: url
            }
        });
    }
}