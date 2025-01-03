import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import { loadStyle } from 'lightning/platformResourceLoader';
import getMetroAreaRelatedDakotaContentRecords from '@salesforce/apex/DakotaContentMetroAreaRelatedList.getMetroAreaStateRelatedDakotaContentRecords';
import getMetroAreaRelatedDakotaContentCount from '@salesforce/apex/DakotaContentMetroAreaRelatedList.getMetroAreaStateRelatedDakotaContentCount';
import { refreshApex } from '@salesforce/apex';

import metroAreaByStateCSS from '@salesforce/resourceUrl/metroAreaByStateCSS';

const COLUMNS = [

    {
        label: 'Content Name',
        sortable: true,
        fieldName: "recordLink",
        type: "url",
        typeAttributes: {
            label: { fieldName: 'contentLineName' },
            tooltip: { fieldName: 'contentLineName' },
            target: '_self'
        }
    },

    {
        label: 'Date',
        sortable: true,
        fieldName: 'dateField',
        type: 'date',
        typeAttributes: {
            day: "numeric",
            month: "numeric",
            year: "numeric"
        }
    },

    {
        label: 'Type',
        sortable: true,
        fieldName: 'Type',
        type: 'Picklist'
    },

    {
        label: 'Featured On',
        sortable: true,
        fieldName: "FeaturedOnLink",
        type: "url",
        typeAttributes: {
            label: { fieldName: 'FeaturedOn' },
            tooltip: { fieldName: 'FeaturedOn' },
            target: '_self'
        }
    },

    {
        label: 'Presentation Recording',
        sortable: true,
        fieldName: 'recordingLink',
        type: "url",
        typeAttributes: {
            label: { fieldName: 'recordingLabel' },
            tooltip: { fieldName: 'recordingLabel' },
            target: '_self'
        }
    }

];


export default class MetroAreaStatesAllContentViewAll extends NavigationMixin(LightningElement) {
    @api stateName;
    isLoading = false;
    defaultSortDirection = 'asc';
    columns = COLUMNS;
    totalRelatedContactCount = 0;
    relatedContactRecords=[];
    isCommunity = false;
    sortedDirection = 'asc';
    sortedBy = 'recordLink';
    offset = 0;
    limit = 50;
    baseURL = '';
    collapsed = true;
    panelStyling;
    fromEditEvent = true;
    fromLoadMore = false;
    fromRefresh =false;
    fieldsMapping;
    nullOrder = 'LAST';
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        this.isLoading = true;
        this.setFieldMappings();
        Promise.all([
            loadStyle(this, metroAreaByStateCSS)
        ]);

