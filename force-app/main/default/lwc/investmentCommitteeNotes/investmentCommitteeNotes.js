import { LightningElement,wire, track, api} from 'lwc';
import getICNotesList from '@salesforce/apex/InvestmentCommitteeNotesController.getICNotesList';
import getNotesCount from '@salesforce/apex/InvestmentCommitteeNotesController.getNotesCount';
import managerPresentationDatatableCss from '@salesforce/resourceUrl/managerPresentationDatatableCss';
import activeCommunities from '@salesforce/label/c.active_communities';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadStyle } from 'lightning/platformResourceLoader';

const columns = [
    { label: 'Name', fieldName: "recordLink", sortable: true, type: "url", typeAttributes: { label: { fieldName: 'Name' }, target: '_self', tooltip: { fieldName: 'Name' }}},
    { label: 'Account', fieldName: 'accountURL', type: 'url', sortable: true , typeAttributes: { label: { fieldName: 'accountName' }, target: '_self',tooltip: { fieldName: 'accountName' }}},
    { label: 'Meeting Date', fieldName: 'Meeting_Date__c', type: 'date-local', sortable: true , typeAttributes: { day: "numeric", month: "numeric", year: "numeric"}},
    { label: 'Posted Date', fieldName: 'Posted_Date__c', type: 'date-local', sortable: true , typeAttributes: { day: "numeric", month: "numeric", year: "numeric"}},
    { label: 'Meeting Minutes URL', fieldName: 'Meeting_Minute_URL__c', type: "url", typeAttributes: {target: '_self'} },
];

export default class InvestmentCommitteeNotes extends LightningElement {
    error;
    columns = columns;
    @track isLoading=false;
    defaultSortDirection = 'desc';
    sortDirection = 'desc';
    displayPage = false;
    pageUrl;
    sortedBy = 'Posted_Date__c';
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    loadMoreStatus;
    totalNumberOfRows;
    limit=20;
    offset=0;
    plusSign = null;
    icnotes;
    searchedValue = '';
    disableLoadMore = false;

    connectedCallback() {

        Promise.all([
            loadStyle(this, managerPresentationDatatableCss)
        ]);

        this.isLoading = true;
        this.columns = columns;

        getNotesCount({
            searchTerm : this.searchedValue
        }) 
        .then (notesCount => {
            this.totalNumberOfRows = notesCount;
        }).catch(error => {
            console.log('error in getting totalNumberOfRows');
        });

        this.sortedBy = 'Posted_Date__c';
        
        getICNotesList({
            sortBy: this.sortedBy, 
            sortOrder: this.sortDirection,
            recLimit: this.limit,
            queryOffset: this.offset,
            searchTerm : this.searchedValue
        }) .then (commNotes => {
            var tempList = [];  
            for (var i = 0; i < commNotes.length; i++) 
            {
                let temObj = Object.assign({}, commNotes[i]);
                temObj.Name = commNotes[i].Name;
                temObj.recordLink = "/"+this.communityName+"/s/detail/" + commNotes[i].Id;
                temObj.accountName = commNotes[i].Account__r.Name
                temObj.accountURL = "/" + this.communityName + "/s/detail/" + commNotes[i].Account__c;
                temObj.Posted_Date__c = commNotes[i].Posted_Date__c;
                temObj.Meeting_Date__c = commNotes[i].Meeting_Date__c;
                temObj.Meeting_Minute_URL__c = commNotes[i].Meeting_Minute_URL__c;
                tempList.push(temObj);
            }
            this.icnotes = tempList;
            this.offset = this.icnotes.length;
                if((this.offset) >= this.totalNumberOfRows)
                {
                    this.plusSign = '';
                }
                else
                {
                    this.plusSign = '+';
                }
                this.isLoading=false;
        }).catch(error => {
            this.isLoading=false;
        });
    }

