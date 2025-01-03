import { LightningElement, track, api } from 'lwc';
import fetchSObjectFields from '@salesforce/apex/ExportRecordsMainController.fetchSObjectFields';
import fetchPaginatedRecords from '@salesforce/apex/ExportRecordsMainController.fetchPaginatedRecords';
import getInitialExportCount from '@salesforce/apex/ExportRecordsMainController.getInitialExportCount';
import updateExportCount from '@salesforce/apex/ExportRecordsMainController.updateExportCount';
import { loadStyle } from 'lightning/platformResourceLoader';
import accountExportStyling from '@salesforce/resourceUrl/AccountExportStyling';
import ParserJs from 'c/parserJs';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import isTrialUser from '@salesforce/apex/ExportRecordsMainController.isTrialUser';
import getOperators from '@salesforce/apex/ExportRecordsMainController.getOperators';
import { loadScript } from "lightning/platformResourceLoader";
import ExcelIcon from "@salesforce/resourceUrl/ExcelIcon";
import workbook2 from "@salesforce/resourceUrl/writeExcel";
import getPicklistValues from '@salesforce/apex/ExportRecordsMainController.getPicklistValues';
import ALLOWED_EXPORT_LIMIT from '@salesforce/label/c.Initial_Export_Batch_Limit';
import getMetroAreaNames from '@salesforce/apex/ExportRecordsMainController.getMetroAreaNames';

const ACCOUNT_COLUMNS = [
    { label: 'Account Name', sortable: false, fieldName: 'Name' },
    { label: 'Account Type', sortable: false, fieldName: 'Type' },
    { label: 'Metro Area', sortable: false, fieldName: 'MetroArea.Name' },
    { label: 'AUM', sortable: false, fieldName: 'AUM__c', type: 'currency', cellAttributes: { alignment: 'left' }, typeAttributes: { minimumFractionDigits: '0', maximumFractionDigits: '0' } },
    { label: 'Website', sortable: false, fieldName: 'Website', type: 'url' }
]

const CONTACT_COLUMNS = [

    { label: 'First Name', sortable: false, fieldName: 'FirstName' },
    { label: 'Last Name', sortable: false, fieldName: 'LastName' },
    { label: 'Full Name', sortable: false, fieldName: 'Name' },
    { label: 'Account', sortable: false, fieldName: 'Account.Name' },
    { label: 'Phone', sortable: false, fieldName: 'Phone', type: 'phone' },
    { label: 'Email', sortable: false, fieldName: 'Email', type: 'email' },
    { label: 'Title', sortable: false, fieldName: 'Title' }
]


export default class ExportDataCustomView extends LightningElement {
    @api objectName;    
    @api exportCount;
    @track selectedField = 'Name';
    @track selectedLabel = '';
    @track selectedOperator = '';
    @track filterValue = '';
    @track listViewSize = 'width: 100%;';
    @track fieldDisplayPopup = false;
    @track addedFilters = [];

    @track columns;
    data;
    isLoading = false;
    options = [];
    selectedFieldsToDisplay;
    tempSelectedFields = [];
    multipicklistSelectedValue = [];
    fieldDisplayPopUpFirstOpen = false;
    fieldsToBeFetched;
    tempColumns = [];
    lookupFieldMap = [];
    selectedPicklistValue =''
    totalRecords = 0;
    totalPages = 0;
    currentPage = 0;
    firstRecId = '';
    lastRecId = '';
    listopen =false;
    paginationArray = [];
    filterVariant = '';
    filtersToSave = false;
    isFilterNotEmpty = false;
    isFiltersLimitReached = false;
    defaultFieldName = 'Name';
    defaultFieldLabel;
    customBackDrop = false;
    isInvalidInput = false;
    showCustomFilterLogicSection = false;
    customLogic = '';
    isAddFilterLogic = false;
    fieldOptions = [];
    operatorOptions = [];
    invalidInputMessage = '';
    customPlaceHolder = '';
    filterId = '';
    activeCard = '';
    stringFieldTypes = ['text', 'string', 'textarea', 'url', 'phone', 'email'];
    numberFieldTypes = ['integer', 'number', 'double', 'percent', 'currency'];
    operatorsList;
    isTrialUser;
    isFilterLogicCorrect = true;
    excel = '';
    pluralObjectName;
    finalAppliedFilters = [];
    fromSaveColumns = false;
    showGroupedCombobox = false;
    groupsAndOptions = [];
    showDropDown = false;
    fieldLabelSelected = false;
    fieldValue = 'Name';
    groupName = 'Contact';
    selectedFieldLabel = 'First Name';
    accountFieldOptions = [];
    schemaObj = [];
    exportDataFieldOptions = [];
    accountOptionsToDisplay = [];
    accountSelectedFieldsToDisplay = ['AUM__c','Type'];
    tempAccountSelectedFields = [];
    tempAccountColumns = [];
    accountFieldsToBeFetched = [];
    finalFieldsToBeFetched = [];
    finalColumns = [];
    contactFieldsChanged = false;
    displayFieldPopupLabel = '';
    isMultipicklist=false;
    multipicklistOptions = [];
    isPicklist=false;
    picklistOptions = [];
    accountPicklists = [];
    contactPicklists = [];
    accountPicklistsMap=new Map();
    contactPicklistsMap=new Map();
    metroAreaNames = [];
    options = [];
      selectedOptions = [];
    
      handleChangeMultiPickList(event) {
        this.filterValue = event.detail;
      }

