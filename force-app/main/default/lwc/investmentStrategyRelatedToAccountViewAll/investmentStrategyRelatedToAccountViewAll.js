import { LightningElement, api, track } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getAccountName from '@salesforce/apex/InvestmentsInAccountsController.getAccountName';
import getRecordsCount from '@salesforce/apex/InvestmentStrategyRelatedToAccountCont.getRecordsCount';
import getAccountRelatedInvestmentRecords from '@salesforce/apex/InvestmentStrategyRelatedToAccountCont.getAccountRelatedInvestmentRecords';
import activeCommunities from '@salesforce/label/c.active_communities';

const COLUMNS = [

    { label: 'Investment Strategy Name', sortable: true, fieldName: "invStrategyId", type: 'url', typeAttributes: { label: { fieldName: 'invStrategyName' }, tooltip: { fieldName: 'invStrategyName' }, target: '_self' } },
    { label: 'Asset Class', sortable: true, initialWidth: 450, fieldName: "Asset_Class_picklist", type: 'text' },
    { label: 'Sub-Asset Class', sortable: true, initialWidth: 450, fieldName: "Sub_Asset_Class", type: 'text' },
]

const PER_COLUMNS = [

    { label: 'Performance Name', sortable: true, fieldName: "invStrategyId", type: 'url', typeAttributes: { label: { fieldName: 'invStrategyName' }, tooltip: { fieldName: 'invStrategyName' }, target: '_self' } },
    { label: 'Vintage', sortable: true, initialWidth: 150, fieldName: "Vintage", type: 'text', cellAttributes: { alignment: 'left' } },
    { label: 'Net IRR', sortable: true, initialWidth: 150, fieldName: "Net_IRR", type: 'percent', typeAttributes: { maximumFractionDigits: '2', minimumFractionDigits: '2' }, cellAttributes: { alignment: 'left' } },
    { label: 'Capital Drawn', sortable: true, initialWidth: 250, fieldName: "Capital_Drawn", type: 'currency', typeAttributes: { maximumFractionDigits: '0' }, cellAttributes: { alignment: 'left' } },
    { label: 'DPI', sortable: true, initialWidth: 150, fieldName: "Yield_DPI", type: 'number', typeAttributes: { maximumFractionDigits: '2', minimumFractionDigits: '2' }, cellAttributes: { alignment: 'left' } },
    { label: 'TVPI', sortable: true, initialWidth: 150, fieldName: "TVPI", type: 'number', typeAttributes: { maximumFractionDigits: '2', minimumFractionDigits: '2' }, cellAttributes: { alignment: 'left' } },
    { label: 'As of Date', sortable: true, initialWidth: 200, fieldName: "As_of_Date", type: 'date', cellAttributes: { alignment: 'left' }, typeAttributes: { day: "numeric", month: "numeric", year: "numeric" } },
]

export default class InvestmentStrategyRelatedToAccountViewAll extends LightningElement {
    @api recordId;
    @api listType;

