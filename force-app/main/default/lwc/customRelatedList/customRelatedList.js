import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getRecordCountViewAll from '@salesforce/apex/CustomRelatedListController.getRecordCountViewAll';
import getRecordViewAll from '@salesforce/apex/CustomRelatedListController.getRecordViewAll';
import activeCommunities from '@salesforce/label/c.active_communities';

export default class CustomRelatedList extends NavigationMixin(LightningElement) {
    @api recordId;
    @api fieldsToQuery;
    @api objectApiName;
    @api columns;    
    @api sortedBy;
    @api sortedDirection;
    @api defaultSortDirection;
    @api relatedListTitle;
    @api iconName;
    @api sortFieldsMapping;
    @api objectNameInLink;
    @api accountLookup;

    isInvestment = false;
    isLoading = true;
    totalRecords = '0';
    nullOrder = 'LAST';
    recordsExist = false;
    data;
    isCommunity = false;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
 
    connectedCallback() {
        this.isLoading = true;

        if(this.relatedListTitle == 'Investments'){
            this.isInvestment = true;
        }

        getRecordCountViewAll({
            recordId: this.recordId,
            objectApiName: this.objectApiName,
            accountLookup : this.accountLookup
        })
        .then((totalCount) => {
            if(totalCount <= 0) {
                this.recordsExist = false;
            }
            else {
                this.recordsExist = true;
            }
            if(totalCount > 10){
                this.totalRecords = '10+';
            } 
            else {
                this.totalRecords = totalCount;
            }
            if(totalCount > 0) {
                let tempSortBy = this.sortFieldsMapping[this.sortedBy];
                this.getRecordViewAll(tempSortBy, this.sortedDirection);
            }            
        })
        .catch((error) => {            
            this.showToastMessage('Error', 'error', error.message);
            this.isLoading = false;
        });
    }
 
    getRecordViewAll(sortedBy, sortedDirection) {
        this.isLoading = true;
        if (sortedDirection?.toLowerCase() == 'desc'){
            this.nullOrder = 'LAST';
        }
        else {
            this.nullOrder = 'FIRST';
        }
        getRecordViewAll({  
            recordId : this.recordId,
            fieldsToQuery : this.fieldsToQuery,
            objectApiName : this.objectApiName,
            accountLookup : this.accountLookup,
            sortedBy : sortedBy,
            sortOrder : sortedDirection,
            recLimit : 10,
            offset : 0,
            nullOrder: this.nullOrder
        }).then(returnedData => {     
            this.isLoading = false;
            if (returnedData) {

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
                });
                this.data = returnedData;
                this.isLoading = false;   
            }
            else
            {
                this.data = null;
            }
        }).catch(error => {            
            this.showToastMessage('Error', 'error', error.message);
            this.isLoading = false;
        });
    }

    updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        let tempSortBy = this.sortFieldsMapping[this.sortedBy];
        this.getRecordViewAll(tempSortBy, this.sortedDirection);
    }

    handleShowFullRelatedList() 
    {
        var url = '/custom-list-view-all?recordId=' + this.recordId +'&listViewName=' + this.objectApiName;
        this[NavigationMixin.Navigate]({
        type: 'standard__webPage',
            attributes: {
                url: url
            }
        });       
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