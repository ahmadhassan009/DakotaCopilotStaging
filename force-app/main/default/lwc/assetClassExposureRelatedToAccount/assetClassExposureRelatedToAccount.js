import {
    LightningElement,
    api
} from 'lwc';
import {
    NavigationMixin
} from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getSFBaseUrl from '@salesforce/apex/RelatedAccountsController.getSFBaseUrl';
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

export default class AssetClassExposureRelatedToAccount extends NavigationMixin(LightningElement) {
    @api recordId;
    baseURL = '';
    columns = COLUMNS;
    isLoading = true;
    offset = 0;
    limit = 10;
    totalRecords = '0';
    nullOrder = 'LAST';
    isCommunity = false;
    tempSortBy = '';
    sortedBy = 'recordLink';
    defaultSortDirection = 'asc';
    nameSortDir = this.defaultSortDirection;
    sortedDirection = 'asc';
    AssetClassExist = false;
    AssetClassRecords;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    /**
     * Connected call hook
     * Gets executed when component is loaded
     * Fetching record count and first 10 records of Investments
     */
    connectedCallback() {
        this.setRecordsInInitialState();
    }

    /**
     * Function to set records when the component is loaded/refreshed 
     */
    setRecordsInInitialState() {
        this.isLoading = true;
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

        //To fetch number of Investment records
        getAssetClassExposureRecordCount({
                recordId: this.recordId
            })
            .then((totalCount) => {
                if (totalCount == 0) {
                    this.AssetClassExist = false;
                } else {
                    this.AssetClassExist = true;
                }
                if (totalCount > 10) {
                    this.totalRecords = '10+';
                } else {
                    this.totalRecords = totalCount;
                }

                if (totalCount > 0) {
                    //To fetch Investments records
                    this.setFieldSorting();
                    this.getAssetClassExposureRecords(this.recordId, this.tempSortBy, this.sortedDirection, this.limit, this.offset);
                    this.sortedDirection = 'asc';
                    this.sortedBy = 'recordLink';
                }
            })
            .catch((error) => {
                console.log('Error for count : ', error);
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
        }
    }

    /**
     * To get Investments records linked to the account
     * @param recordId current account record Id
     * @param sortedBy field to be sorted on (Default sorted on Name)
     * @param sortedDirection sorting direction
     */
    getAssetClassExposureRecords(recordId, sortedBy, sortedDirection, limit, offset) {
        this.isLoading = true;
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
            .then((AssetClassRecords) => {
                if (AssetClassRecords) {
                    let len = AssetClassRecords.length;
                    let assetClassList = [];
                    for (let i = 0; i < len; i++) {
                        let tempAssetClassRecord = Object.assign({}, AssetClassRecords[i]); //cloning object
                        if (this.isCommunity) {
                            if (tempAssetClassRecord.Id != undefined)
                                tempAssetClassRecord.recordLink = "/" + this.communityName + "/s/detail/" + tempAssetClassRecord.Id;
                        } else {
                            if (tempAssetClassRecord.Id != undefined)
                                tempAssetClassRecord.recordLink = "/" + tempAssetClassRecord.Id;
                        }

                        assetClassList.push(tempAssetClassRecord);
                    }
                    this.AssetClassRecords = assetClassList;
                } else {
                    this.AssetClassRecords = null;
                }
                this.isLoading = false;
            })
            .catch((error) => {
                console.log('Error in fetching investment records : ', error);
                this.isLoading = false;
            });
    }

    /**
     * Method is called when Refresh button on related list is clicked
     */
    refreshTable() {
        this.sortedDirection = 'asc';
        this.defaultSortDirection = 'asc';
        this.nameSortDir = this.defaultSortDirection;
        this.sortedBy = 'recordLink';
        this.AssetClassRecords = [];
        this.setRecordsInInitialState();
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
        this.getAssetClassExposureRecords(this.recordId, this.tempSortBy, this.sortedDirection, this.limit, this.offset);
    }

    /**
     * For redirecting to Custom View All page
     */
    handleShowFullRelatedList() {
        var navigationURL = this.baseURL + '/lightning/cmp/c__AssetClassExposureDataTableView?c__recordId=' + this.recordId + '&c__isCommunity=' + this.isCommunity;
        var url = '/asset-class-exposure-viewall?recordId=' + this.recordId + '&isCommunity=' + this.isCommunity;

        if (this.isCommunity) {
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: url
                }
            });
        } else {
            window.open(navigationURL, "_self");
        }
    }
}