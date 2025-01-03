import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";

import NAME_FIELD from '@salesforce/schema/Conference_Speaker__c.Name';
import TITLE_FIELD from '@salesforce/schema/Conference_Speaker__c.Title__c';
import EMAIL_FIELD from '@salesforce/schema/Conference_Speaker__c.Email__c';

import INVESTMENT_FOCUS_FIELD from '@salesforce/schema/Conference_Speaker__c.Investment_Focus__c';
import START_DATE_FIELD from '@salesforce/schema/Conference_Speaker__c.Start_Date__c';
import FORMAT_FIELD from '@salesforce/schema/Conference_Speaker__c.Format__c';

import activeCommunities from '@salesforce/label/c.active_communities';

import getConferenceSpeakerRecordsRelatedToContact from '@salesforce/apex/ConferenceSpeakerController.getConferenceSpeakerRecordsRelatedToContact';    
import getRecordsCount from '@salesforce/apex/ConferenceSpeakerController.getRecordsCount';  
import getConferenceSpeakerRecordsRelatedToConference from '@salesforce/apex/ConferenceSpeakerController.getConferenceSpeakerRecordsRelatedToConference';

const COLUMNS_CONTACT = [
    { label: 'Conference Speaker Name', sortable: true, fieldName: "Id", type: "url", typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: NAME_FIELD.fieldApiName }}},
    { label: 'Conference Name', sortable: true, fieldName: "conferenceLink", type: "url", typeAttributes: { label: { fieldName: "conferenceName" }, target: '_self', tooltip: { fieldName: "conferenceName" }}},
    { label: 'Investment Focus', sortable: true, fieldName: INVESTMENT_FOCUS_FIELD.fieldApiName, type: 'text'},
    { label: 'Start Date', sortable: true, fieldName: START_DATE_FIELD.fieldApiName, type: 'date-local',typeAttributes: {day: "numeric",month: "numeric", year: "numeric"}},
    { label: 'Conference Metro Area', sortable: true, fieldName: "conferenceMetroAreaLink", type: 'url', typeAttributes: { label: { fieldName: "conferenceMetroArea" }, target: '_self', tooltip: { fieldName: "conferenceMetroArea" }}},
    { label: 'Format', sortable: true, fieldName: FORMAT_FIELD.fieldApiName, type: 'text'}
    
]
const COLUMNS_CONFERENCE = [
    { label: 'Conference Speaker Name', sortable: true, fieldName: "Id", type: "url", typeAttributes: { label: { fieldName: NAME_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: NAME_FIELD.fieldApiName }}},
    { label: 'Contact Name', sortable: true, fieldName: "contactLink", type: 'url', typeAttributes: { label: { fieldName: "contactName" }, target: '_self', tooltip: { fieldName: "contactName"}}},
    { label: 'Account', sortable: true, fieldName: "contactAccountLink", type: 'url', typeAttributes: { label: { fieldName: "contactAccount" }, target: '_self', tooltip: { fieldName: "contactAccount" }}},
    { label: 'Title', sortable: true, fieldName: TITLE_FIELD.fieldApiName, type: 'text'},
    { label: 'Metro Area', sortable: true, fieldName: "contactMetroAreaLink", type: 'url', typeAttributes: { label: { fieldName: "contactMetroArea" }, target: '_self', tooltip: { fieldName: "contactMetroArea" }}},
    { label: 'Email', sortable: true, fieldName: EMAIL_FIELD.fieldApiName, type: 'email', typeAttributes: { label: { fieldName: EMAIL_FIELD.fieldApiName }, target: '_self', tooltip: { fieldName: EMAIL_FIELD.fieldApiName }}}
    
]

export default class ConferenceSpeakerInContAndConf extends NavigationMixin(LightningElement) {
    @api recordId;
    @api objectType;
    isContact=false;
    recordsExists = false;
    columns = [];
    data;
    baseURL = '';
    panelStyling;
    isLoading=false;
    totalRecords = '0';
    defaultSortDirection = 'desc';
    sortedDirection = 'desc';
    sortedBy = START_DATE_FIELD.fieldApiName;
    nameSortDir = this.defaultSortDirection;
    nullOrder = 'LAST';
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback()
    {   
        this.isLoading = true;
        if(this.objectType=='Contact')
        {
            this.isContact=true;
            this.columns = COLUMNS_CONTACT;
            getRecordsCount({
                recordId : this.recordId,
                objectType: this.objectType
            }).then(returnedCount => {
                this.isLoading = false;
                if(returnedCount == 0) {
                    this.recordsExists = false;
                }
                else {
                    this.recordsExists = true;
                }
                if(returnedCount > 10){
                    this.totalRecords = '10+';
                } 
                else {
                    this.totalRecords = returnedCount;
                }
                if(returnedCount>0)
                {   
                    this.sortedDirection = 'desc';
                    this.sortedBy = START_DATE_FIELD.fieldApiName;
                    this.getRecords(this.recordId, this.sortedBy, this.sortedDirection);   
                }
            }).catch(error => {
                this.isLoading = false;
            });
        }
        else
        {
            this.columns = COLUMNS_CONFERENCE;
            getRecordsCount({
                recordId : this.recordId,
                objectType: this.objectType
            }).then(returnedCount => {
                this.isLoading = false;
                if(returnedCount == 0) {
                    this.recordsExists = false;
                }
                else {
                    this.recordsExists = true;
                }
                if(returnedCount > 10){
                    this.totalRecords = '10+';
                } 
                else {
                    this.totalRecords = returnedCount;
                }
                if(returnedCount>0)
                {   
                    this.sortedDirection = 'asc';
                    this.sortedBy = '';
                    this.getRecords(this.recordId, this.sortedBy, this.sortedDirection);
                }
            }).catch(error => {
                this.isLoading = false;
            });
        }
        
    }

