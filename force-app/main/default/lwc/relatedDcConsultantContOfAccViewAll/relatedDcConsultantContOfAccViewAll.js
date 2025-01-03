import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getAllRelatedSortedContactsOfAccount from '@salesforce/apex/RelatedDcConsultantContOfAccController.getAllRelatedSortedContactsOfAccount';
import getUnAccessibleContactIds from '@salesforce/apex/RelatedDcConsultantContOfAccController.getUnAccessibleContactIds';
import getAccountInfo from '@salesforce/apex/RelatedDcConsultantContOfAccController.getAccountInfo';
import getCountOfLevelOneAndTwoRecords from '@salesforce/apex/RelatedDcConsultantContOfAccController.getCountOfLevelOneAndTwoRecords';

const COLUMNS = [
    { label: 'Contact Name', sortable: true, fieldName: "ContactLink", type: "url", typeAttributes: { label: { fieldName: 'ContactName' }, tooltip: { fieldName: 'ContactName' }, target: '_self' } },
    { label: 'Company', sortable: true, fieldName: "ContactCompanyLink", type: "url", typeAttributes: { label: { fieldName: 'ContactCompanyName' }, tooltip: { fieldName: 'ContactCompanyName' }, target: '_self' } },
    { label: 'Title', sortable: true, fieldName: 'ContactTitle', type: 'Text' },
    { label: 'College', sortable: false, fieldName: "CollegeLink", type: 'url', typeAttributes: { label: { fieldName: 'CollegeName' }, tooltip: { fieldName: 'CollegeName' }, target: '_self' } },
    { label: 'Metro Area', sortable: true, fieldName: "MetroAreaLink", type: 'url', typeAttributes: { label: { fieldName: 'MetroAreaofContact' }, tooltip: { fieldName: 'MetroAreaofContact' }, target: '_self' } },
    { label: 'Phone', sortable: true, fieldName: 'ContactPhone', type: 'Phone' },
    { label: 'Email', sortable: true, fieldName: 'ContactEmail', type: 'email' }

]

export default class RelatedDcConsultantContOfAccViewAll extends NavigationMixin(LightningElement) {
    @api recordId;
    offset = 0;
    limit = 50;
    plusSign;
    isLoading = false;
    columns;
    totalCount = 0;
    totalRecords = '0';
    defaultSortDirection = 'asc';
    sortedBy = '';
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
    isDefaultState = true;
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
        })
            .then((totalCount) => {
                this.totalCount = totalCount;
                if (totalCount > 0) {
                    this.getAllRelatedSortedContactsOfAccount(this.recordId, this.sortedBy, this.sortedDirection, this.limit, this.offset);
                    this.sortedDirection = 'asc';
                    this.sortedBy = '';
                }
            })
            .catch((error) => {
                console.log('Error for count : ', error);
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

    getAllRelatedSortedContactsOfAccount(recordId, sortedBy, sortedDirection, limit, offset) {
        getAllRelatedSortedContactsOfAccount({
            recordId: recordId,
            sortedBy: sortedBy,
            sortOrder: sortedDirection,
            recordLimit: limit,
            offset: offset,
            isDefaultState: this.isDefaultState,
            unAccessibleContactIds: this.unAccessibleContactIds,
            accState: this.accountInfo.BillingState
        })
            .then((records) => {
                if (records) {
                    let len = records.length;
                    let tempContactList = [];
                    if (len>0)
                    {
                        this.recordName = records[0].AccountName;
                    }
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
                    if (this.isDefaultState) {
                        this.allContactsOfAccount = tempContactList;
                        this.processContactsOfAccountRecords();
                    }
                    else {
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

    processContactsOfAccountRecords() {
        let contactList = [];
        let i = this.queryOffset;
        let limit = this.queryLimit + this.queryOffset;
        while (i < this.totalCount && i < limit) {
            contactList.push(this.allContactsOfAccount[this.dataIndex]);
            this.dataIndex++;
            i++;
        }
        let newRecords = [...this.currentContactsOfAccountRecords, ...contactList];
        this.currentContactsOfAccountRecords = newRecords;
        this.data = this.currentContactsOfAccountRecords;
        this.queryOffset = this.queryOffset + this.queryLimit;
        this.offset = this.queryOffset;
        if ((this.queryOffset) >= this.totalCount || (this.queryOffset) == 0) {
            this.plusSign = '';
            if (this.queryOffset != 0) {
                this.offset = this.totalCount;
            }
        }
        else {
            this.plusSign = '+';
        }

        this.isLoading = false;

    }

    updateColumnSorting(event) {
        this.isDefaultState = false;
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.isLoading = true;
        this.dataSorting = true;
        this.setFieldSorting();
        this.sortedDirection = this.nameSortDir === 'asc' ? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.getAllRelatedSortedContactsOfAccount(this.recordId, this.tempSortBy, this.sortedDirection, this.offset, 0);
    }

    loadMoreData(event) {
        if (this.isRefresh) {
            this.isRefresh = false;
        }
        else {
            if (this.isDefaultState) {
                if (this.totalCount > this.queryOffset) {

                    //Display a spinner to signal that data is being loaded   
                    this.infiniteLoading = true;
                    event.target.isLoading = true;
                    this.processContactsOfAccountRecords();
                    event.target.isLoading = false;
                    this.fromLoadMore = false;
                    this.infiniteLoading = false;
                }
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
                    this.getAllRelatedSortedContactsOfAccount(this.recordId, this.tempSortBy, this.sortedDirection, this.limit, this.offset);
                }
            }
        }
    }

    refreshTable() {
        this.isDefaultState = true;
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
        this.isDefaultState = true;
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