      handleListClose() {
        if(this.isMultipicklist) {
            this.template.querySelector('c-multi-select-combobox-custom').handleClose();  
            this.listopen = false; 
        }
      }
    connectedCallback() {  
        Promise.all([
            loadStyle(this, accountExportStyling),
            loadScript(this, workbook2 + "/write-excel-file.min.js")
        ]);      
        if (this.objectName == 'Contact') {
            this.tempColumns =JSON.parse(JSON.stringify(CONTACT_COLUMNS)) ;

            this.tempAccountColumns =[ { label: 'Account: Account Type',initialWidth:185, sortable: false, fieldName: 'Account.Type' },
            { label: 'Account: Account AUM', initialWidth:185, sortable: false, fieldName: 'Account.AUM__c',  type: 'currency', cellAttributes: { alignment: 'left' }, typeAttributes: { minimumFractionDigits: '0', maximumFractionDigits: '0' }}]
            this.showGroupedCombobox = true;
            this.displayFieldPopupLabel = 'Select Contact Fields To Display';
        }
        else {
            this.tempColumns = ACCOUNT_COLUMNS;
            this.displayFieldPopupLabel = 'Select Fields To Display';
        }

        this.isLoading = true;
        this.pluralObjectName = this.objectName + 's';
        this.setDefaultColumns();
        this.excel = ExcelIcon;

        isTrialUser({}).then(isTrial => {
            this.isTrialUser = isTrial;
            getOperators({}).then(returnedList => {
                this.operatorsList = returnedList;

            }).catch(error => {
                this.isLoading = false;
            });

            fetchSObjectFields({
                objectName: this.objectName
            }).then(returnedData => {
                if (returnedData) {
                    for (let i = 0; i < returnedData.length; i++) {
                        let fieldValue = returnedData[i].apiName;
                        let fieldType = returnedData[i].fieldType;
                        let label = returnedData[i].label;
                        if (this.stringFieldTypes.includes(returnedData[i].fieldType.toLowerCase())) {
                            returnedData[i].fieldType = 'string';
                        }
                        else if (this.numberFieldTypes.includes(returnedData[i].fieldType.toLowerCase())) {
                            returnedData[i].fieldType = 'number';
                        }
                        else if (returnedData[i].fieldType == 'REFERENCE') {
                            fieldValue = returnedData[i].apiName.endsWith('Id') ? (returnedData[i].apiName.split('Id').shift() + '.Name') : (returnedData[i].apiName.split('__c').shift() + '__r.Name');
                            if (returnedData[i].label.endsWith('ID')) {
                                label = returnedData[i].label.split('ID').shift() + '';
                            }

                        }
                        if (returnedData[i].isFilterable) {
                            if (this.showGroupedCombobox) {
                                this.fieldOptions.push({
                                    "objectName": 'Contact',
                                    "label": label,
                                    "value": fieldValue,
                                    "type": returnedData[i].fieldType.toLowerCase()
                                });
                                if(returnedData[i].fieldType.toLowerCase()=='multipicklist' || returnedData[i].fieldType.toLowerCase()=='picklist' )
                                {
                                    this.contactPicklists.push(fieldValue);
                                }
                            }
                            else {
                                this.fieldOptions.push({
                                    "label": label,
                                    "value": fieldValue,
                                    "type": returnedData[i].fieldType.toLowerCase()
                                });
                                if(returnedData[i].fieldType.toLowerCase()=='multipicklist' || returnedData[i].fieldType.toLowerCase()=='picklist' )
                                {
                                    this.accountPicklists.push(fieldValue);
                                }
                            }
                            
                        }

                        this.exportDataFieldOptions.push({
                            "label": label,
                            "value": fieldValue,
                            "type": fieldType.toLowerCase()
                        })


                        this.options.push({
                            "label": label,
                            "value": returnedData[i].apiName,
                            "fieldType": fieldType
                        })
                    }
                    this.options.sort((a, b) => a.label.localeCompare(b.label));
                    this.fieldOptions.sort((a, b) => a.label.localeCompare(b.label));
                    if (this.showGroupedCombobox) {
                        fetchSObjectFields({
                            objectName: 'Account'
                        }).then(accountReturnedData => {
                            if (accountReturnedData) {
                                for (let i = 0; i < accountReturnedData.length; i++) {
                                    let fieldValue = accountReturnedData[i].apiName;
                                    let label = accountReturnedData[i].label;
                                    let type = accountReturnedData[i].fieldType;
                                    if (this.stringFieldTypes.includes(accountReturnedData[i].fieldType.toLowerCase())) {
                                        accountReturnedData[i].fieldType = 'string';
                                    }
                                    else if (this.numberFieldTypes.includes(accountReturnedData[i].fieldType.toLowerCase())) {
                                        accountReturnedData[i].fieldType = 'number';
                                    }
                                    else if (accountReturnedData[i].fieldType == 'REFERENCE') {
                                        fieldValue = accountReturnedData[i].apiName.endsWith('Id') ? (accountReturnedData[i].apiName.split('Id').shift() + '.Name') : (accountReturnedData[i].apiName.split('__c').shift() + '__r.Name');
                                        if (accountReturnedData[i].label.endsWith('ID')) {
                                            label = accountReturnedData[i].label.split('ID').shift() + '';
                                        }
                                    }
                                    if (accountReturnedData[i].isFilterable) {
                                        this.accountFieldOptions.push({
                                            "objectName": 'Account',
                                            "label": label,
                                            "value": fieldValue,
                                            "type": accountReturnedData[i].fieldType.toLowerCase()
                                        });

                                        if(accountReturnedData[i].fieldType.toLowerCase()=='multipicklist' || accountReturnedData[i].fieldType.toLowerCase()=='picklist' )
                                        {
                                            this.accountPicklists.push(fieldValue);
                                        }
                                    }
                                    this.accountOptionsToDisplay.push({
                                        "label": label,
                                        "value": fieldValue,
                                        "fieldType": type
                                    })
                                    this.exportDataFieldOptions.push({
                                        "label": label,
                                        "value": 'Account.' + fieldValue,
                                        "type": type.toLowerCase()
                                    })
                                }
                                this.accountFieldOptions.sort((a, b) => a.label.localeCompare(b.label));
                                this.accountOptionsToDisplay.sort((a, b) => a.label.localeCompare(b.label));
                                if (this.showGroupedCombobox) {
                                    this.groupsAndOptions = [
                                        { groupName: 'Contact Fields', options: this.fieldOptions },
                                        { groupName: 'Account Fields', options: this.accountFieldOptions }
                                    ]
                                }
                                this.tempAccountColumns = [];
                                for (let i = 0; i < this.accountSelectedFieldsToDisplay.length; i++) {
                                    let fieldLabel = 'Account: '+this.accountOptionsToDisplay.find(opt => opt.value === this.accountSelectedFieldsToDisplay[i]).label;
                                    let currentFieldType = this.accountOptionsToDisplay.find(opt => opt.value === this.accountSelectedFieldsToDisplay[i])?.fieldType;
                                    if (currentFieldType == 'REFERENCE') {
                                        let fieldValue = this.accountSelectedFieldsToDisplay[i];
                                        this.accountFieldsToBeFetched.push(fieldValue);
                                        this.tempAccountColumns.push({ label: fieldLabel, fieldName: 'Account.' + fieldValue });
                                    }
                                    else if (currentFieldType == 'CURRENCY') {
                                        this.accountFieldsToBeFetched.push(this.accountSelectedFieldsToDisplay[i]);
                                        this.tempAccountColumns.push({ label: fieldLabel, fieldName: 'Account.' + this.accountSelectedFieldsToDisplay[i], type: 'currency', cellAttributes: { alignment: 'left' }, typeAttributes: { minimumFractionDigits: '0', maximumFractionDigits: '0' } });
                                    }
                                    else if (currentFieldType == 'URL') {
                                        this.accountFieldsToBeFetched.push(this.accountSelectedFieldsToDisplay[i]);
                                        this.tempAccountColumns.push({ label: fieldLabel, fieldName: 'Account.' + this.accountSelectedFieldsToDisplay[i], type: 'url' });
                                    }
                                    else if (currentFieldType == 'DATETIME' || currentFieldType == 'DATE') {
                                        this.accountFieldsToBeFetched.push(this.accountSelectedFieldsToDisplay[i]);
                                        this.tempAccountColumns.push({ label: fieldLabel, fieldName: 'Account.' + this.accountSelectedFieldsToDisplay[i], type: 'date-local', typeAttributes: { day: "numeric", month: "numeric", year: "numeric" } });
                                    }
                                    else if (currentFieldType == 'PHONE') {
                                        this.accountFieldsToBeFetched.push(this.accountSelectedFieldsToDisplay[i]);
                                        this.tempAccountColumns.push({ label: fieldLabel, fieldName: 'Account.' + this.accountSelectedFieldsToDisplay[i], type: 'phone' });
                                    }
                                    else if (currentFieldType == 'EMAIL') {
                                        this.accountFieldsToBeFetched.push(this.accountSelectedFieldsToDisplay[i]);
                                        this.tempAccountColumns.push({ label: fieldLabel, fieldName: 'Account.' + this.accountSelectedFieldsToDisplay[i], type: 'email' });
                                    }
                                    else {
                                        this.accountFieldsToBeFetched.push(this.accountSelectedFieldsToDisplay[i]);
                                        this.tempAccountColumns.push({ label: fieldLabel, fieldName: 'Account.' + this.accountSelectedFieldsToDisplay[i] });
                                    }
                                };

                                this.setSelectedOnOptions();

                            }
                            this.getPicklistValues();
                            this.fetchRecordsViaPagination(false, false, null, null, null, true);
                        }).catch(error => {
                            this.isLoading = false;
                        });
                    }
                    else
                    {
                        this.getPicklistValues();
                        this.fetchRecordsViaPagination(false, false, null, null, null, true);
                    }
                }
                this.getMetroAreaNames();
            }).catch(error => {
                this.isLoading = false;
            });
        }).catch(error => {
            this.isLoading = false;
        });
        this.getInitialExportCount();
    }


    async getPicklistValues()
    {
        await getPicklistValues({
            objectApiName: 'Account',
            fieldApiNames: this.accountPicklists
        }).then(picklistValues => {
            for (let i = 0; i < picklistValues.length; i++) {
                this.accountPicklistsMap.set(picklistValues[i].fieldName, picklistValues[i].valuesLabelsMap);
            }
        }).catch(error => {
            console.log('Cannot fetch account picklist values');
        });

        await getPicklistValues({
            objectApiName: 'Contact',
            fieldApiNames: this.contactPicklists
        }).then(picklistValues => {
            for (let i = 0; i < picklistValues.length; i++) {
                this.contactPicklistsMap.set(picklistValues[i].fieldName, picklistValues[i].valuesLabelsMap);
            }
        }).catch(error => {
            console.log('Cannot fetch contact picklist values');
        });
    }

    

    async getMetroAreaNames()
    {
        await getMetroAreaNames().then(metroAreaNames => {
            this.metroAreaNames=metroAreaNames;
        }).catch(error => {
            console.log('Cannot fetch metroArea Names');
        });
    }

    get comboboxTriggerClass() {
        if (this.showDropDown) {
            return 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-is-open';
        } else {
            return 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
        }
    }

    get buttonClass() {
        let buttonClass = '';
        if (this.fieldLabelSelected) {
            buttonClass += 'slds-input_faux slds-combobox__input slds-combobox__input-value'
        } else if (!this.fieldLabelSelected && this.showDropDown) {
            buttonClass += 'slds-input_faux slds-combobox__input slds-has-focus'
        } else {
            buttonClass += 'slds-input_faux slds-combobox__input'
        }
        return buttonClass;
    }


    get items() {
        return [{
            label: 'Group One',
            items: [{
                type: 'option-inline',
                text: 'Burlington Textiles Corp of America'
            }, {
                text: 'Dickenson pic',
                type: 'option-inline'
            }]
        }, {
            label: 'Group Two',
            items: [{
                text: 'Dickenson pic',
                type: 'option-inline'
            }, {
                text: 'Edge Communications',
                type: 'option-inline'
            }]
        }];
    }

    get disablePrevPage() {
        return this.currentPage <= 1;
    }

    get disableNextPage() {
        return this.currentPage == this.totalPages;
    }

    setDefaultColumns() {
        if (this.objectName == 'Account') {
            this.columns = ACCOUNT_COLUMNS;
            this.selectedFieldsToDisplay = ['Name', 'Type', 'AUM__c', 'MetroArea__c', 'Website'];
            this.fieldsToBeFetched = ['Name', 'Type', 'AUM__c', 'MetroArea__r.Name', 'Website'];
            this.finalFieldsToBeFetched = ['Name', 'Type', 'AUM__c', 'MetroArea__r.Name', 'Website'];
            this.defaultFieldLabel = 'Account Name';
        }
        else if (this.objectName == 'Contact') {
            this.columns = CONTACT_COLUMNS;
            const insertIndex = this.columns.findIndex(col => col.fieldName == "Account.Name");
            if (insertIndex !== -1) {
                this.columns.splice(insertIndex + 1, 0, ...this.tempAccountColumns);
            }
            this.selectedFieldsToDisplay = ['FirstName','LastName','Name', 'AccountId', 'Phone', 'Email', 'Title'];
            this.fieldsToBeFetched = ['FirstName','LastName','Name', 'Account.Name', 'Phone', 'Email', 'Title'];
            this.finalFieldsToBeFetched = ['FirstName','LastName','Name', 'Account.Name', 'Phone', 'Email', 'Title','Account.Type','Account.AUM__c'];
            this.defaultFieldLabel = 'Full Name';
        }
    }

