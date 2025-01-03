import { api, LightningElement, track, wire } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import pill_height from '@salesforce/resourceUrl/pill_height';
import fetchAccounts from '@salesforce/apex/CustomLookupController.fetchAccounts';
import fetchUniversityRecords from '@salesforce/apex/CustomLookupController.fetchUniversityRecords'


export default class customLookup extends LightningElement {
    @api objName;
    @api iconName;
    @api filter = '';
    @api records;
    @api searchPlaceholder='Search';
    @api selectedName;
    @api isValueSelected;
    @track blurTimeout;
    searchTerm = '';
    @api allRecords;
    recordsExist;
    
    //css
    @track boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus';
    @track inputClass = '';

    renderedCallback()
    {
        if(this.records!=null && this.records.length>0)
            this.recordsExist = true;
        Promise.all([
            loadStyle(this, pill_height)
        ]);
    }
  

    handleClick() {
        if(this.objName == 'Account' || this.objName == 'University_Alumni__c')
        {
            this.onChange(null);
        }
        else
        {
            this.inputClass = 'slds-has-focus';
            this.boxClass = 'ul-container slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus slds-is-open';
        }
        
        
    }

    onBlur() {
        this.blurTimeout = setTimeout(() =>  {this.boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus'}, 300);
    }

    onSelect(event) {
        this.template.querySelectorAll('lightning-input').forEach(each => {
            each.value = '';
        });
        if(this.objName == 'Account' || this.objName == 'University_Alumni__c')
        {
            this.records = null;
        }
        let selectedId = event.currentTarget.dataset.id;
        let selectedName = event.currentTarget.dataset.name;
        const valueSelectedEvent = new CustomEvent('lookupselected', {detail:  selectedId });
        this.dispatchEvent(valueSelectedEvent);
        this.isValueSelected = true;
        this.selectedName = selectedName;
        if(this.blurTimeout) {
            clearTimeout(this.blurTimeout);
        }
        this.boxClass = 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus';
    }

    handleRemovePill() {
        const valueSelectedEvent = new CustomEvent('lookupselected', {detail:  null });
        this.dispatchEvent(valueSelectedEvent);
        this.isValueSelected = false;
    }

    onChange(event) {
        this.isLoading = true;
        if(event!=null)
            this.searchTerm = event.target.value;
        if(this.objName == 'Account')
        {
            fetchAccounts({
                searchKey : this.searchTerm
            }).then(returnedData => {
                if(returnedData != null)
                {
                    this.records = returnedData;
                    if(this.records!=null && this.records.length>0)
                    {                        
                        this.recordsExist = true;
                    }
                    else
                         this.recordsExist = false;
                    this.inputClass = 'slds-has-focus';
                    this.boxClass = 'ul-container slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus slds-is-open';
                    this.isLoading = false;
                }
            }).catch(error => {
                console.log(error);
            });
        }
        else if (this.objName == 'University_Alumni__c') {
            fetchUniversityRecords({
                searchKey : this.searchTerm
            }).then(returnedData => {
                if(returnedData != null)
                {
                    this.records = returnedData;
                    if(this.records!=null && this.records.length>0)
                        this.recordsExist = true;
                    else
                         this.recordsExist = false;
                    this.inputClass = 'slds-has-focus';
                    this.boxClass = 'ul-container slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-has-focus slds-is-open';
                    this.isLoading = false;
                }
            }).catch(error => {
                console.log(error);
            });
        } else
        {
            console.log('yes i m here ');
            if((this.searchTerm == null || this.searchTerm == ''))
                {
                    this.records = this.allRecords.slice();
                }
                else
                {
                    var searchedRecs = [];
                    var index = 0;
                    for(var i=0; i<this.allRecords.length; i++)
                    {
                        var name = this.allRecords[i].Name.toLowerCase();
                        if(name.includes(this.searchTerm.toLowerCase()))
                        {
                            searchedRecs[index] = this.allRecords[i];
                            index++;
                        }
                    }
                    if(searchedRecs!=null && searchedRecs.length>0)
                        this.records = searchedRecs;
                    else
                    {
                        this.records = null;
                        this.recordsExist = false;
                    }    
                }
                this.isLoading = false;
        }
    }

}