import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import getRecordsCount from '@salesforce/apex/InvestmentStrategyRelatedToAccountCont.getRecordsCount';
import getInvestmentStrategyRecords from '@salesforce/apex/InvestmentStrategyRelatedToAccountCont.getInvestmentStrategyRecords';
import activeCommunities from '@salesforce/label/c.active_communities';

const COLUMNS = [

    { label: 'Investment Strategy Name', sortable: true, fieldName: "invStrategyId", type: 'url', typeAttributes: { label: { fieldName: 'invStrategyName' }, tooltip: { fieldName: 'invStrategyName' }, target: '_self' } },
    { label: 'Asset Class', sortable: true, initialWidth: 250, fieldName: "Asset_Class_picklist", type: 'text' },
    { label: 'Sub-Asset Class', sortable: true, initialWidth: 250, fieldName: "Sub_Asset_Class", type: 'text' },
]

const PER_COLUMNS = [

    { label: 'Performance Name', sortable: true, fieldName: "invStrategyId", type: 'url', typeAttributes: { label: { fieldName: 'invStrategyName' }, tooltip: { fieldName: 'invStrategyName' }, target: '_self' } },
    { label: 'Vintage', sortable: true, initialWidth: 100, fieldName: "Vintage", type: 'text', cellAttributes: { alignment: 'left' } },
    { label: 'Net IRR', sortable: true, initialWidth: 100, fieldName: "Net_IRR", type: 'percent', typeAttributes: { maximumFractionDigits: '2', minimumFractionDigits: '2' }, cellAttributes: { alignment: 'left' } },
    { label: 'Capital Drawn', sortable: true, initialWidth: 150, fieldName: "Capital_Drawn", type: 'currency', typeAttributes: { maximumFractionDigits: '0' }, cellAttributes: { alignment: 'left' } },
    { label: 'DPI', sortable: true, initialWidth: 100, fieldName: "Yield_DPI", type: 'number', typeAttributes: { maximumFractionDigits: '2', minimumFractionDigits: '2' }, cellAttributes: { alignment: 'left' } },
    { label: 'TVPI', sortable: true, initialWidth: 100, fieldName: "TVPI", type: 'number', typeAttributes: { maximumFractionDigits: '2', minimumFractionDigits: '2' }, cellAttributes: { alignment: 'left' } },
    { label: 'As of Date', sortable: true, initialWidth: 150, fieldName: "As_of_Date", type: 'date', cellAttributes: { alignment: 'left' }, typeAttributes: { day: "numeric", month: "numeric", year: "numeric" } },
]

export default class InvestmentStrategyRelatedToAccount extends NavigationMixin(LightningElement) {
    @api recordId;
    @api relatedListName
    columns = COLUMNS;
    isLoading = true;
    totalRecords = '0';
    nullOrder = 'FIRST';
    sortedBy = 'invStrategyId';
    sortedDirection = 'asc';
    defaultSortDirection = 'asc';
    recordsExist = false;
    recordName;
    data;
    isCommunity = false;
    sitePageName = '';
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    iconName = '';
    className = '';

    connectedCallback() {
        this.isLoading = true;
        this.iconName = `${this.relatedListName == 'Performance' ? 'standard:metrics' : 'custom:custom43'}`;
        this.className = this.relatedListName == 'Performance' ? 'performance_icon' : '';
        this.renderRelatedList();
    }

    renderRelatedList() {
        if (this.relatedListName == 'Performance') {
            this.columns = PER_COLUMNS;
            this.sortedBy = 'As_of_Date';
            this.sortedDirection = 'desc';
            this.sitePageName = '/performance';
        }
        else {
            this.columns = COLUMNS;
            this.sortedBy = 'invStrategyId';
            this.sitePageName = '/investment-strategy-to-account-viewall';
        }
        //To fetch number of Education records
        getRecordsCount({
            recordId: this.recordId,
            relatedListName: this.relatedListName
        })
            .then((totalCount) => {
                if (totalCount <= 0) {
                    this.recordsExist = false;
                }
                else {
                    this.recordsExist = true;
                }
                if (totalCount > 10) {
                    this.totalRecords = '10+';
                }
                else {
                    this.totalRecords = totalCount;
                }
                if (totalCount > 0) {
                    this.getInvestmentStrategyRecords(this.recordId, (this.relatedListName == 'Performance') ? 'As_of_Date__c' : 'Name', this.sortedDirection);
                }
            })
            .catch((error) => {
                console.log('Error for count : ', error);
                this.isLoading = false;
            });
    }

    getInvestmentStrategyRecords(recordId, sortedBy, sortedDirection) {
        this.isLoading = true;
        if (sortedDirection == 'desc') {
            this.nullOrder = 'LAST';
        }
        else {
            this.nullOrder = 'FIRST';
        }

        getInvestmentStrategyRecords({
            recordId: recordId,
            sortedBy: sortedBy,
            sortOrder: sortedDirection,
            nullOrder: this.nullOrder,
            relatedListName: this.relatedListName
        }).then(returnedData => {
            this.isLoading = false;
            if (returnedData) {
                for (var i = 0; i < returnedData.length; i++) {
                    if (returnedData[i].Id) {
                        returnedData[i].invStrategyId = "/" + this.communityName + (this.relatedListName == 'Performance' ? '/s/performance/' : '/s/investment-strategy/') + returnedData[i].Id;
                        returnedData[i].invStrategyName = returnedData[i].Name;
                    }
                    if (returnedData[i].Net_IRR) {
                        returnedData[i].Net_IRR = returnedData[i].Net_IRR / 100;
                    }
                }
                this.data = returnedData;
                this.isLoading = false;
            }
            else {
                this.data = null;
            }
        }).catch(error => {
            this.isLoading = false;
        });
    }

    updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;

        let tempSortBy = this.sortedBy;
        if (this.sortedBy === 'invStrategyId') {
            tempSortBy = 'Name';
        }
        else if (this.sortedBy === 'TVPI') {
            tempSortBy = 'TVPI__c';
        }
        else if (this.sortedBy === 'As_of_Date') {
            tempSortBy = 'As_of_Date__c';
        }
        else if (this.sortedBy === 'Capital_Drawn') {
            tempSortBy = 'Capital_Drawn__c';
        }
        else if (this.sortedBy === 'Net_IRR') {
            tempSortBy = 'Net_IRR__c';
        }
        else if (this.sortedBy === 'Vintage') {
            tempSortBy = 'Vintage__c';
        }
        else if (this.sortedBy === 'Yield_DPI') {
            tempSortBy = 'Yield_DPI__c';
        } else if (this.sortedBy == 'Asset_Class_picklist') {
            tempSortBy = 'Asset_Class_picklist__c';
        } else if (this.sortedBy == 'Sub_Asset_Class') {
            tempSortBy = 'Sub_Asset_Class__c';
        }
        this.getInvestmentStrategyRecords(this.recordId, tempSortBy, this.sortedDirection);
    }

    handleShowFullRelatedList() {
        var url = this.sitePageName + '?recordId=' + this.recordId + '&listType=' + this.relatedListName;

        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: url
            }
        });

    }
}