    /**
     * Method to fetch and prepare data with respect to the applied filter,filter logic, and pagination
     * @param {*} previousClicked If previous button is clicked
     * @param {*} nextClicked If next button is clicked
     * @param {*} firstId Record Id of first record of the current page
     * @param {*} lastPagefirstId Record Id of first record of the previous page
     * @param {*} lastId Record Id of last record of the current page
     */
    fetchRecordsViaPagination(previousClicked, nextClicked, firstId, lastPagefirstId, lastId, addInPaginationArray) {

        fetchPaginatedRecords({
            objectName: this.objectName,
            fieldsToBeDisplayed: this.finalFieldsToBeFetched,
            previous: previousClicked,
            next: nextClicked,
            firstId: firstId,
            lastPagefirstId: lastPagefirstId,
            lastId: lastId,
            filters: JSON.stringify(this.finalAppliedFilters),
            customLogic: this.customLogic
        }).then(returnedDataAndCount => {

            if (returnedDataAndCount.count > 0) {
                let returnedData = returnedDataAndCount.records;
                this.totalRecords = returnedDataAndCount.count;
                this.totalPages = Math.ceil(this.totalRecords / 500);
                if (!previousClicked && !nextClicked) {
                    this.currentPage = 1;
                }
                if (addInPaginationArray) {
                    this.paginationArray.push({ firstRecId: returnedData[0].Id, lastRecId: returnedData[returnedData.length - 1].Id });
                }
                let tempFetchedFields = [];
                for (var i = 0; i < this.finalFieldsToBeFetched.length; i++) {
                    let currentFieldName = this.finalFieldsToBeFetched[i];
                    if (currentFieldName.endsWith('.Name')) {
                        let trimmedFieldName = currentFieldName.slice(0, -5);
                        tempFetchedFields.push(trimmedFieldName);
                        if (trimmedFieldName.endsWith('__r')) {
                            trimmedFieldName = trimmedFieldName.slice(0, -3);
                            currentFieldName = trimmedFieldName + '__c';
                        }
                        else {
                            currentFieldName = trimmedFieldName + 'Id';
                        }
                    }
                    tempFetchedFields.push(currentFieldName);
                }
                if (this.showGroupedCombobox && this.accountFieldsToBeFetched != null && this.accountFieldsToBeFetched.length > 0) {
                    let tempReturnedData = [];
                    for (var i = 0; i < returnedData.length; i++) {
                        let recordToPush = Object.assign({}, returnedData[i]);
                        {
                            for (var j = 0; j < this.finalFieldsToBeFetched.length; j++) {
                                if (this.finalFieldsToBeFetched[j].startsWith('Account.')) {
                                    let trimmed = this.finalFieldsToBeFetched[j].slice(8);
                                    if (trimmed.endsWith('.Name')) {
                                        let trimmedFieldName = trimmed.slice(0, -5);
                                        if(recordToPush['Account'] != undefined && recordToPush['Account'][trimmedFieldName] != undefined) {
                                            recordToPush[this.finalFieldsToBeFetched[j]] = recordToPush['Account'][trimmedFieldName]['Name'];
                                        }
                                    }
                                    else {
										recordToPush[this.finalFieldsToBeFetched[j]] = recordToPush['Account'][trimmed];
									}
                                }
                            }
                        }
                        tempReturnedData.push(recordToPush);

                    }
                    returnedData = tempReturnedData;
                }

                let fetchedFields = tempFetchedFields;
                let lookupFields = [];
                for (var i = 0; i < fetchedFields.length; i++) {
                    if (this.options.find(opt => opt.value === fetchedFields[i])?.fieldType == 'REFERENCE') {
                        lookupFields.push(fetchedFields[i]);
                        let fieldValue = fetchedFields[i].endsWith('Id') ? (fetchedFields[i].split('Id').shift() + '.Name') : (fetchedFields[i].split('__c').shift() + '__r.Name')
                        this.lookupFieldMap[fetchedFields[i]] = fieldValue;
                    }
                }

                if (lookupFields.length > 0) {
                    let tempRecords = [];
                    for (var i = 0; i < returnedData.length; i++) {
                        let recordToPush = Object.assign({}, returnedData[i]);
                        for (var j = 0; j < lookupFields.length; j++) {
                            let keyName = lookupFields[j].endsWith('Id') ? lookupFields[j].replace('Id', '') : lookupFields[j].replace('__c', '__r');
                            let key = lookupFields[j].endsWith('Id') ? lookupFields[j].split('Id').shift() : lookupFields[j].split('__c').shift();
                            key = key + '.Name';
                            recordToPush[key] = recordToPush[keyName]?.Name;
                        }
                        tempRecords.push(recordToPush);
                    }
                    this.data = tempRecords;
                }
                else {
                    this.data = returnedData;
                }
                if (this.fromSaveColumns == true) {
                    this.updateColumsInDOM();
                    this.fromSaveColumns = false;
                }
            }
            else {
                this.updateColumsInDOM()
                this.data = null;
                this.totalPages = 0;
                this.currentPage = 0;
            }
            this.isLoading = false;
        }).catch(error => {
            this.data = [];
            this.isLoading = false;
            this.totalPages = 0;
            this.currentPage = 0;
            this.showToastMessage('Error', 'error', error.body.message);
        });
    }

    updateColumsInDOM() {
        if (this.tempColumns.length < 1 && !this.contactFieldsChanged) {
            for (let i = 0; i < this.finalColumns.length; i++) {

                this.columns.push(this.finalColumns[i]);

            }
            this.columns = JSON.parse(JSON.stringify(this.columns))

        }
        else {
            if (this.finalColumns.length > 0) {
                this.columns = this.finalColumns;
            }
        }
        this.tempSelectedFields = [];
        this.tempAccountSelectedFields = [];
        this.finalColumns = [];
    }

    /**
     * Helper method to show toast message
     * @param {*} title Title of toast message
     * @param {*} variant Variant of toast message
     * @param {*} message Error or success message in toast message
     */
    showToastMessage(title, variant, message) {
        const event = new ShowToastEvent({
            title: title,
            variant: variant,
            message: message,
        });
        this.dispatchEvent(event);
    }

    /**
     * Handler to open Select Fields to Display Popup
     */
    handleClick() {
        this.fieldDisplayPopup = true;
        this.fieldDisplayPopUpFirstOpen = true;
    }

    /**
     * Handler to close Select Fields to Display Popup
     */
    closefieldDisplayPopup() {
        this.fieldDisplayPopup = false;
        if (this.tempSelectedFields.length > 0) {
            this.selectedFieldsToDisplay = this.tempSelectedFields;
        }
        if (this.tempAccountSelectedFields.length > 0) {
            this.accountSelectedFieldsToDisplay = this.tempAccountSelectedFields;
        }
        this.tempSelectedFields = [];
        this.tempAccountSelectedFields = [];
        this.fieldDisplayPopUpFirstOpen = false;
    }

