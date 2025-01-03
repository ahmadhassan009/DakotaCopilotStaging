import { LightningElement, wire, api, track } from 'lwc';
import fetchPerformanceRecords from '@salesforce/apex/PerformanceDashboardController.fetchPerformanceRecords';
import fetchPerformanceRecordsCount from '@salesforce/apex/PerformanceDashboardController.fetchPerformanceRecordsCount';
import activeCommunities from '@salesforce/label/c.active_communities';
import { loadStyle } from 'lightning/platformResourceLoader';
import managerPresentationDatatableCss from '@salesforce/resourceUrl/managerPresentationDatatableCss';
// importing navigation service
import { NavigationMixin } from 'lightning/navigation';

const DEFAULT_COLUMNS = [
    { label: "Account", fieldName: "AccountUrl", hideDefaultActions: true, type: "url", typeAttributes: { label: { fieldName: 'AccountName' }, target: '_self', tooltip: { fieldName: 'AccountName' } }, sortable: "true" },
    { label: "Performance Name", fieldName: "InvestmentStrategyUrl", hideDefaultActions: true, type: "url", typeAttributes: { label: { fieldName: 'Name' }, target: '_self', tooltip: { fieldName: 'Name' } }, sortable: "true", initialWidth: 230 },
    { label: "Asset Class", fieldName: "Asset_Class_picklist__c", type: "text", hideDefaultActions: true, sortable: "true" },
    { label: "Sub-Asset Class", fieldName: "Sub_Asset_Class__c", type: "text", hideDefaultActions: true, sortable: "true" },
    { label: "Vintage", fieldName: "Vintage__c", type: "text", hideDefaultActions: true, sortable: "true" },
    { label: "Net IRR", fieldName: "Net_IRR__c", type: 'text', cellAttributes: { alignment: 'left' }, hideDefaultActions: true, sortable: "true" },
    { label: "TVPI", fieldName: "TVPI__c", type: 'text', cellAttributes: { alignment: 'left' }, hideDefaultActions: true, sortable: "true", initialWidth: 96 },
    { label: "Yield / DPI", fieldName: "Yield_DPI__c", type: "decimal", cellAttributes: { alignment: 'left' }, typeAttributes: { minimumFractionDigits: '0', maximumFractionDigits: '0' }, hideDefaultActions: true, sortable: "true" },
    { label: "Strategy AUM", fieldName: "Performance_AUM__c", type: 'currency', cellAttributes: { alignment: 'left' }, typeAttributes: { minimumFractionDigits: '0', maximumFractionDigits: '2' }, hideDefaultActions: true, sortable: "true" },
    { label: "As of Date", fieldName: "As_of_Date__c", type: "date-local", typeAttributes: { day: "numeric", month: "numeric", year: "numeric" }, hideDefaultActions: true, sortable: "true", initialWidth: 190 }
];