    listTypeName;
    recNameAvailable = false;
    recordLink;
    accountNameLink;
    relatedInvestmentRecords;
    totalRelatedInvestmentsCount;
    columns = COLUMNS;
    baseURL = '';
    tempAddAction = [];
    offset = 0;
    limit = 50;
    defaultSortDirection = 'asc';
    sortedDirection = 'asc';
    sortDirection;
    nameSortDir = this.defaultSortDirection;
    sortedBy = 'invStrategyId';
    plusSign = null;
    @track isLoading = false;
    is13FFiling = false;
    @track error;
    searchValue = '';
    infiniteLoading = false;
    nullOrder = 'Last'
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        this.renderRelatedList();
    }

    renderRelatedList() {
        this.listType = decodeURI(this.listType);
        this.isLoading = true;
        this.setLinks();
        if (this.listType == 'Investment Strategies') {
            this.listTypeName = this.listType;
            this.columns = COLUMNS;
            this.sortedBy = 'invStrategyId';

        } else {
            this.listTypeName = this.listType;
            this.columns = PER_COLUMNS;
            this.sortedBy = 'As_of_Date';
            this.sortedDirection = 'desc';
        }

        this.getAccountRelatedInvestmentRecords();

        getAccountName({
            recordId: this.recordId
        }).then(returnedAccount => {
            if (returnedAccount != null) {
                this.recordName = returnedAccount.Name;
                this.recNameAvailable = true;
            }
        });
    }

    setLinks() {
        this.recordLink = "/" + this.communityName + "/s/account/" + this.recordId;
        this.accountNameLink = "/" + this.communityName + '/s/account/Account/Default';
    }

    getAccountRelatedInvestmentRecords() {
        this.isLoading = true;
        getRecordsCount({
            recordId: this.recordId,
            relatedListName: this.listType
        }).then(investmentRecordCount => {
            if (investmentRecordCount) {
                this.totalRelatedInvestmentsCount = investmentRecordCount;

                if (this.sortedDirection == 'desc') {
                    this.nullOrder = 'LAST';
                }
                else {
                    this.nullOrder = 'FIRST';
                }

                let tempSortBy = this.sortedBy;
                if (this.sortedBy === 'invStrategyId') {
                    tempSortBy = 'Name';
                } else if (this.sortedBy === 'TVPI') {
                    tempSortBy = 'TVPI__c';
                } else if (this.sortedBy === 'As_of_Date') {
                    tempSortBy = 'As_of_Date__c';
                } else if (this.sortedBy === 'Capital_Drawn') {
                    tempSortBy = 'Capital_Drawn__c';
                } else if (this.sortedBy === 'Net_IRR') {
                    tempSortBy = 'Net_IRR__c';
                } else if (this.sortedBy === 'Vintage') {
                    tempSortBy = 'Vintage__c';
                } else if (this.sortedBy === 'Yield_DPI') {
                    tempSortBy = 'Yield_DPI__c';
                }
                else if (this.sortedBy == 'Asset_Class_picklist') {
                    tempSortBy = 'Asset_Class_picklist__c';
                } else if (this.sortedBy == 'Sub_Asset_Class') {
                    tempSortBy = 'Sub_Asset_Class__c';
                }
                getAccountRelatedInvestmentRecords({
                    recordId: this.recordId,
                    recordLimit: this.limit,
                    offset: this.offset,
                    nullOrder: this.nullOrder,
                    sortedBy: tempSortBy,
                    sortOrder: this.sortedDirection,
                    relatedListName: this.listType,
                }).then(relatedInvestments => {
                    if (relatedInvestments) {
                        for (var i = 0; i < relatedInvestments.length; i++) {
                            if (relatedInvestments[i].Id) {
                                relatedInvestments[i].invStrategyId = "/" + this.communityName + (this.listType == 'Performance' ? '/s/performance/' : '/s/investment-strategy/') + relatedInvestments[i].Id;
                                relatedInvestments[i].invStrategyName = relatedInvestments[i].Name;
                            }
                            if (relatedInvestments[i].Net_IRR) {
                                relatedInvestments[i].Net_IRR = relatedInvestments[i].Net_IRR / 100;
                            }

                        }
                        this.relatedInvestmentRecords = relatedInvestments;
                        this.offset = relatedInvestments.length;
                        // For showing + sign with count
                        if ((this.offset) >= this.totalRelatedInvestmentsCount || (this.offset) == 0) {
                            this.plusSign = '';
                        }
                        else {
                            this.plusSign = '+';
                        }
                        this.infiniteLoading = false;
                        this.isLoading = false;
                    }
                }).catch(error => {
                    this.infiniteLoading = false;
                    this.isLoading = false;
                    console.log("Error:", error);
                });
            }
        })
    }

    // To refresh table
    refreshTable(event) {
        this.infiniteLoading = true;
        this.isLoading = true;
        this.offset = 0;
        this.limit = 50;
        this.sortedDirection = 'asc';
        if (this.listType == 'Investment Strategies') {
            this.sortedBy = 'invStrategyId';

        } else {
            this.sortedBy = 'As_of_Date__c';
        }
        this.relatedInvestmentRecords = null;
        var table = this.template.querySelector('lightning-datatable');
        if (table) table.enableInfiniteLoading = true;
        return refreshApex(this.connectedCallback());
    }

    loadMoreData(event) {
        if (this.totalRelatedInvestmentsCount > this.offset) {
            if (this.infiniteLoading)
                return;
            this.infiniteLoading = true;
            //Display a spinner to signal that data is being loaded
            if (this.relatedInvestmentRecords != null && event.target) {
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            //Display "Loading" when more data is being loaded
            this.loadMoreStatus = 'Loading';

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
            }
            else if (this.sortedBy == 'Asset_Class_picklist') {
                tempSortBy = 'Asset_Class_picklist__c';
            } else if (this.sortedBy == 'Sub_Asset_Class') {
                tempSortBy = 'Sub_Asset_Class__c';
            }
            getAccountRelatedInvestmentRecords({
                recordId: this.recordId,
                recordLimit: this.limit,
                offset: this.offset,
                nullOrder: this.nullOrder,
                sortedBy: tempSortBy,
                sortOrder: this.sortedDirection,
                relatedListName: this.listType,
            }).then(relatedInvestments => {
                var tempSearchList = [];
                if (relatedInvestments) {
                    for (var i = 0; i < relatedInvestments.length; i++) {
                        let tempContactRecord = Object.assign({}, relatedInvestments[i]); //cloning object 
                        if (tempContactRecord.Id) {
                            tempContactRecord.invStrategyId = "/" + this.communityName + (this.listType == 'Performance' ? '/s/performance/' : '/s/investment-strategy/') + relatedInvestments[i].Id;
                            tempContactRecord.invStrategyName = relatedInvestments[i].Name;
                        }
                        if (tempContactRecord.Net_IRR) {
                            tempContactRecord.Net_IRR = relatedInvestments[i].Net_IRR / 100;
                        }
                        tempSearchList.push(tempContactRecord);

                    }
                    this.isLoading = false;
                    this.relatedInvestmentRecords = this.relatedInvestmentRecords.concat(tempSearchList);
                    if ((this.offset + 50) >= this.totalRelatedInvestmentsCount || (this.offset) == 0) {
                        this.offset = this.totalRelatedInvestmentsCount;
                        this.plusSign = '';
                    } else {
                        this.offset = parseInt(this.offset) + parseInt(this.limit);
                        this.plusSign = '+';
                    }
                    this.loadMoreStatus = '';
                    if (this.tableElement) {
                        this.tableElement.isLoading = false;
                    }
                    this.infiniteLoading = false;
                }
            }).catch(error => {
                this.infiniteLoading = false;
                this.isLoading = false;
                console.log("Error:", error);
            });

        }
    }

    updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;

        this.infiniteLoading = true;
        this.isLoading = true;
        this.offset = 0;
        this.limit = 50;
        this.relatedInvestmentRecords = null;
        var table = this.template.querySelector('lightning-datatable');
        if (table) table.enableInfiniteLoading = true;
        this.getAccountRelatedInvestmentRecords();
    }
}