    loadMoreData(event) {
        if (this.disableLoadMore) {
            if((this.offset) < this.totalNumberOfRows)
            {
                this.disableLoadMore = false;
                return;
            }
        }
            
        if(this.offset < this.totalNumberOfRows)
        {
            if(this.icnotes!=null && event.target){
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            this.loadMoreStatus = 'Loading';
            let sortingField = this.sortedBy;
            if(this.sortedBy == 'recordLink') {
                sortingField = 'Name';
            }
            else if(this.sortedBy == 'accountURL') {
                sortingField = 'Account__r.Name';
            }
        getICNotesList({
            sortBy: sortingField, 
            sortOrder: this.sortDirection,
            recLimit: this.limit,
            queryOffset: this.offset,
            searchTerm : this.searchedValue
        }).then((commNotes) => {
            var tempList = [];
            for (var i = 0; i < commNotes.length; i++) 
            {
                let temObj = Object.assign({}, commNotes[i]);
                temObj.Name = commNotes[i].Name;
                temObj.recordLink ="/"+this.communityName+"/s/detail/" + commNotes[i].Id;
                temObj.accountName = commNotes[i].Account__r.Name;
                temObj.accountURL = "/" + this.communityName + "/s/detail/" + commNotes[i].Account__c;
                temObj.Posted_Date__c = commNotes[i].Posted_Date__c;
                temObj.Meeting_Date__c = commNotes[i].Meeting_Date__c;
                temObj.Meeting_Minute_URL__c = commNotes[i].Meeting_Minute_URL__c;
                tempList.push(temObj);
            }
            if(this.icnotes){
                this.icnotes =  this.icnotes.concat(tempList);
                this.sortedBy = sortingField;
                if(sortingField == 'Name') {
                    this.sortedBy  = 'recordLink';
                }
                else if(sortingField == 'Account__r.Name') {
                    this.sortedBy  = 'accountURL';
                }
            }
            if((this.offset+20)>=this.totalNumberOfRows)
            {
                this.offset = this.totalNumberOfRows;
                this.plusSign = '';
            }
            else
            {
                this.offset = parseInt(this.offset ) + parseInt(this.limit);
                this.plusSign = '+';
            }
            this.loadMoreStatus = '';
            if (this.icnotes!=null && this.icnotes.length  >= this.totalNumberOfRows) {
                this.loadMoreStatus = 'No more data to load';
            }
                else if(this.icnotes==null)
                {
                    this.loadMoreStatus = 'No more data to load';

                }

                if(this.tableElement){
                    this.tableElement.isLoading = false;
                }    
        }).catch(error => {
            this.isLoading=false;
            console.log(error);
        });
        }
    }

    onHandleSort(event) {
        this.isLoading = true;
        const { fieldName: sortedBy, sortDirection } = event.detail;
        let sortingField = sortedBy;
        if(sortedBy== 'recordLink') {
            sortingField = 'Name';
        }
        else if(sortedBy == 'accountURL') {
            sortingField = 'Account__r.Name';
        }
        
        this.icnotes = [];
        getICNotesList({
            sortBy: sortingField, 
            sortOrder: sortDirection,
            recLimit: this.offset,
            queryOffset: 0,
            searchTerm : this.searchedValue
        }).then((commNotes) => {
            var tempList = [];  
            for (var i = 0; i < commNotes.length; i++) 
            {
                let temObj = Object.assign({}, commNotes[i]);
                temObj.Name = commNotes[i].Name;
                temObj.recordLink ="/"+this.communityName+"/s/detail/" + commNotes[i].Id;
                temObj.accountName = commNotes[i].Account__r.Name;
                temObj.accountURL = "/" + this.communityName + "/s/detail/" + commNotes[i].Account__c;
                temObj.Posted_Date__c = commNotes[i].Posted_Date__c;
                temObj.Meeting_Date__c = commNotes[i].Meeting_Date__c;
                temObj.Meeting_Minute_URL__c = commNotes[i].Meeting_Minute_URL__c;
                tempList.push(temObj);
            }
            this.icnotes =  tempList;
            this.isLoading = false;
        }).catch(error => {
            this.isLoading=false;
            console.log(error);
        });
        this.sortDirection = sortDirection;
        this.sortedBy = sortingField;
        if(sortingField == 'Name') {
            this.sortedBy  = 'recordLink';
        }
        else if(sortingField == 'Account__r.Name') {
            this.sortedBy  = 'accountURL';
        }
    }

    openPDF()
    {
        var notes = this.template.querySelector('lightning-datatable').getSelectedRows();
        if(notes!=null && notes.length>0)
        {
            var notesIds = '';
            for(var i=0; i<notes.length; i++)
            {
                notesIds = notesIds+notes[i].Id + ',';
            }
            this.template.querySelector('[data-id="mainCmp"]').className='slds-hide';
            this.pageUrl = '/apex/PublicPlanMinutes?notesIds='+notesIds;
            this.displayPage = true;
        }
        else
        {
            const event = new ShowToastEvent({
                message: 'Please select at least one Public Plan Minute to generate PDF',
                variant: 'Error',
                mode: 'dismissable'
            });
            this.dispatchEvent(event);
        }
    }
    closePDF()
    {
        this.template.querySelector('[data-id="mainCmp"]').className='slds-show slds-modal__content content-div slds-card';
        this.displayPage = false;
    }

    searchManagerPrestOnEnter(event) {
        if (event.keyCode == 13) {
            this.isLoading = true;
            this.fetchSearchResults(event);
        }
    }

    resetFilters(event) {
        this.template.querySelector('[data-id="searchValue"]').value = '';
        this.totalNumberOfRows = 0;
        this.limit = 20;
        this.offset = 0;
        this.sortBy = 'MeetingDate';
        this.sortDirection ='desc';
        this.searchedValue = '';
        this.template.querySelector('lightning-datatable').selectedRows=[];
        this.connectedCallback();
    }

    fetchfilteredICNotes(){
        this.isLoading = true;
        this.icnotes = [];
        this.offset = 0;
        this.recLimit = 20;
        this.disableLoadMore = true;

        getNotesCount({
            searchTerm : this.searchedValue
        }) 
        .then (notesCount => {
            this.totalNumberOfRows = notesCount;
        }).catch(error => {
            console.log('error in getting totalNumberOfRows');
        });

        let sortingField = this.sortedBy;
        if(this.sortedBy == 'recordLink') {
            sortingField = 'Name';
        }
        else if(this.sortedBy == 'accountURL') {
            sortingField = 'Account__r.Name';
        }

        getICNotesList({
            sortBy: sortingField, 
            sortOrder: this.sortDirection,
            recLimit: this.recLimit,
            queryOffset: this.offset,
            searchTerm : this.searchedValue
        }).then((commNotes) => {
            var tempList = [];
            for (var i = 0; i < commNotes.length; i++) 
            {
                let temObj = Object.assign({}, commNotes[i]);
                temObj.Name = commNotes[i].Name;
                temObj.recordLink ="/"+this.communityName+"/s/detail/" + commNotes[i].Id;
                temObj.accountName = commNotes[i].Account__r.Name;
                temObj.accountURL = "/" + this.communityName + "/s/detail/" + commNotes[i].Account__c;
                temObj.Posted_Date__c = commNotes[i].Posted_Date__c;
                temObj.Meeting_Date__c = commNotes[i].Meeting_Date__c;
                temObj.Meeting_Minute_URL__c = commNotes[i].Meeting_Minute_URL__c;
                tempList.push(temObj);
            }
            this.icnotes =  tempList;
            this.offset = this.icnotes.length;
            if((this.offset) >= this.totalNumberOfRows)
            {
                this.plusSign = '';
                this.disableLoadMore = true;
            }
            else
            {
                this.plusSign = '+';
                this.disableLoadMore = false;
            }

            this.sortedBy = sortingField;
            if(sortingField == 'Name') {
                this.sortedBy  = 'recordLink';
            }
            else if(sortingField == 'Account__r.Name') {
                this.sortedBy  = 'accountURL';
            }
            this.isLoading = false;
        }).catch(error => {
            this.isLoading=false;
            console.log(error);
        });
    }

    fetchSearchResults(event){
        var searchValue = this.template.querySelector('[data-id="searchValue"]').value;
        this.searchedValue = searchValue.trim();
        this.fetchfilteredICNotes();
    }
}