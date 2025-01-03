import { LightningElement, api, track } from 'lwc';
import {NavigationMixin} from "lightning/navigation";
import { ShowToastEvent } from 'lightning/platformShowToastEvent'; 
import activeCommunities from '@salesforce/label/c.active_communities';
import getRecordCountOfMpNewFeatures from '@salesforce/apex/NewFeaturesInCommunitiesController.getRecordCountOfMpNewFeatures';
import getlimitedRecordOfMpNewFeatures from '@salesforce/apex/NewFeaturesInCommunitiesController.getlimitedRecordOfMpNewFeatures';
import { loadStyle } from 'lightning/platformResourceLoader';
import newFeaturesInCommunityCSS from '@salesforce/resourceUrl/newFeaturesInCommunityCSS';



export default class NewFeaturesInCommunity extends NavigationMixin(LightningElement) {

    @track data = [];
    @track allData = [];
    @track plusSign = '';
    initialLimit = 10;
    scrollLimit = 10;
    offset = 0;
    totalRecords;
    isLoading=false;
    recordsExists=true;
    DemoUrl;
    previewVideoPopup=false;    

    isCommunity = false;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

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
                loadStyle(this, newFeaturesInCommunityCSS)
            ]);

            getRecordCountOfMpNewFeatures().then(returnedCount => {
                this.totalRecords = returnedCount;
                // For showing + sign with count
                if((this.totalRecords <= this.initialLimit) || (this.totalRecords) == 0)
                {
                    if(this.totalRecords == 0) {
                        this.recordsExists = false;
                    }
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
                    getlimitedRecordOfMpNewFeatures().then(returnedData => {
                        if (returnedData) {
                            for(var i=0; i<returnedData.length; i++)
                            {
                                returnedData[i].Id = "/"+this.communityName+'/s/mp-new-features/'+returnedData[i].Id;
                                if(returnedData[i].Title__c)
                                {
                                    returnedData[i].title=returnedData[i].Title__c;
                                }
                                if(returnedData[i].Date__c)
                                {
                                    returnedData[i].date=returnedData[i].Date__c;
                                }
                                if(returnedData[i].Demo__c)
                                {
                                    returnedData[i].demo=returnedData[i].Demo__c;
                                }  
                                if(returnedData[i].Description__c)
                                {
                                    returnedData[i].description=returnedData[i].Description__c;
                                    if(returnedData[i].description.length >500)
                                    {
                                        returnedData[i].description = returnedData[i].description.substring(0, 500);
                                        returnedData[i].description+='...';
                                        returnedData[i].desLength=true;
                                    }                                    
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
                                    date:this.allData[j].date,
                                    description:this.allData[j].description,
                                    demo:this.allData[j].demo,
                                    desLength:this.allData[j].desLength
                                 });  
                                 
                                j++;
                            }
                        }
                        else
                        {
                            this.allData=null;
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
                this.isLoading = false;
            });
            
        }
        catch(error) {
            console.log(error);
        }
        
    }

    handleRowAction(event)
    {
        this.previewVideoPopup = true;
        this.DemoUrl = event.target.getAttribute('target');
    }

    closePreviewVideoPopup()
    {
        this.previewVideoPopup = false;
    }


    handleViewAll() 
    {
        this[NavigationMixin.Navigate]({
        type: 'standard__webPage',
            attributes: {
                url: '/new-features'
            }
        });
    }

}