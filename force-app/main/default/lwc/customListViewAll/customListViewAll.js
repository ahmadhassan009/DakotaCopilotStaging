import { LightningElement, api} from 'lwc';
import { NavigationMixin} from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getRecordName from '@salesforce/apex/CustomRelatedListController.getRecordName';
import getRecordCountViewAll from '@salesforce/apex/CustomRelatedListController.getRecordCountViewAll';
import getRecordViewAll from '@salesforce/apex/CustomRelatedListController.getRecordViewAll';

export default class CustomListViewAll extends NavigationMixin(LightningElement) {
    @api recordId;
    @api parentLinkName;
    @api parentApiName;
    @api parentLabel;
    @api fieldsToQuery;
    @api objectApiName;
    @api columns;    
    @api sortedBy;
    @api sortedDirection;
    @api defaultSortDirection;
    @api relatedListTitle;
    @api sortFieldsMapping;
    @api objectNameInLink;
    @api accountLookup;

    isCommunity;
    offset = 0;
    limit = 50;
    accountNameLink;
    recordName;
    totalEducationCount;
    dataSorting = false;
    fromLoadMore = false;
    infiniteLoading = false;
    isLoading = true;
    plusSign;
    totalRecords = '0';
    nullOrder = 'LAST';
    isCommunity = false;
    tempSortBy = '';
    nameSortDir = this.defaultSortDirection;
    data;
    backupSortedby;
    loadMoreLimitReached = false;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        this.backupSortedby = this.sortedBy;
        this.setRecordsInInitialState();
    }

    
    setRecordsInInitialState() {
        this.isLoading = true;
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        this.setLinks();

        getRecordName({
            recordId: this.recordId
        }).then(returnedAccount => {
            if (returnedAccount != null) {
                this.recordName = returnedAccount.Name;
            }
        });

        getRecordCountViewAll({
            recordId: this.recordId,
            objectApiName: this.objectApiName,
            accountLookup : this.accountLookup
        }).then(Count => {
            if (Count > 0) {
                this.totalEducationCount = Count;
                this.tempSortBy = this.sortFieldsMapping[this.sortedBy];
                this.getRecordViewAll(this.tempSortBy, this.sortedDirection, this.limit, this.offset);
            }
            
        }).catch(error => {
            console.log("Error in fetching total count of records : ", error);
            this.showToastMessage('Error', 'error', error.message);
        });
    }


    getRecordViewAll(sortedBy, sortedDirection, limit, offset) {
        if (sortedDirection?.toLowerCase() == 'desc') {
            this.nullOrder = 'LAST';
        } else {
            this.nullOrder = 'FIRST';
        }
        
        getRecordViewAll({  
            recordId : this.recordId,
            fieldsToQuery : this.fieldsToQuery,
            objectApiName : this.objectApiName,
            accountLookup : this.accountLookup,
            sortedBy : sortedBy,
            sortOrder : sortedDirection,
            recLimit : limit,
            offset : offset,
            nullOrder: this.nullOrder
        })
            .then((returnedData) => {
                if (returnedData) {
                    let recordList = [];

                    returnedData.forEach(returnedData => {
                        if(returnedData?.Id) {
                            returnedData.recordId = "/" + this.communityName + '/s/'+this.objectNameInLink+'/' + returnedData.Id;
                        }  
                        if (returnedData?.Account__r) {                        
                            returnedData.AccountId = "/" + this.communityName + '/s/account/' + returnedData.Account__c;                    
                            returnedData.AccountName = returnedData.Account__r.Name;
                        }
    
                        if (returnedData?.Investment_Strategy__r) {                        
                            returnedData.InvestmentStrategyId = "/" + this.communityName + '/s/investment-strategy/' + returnedData.Investment_Strategy__c;                    
                            returnedData.InvestmentStrategyName = returnedData.Investment_Strategy__r.Name;
                        }
                        if (returnedData?.Public_Plan_Minute__r) {                        
                            returnedData.PublicPlanMinuteId = "/" + this.communityName + '/s/public-plan-minute/' + returnedData.Public_Plan_Minute__c;                    
                            returnedData.PublicPlanMinuteName = returnedData.Public_Plan_Minute__r.Name;
                        }            
                        if(returnedData?.Dakota_Live_Call__c)
                        {
                            returnedData.Dakota_Live_Call__c = "/"+this.communityName+'/s/dakota-content/'+returnedData.Dakota_Live_Call__c;
                            returnedData.Featured_On__c = returnedData.Featured_On__c.split(">")[1].split('</a')[0];
                        }  
                        if (returnedData?.Form_ADV__r?.Account__r) {                        
                            returnedData.AccountId = "/" + this.communityName + '/s/account/' + returnedData.Form_ADV__r.Account__c;                    
                            returnedData.AccountName = returnedData.Form_ADV__r.Account__r.Name;
                        }   
                        recordList.push(returnedData);                
                    });

                    if (this.fromLoadMore) {
                        if (this.data)
                            this.data = this.data.concat(recordList);
                        if ((this.offset + this.limit) >= this.totalEducationCount || (this.offset) == 0) {
                            this.offset = this.totalEducationCount;
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
                        this.data = recordList;
                    }

                    this.offset = this.data.length;
                    if ((this.data.length) >= this.totalEducationCount) {
                        this.plusSign = '';
                    } else {
                        this.plusSign = '+';
                    }
                } else {
                    this.data = null;
                }
                this.isLoading = false;
                if (this.dataSorting) {
                    this.dataSorting = false;
                }
            })
            .catch((error) => {
                console.log('Error in fetching records : ', error);
                this.showToastMessage('Error', 'error', error.message);
                this.isLoading = false;
                this.infiniteLoading = false;
            });
    }

    updateColumnSorting(event) {
        this.isLoading = true;
        this.loadMoreLimitReached = false;
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.dataSorting = true;
        this.data = [];
        this.tempSortBy = this.sortFieldsMapping[this.sortedBy];
        this.nameSortDir = this.sortedDirection;
        this.offset = 0;
        this.getRecordViewAll(this.tempSortBy, this.sortedDirection, this.limit, this.offset);
    }

    loadMoreData(event) {
        if(this.offset <= 1950){
            if (this.totalEducationCount > this.offset) {
                if (this.infiniteLoading) {
                    return;
                }
                if (this.dataSorting) {
                    return;
                }
                this.infiniteLoading = true;
                if (this.data != null && event.target) {
                    event.target.isLoading = true;
                }
                this.tableElement = event.target;
                this.fromLoadMore = true;            
                this.tempSortBy = this.sortFieldsMapping[this.sortedBy];
                this.getRecordViewAll(this.tempSortBy, this.sortedDirection, this.limit, this.offset);
            }
        } else{
            this.loadMoreLimitReached = true;
        }
        
    }

    refreshTable() {
        this.offset = 0;
        this.limit = 50;
        this.plusSign = '';        
        this.loadMoreLimitReached = false;
        this.nameSortDir = this.defaultSortDirection;
        this.sortedDirection = this.defaultSortDirection;
        this.sortedBy = this.backupSortedby;
        this.data = [];
        this.setRecordsInInitialState();
    }

    setLinks() {
        this.recordLink = "/" + this.communityName + "/s/"+this.parentLinkName+"/" + this.recordId;
        this.accountNameLink = "/" + this.communityName + '/s/'+this.parentLinkName+'/'+this.parentApiName+'/Default';
    }

    showToastMessage(title, variant, message) {
        const event = new ShowToastEvent({
            title: title,
            variant: variant,
            message: message,
        });
        this.dispatchEvent(event);
    }
}