const HEDGE_FUND_COLUMNS = [
    { label: "Account", fieldName: "AccountUrl", hideDefaultActions: true, type: "url", typeAttributes: { label: { fieldName: 'AccountName' }, target: '_self', tooltip: { fieldName: 'AccountName' } }, sortable: "true" },
    { label: "Performance Name", fieldName: "InvestmentStrategyUrl", hideDefaultActions: true, type: "url", typeAttributes: { label: { fieldName: 'Name' }, target: '_self', tooltip: { fieldName: 'Name' } }, sortable: "true", initialWidth: 230 },
    { label: "Asset Class", fieldName: "AssetClass", type: "text", hideDefaultActions: true, sortable: "true" },
    { label: "Sub-Asset Class", fieldName: "SubAssetClass", type: "text", hideDefaultActions: true, sortable: "true" },
    { label: "As of Date", fieldName: "AsOfDate", type: "date-local", typeAttributes: { day: "numeric", month: "numeric", year: "numeric" }, hideDefaultActions: true, sortable: "true", initialWidth: 190 },
    { label: "Rate of Return", fieldName: "ROR", type: 'text', cellAttributes: { alignment: 'left' }, hideDefaultActions: true, sortable: "true" },
    { label: "Performance Fee", fieldName: "PerfFee", type: 'text', cellAttributes: { alignment: 'left' }, hideDefaultActions: true, sortable: "true" },
    { label: "Mgmt Fee", fieldName: "MgmtFee", type: 'text', cellAttributes: { alignment: 'left' }, hideDefaultActions: true, sortable: "true" },
    // { label: "Net IRR", fieldName: "NetIRR", type: 'text', cellAttributes: { alignment: 'left' }, hideDefaultActions: true, sortable: "true" },
    // { label: "Yield / DPI", fieldName: "YieldDPI", type: "decimal", cellAttributes: { alignment: 'left' }, typeAttributes: { minimumFractionDigits: '0', maximumFractionDigits: '0' }, hideDefaultActions: true, sortable: "true" },
    // { label: "TVPI", fieldName: "TVPI", type: 'text', cellAttributes: { alignment: 'left' }, hideDefaultActions: true, sortable: "true", initialWidth: 96 },
];

export default class PerformanceDashboard extends NavigationMixin(LightningElement) {
    @api portalType;
    @track sortBy = 'Performance_AUM__c';
    @track sortDirection = 'desc';

    isLoading = true;
    performanceRecords = [];
    allRecords;
    performanceRecordsExist = false;
    columns = DEFAULT_COLUMNS;
    totalNumberOfRows;
    currentCount = 0;
    limit = 20;
    offset = 0;
    nullOrder = 'LAST';
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    isCommunity = false;
    isLoadMore = false;
    assetClassOptions = [
        { label: 'Private Equity', value: 'Private Equity' },
        { label: 'Private Credit', value: 'Private Credit' },
        { label: 'Real Assets', value: 'Real Assets' },
        // { label: 'Hedge Fund', value: 'Hedge Fund' },
        { label: 'Private Real Estate', value: 'Private Real Estate' },
        { label: 'Private Infrastructure', value: 'Private Infrastructure' }
    ];

    subAssetClassOptions = [
        { label: 'Asset Backed/Securitized', value: 'Asset Backed/Securitized' },
        { label: 'Co-Investment Private Equity', value: 'Co-Investment Private Equity' },
        { label: 'Co-Investment Real Estate', value: 'Co-Investment Real Estate' },
        { label: 'Core Plus Real Estate', value: 'Core Plus Real Estate' },
        { label: 'Core Real Estate', value: 'Core Real Estate' },
        { label: 'Direct Lending', value: 'Direct Lending' },
        { label: 'Early Stage', value: 'Early Stage' },
        { label: 'Energy Private Equity', value: 'Energy Private Equity' },
        { label: 'Entertainment Financing', value: 'Entertainment Financing' },
        { label: 'Global Infrastructure', value: 'Global Infrastructure' },
        { label: 'Growth Equity', value: 'Growth Equity' },
        { label: 'Healthcare Private Equity', value: 'Healthcare Private Equity' },
        { label: 'Infrastructure', value: 'Infrastructure' },
        { label: 'Insurance Related', value: 'Insurance Related' },
        { label: 'Large Buyout', value: 'Large Buyout' },
        { label: 'Late Stage', value: 'Late Stage' },
        { label: 'Lower Middle Market Buyout', value: 'Lower Middle Market Buyout' },
        { label: 'Mezzanine', value: 'Mezzanine' },
        { label: 'Middle Market Buyout', value: 'Middle Market Buyout' },
        { label: 'Natural Resources', value: 'Natural Resources' },
        { label: 'Oil & Gas', value: 'Oil & Gas' },
        { label: 'Opportunistic', value: 'Opportunistic' },
        { label: 'Opportunistic Real Estate', value: 'Opportunistic Real Estate' },
        { label: 'PE Fund of Funds', value: 'PE Fund of Funds' },
        { label: 'Private Credit', value: 'Private Credit' },
        { label: 'Private Infrastructure', value: 'Private Infrastructure' },
        { label: 'Real Assets', value: 'Real Assets' },
        { label: 'Real Estate Debt', value: 'Real Estate Debt' },
        { label: 'Secondary Private Equity', value: 'Secondary Private Equity' },
        { label: 'Special Situations', value: 'Special Situations' },
        { label: 'Structural Credit', value: 'Structural Credit' },
        { label: 'Timber', value: 'Timber' },
        { label: 'Value-Add Real Estate', value: 'Value-Add Real Estate' },
        { label: 'Venture Capital', value: 'Venture Capital' }
    ];

