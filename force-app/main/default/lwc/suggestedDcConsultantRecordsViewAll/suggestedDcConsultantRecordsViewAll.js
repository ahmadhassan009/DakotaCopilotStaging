import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getAllSuggestedDcConsultants from '@salesforce/apex/RelatedDcConsultantContOfAccController.getAllSuggestedDcConsultants';
import getUnAccessibleContactIds from '@salesforce/apex/RelatedDcConsultantContOfAccController.getUnAccessibleContactIds';
import getAccountInfo from '@salesforce/apex/RelatedDcConsultantContOfAccController.getAccountInfo';
import getCountOfSuggestedConsultants from '@salesforce/apex/RelatedDcConsultantContOfAccController.getCountOfSuggestedConsultants';

const COLUMNS = [
    { label: 'Contact Name', sortable: true, fieldName: "ContactLink", type: "url", typeAttributes: { label: { fieldName: 'ContactName' }, tooltip: { fieldName: 'ContactName' }, target: '_self' } },
    { label: 'Company', sortable: true, fieldName: "ContactCompanyLink", type: "url", typeAttributes: { label: { fieldName: 'ContactCompanyName' }, tooltip: { fieldName: 'ContactCompanyName' }, target: '_self' } },
    { label: 'Title', sortable: true, fieldName: 'ContactTitle', type: 'Text' },
    { label: 'College', sortable: false, fieldName: "CollegeLink", type: 'url', typeAttributes: { label: { fieldName: 'CollegeName' }, tooltip: { fieldName: 'CollegeName' }, target: '_self' } },
    { label: 'Metro Area', sortable: true, fieldName: "MetroAreaLink", type: 'url', typeAttributes: { label: { fieldName: 'MetroAreaofContact' }, tooltip: { fieldName: 'MetroAreaofContact' }, target: '_self' } },
    { label: 'Phone', sortable: true, fieldName: 'ContactPhone', type: 'Phone' },
    { label: 'Email', sortable: true, fieldName: 'ContactEmail', type: 'email' }

]