    /**
     * To get records of Dakota Content
     */
    getRecords(recordId, sortedBy, sortedDirection)
    {   
        this.isLoading = true;
        if (sortedDirection == 'desc'){
            this.nullOrder = 'LAST';
        }
        else {
            this.nullOrder = 'FIRST';
        }

        if(this.objectType=='Contact')
        {
            getConferenceSpeakerRecordsRelatedToContact({
                recordId : recordId,
                sortedBy : sortedBy,
                sortOrder : sortedDirection,
                nullOrder: this.nullOrder
            }).then(returnedData => { 
                if (returnedData) {
                    for(var i=0; i<returnedData.length; i++)
                    {
                        returnedData[i].Id = "/"+this.communityName+'/s/conference-speaker/'+returnedData[i].Id;
                        if(returnedData[i].Conference__c)
                        {
                            returnedData[i].conferenceLink = "/"+this.communityName+'/s/conference/'+returnedData[i].Conference__c;
                            returnedData[i].conferenceName = returnedData[i].Conference__r.Name;
                        }
                        if(returnedData[i].Conference__r.Metro_Area__c)
                        {
                            returnedData[i].conferenceMetroAreaLink = "/"+this.communityName+'/s/metro-area/'+returnedData[i].Conference__r.Metro_Area__c;
                            returnedData[i].conferenceMetroArea = returnedData[i].Conference__r.Metro_Area__r.Name;
                        }
                    }
                    this.data = returnedData;
                    this.isLoading = false;
                }
                else
                {
                    this.data = null;
                }
            }).catch(error => {
                this.isLoading = false;
            });
        }
        else
        {
            getConferenceSpeakerRecordsRelatedToConference({
                recordId : recordId,
                sortedBy : sortedBy,
                sortOrder : sortedDirection,
                nullOrder: this.nullOrder
            }).then(returnedData => {
                if (returnedData) {
                    for(var i=0; i<returnedData.length; i++)
                    {
                        returnedData[i].Id = "/"+this.communityName+'/s/conference-speaker/'+returnedData[i].Id;
                        if(returnedData[i].Contact__c)
                        {
                            returnedData[i].contactLink = "/"+this.communityName+'/s/contact/'+returnedData[i].Contact__c;
                            returnedData[i].contactName = returnedData[i].Contact__r.Name;
                        }
                        if(returnedData[i].Contact__r.AccountId)
                        {
                            returnedData[i].contactAccountLink = "/"+this.communityName+'/s/account/'+returnedData[i].Contact__r.Account.Id;
                            returnedData[i].contactAccount = returnedData[i].Contact__r.Account.Name;
                        }
                        if(returnedData[i].Contact__r.Metro_Area__c)
                        {
                            returnedData[i].contactMetroAreaLink = "/"+this.communityName+'/s/metro-area/'+returnedData[i].Contact__r.Metro_Area__c;
                            returnedData[i].contactMetroArea = returnedData[i].Contact__r.Metro_Area__r.Name;
                        }
                    }
                    this.data = returnedData;
                    this.isLoading = false;
                }
                else
                {
                    this.data = null;
                }
            }).catch(error => {
                this.isLoading = false;
            });
        }
        
    }

    handleShowFullRelatedList() {
        if(this.objectType=='Contact')
        {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordRelationshipPage',
                attributes: {
                    recordId: this.recordId,
                    objectApiName: 'Contact',
                    relationshipApiName: 'Conference__r',
                    actionName: 'view'
                }
            });
        }
        else
        {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordRelationshipPage',
                attributes: {
                    recordId: this.recordId,
                    objectApiName: 'Conference__c',
                    relationshipApiName: 'Conference_Speakers__r',
                    actionName: 'view'
                }
            });
        }
    }
    /**
     * For sorting the table
     * @param {*} event 
     */
    updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        let tempSortBy = this.sortedBy;

        if(this.sortedBy === 'Id') {
            tempSortBy = 'Name';
        }else if(this.sortedBy === 'conferenceLink') {
            tempSortBy = 'Conference__r.Name';
        }else if(this.sortedBy === INVESTMENT_FOCUS_FIELD.fieldApiName) {
            tempSortBy =  'Investment_Focus__c';
        }else if(this.sortedBy === START_DATE_FIELD.fieldApiName) {
            tempSortBy =  'Start_Date__c';
        }else if(this.sortedBy === 'conferenceMetroAreaLink') {
            tempSortBy =  'Conference__r.Metro_Area__r.Name';
        }else if(this.sortedBy === FORMAT_FIELD.fieldApiName) {
            tempSortBy =  'Format__c';
        }
        else if(this.sortedBy === 'contactLink') {
            tempSortBy =  'Contact__r.Name';
        }else if(this.sortedBy === 'contactAccountLink') {
            tempSortBy =  'Contact__r.Account.Name';
        }else if(this.sortedBy === TITLE_FIELD.fieldApiName) {
            tempSortBy =  'Title__c';
        }else if(this.sortedBy === 'contactMetroAreaLink') {
            tempSortBy =  'Contact__r.Metro_Area__r.Name';
        }else if(this.sortedBy === EMAIL_FIELD.fieldApiName) {
            tempSortBy =  'Email__c';
        }

        this.sortedDirection = this.nameSortDir === 'asc'? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.getRecords(this.recordId, tempSortBy, this.sortedDirection);
    }
}