    vintageOptions = [
    ];
    oldVintageFilterValue = [];
    oldSubAssetClassFilterValue = [];
    oldAssetClassFilterValue = [];
    vintageFilterValue = [];
    subAssetClassValue = [];
    assetClassFilterValue = [];

    isDropDownOpen = false;
    isInProgress = false;

    aFilter = [];
    sFilter = [];
    vFilter = [];

    async connectedCallback() {
        this.isLoading = true;
        Promise.all([
            loadStyle(this, managerPresentationDatatableCss)
        ]);
        let currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        const currentYear = new Date().getFullYear();
        for (let i = currentYear; i >= 2000; i--) {
            this.vintageOptions.push({
                label: `${i}`,
                value: `${i}`,
                selected: false
            });
        }
        document?.addEventListener('click', () => {
            this.handleListClose()
        });
        this.assetClassOptions.map((opt) => {
            opt.selected = false;
        })
        this.subAssetClassOptions.map((opt) => {
            opt.selected = false;
        })
        this.template.querySelector('[data-id="assetClass"]')?.handleListChange(this.assetClassOptions, true);
        this.template.querySelector('[data-id="subAssetClass"]')?.handleListChange(this.subAssetClassOptions, true);
        this.template.querySelector('[data-id="vintage"]')?.handleListChange(this.vintageOptions, true);
        this.sortBy = 'Performance_AUM__c';
        this.sortDirection = 'desc';
        this.columns = DEFAULT_COLUMNS;
        this.performanceRecords = [];
        this.totalNumberOfRows = 0;
        this.currentCount = 0;
        this.limit = 20;
        this.offset = 0;
        await this.fetchPerformanceRecords();
    }

    async handleListClose() {
        const multiPicklist = this.template.querySelectorAll('c-multi-select-combobox-custom')
        if (multiPicklist) {
            multiPicklist.forEach((mp) => {
                mp?.handleClose();
            });
            if ((JSON.stringify(this.oldAssetClassFilterValue) != JSON.stringify(this.assetClassFilterValue) ||
                JSON.stringify(this.oldSubAssetClassFilterValue) != JSON.stringify(this.subAssetClassValue) ||
                JSON.stringify(this.oldVintageFilterValue) != JSON.stringify(this.vintageFilterValue)) && this.isDropDownOpen) {
                this.performanceRecords = [];
                this.totalNumberOfRows = 0;
                this.currentCount = 0;
                this.limit = 20;
                this.offset = 0;
                this.isLoading = true;
                this.aFilter = this.assetClassFilterValue;
                this.sFilter = this.subAssetClassValue;
                this.vFilter = this.vintageFilterValue;
                if (!this.isInProgress) {
                    await this.fetchPerformanceRecords();
                }
                this.oldVintageFilterValue = this.vintageFilterValue || [];
                this.oldSubAssetClassFilterValue = this.subAssetClassValue || [];
                this.oldAssetClassFilterValue = this.assetClassFilterValue || [];
            }
            this.isDropDownOpen = false;
        }
    }
    setSortBy() {
        let tempSortBy = '';
        if (this.sortBy == 'AccountUrl') {
            tempSortBy = 'Account__r.Name';
        } else if (this.sortBy == 'InvestmentStrategyUrl') {
            tempSortBy = 'Name';
        } else {
            tempSortBy = this.sortBy;
        }
        return tempSortBy;
    }

