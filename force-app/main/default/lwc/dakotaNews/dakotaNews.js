import { LightningElement } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';  
import getRecords from '@salesforce/apex/DakotaNewsController.getRecords';
import getRecordsCount from '@salesforce/apex/DakotaNewsController.getRecordsCount';
import activeCommunities from '@salesforce/label/c.active_communities';
import { loadStyle } from 'lightning/platformResourceLoader';
import accordian_color from '@salesforce/resourceUrl/accordian_color';


export default class DakotaNews extends NavigationMixin(LightningElement) {

    data;
    isLoading=false;
    recordsExists=true;
    totalRecords = 0;
    isCommunity = false;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    ascOrDesc =true;
    icon = 'utility:arrowdown';
    sortBy = 'Publish_Date__c';
    sortDirection = 'desc';
    isActive = false;
    searchValue = '';
    sharePopup = false;
    isNotHomePage = false;
    newsRecordId ='';

    handleShareRecord(event) {
        this.newsRecordId = event.target.dataset.id;
        if (this.newsRecordId) {
            this.sharePopup = true;
        } else {
            const event = new ShowToastEvent({
                title: 'Error',
                message: 'Unable to fetch Records.',
            });
            this.dispatchEvent(event);
        }
        this.isLoading = false;
    }
    handleremoveSpinner() 
    {
        this.isLoading = false;
    }

    handleclosepopup()
    {
        this.sharePopup = false;
    }

    handleSorting(event) {
        this.ascOrDesc =!this.ascOrDesc
        this.isActive = true;
        this.icon=(this.ascOrDesc)? 'utility:arrowdown':'utility:arrowup';
        this.sortDirection = (this.sortDirection == 'desc')? 'asc':'desc';
        this.isLoading=true;
        this.retrievingData();
    }

    searchUpdatesOnEnter(event) {
        if (event.keyCode == 13) {
            this.isLoading = true;
            this.recordsExists=true;
            this.totalRecords = '0';
            this.searchValue = this.template.querySelector('[data-id="searchValue"]').value;
            this.retrievingData();
        }
    }

    retrievingData () { 
            getRecordsCount({search: this.searchValue}).then(returnedCount => {
                if(returnedCount == 0) {
                    this.recordsExists = false;
                    this.totalRecords = '0';
                    this.isLoading=false;
                }
                else {
                    this.recordsExists = true;
                }
                if(returnedCount > 5)
                {
                    this.totalRecords = '5+';
                } 
                else {
                    this.totalRecords = returnedCount;
                }
                if(returnedCount>0)
                {   
                    getRecords({
                        search: this.searchValue,
                        sortBy: this.sortBy,
                        sortDirection: this.sortDirection
                    }).then(returnedData => {
                        if (returnedData) {
                            for(var i=0; i<returnedData.length; i++)
                            {
                                returnedData[i].dataId = returnedData[i].Id;
                                if(this.isCommunity)
                                {
                                    returnedData[i].Id = "/"+this.communityName+'/s/dakota-news/'+returnedData[i].Id;
                                }
                                else
                                {
                                    returnedData[i].Id = "/"+returnedData[i].Id;
                                }
                                if(returnedData[i].Description__c)
                                {
                                    if(returnedData[i].Description__c.length >255)
                                    {
                                        returnedData[i].Description__c = returnedData[i].Description__c.substring(0, 255);
                                        returnedData[i].Description__c+='...';
                                        returnedData[i].desLength=true;
                                    }
                                }
                                else
                                {
                                   returnedData[i].desLength=false;
                                }
                                if(returnedData[i].Publish_Date__c)
                                {
                                    
                                    returnedData[i].Publish_Date__c = returnedData[i].Publish_Date__c;
                                }
                            }
                
                            this.isActive = false;
                            this.data=returnedData;
                        }
                        else
                        {
                            this.data=null;
                        }
                        this.isLoading=false;
                    }).catch(error => {
                        const event = new ShowToastEvent({
                            title: 'Error',
                            message: 'Unable to fetch Records.',
                        });
                        this.dispatchEvent(event);
                    });
                    
                }
            }).catch(error => {
                this.totalRecords = '0';
                this.recordsExists = false;
                this.isLoading = false;
            });
            
    }
    //For Community User
    checkIsCommunityInstance()
    {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
    }

    connectedCallback()
    {
        this.checkIsCommunityInstance();
        this.isLoading=true;
        try{
            Promise.all([
                loadStyle(this, accordian_color)
            ]);
            this.retrievingData();
        }
        catch(error) {
            console.log(error);
        }
        
    }

    handleViewAll() {
        this.checkIsCommunityInstance(); 
        //Navigation from Dakota news Homepage to View All In Community
           if(this.isCommunity)
           {
                var url = '/dakota-news-view-all?searchValue=' + encodeURIComponent(this.searchValue);
    
                this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                    attributes: {
                        url: url
                    }
                });
           }
           else
           {
            //Navigation from Dakota news Homepage to View All In Salesforce
            let cmpDef={
                componentDef:"c:dakotaNewsViewAll",
            };
            let encdedDef=btoa(JSON.stringify(cmpDef));
            this[NavigationMixin.Navigate]({
                    type: 'standard__webPage',
                    attributes: {
                        url:"/one/one.app#"+encdedDef
                    }
                });
           }
    }

    handleClear(event)
    {
        if(!event.target.value.length){
            this.isLoading = true;
            this.totalRecords = '0';
            this.searchValue = this.template.querySelector('[data-id="searchValue"]').value;
            this.retrievingData();
        }
    }

}