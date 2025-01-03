import { LightningElement,api,track } from 'lwc';
import getResults from '@salesforce/apex/MultiSelectCustomLookupController.fetchContacts';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import multiselectbox from '@salesforce/resourceUrl/multiselectbox';
import jQuery from '@salesforce/resourceUrl/jQueryPicklists';

export default class MultiSelectCustomLookup extends LightningElement {
    @api objectName = 'Account';
    @api fieldName = 'Name';
    @api Label;
    @track searchRecords = [];
    @api selectedConnRecords = [];
    @track selectedRecords = [];
    @api required = false;
    @api iconName = 'standard:contact';
    @api LoadingText = false;
    @track txtclassname = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
    @track messageFlag = false;
    showDropDown = false;
    @track blurTimeout;

    dropdownCss;
    connectedCallback()
    {
        Promise.all([
            loadStyle(this, multiselectbox),
            loadScript(this, jQuery)
        ]);
        if(this.selectedConnRecords!=null)
        {
            for(let i = 0; i < this.selectedConnRecords.length; i++)
            {
                let newsObject = { 'Id' : this.selectedConnRecords[i].Id ,'Name' : this.selectedConnRecords[i].Name };
                this.selectedRecords.push(newsObject);
            }
            let selRecords = this.selectedRecords;
            const selectedEvent = new CustomEvent('selected', { detail: {selRecords}, });
            // Dispatches the event.
            this.dispatchEvent(selectedEvent);
        }
    }

    searchField(event) 
    {
        var currentText = event.target.value;
        var selectRecId = [];
        for(let i = 0; i < this.selectedRecords.length; i++){
            selectRecId.push(this.selectedRecords[i].Id);
        }
        this.LoadingText = true;
        getResults({searchKey: currentText, selectedRecId : selectRecId })
        .then(result => {
            this.searchRecords= result;
            this.showDropDown = true;
            this.LoadingText = false;
            
            this.txtclassname =  result.length > 0 ? 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-is-open' : 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
            if(currentText.length > 0 && result.length == 0) {
                this.messageFlag = true;
            }
            else {
                this.messageFlag = false;
            }

            if(this.selectRecordId != null && this.selectRecordId.length > 0) {
                this.iconFlag = false;
                this.clearIconFlag = true;
            }
            else {
                this.iconFlag = true;
                this.clearIconFlag = false;
            }
        })
        .catch(error => {
            console.log(error);
        });
        
    }
    
    setSelectedRecord(event) {
        this.template.querySelectorAll('lightning-input').forEach(each => {
            each.value = '';
        });
        this.searchRecords = null;
        var recId = event.currentTarget.dataset.id;
        var selectName = event.currentTarget.dataset.name;
        let newsObject = { 'Id' : recId ,'Name' : selectName };
        this.selectedRecords.push(newsObject);
        this.txtclassname =  'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
        let selRecords = this.selectedRecords;
        this.showDropDown = false;
        const selectedEvent = new CustomEvent('selected', { detail: {selRecords}, });
        // Dispatches the event.
        this.dispatchEvent(selectedEvent);
    }

    removeRecord (event){
        let selectRecId = [];
        for(let i = 0; i < this.selectedRecords.length; i++){
            if(event.detail.name !== this.selectedRecords[i].Id)
                selectRecId.push(this.selectedRecords[i]);
        }
        this.selectedRecords = [...selectRecId];
        let selRecords = this.selectedRecords;
        const selectedEvent = new CustomEvent('selected', { detail: {selRecords}, });

        // Dispatches the event.
        this.dispatchEvent(selectedEvent);
    }

    onBlur() {
       this.blurTimeout = setTimeout(() =>  {this.showDropDown = false;}, 300);
    }
}