    async fetchPerformanceRecords() {
        try {
            this.isInProgress = true;
            let searchValue = this.template.querySelector('[data-id="searchValue"]')?.value || '';
            if (searchValue)
                searchValue = searchValue?.trim();
            this.nullOrder = (this.sortDirection == 'desc') ? 'LAST' : 'FIRST';
            this.columns = (this.assetClassFilterValue.includes('Hedge Fund')) ? HEDGE_FUND_COLUMNS : DEFAULT_COLUMNS;
            if (!this.isLoadMore) {
                this.totalNumberOfRows = await fetchPerformanceRecordsCount({
                    searchValue: searchValue,
                    vintageFilterValue: this.vFilter ? this.vFilter : '',
                    subAssetClassValue: this.sFilter ? this.sFilter : '',
                    assetClassFilterValue: this.aFilter ? this.aFilter : ''
                });
            }
            if (this.totalNumberOfRows > 0) {
                const returnedPerformanceRecords = await fetchPerformanceRecords({
                    searchValue: searchValue,
                    vintageFilterValue: this.vFilter ? this.vFilter : '',
                    subAssetClassValue: this.sFilter ? this.sFilter : '',
                    assetClassFilterValue: this.aFilter ? this.aFilter : '',
                    sortedBy: this.setSortBy(),
                    sortOrder: this.sortDirection,
                    nullOrder: this.nullOrder,
                    recordLimit: this.limit,
                    offset: this.offset,
                });
                if (returnedPerformanceRecords?.length > 0) {
                    let tempList = [];
                    returnedPerformanceRecords.forEach((obj) => {
                        let temObj = Object.assign({}, obj);
                        temObj.Name = obj?.Name;
                        temObj.AccountName = obj?.Account__r?.Name;
                        temObj.Asset_Class_picklist__c = obj?.Asset_Class_picklist__c;
                        temObj.Sub_Asset_Class__c = obj?.Sub_Asset_Class__c;
                        temObj.Vintage__c = obj?.Vintage__c;
                        temObj.Performance_AUM__c = obj?.Performance_AUM__c;
                        temObj.Net_IRR__c = (typeof obj?.Net_IRR__c != 'undefined' && obj?.Net_IRR__c != null) ? `${obj?.Net_IRR__c}%` : '';
                        temObj.Rate_Of_Return__c = obj?.Rate_Of_Return__c ? `${obj?.Rate_Of_Return__c}%` : '';
                        temObj.Performance_Fee__c = obj?.Performance_Fee__c ? `${obj?.Performance_Fee__c}%` : '';
                        temObj.Mgmt_Fee__c = obj?.Mgmt_Fee__c ? `${obj?.Mgmt_Fee__c}%` : '';
                        temObj.Yield_DPI__c = obj?.Yield_DPI__c;
                        temObj.TVPI__c = (obj?.TVPI__c || obj?.TVPI__c == 0) ? `${obj?.TVPI__c}` : '';
                        temObj.As_of_Date__c = obj?.As_of_Date__c;
                        if (this.isCommunity) {
                            temObj.AccountUrl = obj?.Account__c ? "/" + this.communityName + "/s/detail/" + obj?.Account__c : null;
                            temObj.InvestmentStrategyUrl = obj?.Id ? "/" + this.communityName + "/s/detail/" + obj?.Id : null;
                        } else {
                            temObj.AccountUrl = obj?.Account__c ? "/" + obj?.Account__c : null;
                            temObj.InvestmentStrategyUrl = obj?.Id ? "/" + obj?.Id : null;
                        }
                        tempList.push(temObj);
                    });

                    this.performanceRecords = this.performanceRecords?.concat(tempList);
                    this.currentCount = this.performanceRecords?.length;
                    this.performanceRecordsExist = true;
                    if ((this.offset + 20) >= this.totalNumberOfRows) {
                        this.offset = this.totalNumberOfRows;
                    } else {
                        this.offset = parseInt(this.offset) + parseInt(this.limit);
                    }
                    this.isLoadMore = false;
                    if (this.tableElement) {
                        this.tableElement.isLoading = false;
                    }
                    this.isLoading = false;
                }
            } else {
                this.isLoading = false;
                this.isLoadMore = false;
                this.currentCount = 0;
                this.performanceRecordsExist = false;
            }
            this.isInProgress = false;
        } catch (error) {
            this.isInProgress = false;
            this.isLoadMore = false;
            this.isLoading = false;
            console.log(error);
        }
    }