    /**
     * Handler method is called when any field is added/removed from the Contact field display popup
     */
    handleChange(event) {
        this.contactFieldsChanged = true;
        if (this.accountFieldsToBeFetched.length + event.detail.value.length > 25) {
            this.showToastMessage('Warning', 'Warning', 'You can select maximum 25 fields.');
            this.selectedFieldsToDisplay = JSON.parse(JSON.stringify(this.selectedFieldsToDisplay))
            return;
        }
        else {
            this.tempColumns = [];
            this.fieldsToBeFetched = [];

            if (this.fieldDisplayPopUpFirstOpen) {
                this.tempSelectedFields = this.selectedFieldsToDisplay;
                this.fieldDisplayPopUpFirstOpen = false;
            }

            this.selectedFieldsToDisplay = event.detail.value;
            for (let i = 0; i < this.selectedFieldsToDisplay.length; i++) {
                let fieldLabel = event.target.options.find(opt => opt.value === this.selectedFieldsToDisplay[i]).label;
                let currentFieldType = this.options.find(opt => opt.value === this.selectedFieldsToDisplay[i])?.fieldType;
                if (currentFieldType == 'REFERENCE') {

                    let fieldValue = this.selectedFieldsToDisplay[i].endsWith('Id') ? (this.selectedFieldsToDisplay[i].split('Id').shift() + '.Name') : (this.selectedFieldsToDisplay[i].split('__c').shift() + '__r.Name');
                    this.fieldsToBeFetched.push(fieldValue);
                    let key = this.selectedFieldsToDisplay[i].endsWith('Id') ? this.selectedFieldsToDisplay[i].split('Id').shift() : this.selectedFieldsToDisplay[i].split('__c').shift();
                    key = key + '.Name';
                    this.tempColumns.push({ label: fieldLabel, fieldName: key });
                }
                else if (currentFieldType == 'CURRENCY') {
                    this.fieldsToBeFetched.push(this.selectedFieldsToDisplay[i]);
                    this.tempColumns.push({ label: fieldLabel, fieldName: this.selectedFieldsToDisplay[i], type: 'currency', cellAttributes: { alignment: 'left' }, typeAttributes: { minimumFractionDigits: '0', maximumFractionDigits: '0' } });
                }
                else if (currentFieldType == 'URL') {
                    this.fieldsToBeFetched.push(this.selectedFieldsToDisplay[i]);
                    this.tempColumns.push({ label: fieldLabel, fieldName: this.selectedFieldsToDisplay[i], type: 'url' });
                }
                else if (currentFieldType == 'DATETIME' || currentFieldType == 'DATE') {
                    this.fieldsToBeFetched.push(this.selectedFieldsToDisplay[i]);
                    this.tempColumns.push({ label: fieldLabel, fieldName: this.selectedFieldsToDisplay[i], type: 'date-local', typeAttributes: { day: "numeric", month: "numeric", year: "numeric" } });
                }
                else if (currentFieldType == 'PHONE') {
                    this.fieldsToBeFetched.push(this.selectedFieldsToDisplay[i]);
                    this.tempColumns.push({ label: fieldLabel, fieldName: this.selectedFieldsToDisplay[i], type: 'phone' });
                }
                else if (currentFieldType == 'EMAIL') {
                    this.fieldsToBeFetched.push(this.selectedFieldsToDisplay[i]);
                    this.tempColumns.push({ label: fieldLabel, fieldName: this.selectedFieldsToDisplay[i], type: 'email' });
                } else if (currentFieldType == 'DOUBLE') {
                    this.fieldsToBeFetched.push(this.selectedFieldsToDisplay[i]);
                    this.tempColumns.push({ label: fieldLabel, fieldName: this.selectedFieldsToDisplay[i], type: 'number', cellAttributes: { alignment: 'left' } });
                }
                else if (currentFieldType == 'NUMBER') {
                    this.fieldsToBeFetched.push(this.selectedFieldsToDisplay[i]);
                    this.tempColumns.push({ label: fieldLabel, fieldName: this.selectedFieldsToDisplay[i], type: 'number', cellAttributes: { alignment: 'left' } });
                }
                else {
                    this.fieldsToBeFetched.push(this.selectedFieldsToDisplay[i]);
                    this.tempColumns.push({ label: fieldLabel, fieldName: this.selectedFieldsToDisplay[i] });
                }
            };

        }
    }










    /**
    * Handler method is called when any field is added/removed from the Account field display popup
    */
    handleChangeForAccountSelectedFields(event) {
        if (event.detail.value.length + this.fieldsToBeFetched.length > 25) {
            this.showToastMessage('Warning', 'Warning', 'You can select maximum 25 fields.');
            this.accountSelectedFieldsToDisplay = JSON.parse(JSON.stringify(this.accountSelectedFieldsToDisplay))
            return;
        }
        else {
            this.tempAccountColumns = [];
            this.accountFieldsToBeFetched = [];
            if (this.fieldDisplayPopUpFirstOpen) {
                this.tempAccountSelectedFields = this.accountSelectedFieldsToDisplay;
                this.fieldDisplayPopUpFirstOpen = false;
            }
            this.accountSelectedFieldsToDisplay = event.detail.value;
            for (let i = 0; i < this.accountSelectedFieldsToDisplay.length; i++) {
                let fieldLabel = 'Account: '+ event.target.options.find(opt => opt.value === this.accountSelectedFieldsToDisplay[i]).label;
                let currentFieldType = this.accountOptionsToDisplay.find(opt => opt.value === this.accountSelectedFieldsToDisplay[i])?.fieldType;
                if (currentFieldType == 'REFERENCE') {
                    let fieldValue = this.accountSelectedFieldsToDisplay[i];
                    this.accountFieldsToBeFetched.push(fieldValue);
                    this.tempAccountColumns.push({ label: fieldLabel, fieldName: 'Account.' + fieldValue });
                }
                else if (currentFieldType == 'CURRENCY') {
                    this.accountFieldsToBeFetched.push(this.accountSelectedFieldsToDisplay[i]);
                    this.tempAccountColumns.push({ label: fieldLabel, fieldName: 'Account.' + this.accountSelectedFieldsToDisplay[i], type: 'currency', cellAttributes: { alignment: 'left' }, typeAttributes: { minimumFractionDigits: '0', maximumFractionDigits: '0' } });
                }
                else if (currentFieldType == 'URL') {
                    this.accountFieldsToBeFetched.push(this.accountSelectedFieldsToDisplay[i]);
                    this.tempAccountColumns.push({ label: fieldLabel, fieldName: 'Account.' + this.accountSelectedFieldsToDisplay[i], type: 'url' });
                }
                else if (currentFieldType == 'DATETIME' || currentFieldType == 'DATE') {
                    this.accountFieldsToBeFetched.push(this.accountSelectedFieldsToDisplay[i]);
                    this.tempAccountColumns.push({ label: fieldLabel, fieldName: 'Account.' + this.accountSelectedFieldsToDisplay[i], type: 'date-local', typeAttributes: { day: "numeric", month: "numeric", year: "numeric" } });
                }
                else if (currentFieldType == 'PHONE') {
                    this.accountFieldsToBeFetched.push(this.accountSelectedFieldsToDisplay[i]);
                    this.tempAccountColumns.push({ label: fieldLabel, fieldName: 'Account.' + this.accountSelectedFieldsToDisplay[i], type: 'phone' });
                }
                else if (currentFieldType == 'EMAIL') {
                    this.accountFieldsToBeFetched.push(this.accountSelectedFieldsToDisplay[i]);
                    this.tempAccountColumns.push({ label: fieldLabel, fieldName: 'Account.' + this.accountSelectedFieldsToDisplay[i], type: 'email' });
                }
                else {
                    this.accountFieldsToBeFetched.push(this.accountSelectedFieldsToDisplay[i]);
                    this.tempAccountColumns.push({ label: fieldLabel, fieldName: 'Account.' + this.accountSelectedFieldsToDisplay[i] });
                }
            };

        }
    }

    /**
     * Handler method is called when Save button is clicked on Select Fields to Display popup
     */
    saveColumns() {
        this.finalFieldsToBeFetched = [];
        this.finalColumns = [];
        for (var i = 0; i < this.fieldsToBeFetched?.length; i++) {
            this.finalFieldsToBeFetched.push(this.fieldsToBeFetched[i]);
        }
        for (var i = 0; i < this.accountFieldsToBeFetched?.length; i++) {
            if (!this.finalFieldsToBeFetched.includes('Account.' + this.accountFieldsToBeFetched[i])) {
                this.finalFieldsToBeFetched.push('Account.' + this.accountFieldsToBeFetched[i]);
            }
        }
        for (var i = 0; i < this.tempColumns?.length; i++) {
            this.finalColumns.push(this.tempColumns[i]);
        }
        for (var i = 0; i < this.tempAccountColumns?.length; i++) {
            this.finalColumns.push(this.tempAccountColumns[i]);
        }

        if (this.filtersToSave) {
            this.showToastMessage('Error', 'error', 'Please apply the filters.');
        }
        else if (this.finalFieldsToBeFetched.length == 0) {
            this.showToastMessage('Error', 'error', 'Please select at least one field.');
        }
        else {
            let i = 0;
            if (this.addedFilters?.length > 0) {
                while (i < this.addedFilters?.length) {
                    if (this.addedFilters[i].label == 'New Filter*') {
                        this.deleteFilter(null, this.addedFilters[i].index);
                        i = 0;
                    }
                    else {
                        i = i + 1;
                    }
                }
            }
            this.finalAppliedFilters = JSON.parse(JSON.stringify(this.addedFilters));
            this.fieldDisplayPopup = false;
            this.isLoading = true;
            this.fromSaveColumns = true;
            if (this.finalFieldsToBeFetched.length == 1) {
                this.finalColumns[0].initialWidth = 1000;
            }
            this.paginationArray = [];

            this.fetchRecordsViaPagination(false, false, null, null, null, true);
        }
    }

    /**
     * Handler method is called when "Previous" button is clicked
     */
    goToPreviousPage() {
        this.isLoading = true;
        if (this.filtersToSave) {
            this.isLoading = false;
            this.showToastMessage('Error', 'error', 'Please apply the filters.');
            return;
        }
        let thisPageId = (this.currentPage - 1) >= 0 ? this.paginationArray[this.currentPage - 1].firstRecId : null;
        let previousPageId = (this.currentPage - 2) >= 0 ? this.paginationArray[this.currentPage - 2].firstRecId : null;
        this.paginationArray.splice(this.currentPage - 1, 1);
        this.fetchRecordsViaPagination(true, false, thisPageId, previousPageId, null, false);
        this.currentPage = this.currentPage - 1;
    }

