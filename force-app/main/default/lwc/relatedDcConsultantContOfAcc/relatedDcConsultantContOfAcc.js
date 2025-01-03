import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getCountOfLevelOneAndTwoRecords from '@salesforce/apex/RelatedDcConsultantContOfAccController.getCountOfLevelOneAndTwoRecords';
import getCountOfSuggestedConsultants from '@salesforce/apex/RelatedDcConsultantContOfAccController.getCountOfSuggestedConsultants';
import getRelatedContactsToAccount from '@salesforce/apex/RelatedDcConsultantContOfAccController.getRelatedContactsToAccount';
import dcConsultantContactsRelatedList from '@salesforce/resourceUrl/dcConsultantContactsRelatedList';
import getUnAccessibleContactIds from '@salesforce/apex/RelatedDcConsultantContOfAccController.getUnAccessibleContactIds';
import getAccountInfo from '@salesforce/apex/RelatedDcConsultantContOfAccController.getAccountInfo';
import { loadStyle } from 'lightning/platformResourceLoader';

const COLUMNS = [
    { label: 'Contact Name', sortable: true, fieldName: "ContactLink", type: "url", typeAttributes: { label: { fieldName: 'ContactName' }, tooltip: { fieldName: 'ContactName' }, target: '_self' } },
    { label: 'Company', sortable: true, fieldName: "ContactCompanyLink", type: "url", typeAttributes: { label: { fieldName: 'ContactCompanyName' }, tooltip: { fieldName: 'ContactCompanyName' }, target: '_self' } },
    { label: 'Title', sortable: true, fieldName: 'ContactTitle', type: 'Text' },
    { label: 'College', sortable: false, fieldName: "CollegeLink", type: 'url', typeAttributes: { label: { fieldName: 'CollegeName' }, tooltip: { fieldName: 'CollegeName' }, target: '_self' } },
    { label: 'Metro Area', sortable: true, fieldName: "MetroAreaLink", type: 'url', typeAttributes: { label: { fieldName: 'MetroAreaofContact' }, tooltip: { fieldName: 'MetroAreaofContact' }, target: '_self' } },
    { label: 'Phone', sortable: true, fieldName: 'ContactPhone', type: 'Phone' },
    { label: 'Email', sortable: true, fieldName: 'ContactEmail', type: 'email' }

]

export default class RelatedDcConsultantContOfAcc extends NavigationMixin(LightningElement) {
    @api recordId;
    columns = COLUMNS;
    isLoading = true;
    totalConsultants = '0';
    sortedBy = 'metro area';
    sortedDirection = 'asc';
    defaultSortDirection = 'asc';
    dataExist = false;
    data;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    helpTextContent = 'Suggested';
    unAccessibleContactIds = [];
    suggestedConsultantCollapsed = true;
    suggestedConsultantRecordCount = 0;
    suggestedConsultantExists = false;
    accountInfo;
    recordsExist;
    DcConsultantCollapsed = false;
    totalRecords;
    consultantsCount;

    /**
     * Connected call hook
     * Gets executed when component is loaded
     * Fetching record count and first 10 records of Contacts
    */
    connectedCallback() {
        Promise.all([
            loadStyle(this, dcConsultantContactsRelatedList)
        ]);
        this.isLoading = true;

        getAccountInfo({
            recordId: this.recordId
        })
            .then((returnedAccount) => {
                if (returnedAccount) {
                    this.accountInfo = returnedAccount;
                    getUnAccessibleContactIds({
                        recordId: this.recordId
                    }).then(returnedIds => {
                        this.unAccessibleContactIds = returnedIds;
                        this.fetchCountOfLevelOneAndTwoRecords();
                    }).catch(error => {
                        console.log("Error in fetching total count DC Consultant Contact records : ", error);
                    });
                }
            })
            .catch((error) => {
                console.log('Error for count : ', error);
                this.isLoading = false;
            });
    }

    /**
     * Fetch count of level one and level two records
     * Level one are consultant contacts with same metro area
     * Level two are consultant contacts with same state
     */
    fetchCountOfLevelOneAndTwoRecords() {
        getCountOfLevelOneAndTwoRecords({
            recordId: this.recordId,
            accMetroArea: this.accountInfo.MetroArea__c,
            accState: this.accountInfo.BillingState,
            unAccessibleContactIds: this.unAccessibleContactIds
        }).then((returnedConsultantCount) => {

            this.consultantsCount = returnedConsultantCount;
            if (returnedConsultantCount == 0) {

                this.isLoading = false;
                this.dataExist = false;
            }
            else {
                this.dataExist = true;
                this.recordsExist = true;
            }
            if (returnedConsultantCount > 10) {
                this.totalConsultants = '10+';
            }
            else {
                this.totalConsultants = returnedConsultantCount;
            }

            if (returnedConsultantCount > 0) {
                this.sortedDirection = 'ASC';
                this.sortedBy = 'metro area';
                this.getRelatedContactsToAccount(this.recordId, this.sortedBy, this.sortedDirection);
            }

            /**
             * Fetch count of suggested consultant contacts
             * All consultant that aer not in level one and level two are suggested consultants
             */
            getCountOfSuggestedConsultants({
                recordId: this.recordId,
                accMetroArea: this.accountInfo.MetroArea__c,
                accState: this.accountInfo.BillingState,
                unAccessibleContactIds: this.unAccessibleContactIds
            })
            .then((returnedAdvisorCount) => {
                this.totalRecords = this.consultantsCount + returnedAdvisorCount;
                if (returnedAdvisorCount == 0) {
                    this.suggestedConsultantExists = false;
                    if (this.totalConsultants == 0) {
                        this.recordsExist = false;
                    }
                }
                else {
                    this.suggestedConsultantExists = true;
                    this.recordsExist = true;
                }
                if (returnedAdvisorCount > 10) {
                    this.suggestedConsultantRecordCount = '10+';
                }
                else {
                    this.suggestedConsultantRecordCount = returnedAdvisorCount;
                }

            })
            .catch((error) => {
                console.log('Error in fetching Suggested Consultant Contact record count : ', error);
                this.isLoading = false;
            });

        })
        .catch((error) => {
            console.log('Error for count : ', error);
            this.isLoading = false;
        });
    }

    // 
    //  @param recordId current account record Id
    //  @param sortedBy field to be sorted on (Default sorted on Row Order P1)
    //  @param sortedDirection sorting direction
    // 
    getRelatedContactsToAccount(recordId, sortedBy, sortedDirection) {
        this.isLoading = true;
        getRelatedContactsToAccount({
            recordId: recordId,
            sortedBy: sortedBy,
            sortOrder: sortedDirection,
            unAccessibleContactIds: this.unAccessibleContactIds,
            accMetroArea: this.accountInfo.MetroArea__c,
            accState: this.accountInfo.BillingState,
        })
            .then((records) => {
                if (records) {
                    var tempContactList = [];
                    for (var i = 0; i < records.length; i++) {
                        let tempContactRecord = Object.assign({}, records[i]); //cloning object


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

    DcConsultantChevronButtonClicked() {
        this.DcConsultantCollapsed = !this.DcConsultantCollapsed;
    }

    /**
     * For sorting the table based on column and sort direction
    */
    updateColumnSorting(event) {
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
        this.getRelatedContactsToAccount(this.recordId, tempSortBy, this.sortedDirection);
    }

    /**
    * For redirecting to Standard View All page
    */
    handleShowFullRelatedList() {
        var url = '/dc-consultant-contacts?recordId=' + this.recordId;

        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: url
            }
        });
    }
}