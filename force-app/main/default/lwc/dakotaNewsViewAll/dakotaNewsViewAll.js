import { LightningElement,track,api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';  
import getRecordsViewAll from '@salesforce/apex/DakotaNewsController.getRecordsViewAll';
import getRecordsCount from '@salesforce/apex/DakotaNewsController.getRecordsCount';
import activeCommunities from '@salesforce/label/c.active_communities';
import { loadStyle } from 'lightning/platformResourceLoader';
import accordian_color from '@salesforce/resourceUrl/accordian_color';

export default class DakotaNewsViewAll extends LightningElement{

    @track data = [];
    @track allData = [];
    @track plusSign = '';
    initialLimit = 20;
    scrollLimit = 20;
    offset = 0;
    totalRecords;
    homeLink;
    isLoading=false;
    recordsExists=false;
    

    isCommunity = false;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    ascOrDesc =true;
    emptyTable=false;
    icon = 'utility:arrowdown';
    sortBy = 'Publish_Date__c';
    sortDirection = 'desc';
    isActive = false;
    @api searchValue = '';
    sharePopup = false;
    isNotHomePage = false;
    newsRecordId ='';

    handleSorting(event) {
        this.ascOrDesc =!this.ascOrDesc
        this.isActive = true;
        this.icon=(this.ascOrDesc)? 'utility:arrowdown':'utility:arrowup';
        this.sortDirection = (this.sortDirection == 'desc')? 'asc':'desc';
        this.isLoading=true;
        this.retrievingData();
    }

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

    searchUpdatesOnEnter(event) {
        if (event.keyCode == 13) {
            this.isLoading = true;
            this.offset = 0;
            this.plusSign = '';
            this.totalRecords = 0;
            this.searchValue = this.template.querySelector('[data-id="searchValue"]').value;
            this.retrievingData();
        }
    }

    retrievingData() {
            
            this.isLoading = true;            
            this.emptyTable=false;
            getRecordsCount({search: this.searchValue}).then(returnedCount => {
                this.totalRecords = returnedCount;
                
                // For showing + sign with count
                if((this.totalRecords <= this.initialLimit) || (this.totalRecords) == 0)
                {
                    this.offset = this.totalRecords;
                    this.plusSign = '';
                }
                else
                {
                    this.offset = this.initialLimit;
                    this.plusSign = '+';
                }
                if(returnedCount>0)
                {   
                    getRecordsViewAll({
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
                                if(returnedData[i].Title__c)
                                {
                                    returnedData[i].title=returnedData[i].Title__c;
                                }
                                if(returnedData[i].Description__c)
                                {
                                    returnedData[i].postBody = returnedData[i].Description__c;
                                    if(returnedData[i].Description__c.length >500)
                                    {
                                        returnedData[i].postBody = returnedData[i].Description__c.substring(0, 500);
                                        returnedData[i].postBody+='...';
                                        returnedData[i].desLength=true;
                                    }
                                }
                                else
                                {
                                   returnedData[i].desLength=false;
                                }
                                if(returnedData[i].Publish_Date__c)
                                {
                                    
                                    returnedData[i].publishDate = returnedData[i].Publish_Date__c;
                                }
                            }
                            this.allData=returnedData;
                            this.data = [];
                            let j = 0;
                            //Copy Initial Data Chunk
                            while(j < this.offset) {
                                this.data.push({
                                    Id:this.allData[j].Id,
                                    title:this.allData[j].title,
                                    accountId:this.allData[j].accountId,
                                    accountName:this.allData[j].accountName,
                                    contactId:this.allData[j].contactId,
                                    contactName:this.allData[j].contactName,
                                    postBody:this.allData[j].postBody,
                                    desLength:this.allData[j].desLength,
                                    publishDate: this.allData[j].publishDate,
                                    PublicPlanMinuteId: this.allData[j].PublicPlanMinuteId,
                                    PublicPlanMinuteName:this.allData[j].PublicPlanMinuteName,
                                    dataId:this.allData[j].dataId
                                 });  
                                j++;
                            }
                        }
                        else
                        {
                            this.allData=null;
                        }
                        this.isActive = false;
                        this.isLoading=false;
                    }).catch(error => {                       
                        const event = new ShowToastEvent({
                            title: 'Error',
                            message: 'Unable to fetch Records.',
                        });
                        this.dispatchEvent(event);
                    });
                    
                }
                else{
                    this.data = [];
                    this.emptyTable=true;
                    this.isLoading = false;
                }
            }).catch(error => {
                this.isLoading = false;                
                this.emptyTable=true;
                this.data = [];
            });
    }

    checkIsCommunityInstance()
    {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
    }

    //Set Back link
    setLinks() {
        if(this.isCommunity)
        {
            this.homeLink = "/"+this.communityName + '/s/';
        }
        else{
            this.homeLink = "/one/one.app";
        }
    }

    connectedCallback()
    {
        this.checkIsCommunityInstance();
        this.setLinks();
        this.searchValue=decodeURIComponent(this.searchValue);       

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

    //infinite scroll 
    handleScroll(event) {
        let area = this.template.querySelector('.scrollArea');
        let threshold = event.target.clientHeight;
        let areaHeight = area.clientHeight;
        let scrollTop = event.target.scrollTop;
        let chunkSize = 20;
        if(areaHeight - threshold <= scrollTop + 10) {
           
            try {
                if(this.totalRecords > this.offset)
                {
                    if(((this.offset+chunkSize) >= this.totalRecords )|| (this.offset == 0))
                    {
                        this.offset = this.totalRecords;
                        this.plusSign = '';
                    } else {
                        this.offset = parseInt(this.offset ) + parseInt(this.scrollLimit);
                        this.plusSign = '+';
                    }
                    let j = 0, t = this.data.length;
                    while(j < this.scrollLimit) {
                        this.data.push({
                            Id:this.allData[j+t].Id,
                            title:this.allData[j+t].title,
                            accountId:this.allData[j+t].accountId,
                            accountName:this.allData[j+t].accountName,
                            contactId:this.allData[j+t].contactId,
                            contactName:this.allData[j+t].contactName,
                            postBody:this.allData[j+t].postBody,
                            desLength:this.allData[j+t].desLength,
                            publishDate: this.allData[j+t].publishDate,
                            PublicPlanMinuteId: this.allData[j+t].PublicPlanMinuteId,
                            PublicPlanMinuteName:this.allData[j+t].PublicPlanMinuteName,
                            dataId:this.allData[j+t].dataId
                         });  
                        j++;
                    }
                }    
            } catch (error) {
                console.log('Error : ' + error);
            }
        }
    }

    handleClear(event)
    {
        if(!event.target.value.length){
            this.isLoading = true;
            this.offset = 0;
            this.plusSign = '';
            this.totalRecords = 0;
            this.searchValue = this.template.querySelector('[data-id="searchValue"]').value;
            this.retrievingData();
        }
    }

}