    /**
     * Handler method is called when "Next" button is clicked
     */
    gotToNextPage() {
        this.isLoading = true;
        if (this.filtersToSave) {
            this.isLoading = false;
            this.showToastMessage('Error', 'error', 'Please apply the filters.');
            return;
        }
        let thisPageId = (this.currentPage + 1) <= this.totalPages ? this.paginationArray[this.currentPage - 1].lastRecId : null;
        this.fetchRecordsViaPagination(false, true, null, null, thisPageId, true);
        this.currentPage = this.currentPage + 1;
    }

    /**
     * Method will called when filter button icon is clicked
     */
    handleFilterIconClick() {
        this.customBackDrop = false;
        if (this.listViewSize == 'width: 82.8%;border-bottom-right-radius: unset;') {
            this.listViewSize = 'width: 100%;'
        }
        else if (this.listViewSize == 'width: 100%;') {
            this.listViewSize = 'width: 82.8%;border-bottom-right-radius: unset;'

        }
        this.isFilterDataUpdated = false;
        if (!this.filterDisabled) {
            this.isFilterOpen = !this.isFilterOpen;
        }
    }

    /**
     * Method will called when any card of existing filter is clicked.
     * It is also called as a helper method when Add Filter is clicked
     */
    handleOpenSingleFilterModal(event) {
        this.showDropDown = false;
        this.customBackDrop = true;
        var elFeildDetail = this.template.querySelector('.feildDetailWrapper');
        elFeildDetail?.classList?.remove('hide');

        for (let i = 0; i < this.addedFilters.length; i++) {
            if (this.addedFilters[i].index == event?.target?.dataset?.item) {
                this.selectedField = this.addedFilters[i].field ? this.addedFilters[i].field : this.defaultFieldName;
                let field = this.fieldOptions.find(field => { if (this.selectedField == field) { return field } })
                this.setPlaceHolder(field?.type);
                this.selectedLabel = this.addedFilters[i].label === 'New Filter*' ? this.defaultFieldLabel : this.addedFilters[i].label;
                this.selectedOperator = this.addedFilters[i].operator ? this.addedFilters[i].operator : 'equals';
                this.filterValue = this.addedFilters[i].value;
                this.filterId = event.target.dataset.item;
                this.fieldLabelSelected = true;
                this.selectedFieldLabel = this.selectedLabel;
                this.groupName = this.addedFilters[i].objectName ? this.addedFilters[i].objectName : this.objectName;
                if (this.showGroupedCombobox) {
                    this.setSelectedOnOptions();
                }
                if(this.addedFilters[i]?.multiPicklistobj)
                    this.multipicklistSelectedValue =JSON.parse(JSON.stringify(this.addedFilters[i]?.multiPicklistobj));
                this.getOperatorsWithRespectToFieldType();
                break;
            }
        }
        if (this.activeCard) {
            this.template.querySelector('lightning-card[data-item="' + this.activeCard + '"' + ']')?.classList?.remove('dynamic-box-color');
            this.activeCard = event?.target?.dataset?.item || event?.target?.getAttribute('data-item');
            this.template.querySelector('lightning-card[data-item="' + this.activeCard + '"' + ']')?.classList?.add('dynamic-box-color');
        }
        else {
            this.activeCard = event?.target?.dataset?.item || event?.target?.getAttribute('data-item');
            this.template.querySelector('lightning-card[data-item="' + this.activeCard + '"' + ']')?.classList?.add('dynamic-box-color');
        }
    }

    /**
     * Method will be called when cross icon is clicked in order to close filter side view
     */
    handleCloseModal() {
        if (this.listViewSize == 'width: 82.8%;border-bottom-right-radius: unset;') {
            this.listViewSize = 'width: 100%;'
        }
        this.isFilterOpen = false;
        this.filterVariant = '';
    }

    /**
     * Method will be called when single filter modal is closed
     */
    handleCloseSingleFilterModal() {
        this.customBackDrop = false;
        this.template.querySelector('lightning-card[data-item="' + this.activeCard + '"' + ']')?.classList?.remove('dynamic-box-color');
        this.isInvalidInput = false;
        var elFeildDetail = this.template.querySelector('.feildDetailWrapper');
        this.customPlaceHolder = '';
        elFeildDetail.classList.add('hide');
        this.isMultipicklist=false;
    }

    /**
     * Method will be called when 'Done' button is clicked to save the filter
     */
    handleDoneButton() {
        this.isDoneButtonClicked = true;
        const pattern = /^[0-9,]*$/g;

        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        let result = this.fieldOptions.find(function (filter) {
            return filter.value == this.value
        }, { value: this.selectedField });
        if (result?.type === 'number') {
            this.isInvalidInput = !this.filterValue.match(pattern);
            this.invalidInputMessage = 'Invalid Number';
            this.filterValue = this.filterValue.replaceAll(',', '');
            if (this.filterValue.toString().length > 23) {
                this.invalidInputMessage = 'The value should not be greater than 23 digits.';
                this.isInvalidInput = true;
            }
            if (this.filterValue == '' && (this.selectedOperator != 'equals' && this.selectedOperator != 'not equal to')) {
                this.invalidInputMessage = 'Please enter a valid number.';
                this.isInvalidInput = true;
            }
        } else if (result?.type === 'datetime' || result?.type === 'date' || result?.type === 'sfDateTime') {
            this.isInvalidInput = !this.filterValue.match(datePattern);
            this.invalidInputMessage = 'Invalid date time format. Please add the value in YYYY-MM-DD format.';
        } else if (result?.type === 'boolean') {
            this.isInvalidInput = this.filterValue.toLowerCase() != 'true' && this.filterValue.toLowerCase() != 'false';
            this.invalidInputMessage = 'Invalid format. Please add True or False';
        }

        if (!this.isInvalidInput) {

            this.isInvalidInput = false;
            this.addedFilters = JSON.parse(JSON.stringify(this.addedFilters));
            this.showCustomFilterLogicSection = this.addedFilters?.length > 0 ? true : false;
            this.updateFilterNumbers();
            for (let i = 0; i < this.addedFilters.length; i++) {
                if (this.addedFilters[i].index == this.filterId) {
                    for (let i = 0; i < this.addedFilters.length; i++) {
                        if (this.addedFilters[i].index == this.filterId) {
                            if (result?.type == 'number' && this.addedFilters[i].type == 'text') {
                                this.addedFilters[i].type = 'number';
                            }
                        }
                    }

                    this.addedFilters[i].field = this.selectedField;
                    const fieldIndex = this.groupName == 'Account' && this.showGroupedCombobox == true ? this.accountFieldOptions.findIndex(item => item.value === this.selectedField) : this.fieldOptions.findIndex(item => item.value === this.selectedField);
                    this.addedFilters[i].type = this.groupName == 'Account' && this.showGroupedCombobox == true ? this.accountFieldOptions[fieldIndex].type : this.fieldOptions[fieldIndex].type;

                    if (this.showGroupedCombobox) {
                        this.addedFilters[i].label = this.groupName == 'Account' && this.showGroupedCombobox == true && !this.selectedFieldLabel.includes(':')? this.groupName + ': ' + this.selectedFieldLabel : this.selectedFieldLabel;
                        this.addedFilters[i].objectName = this.groupName;
                    }
                    else {
                        this.addedFilters[i].label = this.selectedLabel;
                        this.addedFilters[i].objectName = this.objectName;
                    }
                    this.addedFilters[i].operator = this.selectedOperator;
                    if(this.addedFilters[i].type == 'multipicklist' && typeof(this.filterValue)=='object' ) {
                        this.addedFilters[i].multiPicklistList = this.filterValue;
                        this.addedFilters[i].multiPicklistobj =  this.filterValue;
                        this.addedFilters[i].multiPicklistList = this.filterValue.reduce((retrunString,val) =>{
                            return retrunString+';'+val['value'];
                        },'').slice(1);
                        if(this.filterValue.length>0) {
                            //this.addedFilters[i].value = this.filterValue.length+' Options Selected';
                            this.addedFilters[i].value = this.addedFilters[i].multiPicklistList;
                        }
                        else {
                            this.addedFilters[i].multiPicklistobj = [];
                            this.addedFilters[i].value ='';
                        }
                    }
                    else if(this.addedFilters[i].type == 'reference' && typeof(this.filterValue)=='object' && (this.addedFilters[i].field=='MetroArea__r.Name' || this.addedFilters[i].field=='Metro_Area__r.Name' ) ) {
                        this.addedFilters[i].multiPicklistList = this.filterValue;
                        this.addedFilters[i].multiPicklistobj =  this.filterValue;
                        this.addedFilters[i].multiPicklistList = this.filterValue.reduce((retrunString,val) =>{
                            return retrunString+';'+val['value'];
                        },'').slice(1);
                        if(this.filterValue.length>0) {
                            this.addedFilters[i].value = this.addedFilters[i].multiPicklistList;
                        }
                        else {
                            this.addedFilters[i].multiPicklistobj = [];
                            this.addedFilters[i].value ='';
                        }
                    }
                    else if (this.addedFilters[i].type == 'picklist' ) {
                        this.addedFilters[i].multiPicklistList = this.filterValue;
                        if(typeof(this.filterValue)=='object') {
                            this.addedFilters[i].multiPicklistobj =  this.filterValue;
                            this.addedFilters[i].multiPicklistList = this.filterValue.reduce((retrunString,val) =>{
                                return retrunString+';'+val['value'];
                            },'').slice(1);
                        }
                        if(this.filterValue.length>0) {
                            //this.addedFilters[i].value = this.filterValue.length+' Options Selected';
                            this.addedFilters[i].value = this.addedFilters[i].multiPicklistList;
                        }
                        else {
                            this.addedFilters[i].multiPicklistobj = [];
                            this.addedFilters[i].value ='';
                        }
                        // this.addedFilters[i].multiPicklistobj = [];
                        // this.addedFilters[i].value = this.selectedPicklistValue;
                    }
                    else if (this.addedFilters[i].field!='MetroArea__r.Name' && this.addedFilters[i].field!='Metro_Area__r.Name' ) {
                        this.addedFilters[i].multiPicklistobj = [];
                        this.addedFilters[i].value = this.filterValue;
                    }
                    break;
                }
            }

            if (!this.isInvalidInput) {
                this.filtersToSave = true;
                this.handleCloseSingleFilterModal();
            }
        }
    }