        this.maNameLink = "/"+this.communityName + '/s/metro-area/Metro_Area__c/Default';
        this.recordLink = "/"+this.communityName + '/s/state-detail-page?stateName=' + this.stateName;
        this.checkIsCommunityInstance();
        this.getTotalRecordCount();
        this.getRelatedContacts(this.stateName, this.fieldsMapping.get(this.sortedBy), this.sortedDirection,this.limit, this.offset);
    }

    getTotalRecordCount() {
        //To get count of related records
        getMetroAreaRelatedDakotaContentCount({
            stateName: this.stateName,
        }).then(contactRecordCount => {
            if (contactRecordCount) {
                this.totalRelatedContactCount = contactRecordCount;
            }
        }).catch(error => {
            console.log('Error : ', error);
        });
    }

    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
    }
    getRelatedContacts(stateName,sortBy,sortdirection, limit, offset) {
        this.getTotalRecordCount();

        if (sortdirection == 'desc') {
            this.nullOrder = 'LAST';
        } else {
            this.nullOrder = 'FIRST';
        }

        getMetroAreaRelatedDakotaContentRecords({
            stateName: stateName,
            sortedBy:sortBy,
            sortedDirection:sortdirection,
            recordLimit: limit,
            offset: offset,            
            nullOrder: this.nullOrder
        }).then(relatedDakotaContent => {
            if (relatedDakotaContent) {
                var tempDakotaContentList = [];
                for (var i = 0; i < relatedDakotaContent.length; i++) {
                    let tempRecord = Object.assign({}, relatedDakotaContent[i]); //cloning object  
                    if (this.isCommunity) {
                        tempRecord.recordLink = "/" + this.communityName + "/s/dakota-content/" + tempRecord.Id;
                        tempRecord.FeaturedOnLink = (tempRecord.Dakota_Live_Call__c != null
                            ? "/" + this.communityName + "/s/dakota-content/" + tempRecord.Dakota_Live_Call__c
                            : '');
                        tempRecord.recordingLink = tempRecord.Presentation_Recording_url__c;
                    }
                    else {
                        tempRecord.recordLink = "/dakota-content/" + tempRecord.Id;
                        tempRecord.FeaturedOnLink = (tempRecord.Dakota_Live_Call__c != null
                            ? "/dakota-content/" + tempRecord.Dakota_Live_Call__c
                            : '');
                        tempRecord.recordingLink = tempRecord.Presentation_Recording_url__c;
                    }
                    if (tempRecord.Id != undefined) {
                        tempRecord.contentLineName = tempRecord.Name;
                        tempRecord.dateField = tempRecord.Date__c;
                        tempRecord.recordingLabel = "Click Here to Watch";
                        tempRecord.Type = tempRecord.Type__c;
                    }
                    if (tempRecord.Dakota_Live_Call__c != undefined) {
                        tempRecord.FeaturedOn = tempRecord.Dakota_Live_Call__r.Name;
                    }

                    tempDakotaContentList.push(tempRecord);
                }

                if(this.offset==0){
                    this.fromRefresh = false;
                }
                
                if ((this.offset + this.limit) >= this.totalRelatedContactCount ) {
                    this.plusSign = '';
                } else {
                    this.plusSign = '+';
                }
                this.offset += tempDakotaContentList.length;
                if(this.fromLoadMore){
                    if(this.relatedContactRecords)
                        this.relatedContactRecords = this.relatedContactRecords.concat(tempDakotaContentList);

                    this.fromLoadMore = false;
                    if (this.tableElement) {
                        this.tableElement.isLoading = false;
                      }
                }
                else
                {
                    this.relatedContactRecords=[];
                    this.relatedContactRecords = tempDakotaContentList;
                }
                this.isLoading = false;
            }
        }).catch(error => {
            this.isLoading = false;
            console.log('Error : ', error);
        });

    }

    onHandleSort(event) {

        const {
            fieldName: sortedBy,
            sortDirection
        } = event.detail;
        this.offset = 0;
        this.limit = 50;
        this.isLoading = true;
        this.sortedBy = sortedBy
        this.sortedDirection = sortDirection;
        this.getRelatedContacts(this.stateName,this.fieldsMapping.get(this.sortedBy), this.sortedDirection, this.limit, this.offset);

    }

    loadMoreData(event) {
        if(this.totalRelatedContactCount != this.offset && this.offset>0) {
            //Display a spinner to signal that data is being loaded
            if(!this.fromRefresh) {
            if(this.relatedContactRecords != null && event.target){
                event.target.isLoading = true;
            }

            this.tableElement = event.target;
            this.fromLoadMore = true;
            this.offset = this.relatedContactRecords.length;
            this.getRelatedContacts(this.stateName,this.fieldsMapping.get(this.sortedBy), this.sortedDirection, this.limit, this.offset);

        }
        }
    }

    refreshTable(event)
    {
        this.isLoading = true;
        this.infiniteLoading = true;
        this.offset = 0;
        this.limit = 50;
        this.fromRefresh = true;
        this.sortedDirection = 'asc';
        this.sortedBy = 'recordLink';
         var table = this.template.querySelector('lightning-datatable');
         if(table!=null)
            table.enableInfiniteLoading = true;
        return refreshApex(this.getRelatedContacts(this.stateName,this.fieldsMapping.get(this.sortedBy), this.sortedDirection, this.limit, this.offset));
    }

    setFieldMappings() {
        this.fieldsMapping = new Map();
        this.fieldsMapping.set("FeaturedOnLink", 'Dakota_Live_Call__r.Name');
        this.fieldsMapping.set("dateField", 'Date__c');
        this.fieldsMapping.set("Type", 'Type__c');
        this.fieldsMapping.set("recordLink", 'Name');
        this.fieldsMapping.set("recordingLink", 'Presentation_Recording_url__c');
      }

}