export default class SuggestedDcConsultantRecordsViewAll extends NavigationMixin(LightningElement) {
    @api recordId;
    offset = 0;
    limit = 50;
    plusSign;
    isLoading = false;
    columns;
    totalCount = 0;
    totalRecords = '0';
    defaultSortDirection = 'asc';
    sortedBy = 'ContactLink';
    sortedDirection = 'asc';
    nameSortDir = this.defaultSortDirection;
    tempSortBy = '';
    data;
    queryOffset = 0;
    queryLimit = 50;
    dataIndex = 0;
    dataSorting = false;
    fromLoadMore = false;
    infiniteLoading = false;
    tableElement;
    isRefresh = false;
    allContactsOfAccount = [];
    currentContactsOfAccountRecords = [];
    currentContactsOfAccountRecordsCount;
    unAccessibleContactIds = [];
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        this.setRecordsInInitialState();
    }

    setRecordsInInitialState() {
        this.isLoading = true;
        this.setLinks();
        this.columns = COLUMNS;


        getAccountInfo({
            recordId: this.recordId
        }).then((returnedAccount) => {
            if (returnedAccount) {
                this.accountInfo = returnedAccount;
                getUnAccessibleContactIds({
                    recordId: this.recordId
                }).then(returnedIds => {
                    this.unAccessibleContactIds = returnedIds;
                    this.setFieldSorting();
                    this.fetchCountOfSuggestedConsultants();
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
    * Fetch count of suggested consultant contacts
    * All consultant that aer not in level one and level two are suggested consultants
    */
    fetchCountOfSuggestedConsultants() {

        getCountOfSuggestedConsultants({
            recordId: this.recordId,
            accMetroArea: this.accountInfo.MetroArea__c,
            accState: this.accountInfo.BillingState,
            unAccessibleContactIds: this.unAccessibleContactIds
        })
            .then((totalCount) => {
                this.totalCount = totalCount;
                if (totalCount > 0) {
                    this.getAllSuggestedDcConsultants(this.recordId, this.tempSortBy, this.sortedDirection, this.limit, this.offset);
                    this.sortedDirection = 'asc';
                    this.sortedBy = 'ContactLink';
                }
            })
            .catch((error) => {
                console.log('Error in fetching Suggested Consultant Contact record count : ', error);
                this.isLoading = false;

            });
    }

    setFieldSorting() {
        this.tempSortBy = this.sortedBy;
        if (this.sortedBy === 'ContactLink') {
            this.tempSortBy = 'Contact__r.Name';
        } else if (this.sortedBy === 'ContactEmail') {
            this.tempSortBy = 'Contact__r.Email';
        } else if (this.sortedBy === 'ContactTitle') {
            this.tempSortBy = 'Contact__r.Title';
        } else if (this.sortedBy === 'ContactCompanyLink') {
            this.tempSortBy = 'Contact__r.Account.Name';
        } else if (this.sortedBy === 'ContactPhone') {
            this.tempSortBy = 'Contact__r.Phone';
        } else if (this.sortedBy === 'MetroAreaLink') {
            this.tempSortBy = 'Contact__r.Metro_Area__r.Name';
        }
    }

    getAllSuggestedDcConsultants(recordId, sortedBy, sortedDirection, limit, offset) {
        
        getAllSuggestedDcConsultants({
            recordId: recordId,
            sortedBy: sortedBy,
            sortOrder: sortedDirection,
            recordLimit: limit,
            offset: offset,
            unAccessibleContactIds: this.unAccessibleContactIds,
            accMetroArea: this.accountInfo.MetroArea__c,
            accState: this.accountInfo.BillingState
        })
            .then((records) => {
                if (records) {
                    let len = records.length;
                    let tempContactList = [];
                    this.recordName = records[0].AccountName;
                    for (let i = 0; i < len; i++) {
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

                    if (this.fromLoadMore) {
                        if (this.data)
                            this.data = this.data.concat(tempContactList);
                        if ((this.offset + this.limit) >= this.totalCount || (this.offset) == 0) {
                            this.offset = this.totalCount;
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
                        this.data = [];
                        this.data = tempContactList;
                    }

                    this.offset = this.data.length;
                    if ((this.data.length) >= this.totalCount) {
                        this.plusSign = '';
                    } else {
                        this.plusSign = '+';
                    }

                }
                else {
                    this.data = null;
                }
                this.isLoading = false;
                if (this.dataSorting) {
                    this.dataSorting = false;
                }
            })
            .catch((error) => {
                console.log('Error in fetching DC Consultant Contact records : ', error);
                this.isLoading = false;
                this.infiniteLoading = false;
            });
    }

    updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.isLoading = true;
        this.dataSorting = true;
        this.setFieldSorting();
        this.sortedDirection = this.nameSortDir === 'asc' ? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.getAllSuggestedDcConsultants(this.recordId, this.tempSortBy, this.sortedDirection, this.offset, 0);
    }

    loadMoreData(event) {
        if (this.isRefresh) {
            this.isRefresh = false;
        }
        else {


            if (this.totalCount > this.offset) {
                if (this.infiniteLoading) {
                    return;
                }
                if (this.dataSorting) {
                    return;
                }
                this.infiniteLoading = true;
                //Display a spinner to signal that data is being loaded
                if (this.data != null && event.target) {
                    event.target.isLoading = true;
                }
                this.tableElement = event.target;
                this.fromLoadMore = true;
                this.setFieldSorting();
                this.getAllSuggestedDcConsultants(this.recordId, this.tempSortBy, this.sortedDirection, this.limit, this.offset);
            }

        }
    }

    refreshTable() {
        this.isLoading = true;
        this.isRefresh = true;
        this.totalCount = 0;
        this.offset = 0;
        this.limit = 50;
        this.plusSign = '';
        this.sortedDirection = 'asc';
        this.defaultSortDirection = 'asc';
        this.nameSortDir = this.defaultSortDirection;
        this.sortedBy = 'ContactLink';
        this.data = [];
        this.allContactsOfAccount = [];
        this.queryOffset = 0;
        this.queryLimit = 50;
        this.dataIndex = 0;
        this.allContactsOfAccount = [];
        this.currentContactsOfAccountRecords = [];
        this.currentContactsOfAccountRecordsCount;
        this.setRecordsInInitialState();

    }

    //Set breadcrumb links
    setLinks() {
        this.recordLink = "/" + this.communityName + "/s/account/" + this.recordId;
        this.maNameLink = "/" + this.communityName + '/s/account/Account/Default';
    }
}