    /**
     * Method will be called when Add Filter hyperlink button is clicked
     */
    handleAddFilter() {
        this.showDropDown = false;
        let tempOperatorList = this.operatorsList.find(opt => opt.fieldName === 'string').operators;
        let operators = tempOperatorList.split(',');
        let operatorOptionValues = [];
        for (let operator of operators) {
            let obj = {
                label: operator,
                value: operator
            }
            operatorOptionValues.push(obj);
        }
        this.operatorOptions = operatorOptionValues;
        const filterIndex = (new Date()).getTime();

        this.addedFilters.push({
            field: '',
            label: 'New Filter*',
            operator: '',
            value: '',
            type: 'text',
            index: filterIndex,
            objectName: this.groupName
        })
        if (this.addedFilters?.length < 8) {
            this.isFiltersLimitReached = false;
        } else {
            this.isFiltersLimitReached = true;
        }
        this.isFilterNotEmpty = true;
        const clonedEvent = {
            target: {
                dataset: {
                    item: filterIndex,
                }
            }
        }
        this.handleOpenSingleFilterModal(clonedEvent);
        this.isInvalidInput = false;
        this.selectedField = this.defaultFieldName;
        this.selectedLabel = this.defaultFieldLabel;
        this.selectedFieldLabel = this.defaultFieldLabel;
        this.selectedOperator = 'equals';
        this.groupName = this.objectName;
        this.filterValue = '';
        this.showCustomFilterLogicSection = this.addedFilters?.length > 0 ? true : false;
        this.isFilterNotEmpty = this.addedFilters?.length ? true : false;
        this.updateFilterNumbers();
        if (this.isAddFilterLogic) {
            this.updateCustomFilterLogic();
            this.validateFilterLogic();
        }
    }

    /**
     * Method will be called when Add Filter hyperlink button is clicked
     */
    handleDeleteFilter(event) {
        this.deleteFilter(event, event.target.dataset.item);
    }
    deleteFilter(event, targetItem) {
        this.isFilterLogicCorrect = true;
        this.multipicklistSelectedValue  =[];
        this.handleCloseSingleFilterModal();
        this.filtersToSave = true;
        var rowNumber;
        if (this.addedFilters.length == 1) {
            this.addedFilters = [];
            this.finalAppliedFilters = [];
            this.isFilterNotEmpty = false;
            this.handleCloseSingleFilterModal();
        }
        else {
            for (let i = 0; i < this.addedFilters.length; i++) {
                if (this.addedFilters[i].index == targetItem) {
                    this.addedFilters.splice(i, 1);
                    rowNumber = i;
                    break;
                }
            }
            if (this.addedFilters?.length < 8) {
                this.isFiltersLimitReached = false;
            }
        }
        this.updateFilterNumbers();
        this.showCustomFilterLogicSection = this.addedFilters?.length > 0 ? true : false;
        var tokenizedStr;
        rowNumber++;
        try {
            var parser = new ParserJs();
            tokenizedStr = parser.getTokens(this.customLogic || '1');

            var tokenizedArr = [];
            tokenizedStr.forEach((element, index) => {
                if (element.id == 0) //opening bracket
                    tokenizedArr.push('(');
                else if (element.id == 5)    //integer
                    tokenizedArr.push(element.value);
                else if (element.id == 2 || element.id == 3)    //AND or OR
                    tokenizedArr.push(element.operation);
                else if (element.id == 1)
                    tokenizedArr.push(')');
            });

            var indexes = [];
            let parentStr = JSON.parse(JSON.stringify(tokenizedStr));
            var finalStr = tokenizedStr;
            var deletedFilterCount;

            //"AND" or "OR" at last index
            if (tokenizedStr[tokenizedStr.length - 1].id == 2 || tokenizedStr[tokenizedStr.length - 1].id == 3) {
                finalStr.splice(finalStr.length - 1, 1);
            }
            else {
                var indexesProcesses = false;
                var counter = 0;

                for (let j = 0; j < tokenizedArr.length; j++) {
                    if (tokenizedArr[j] === rowNumber)
                        indexes.push(j);
                }

                for (let j = 0; j < parentStr.length; j++) {
                    if (counter != indexes.length) {
                        for (let i = 0; i < tokenizedStr.length; i++) {
                            if (i != 0) {
                                if (tokenizedStr[i - 1].id == 0 && tokenizedStr[i + 1].id == 1) {
                                    finalStr.splice(i - 1, 1);
                                    finalStr.splice(i, 1);
                                    i--;
                                }
                            }
                            indexesProcesses = true;

                            if (tokenizedStr[i].value == rowNumber) {
                                deletedFilterCount = tokenizedStr[i].value;
                                var isClosing = false;
                                if (i + 1 != tokenizedStr.length)  //check if i+1 is a closing bracket
                                {
                                    if (tokenizedStr[i + 1].id == 1) {
                                        isClosing = true;
                                    }

                                }
                                if (i == 0)            //no opening bracket behind
                                {
                                    finalStr.splice(i, 2);
                                    break;
                                }
                                //"AND" or "OR" operator at previous index
                                if ((tokenizedStr[i - 1].id == 2 || tokenizedStr[i - 1].id == 3) && isClosing == false) {
                                    counter++;
                                    //remove the filter number and its operator
                                    finalStr.splice(i - 1, 2);

                                    break;

                                } //opening bracket at previous index
                                else if (tokenizedStr[i - 1].id == 0) {
                                    counter++;
                                    deletedFilterCount = tokenizedStr[i].value;

                                    // remove the corresponding closing bracket
                                    var index = parser.findClosingBracketIndex(finalStr, i - 1);
                                    finalStr.splice(index, 1);

                                    //remove the opening bracket, filter number and its operator
                                    finalStr.splice(i - 1, 3);

                                    break;

                                } //closing bracket at next index
                                else if (tokenizedStr[i + 1].id == 1) {
                                    counter++;

                                    deletedFilterCount = tokenizedStr[i].value;

                                    // remove the corresponding opening bracket
                                    var index = parser.findOpeningBracketIndex(finalStr, i + 1);
                                    finalStr.splice(index, 1);

                                    //remove the closing bracket, filter number and its operator
                                    finalStr.splice(i - 2, 3);
                                    break;
                                }
                            }
                        }
                    }
                }
                for (let i = 0; i < finalStr.length; i++) {
                    if (rowNumber < finalStr[i].value) {
                        if (finalStr[i].id == 5)
                            finalStr[i].value--;
                    }
                }
            }
        }
        catch (e) {
            console.log(e);
        }

        //remove brackets if around a single integer i-e (1)
        for (let i = 0; i < finalStr.length; i++) {
            if (finalStr[i - 1] != undefined && finalStr[i - 1].id == 0 && finalStr[i + 1] != undefined && finalStr[i + 1].id == 1) {
                finalStr.splice(i - 1, 1);
                finalStr.splice(i, 1);
            }
        }

        //Convert the final tokenized array into string
        var logicStr = '';
        for (let i = 0; i < finalStr.length; i++) {
            if (finalStr[i].value != undefined)  //is integer
            {
                logicStr = logicStr.concat(finalStr[i].value);
            } else if (finalStr[i].operation != undefined)  //is operator
            {
                logicStr = logicStr.concat(finalStr[i].operation);
            } else if (finalStr[i].id == 0)  //is opening bracket
            {
                logicStr = logicStr.concat('(');
            } else if (finalStr[i].id == 1)  //is closing bracket
            {
                logicStr = logicStr.concat(')');
            }
            logicStr = logicStr.concat(' ');
        }
        logicStr = logicStr.slice(0, -1);
        logicStr = logicStr.replace("  ", " ");
        if (this.addedFilters?.length == 1 || this.isAddFilterLogic == false) {
            logicStr = '';
        }
        this.customLogic = logicStr;
        if (this.customLogic != '') {
            this.validateFilterLogic();
        }
        else {
            this.filterValidationMsg = ''
        }

        if (event != null) {
            event.stopPropagation();
        }
        else {
            return;
        }

    }