    handleAssetClassChange(e) {
        this.assetClassFilterValue = e?.detail?.map(selectedOption => selectedOption.value) || [];
    }

    storeAssetOldValues(event) {
        this.oldAssetClassFilterValue = event?.detail?.map(selectedOption => selectedOption.value) || [];
        this.assetClassFilterValue = event?.detail?.map(selectedOption => selectedOption.value) || [];
        this.template.querySelector('[data-id="subAssetClass"]')?.handleClose();
        this.template.querySelector('[data-id="vintage"]')?.handleClose();
        this.isDropDownOpen = true;
    }

    handleSubAssetClassChange(e) {
        this.subAssetClassValue = e?.detail?.map(selectedOption => selectedOption.value) || [];
    }

    storeSubAssetOldValues(event) {
        this.oldSubAssetClassFilterValue = event?.detail?.map(selectedOption => selectedOption.value) || [];
        this.subAssetClassValue = event?.detail?.map(selectedOption => selectedOption.value) || [];
        this.template.querySelector('[data-id="vintage"]')?.handleClose();
        this.template.querySelector('[data-id="assetClass"]')?.handleClose();
        this.isDropDownOpen = true;
    }

    handleVintageChange(e) {
        this.vintageFilterValue = e?.detail?.map(selectedOption => selectedOption.value) || [];
    }

    storeVintageOldValues(event) {
        this.oldVintageFilterValue = event?.detail?.map(selectedOption => selectedOption.value) || [];
        this.vintageFilterValue = event?.detail?.map(selectedOption => selectedOption.value) || [];
        this.template.querySelector('[data-id="subAssetClass"]')?.handleClose();
        this.template.querySelector('[data-id="assetClass"]')?.handleClose();
        this.isDropDownOpen = true;
    }

    async fetchSearchResults(event) {
        this.isLoading = true;
        this.performanceRecords = [];
        this.totalNumberOfRows = 0;
        this.currentCount = 0;
        this.limit = 20;
        this.offset = 0;
        this.isLoading = true;
        await this.fetchPerformanceRecords();
    }

    searchManagerPrestOnEnter(event) {
        if (event.keyCode == 13) {
            this.isLoading = true;
            this.fetchSearchResults(event);
        }
    }

    resetFilters(event) {
        this.isLoading = true;
        this.template.querySelector('[data-id="searchValue"]').value = '';
        this.vintageOptions = [];
        this.vintageFilterValue = [];
        this.assetClassFilterValue = [];
        this.subAssetClassValue = [];
        this.oldVintageFilterValue = [];
        this.oldAssetClassFilterValue = [];
        this.oldSubAssetClassValue = [];
        this.aFilter = [];
        this.sFilter = [];
        this.vFilter = [];
        this.connectedCallback();
    }

    async loadMoreData(event) {
        if (!this.isLoadMore && this.offset < this.totalNumberOfRows) {
            this.tableElement = event.target;
            this.isLoadMore = true;
            event.target.isLoading = true;
            await this.fetchPerformanceRecords(event);
        }
    }

    async doSorting(event) {
        this.isLoading = true;
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.performanceRecords = [];
        this.totalNumberOfRows = 0;
        this.currentCount = 0;
        this.limit = 20;
        this.offset = 0;
        await this.fetchPerformanceRecords();
    }
}