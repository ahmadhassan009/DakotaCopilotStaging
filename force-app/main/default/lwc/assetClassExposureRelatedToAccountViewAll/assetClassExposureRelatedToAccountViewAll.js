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
import AssetClassExposureCSS from '@salesforce/resourceUrl/AssetClassExposureCSS';
import getAccountName from '@salesforce/apex/ContactRelatedToAccountController.getAccountName';
import activeCommunities from '@salesforce/label/c.active_communities';
import getAssetClassExposureRecordCount from '@salesforce/apex/AssetClassRelatedToAccountController.getAssetClassExposureRecordCount';
import getAssetClassExposureRecords from '@salesforce/apex/AssetClassRelatedToAccountController.getAssetClassExposureRecords';
import NAME_FIELD from '@salesforce/schema/Asset_Class_Exposure__c.Name';
import FUND_BALANCE_FIELD from '@salesforce/schema/Asset_Class_Exposure__c.Fund_Balance__c';
import ASSET_CLASS_FIELD from '@salesforce/schema/Asset_Class_Exposure__c.Asset_Class__c';
import FUNDING_YEAR_FIELD from '@salesforce/schema/Asset_Class_Exposure__c.Funding_Year__c';

const COLUMNS = [{
        label: "Asset Class Exposure Name",
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
        label: "Amount",
        sortable: true,
        fieldName: FUND_BALANCE_FIELD.fieldApiName,
        type: "currency",
        typeAttributes: {
            minimumFractionDigits: '0'
        },
        cellAttributes: {
            alignment: 'left'
        }
    },
    {
        label: "Asset Class",
        sortable: true,
        fieldName: ASSET_CLASS_FIELD.fieldApiName,
        type: "text"
    },
    {
        label: "Funding Year",
        sortable: true,
        fieldName: FUNDING_YEAR_FIELD.fieldApiName,
        type: "text"
    }
];

export default class AssetClassExposureRelatedToAccountViewAll extends NavigationMixin(LightningElement) {
    @api recordId;
    @api isCommunity;
    offset = 0;
    limit = 50;
    columns = COLUMNS;
    accountNameLink;
    recordName;
    totalAssetClassCount;
    dataSorting = false;
    fromLoadMore = false;
    infiniteLoading = false;
    isLoading = true;
    plusSign;
    totalRecords = '0';
    nullOrder = 'LAST';
    isCommunity = false;
    tempSortBy = '';
    defaultSortDirection = 'asc';
    sortedBy = 'recordLink';
    nameSortDir = this.defaultSortDirection;
    sortedDirection = 'asc';
    assetClassRecords;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    /**
     * Connected call hook
     * Gets executed when component is loaded
     * Fetching record count and first 50 records of Investments
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
            loadStyle(this, AssetClassExposureCSS)
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

        //To fetch number of Investment records
        getAssetClassExposureRecordCount({
            recordId: this.recordId
        }).then(assetClassExposureCount => {
            if (assetClassExposureCount)
                this.totalAssetClassCount = assetClassExposureCount;
            //To fetch Annual Reports and Holding records
            this.setFieldSorting();
            this.getAssetClassExposureRecords(this.recordId, this.tempSortBy, this.sortedDirection, this.limit, this.offset);
            this.sortedDirection = 'asc';
            this.sortedBy = 'recordLink';
        }).catch(error => {
            console.log("Error in fetching total count of Investment records : ", error);
        });
    }

    /**
     * Set field api name before sorting data
     */
    setFieldSorting() {
        this.tempSortBy = this.sortedBy;
        if (this.sortedBy === 'recordLink') {
            this.tempSortBy = 'Name';
        }
    }

    /**
     * To get Investments records linked to the account
     * @param recordId current account record Id
     * @param sortedBy field to be sorted on (Default sorted on Name)
     * @param sortedDirection sorting direction
     * @param limit record limit
     * @param offset record offset
     */
    getAssetClassExposureRecords(recordId, sortedBy, sortedDirection, limit, offset) {
        if (sortedDirection == 'desc') {
            this.nullOrder = 'LAST';
        } else {
            this.nullOrder = 'FIRST';
        }
        //Getting Investments records based on the passed Account Id
        getAssetClassExposureRecords({
                recordId: recordId,
                sortedBy: sortedBy,
                sortOrder: sortedDirection,
                recLimit: limit,
                offset: offset,
                nullOrder: this.nullOrder
            })
            .then((assetClassRecords) => {
                if (assetClassRecords) {
                    let len = assetClassRecords.length;
                    let assetClassList = [];
                    for (let i = 0; i < len; i++) {
                        let tempAssetClassRecord = Object.assign({}, assetClassRecords[i]); //cloning object
                        if (this.isCommunity) {
                            if (tempAssetClassRecord.Id != undefined)
                                tempAssetClassRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempAssetClassRecord.Id;
                        } else {
                            if (tempAssetClassRecord.Id != undefined)
                                tempAssetClassRecord.recordLink = "/" + tempAssetClassRecord.Id;
                        }

                        assetClassList.push(tempAssetClassRecord);
                    }

                    if (this.fromLoadMore) {
                        if (this.assetClassRecords)
                            this.assetClassRecords = this.assetClassRecords.concat(assetClassList);
                        if ((this.offset + this.limit) >= this.totalAssetClassCount || (this.offset) == 0) {
                            this.offset = this.totalAssetClassCount;
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
                        this.assetClassRecords = assetClassList;
                    }

                    this.offset = this.assetClassRecords.length;
                    if ((this.assetClassRecords.length) >= this.totalAssetClassCount) {
                        this.plusSign = '';
                    } else {
                        this.plusSign = '+';
                    }
                } else {
                    this.assetClassRecords = null;
                }
                this.isLoading = false;
                if (this.dataSorting) {
                    this.dataSorting = false;
                }
            })
            .catch((error) => {
                console.log('Error in fetching investment records : ', error);
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
        this.assetClassRecords = [];

        this.setFieldSorting();

        this.sortedDirection = this.nameSortDir === 'asc' ? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.getAssetClassExposureRecords(this.recordId, this.tempSortBy, this.sortedDirection, this.offset, 0);
    }

    /**
     * For loading more records on scroll down
     * @param {*} event 
     */
    loadMoreData(event) {
        if (this.totalAssetClassCount > this.offset) {
            if (this.infiniteLoading) {
                return;
            }
            if (this.dataSorting) {
                return;
            }
            this.infiniteLoading = true;
            //Display a spinner to signal that data is being loaded
            if (this.assetClassRecords != null && event.target) {
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            this.fromLoadMore = true;
            this.setFieldSorting();
            this.getAssetClassExposureRecords(this.recordId, this.tempSortBy, this.sortedDirection, this.limit, this.offset);

        }
    }

    /**
     * Method is called when Refresh button on related list is clicked
     */
    refreshTable() {
        this.offset = 0;
        this.limit = 50;
        this.plusSign = '';
        this.sortedDirection = 'asc';
        this.defaultSortDirection = 'asc';
        this.nameSortDir = this.defaultSortDirection;
        this.sortedBy = 'recordLink';
        this.assetClassRecords = [];
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