    /**
     * Method will be called when Remove Filter hyperlink button is clicked
     */
    handleRemoveFilters() {
        this.isFilterLogicCorrect = true;
        this.addedFilters = [];
        this.finalAppliedFilters = [];
        this.showCustomFilterLogicSection = false;
        this.filtersToSave = true;
        this.isFilterNotEmpty = false;
        this.isFiltersLimitReached = false;
        this.filterValidationMsg = '';
        this.template.querySelector('[data-id="error-message"]')?.classList?.remove('slds-show');
        this.template.querySelector('[data-id="error-message"]')?.classList?.add('slds-hide')
        this.handleCloseSingleFilterModal();
        this.customLogic = '';
        this.updateCustomFilterLogic();
    }

    /**
     * Method will be called when field is selected or changed in a single filter view(modal)
     */
    handleFieldChange(event) {
        this.selectedField = event.detail.value;
        this.filterValue = '';
        this.selectedOperator = 'equals';
        this.isInvalidInput = false;
        this.invalidInputMessage = '';
        this.getOperatorsWithRespectToFieldType();
    }

    ontestevent(event ) {
        this.listopen = true;
    }

    getSelectedItems(options) {
        return options.filter((item) => item.selected);
    }
    
    getOperatorsWithRespectToFieldType() {
        var selectedFieldType;
        let tempFieldsOptions = this.objectName == 'Contact' && this.showGroupedCombobox == true && this.groupName == 'Account' ? this.accountFieldOptions : this.fieldOptions;

        for (let i = 0; i < tempFieldsOptions.length; i++) {
            let anySelectedValue = false;
            if (tempFieldsOptions[i].value == this.selectedField) {
                this.setPlaceHolder(tempFieldsOptions[i].type);
                selectedFieldType = tempFieldsOptions[i].type;
                this.selectedLabel = tempFieldsOptions[i].label;
                this.isMultipicklist = selectedFieldType=='multipicklist' || this.selectedField=='MetroArea__r.Name' || this.selectedField=='Metro_Area__r.Name' || selectedFieldType=='picklist' ? true : false;
                //this.isPicklist = selectedFieldType=='picklist' ? true : false;
                
                let picklistValuesMap=new Map();
                if(this.objectName == 'Account') {
                    picklistValuesMap = this.accountPicklistsMap.get(this.selectedField);
                }
                else {
                    picklistValuesMap = this.groupName=='Account' ? this.accountPicklistsMap.get(this.selectedField) :  this.contactPicklistsMap.get(this.selectedField);
                }

                if(this.isMultipicklist)
                {
                    this.multipicklistOptions = [];
                    if(this.selectedField=='MetroArea__r.Name' || this.selectedField=='Metro_Area__r.Name')
                    {
                        for (let i = 0; i < this.metroAreaNames.length; i++) {
                            this.multipicklistOptions.push({
                                "label": this.metroAreaNames[i],
                                "value": this.metroAreaNames[i],
                                "fieldType": 'String'
                            })
                        }

                        for(let i =0;i<this.multipicklistSelectedValue.length;i++) {
                            for(let j =0;j<this.multipicklistOptions.length;j++) {
                                if(this.multipicklistSelectedValue[i]['value'] == this.multipicklistOptions[j]['value']){
                                    this.multipicklistOptions[j] = this.multipicklistSelectedValue[i];
                                }
                            }
                        } 
                        this.multipicklistOptions = JSON.parse(JSON.stringify(this.multipicklistOptions));  
                        this.template.querySelector('c-multi-select-combobox-custom')?.handleListChange(this.multipicklistOptions, anySelectedValue);
                    }
                    else
                    {
                        let values = Object.values(picklistValuesMap);
                        let keys = Object.keys(picklistValuesMap);
                        for (let i = 0; i < values.length; i++) {
                            this.multipicklistOptions.push({
                                "label": values[i],
                                "value": keys[i],
                                "fieldType": 'String'
                            })
                        } 
                        for(let i =0;i<this.multipicklistSelectedValue.length;i++) {
                            for(let j =0;j<this.multipicklistOptions.length;j++) {
                                if(this.multipicklistSelectedValue[i]['value'] == this.multipicklistOptions[j]['value']){
                                    this.multipicklistOptions[j] = this.multipicklistSelectedValue[i];
                                    anySelectedValue = true;
                                }
                            }
                        }
                        this.multipicklistOptions = JSON.parse(JSON.stringify(this.multipicklistOptions));
                        if(anySelectedValue) {
                            this.filterValue = this.getSelectedItems(this.multipicklistOptions);
                        }
                        this.template.querySelector('c-multi-select-combobox-custom')?.handleListChange(this.multipicklistOptions, anySelectedValue);  
                    }          
                }
                break;
            }
        }

        let tempOperatorList = this.operatorsList.find(opt => opt.fieldName === selectedFieldType).operators;
        let operators = tempOperatorList.split(',');
        let operatorOptionValues = [];
        for (let operator of operators) {
            let obj = {
                label: operator,
                value: operator
            }
            
                operatorOptionValues.push(obj);
                
        }
        this.operatorOptions = operatorOptionValues;
    }

    handlePicklistChange(event)
    {
        this.selectedPicklistValue = event.detail.value;
    }
    /**
     * Method will be called when operator is selected or changed in a single filter view(modal)
     */
    handleOperatorChange(event) {
        this.selectedOperator = event.detail.value;
    }

    /**
     * Method will be called when value is added or changed in a single filter view(modal)
     */
    handleValueChange(event) {
        this.filterValue = event.detail.value.replace(/\s+/g, ' ').trim();
        this.isInvalidInput = false;
    }

    /**
     * Method will be called when 'Cancel' button is clicked in order to cancel the filters
     */
    handleCancelFilter() {
        this.addedFilters = [];
        this.finalAppliedFilters = [];
        this.showCustomFilterLogicSection = false;
        this.isFilterNotEmpty = false;
        this.filtersToSave = false;
        this.updateFilterNumbers();
        this.customFilterLogic = '';
        this.customLogic = '';
        this.isAddFilterLogic = false;
        this.handleCloseSingleFilterModal();
    }

    /**
     * Method will be called when 'Save' button is clicked in order to save the filters
     */
    handleSaveFilter() {
        if (this.isFilterLogicCorrect == false && this.addedFilters?.length != 0) {
            this.showToastMessage('Error', 'error', 'Please apply the correct filter logic.');
        }
        else {
            let i = 0;
            if (this.addedFilters?.length > 0) {
                while (i < this.addedFilters?.length) {
                    if (this.addedFilters[i].label == 'New Filter*') {
                        this.deleteFilter(null, this.addedFilters[i].index);
                        i = 0;
                    }
                    else {
                        i = i + 1;
                    }
                }
            }
            let updatedLength = this.addedFilters?.length;
            this.isDoneButtonClicked = false;
            this.paginationArray = [];
            if (updatedLength < 0) {

                this.handleRemoveFilters();
            }

            this.isLoading = true;
            this.finalAppliedFilters = JSON.parse(JSON.stringify(this.addedFilters));
            this.fetchRecordsViaPagination(false, false, null, null, null, true);

            this.filtersToSave = false;

        }

    }

    /**
     * Method will be called when 'Add Filter Logic' button is clicked in order to add filter logic
     */
    handleAddFilterLogic() {
        this.isAddFilterLogic = true;
        this.updateCustomFilterLogic();

    }

    /**
     * Method will be called when 'Add Filter Logic' button is clicked in order to remove filter logic
     */
    handleRemoveCustomLogic() {
        this.isFilterLogicCorrect = true;
        this.isAddFilterLogic = false;
        this.customLogic = '';
        this.filtersToSave = true;

    }

    /**
     * Handler is called when custom filter logic text area is changed
     * @param {*} event 
     */
    handleTextAreaChange(event) {
        this.customLogic = event.target.value;
        this.validateFilterLogic();
    }

    validateFilterLogic() {
        this.isFilterLogicCorrect = true;
        this.filtersToSave = true;
        var filterLogic = this.customLogic;
        var allFiltersList = this.addedFilters;
        var b = [];
        for (var c = 0; c < allFiltersList.length; c++) {
            b.push(c + 1);
        }
        try {

            var parser = new ParserJs();

            var result = parser.getFiltersInUseMessage(b, filterLogic);
            if (result == null) {
                this.validateFilterOperatorPrecedence(filterLogic);
            }
            else {
                this.filterValidationMsg = result;
                this.isFilterLogicCorrect = false;
                this.template.querySelector('[data-id="error-message"]')?.classList?.add('slds-show');
                this.template.querySelector('[data-id="error-message"]')?.classList?.remove('slds-hide')
            }
        }
        catch (e) {
            this.filterValidationMsg = 'Error: Check the spelling in your filter logic.'
            this.isFilterLogicCorrect = false;
            this.template.querySelector('[data-id="error-message"]')?.classList?.add('slds-show');
            this.template.querySelector('[data-id="error-message"]')?.classList?.remove('slds-hide')
        }
    }

