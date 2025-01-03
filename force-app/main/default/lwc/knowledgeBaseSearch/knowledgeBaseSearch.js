import { LightningElement, wire, api, track } from 'lwc';
import fetchKnowledgeBaseRecords from '@salesforce/apex/KnowledgeBaseSearchController.fetchKnowledgeBaseRecords';
import searchKnowledgeBaseRecords from '@salesforce/apex/KnowledgeBaseSearchController.searchKnowledgeBaseRecords';

export default class KnowledgeBaseSearch extends LightningElement {
    isLoading = true;
    knowledgebaseRecords = [];
    kbRecordsExists = false;
    portalName;
    @api portalType;
    componentStyling = 'componentStyling';

    connectedCallback(){
        if(this.portalType == null)
        {
            this.portalType = 'Marketplace';
        }
        this.portalName = this.portalType == 'Marketplace' ? 'Marketplace 2.0' : 'Everest';
        if (this.portalName == 'Marketplace 2.0') {
            this.componentStyling = 'componentStyling additionalCompStyling';
        }
        this.isLoading = true;
        fetchKnowledgeBaseRecords({
            portalType : this.portalType
        }).then(returnedKnowledgeBaseRecords => {
            if(returnedKnowledgeBaseRecords) {
                if(returnedKnowledgeBaseRecords.length > 0) {
                    this.kbRecordsExists = true;
                }
                else {
                    this.kbRecordsExists = false;
                }
                this.knowledgebaseRecords = returnedKnowledgeBaseRecords;
            }
            this.isLoading = false;
        }).catch(error => {
            this.isLoading = false;
            console.log("Error:", error);
        });
    }

    fetchSearchResults(event){
        this.isLoading = true;
        var searchValue = event.target.value;
        searchValue = searchValue.trim();
        this.knowledgebaseRecords = [];
        searchKnowledgeBaseRecords({
            portalType : this.portalType,
            searchTerm : searchValue
        }).then(returnedKnowledgeBaseRecords => {
            if(returnedKnowledgeBaseRecords) {
                if(returnedKnowledgeBaseRecords.length > 0) {
                    this.kbRecordsExists = true;
                }
                else {
                    this.kbRecordsExists = false;
                }
                this.knowledgebaseRecords = returnedKnowledgeBaseRecords;
            }
            this.isLoading = false;
        }).catch(error => {
            this.isLoading = false;
            console.log("Error:", error);
        });
    }
}