    /**
     * Helper method to validate the filter's operator precendence
     * @param {*} filterLogic Filter logic
     */
    validateFilterOperatorPrecedence(filterLogic) {
        var logicList = [];
        var error = false;
        if ((filterLogic.includes('and') || filterLogic.includes('AND'))
            && (filterLogic.includes('OR') || filterLogic.includes('or'))
            && !filterLogic.includes('(')) {
            error = true;
        }
        else {
            for (var i = 0; i < filterLogic.length; i++) {
                if (filterLogic[i] != '' && filterLogic[i] != ' '
                    && filterLogic[i] != 'N' && filterLogic[i] != 'n'
                    && filterLogic[i] != 'D' && filterLogic[i] != 'd'
                    && filterLogic[i] != 'R' && filterLogic[i] != 'r') {
                    if (filterLogic[i] == 'A' || filterLogic[i] == 'a') {
                        logicList.push('AND');
                    }
                    else if (filterLogic[i] == 'O' || filterLogic[i] == 'o') {
                        logicList.push('OR');
                    }
                    else if (filterLogic[i] == '(') {
                        logicList.push('(');
                    }
                    else if (filterLogic[i] == ')') {
                        var logicStr = '';
                        for (var j = (logicList.length - 1); j >= 0; j--) {

                            if (logicList[j] != '(') {
                                logicStr = logicStr + logicList[j];
                                logicList.splice(j, 1);
                            }
                            else {
                                if (logicStr.includes('AND') &&
                                    logicStr.includes('OR')) {
                                    error = true;
                                }
                                logicList[j] = 1;
                                break;
                            }
                        }
                    }
                    else {
                        logicList.push(filterLogic[i]);
                    }
                }
            }
        }
        if ((logicList.includes('and') || logicList.includes('AND'))
            && (logicList.includes('OR') || logicList.includes('or'))) {
            error = true;
        }
        if (error) {
            this.isFilterLogicCorrect = false;
            this.filterValidationMsg = 'Error: To use successive AND-OR expressions in filter logic, add parentheses.'
            this.template.querySelector('[data-id="error-message"]')?.classList?.add('slds-show');
            this.template.querySelector('[data-id="error-message"]')?.classList?.remove('slds-hide')
        }
        else {
            this.filterValidationMsg = ''
            this.isFilterLogicCorrect = true;
            if (this.isAddFilterLogic) {
                this.template.querySelector('[data-id="error-message"]')?.classList?.remove('slds-show');
                this.template.querySelector('[data-id="error-message"]')?.classList?.add('slds-hide');
            }
        }
    }

    /**
     * Helper method to update the filter logic in case a filter is added or removed
     */
    updateCustomFilterLogic() {
        if (!this.customLogic.trim()) {
            if (this.addedFilters?.length > 1) {
                this.customLogic = 1;
                for (let i = 2; i <= this.addedFilters?.length; i++) {
                    this.customLogic += ' AND ' + i;
                }
            } else {
                this.customLogic = '';
            }
        }
        else {
            if (this.addedFilters?.length > 1) {
                if (this.addedFilters?.length == 2) {
                    this.customLogic = '1 AND 2'
                }
                else {
                    this.customLogic += ' AND ' + this.addedFilters?.length;
                }
            }
            else {
                this.customLogic = '';
            }
        }
    }

    /**
     * Helper method to set placeholder in the value field of single filter view(modal)
     */
    setPlaceHolder(fieldType) {
        if (fieldType == 'datetime' || fieldType == 'date') {
            this.customPlaceHolder = 'YYYY-MM-DD';
        } else if (fieldType == 'boolean') {
            this.customPlaceHolder = 'True or False';
        }
        else {
            this.customPlaceHolder = '';
        }
    }

    /**
     * Helper method to update number of filters
     */
    updateFilterNumbers() {
        for (let i = 0; i < this.addedFilters?.length; i++) {
            this.addedFilters[i].filterNumber = i + 1;
        }
    }

    /**
     * Method will be called when anywhere on the screen except for single filter view(modal) is clicked
     * It will close the single filter view(modal)
     */
    closeFilterModal(event) {
        this.customBackDrop = false;
        if (this.isFilterOpen) {
            this.template.querySelector('lightning-card[data-item="' + this.activeCard + '"' + ']')?.classList?.remove('dynamic-box-color');
            this.isInvalidInput = false;
            var elFeildDetail = this.template.querySelector('.feildDetailWrapper');
            this.customPlaceHolder = '';
            elFeildDetail.classList.add('hide');
            this.listopen = false;
            this.handleListClose();
        }
    }

    setSelectedOnOptions() {
        let markedSelected = false;
        this.groupsAndOptions.forEach(group => {
            group.options.forEach(option => {
                if (option.value === this.selectedField && markedSelected == false && option.objectName == this.groupName) {
                    option.selected = true;
                    markedSelected = true;
                } else {
                    option.selected = false;
                }
            })
        })
    }

    handleDropDownClick() {
        this.setSelectedOnOptions();
        this.showDropDown = !this.showDropDown;
    }

    handleOptionClick(event) {
        this.selectedField = event.currentTarget.dataset.id;
        this.fieldLabelSelected = true;
        this.filterValue = '';
        this.selectedOperator = 'equals';
        this.isInvalidInput = false;
        this.invalidInputMessage = '';
        let tempGroupName = event?.currentTarget?.getAttribute('data-item');
        this.groupName = tempGroupName.slice(0, -7).trim();
        let fieldLabelSet = false;
        this.groupsAndOptions.forEach(group => {
            group.options.forEach(option => {
                if (option.value === this.selectedField && fieldLabelSet == false && option.objectName == this.groupName) {
                    this.selectedFieldLabel = option.label;
                    fieldLabelSet = true;
                }
            })
        })
        this.getOperatorsWithRespectToFieldType();
        this.handleDropDownClick();
    }

    /**
       *  excel data on button click
       */
    async exportExcelData() {
     this.dispatchEvent(new CustomEvent('exportcount'));
      // Fire the custom event
        if (this.exportCount && this.exportCount > 0) {
            this.isLoading = true;
            this.exportCount--;
            let count=this.exportCount;
            this.dispatchEvent(new CustomEvent('exportclick', { detail: {count}  } ));
            await this.updateExportCount();
            this.schemaObj2 = [];
            let currencyFields = [];
            let booleanFields = [];

            for (var i = 0; i < this.exportDataFieldOptions.length; i++) {
                var specificSubstring = '__r';
                let value = this.exportDataFieldOptions[i].value;
                const parts = value.split(specificSubstring);
                if (parts.length > 1) {
                    value = parts[0] + specificSubstring;
                    value = value.slice(0, -3)
                    this.exportDataFieldOptions[i].value = value + '.Name';
                }
            }
            for (var i = 0; i < this.columns.length; i++) {
                let value = this.columns[i].fieldName;
                if (this.exportDataFieldOptions.find(opt => opt.value === this.columns[i].fieldName)?.type == 'currency') {
                    currencyFields.push(this.columns[i].fieldName);
                    this.schemaObj2.push({
                        column: this.columns[i].label,
                        type: String,
                        value: (x) => x[value]
                    })
                }
                else if (this.exportDataFieldOptions.find(opt => opt.value === this.columns[i].fieldName)?.type == 'boolean') {
                    booleanFields.push(this.columns[i].fieldName);
                    this.schemaObj2.push({
                        column: this.columns[i].label,
                        type: String,
                        value: (x) => x[value]
                    })
                }
                else if (this.numberFieldTypes.includes(this.exportDataFieldOptions.find(opt => opt.value === this.columns[i].fieldName)?.type) && (this.exportDataFieldOptions.find(opt => opt.value === this.columns[i].fieldName)?.type != 'currency')) {
                    this.schemaObj2.push({
                        column: this.columns[i].label,
                        type: Number,
                        format: '#,##0',
                        value: (x) => x[value]
                    })
                }
                else {
                    this.schemaObj2.push({
                        column: this.columns[i].label,
                        type: String,
                        value: (x) => x[value]
                    })
                }
            }

            for (var i = 0; i < this.data.length; i++) {
                for(var j =0; j< currencyFields.length;j++){
                    let currField = currencyFields[j];
                    const formattedNumber = this.data[i][currField] !=null || this.data[i][currField]!= undefined? '$'+ Math.round(this.data[i][currField]).toLocaleString("en-US") : null;
                    this.data[i][currField] = formattedNumber;
                }
                for(var j =0; j< booleanFields.length;j++){
                    let currField = booleanFields[j];
                    const stringValue = this.data[i][currField] !=null || this.data[i][currField]!= undefined? this.data[i][currField].toString() : null;
                    this.data[i][currField] = stringValue;
                }
            }

            writeXlsxFile(this.data, {
                schema: this.schemaObj2,
                fileName: this.pluralObjectName + '.xlsx'
            })
        }
        else {
            const event = new ShowToastEvent({
                title: 'Error',
                variant: 'error',
                message: `You’ve reached the monthly export limit. To refresh the limit, please contact {0}.`,
                messageData: [{
                    url: 'mailto:membership@dakota.com',
                    label: 'membership@dakota.com'
                }]
            });
            this.dispatchEvent(event);
        }
    }


    async getInitialExportCount()
    {
        return getInitialExportCount({}).then(exportCount => {
            this.exportCount = exportCount;
            let count = this.exportCount;
            this.dispatchEvent(new CustomEvent('exportclick', { detail: {count}  } ));
        }).catch(error => {
            console.log(error)
            this.isLoading = false;
        });
    }

    async updateExportCount()
    {
        return updateExportCount({
            exportCount: this.exportCount
        }).then((count) => {
            this.isLoading = false;
        }).catch(() => {
            this.isLoading = false;
            console.log('Export Count not updated successfuly');
        });
    }

}