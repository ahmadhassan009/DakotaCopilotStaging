import { LightningElement, wire, api, track } from 'lwc';
import floatingIcon from '@salesforce/resourceUrl/dakotaCopilotViewall';
import activeCommunities from '@salesforce/label/c.active_communities_copilot';
import processQueryAllRecords from '@salesforce/apex/DakotaCopolitController.processQueryAllRecords';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import USER_LOCALE from '@salesforce/i18n/locale';
import USER_CURRENCY from '@salesforce/i18n/currency';
import TIMEZONE from '@salesforce/i18n/timeZone';
import { htmlToPlainText } from 'c/dakotaLwcUitils'; 

export default class TabulatorData extends LightningElement {
    botProfilePic = floatingIcon;
    fieldOptions;
    groupValue = '';
    fieldValue = '';
    is_lookup = false;
    fieldType = '';
    operatorValue = '';
    input = '';
    @track columns = [];
    @track resultantRecords = [];
    @track isLoading = true;
    @track sortedBy; // The column fieldName currently being sorted
    @track sortedDirection = 'asc'; // Default sort direction
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    isCommunity = false;
    @track allRecords;
    datatableHeight = 'datatableHeightDefault';
    divHeight = 'datatableDivHeightSF';
    @api fromParent;
    @track recordCount;
    totalRecordCount;
    orgLocale;
    currencyCode;
    userTimeZone;
    offset = 0;
    limit = 50;
    @track sortingCriteria = {}; // Empty object by default
    @track filtersCriteria = []; // Empty object by default
    noRecords = false;
    // Pagination state
    @track recordsToDisplay = 50;
    totalLoadedRecords = 0;
    @track isLoadingMore = false; // Spinner for loading more records

    get operatorOptions() {
        return [
            { label: 'Equals', value: '=' },
            { label: 'Less than', value: '<' },
            { label: 'Less than or Equal to', value: '<=' },
            { label: 'Greater than', value: '>' },
            { label: 'Greater than or Equal to', value: '>=' },
            { label: 'Not Equals', value: '!=' },
            {label: 'Contains', value: 'includes'}
        ]
    }

    connectedCallback() {
        if (USER_LOCALE && USER_CURRENCY && TIMEZONE) {
            this.orgLocale = USER_LOCALE;
            this.currencyCode = USER_CURRENCY;
            this.userTimeZone = TIMEZONE;
        }
        this.checkIsCommunityInstance();
        this.initializeGrid();
    }

    initializeGrid() {
        this.isLoading = true;
        const queryString = sessionStorage.getItem('SQL_Default_Query');
        this.prompt = sessionStorage.getItem('inputPrompt');      
        processQueryAllRecords({ 
            query: queryString, 
            requestType: 'View All Data',
            recordLimit: this.limit, 
            offset: this.offset,
            order_by: this.sortingCriteria,
            filter: this.filtersCriteria
            })
        .then( 
            (result) => {
                const dataString = result.SQL_Query_Result;
                const columnsString = JSON.stringify(result.SQL_Query_Columns);
                const totalRecordCount = result.Record_Count;
                // Check if sessionStorage has necessary data
                if (columnsString && dataString) {
                    if(this.noRecords){
                        this.noRecords = false;
                    }
                    // Parse and map field options for dropdown/filter
                    const fieldOptionsValues = JSON.parse(columnsString);
                    this.fieldOptions = fieldOptionsValues.map(item => {
                        var mapFieldOptions = {
                            label: item.title,
                            value: item.field_name,
                            type: item.type
                        }

                        if (item.hasOwnProperty('joinMeta')) {
                            mapFieldOptions['is_lookup'] = true;
                            mapFieldOptions['object_id_field'] = item.object_id_field;
                        }
                        return mapFieldOptions;
                    }
                );
                    // Parse column data for grid setup
                    const columns = JSON.parse(columnsString);
                    this.columns = columns.map(item => {
                        if (item.hasOwnProperty('object_name') && item.hasOwnProperty('object_id_field') && item.hasOwnProperty('joinMeta') &&
                            item.object_name !== '' &&  item.object_id_field !== '' ) 
                        {
                            return {
                                label: item?.title || 'Unnamed Column',
                                fieldName: item?.object_id_field + '_link',
                                type: 'url',
                                initialWidth: 180,
                                typeAttributes: { label: { fieldName: item?.object_id_field + '_name' }, target: '_blank' },
                                object_name: item?.object_name,
                                object_id_field: item?.object_id_field,
                                field_name_mapping: item?.field_name,
                                sortable: true

                            };
                        }
                        else if (item.hasOwnProperty('object_name') && item.hasOwnProperty('object_id_field') && 
                            item.object_name !== '' &&  item.object_id_field !== '' ) 
                        {
                            return {
                                label: item?.title || 'Unnamed Column',
                                fieldName: item?.field_name + '_link',
                                type: 'url',
                                initialWidth: 180,
                                typeAttributes: { label: { fieldName: item?.field_name }, target: '_blank' },
                                object_name: item?.object_name,
                                object_id_field: item?.object_id_field,
                                sortable: true

                            };
                        }
                        else if (item?.type=='richText'){
                            return {
                                label: item.title,
                                fieldName: item.field_name,
                                type: item.type
                            };
                        }
                        return {
                            label: item.title,
                            fieldName: item.field_name,
                            type: item.type,
                            sortable: true
                        };
                    });   
                    // Parse data for the grid
                    const data = JSON.parse(dataString);
                    this.allRecords = data; // Keep all records for further pagination
                    // Apply formatting based on column types
                    this.allRecords = this.formatData(this.columns, this.allRecords);
                    this.allRecords = this.addLinks(this.allRecords, this.columns);
                    this.resultantRecords = this.allRecords; // Load the first 50 records
                    this.offset = result.next_offset; 
                    this.recordCount = this.recordCountFormatting(this.resultantRecords.length);
                    this.totalRecordCount = this.recordCountFormatting(totalRecordCount);
                } else {
                    console.error('SQL Query Columns or Results are missing from sessionStorage.');
                }
                if(dataString == ''){
                    this.resultantRecords = [];
                    this.noRecords = true;
                    this.recordCount = this.recordCountFormatting(this.resultantRecords.length);
                }
            }
        )
        .catch(
            (error) => {
                let message = 'An unknown error occurred.'; // Default message
                if (error && error.body && error.body.message) {
                    message = error.body.message;  // Standard Salesforce error
                } else if (error && error.message) {
                    message = error.message;  // Other JavaScript or network errors
                }
                console.error('Error: ', error); // Log the complete error for debugging
            }
        ).finally(
            () => {
                this.isLoading = false;
            }
        )
    }

    addLinks(data, columns) {
        return data.map(record => {
            var currentUrl = window.location.href;
            this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
            columns.forEach(column => {
                if (column?.object_name && column?.object_id_field && record[column.object_id_field]) {
                    const objectId = record[column.object_id_field];
                    const linkField = column.fieldName // e.g., account_name_link, metro_area_name__c_link   
                    if (column?.field_name_mapping && objectId) {
                       
                        record[column.object_id_field + '_name'] = record[column.field_name_mapping];
                        record[linkField] = this.isCommunity
                        ? `/${this.communityName}/s/${column.object_name}/${objectId}/${record[column.field_name_mapping]}`
                        : `/lightning/r/${column.object_name}/${objectId}/view`;                      
                    }
                    else if (objectId) {
                        record[linkField] = this.isCommunity
                        ? `/${this.communityName}/s/${column.object_name}/${objectId}/${record[column.typeAttributes.label.fieldName]}`
                        : `/lightning/r/${column.object_name}/${objectId}/view`;
                                       
                    } else {
                        console.warn(`⚠️ No Object ID found for ${column.title} (Field: ${column.object_id_field})`);
                    }
                } else {
                    console.warn(`⚠️ Skipping column - Missing attributes. Column Data:`, JSON.stringify(column, null, 2));
                }
            });   
            return record;
        });
    }

    handleLoadMore(event) {
        const totalRecordCount = Number(this.totalRecordCount.replace(/,/g, ''));
        if(this.offset > 0){
            this.isLoadingMore = true; // Show bottom spinner
            const queryString = sessionStorage.getItem('SQL_Default_Query');
            processQueryAllRecords({
                query: queryString, 
                requestType: 'View All Data', 
                recordLimit: this.limit, 
                offset: this.offset,
                order_by: this.sortingCriteria,
                filter: this.filtersCriteria
            })
            .then(
                (result) => {
                    const dataString = result.SQL_Query_Result;
                    const columnsString = JSON.stringify(result.SQL_Query_Columns);      
                    // Check if sessionStorage has necessary data
                    if (columnsString && dataString) {
                        // Parse column data for grid setup
                        const columns = JSON.parse(columnsString);
                        this.columns = columns.map(item => {
                            if (item.hasOwnProperty('object_name') && item.hasOwnProperty('object_id_field') && item.hasOwnProperty('joinMeta') &&
                                item.object_name !== '' &&  item.object_id_field !== '' ) 
                            {
                                return {
                                    label: item?.title || 'Unnamed Column',
                                    fieldName: item?.object_id_field + '_link',
                                    type: 'url',
                                    initialWidth: 180,
                                    typeAttributes: { label: { fieldName: item?.object_id_field + '_name' }, target: '_blank' },
                                    object_name: item?.object_name,
                                    object_id_field: item?.object_id_field,
                                    field_name_mapping: item?.field_name
                                };
                            }
                            else if (item.hasOwnProperty('object_name') && item.hasOwnProperty('object_id_field') && 
                                item.object_name !== '' &&  item.object_id_field !== '' ) 
                            {
                                return {
                                    label: item?.title || 'Unnamed Column',
                                    fieldName: item?.field_name + '_link',
                                    type: 'url',
                                    initialWidth: 180,
                                    typeAttributes: { label: { fieldName: item?.field_name }, target: '_blank' },
                                    object_name: item?.object_name,
                                    object_id_field: item?.object_id_field
                                };
                            }
                            return {
                                label: item.title,
                                fieldName: item.field_name,
                                type: item.type,
                                sortable: true
                            };
                        });   
                            // Parse data for the grid
                        const data = JSON.parse(dataString);
                        // Apply formatting based on column types
                        var tempRecords= this.formatData(this.columns, data);
                        tempRecords = this.addLinks(tempRecords, this.columns);
                        if(this.resultantRecords)
                            this.resultantRecords = this.resultantRecords.concat(tempRecords); // append 50 new loaded records
                            this.recordCount = this.recordCountFormatting(this.resultantRecords.length);
                            this.offset = result.next_offset;
                    } else {
                        console.error('SQL Query Columns or Results are missing from sessionStorage.'); 
                    }
                }
            )
            .catch(
                (error) => {
                    let message = 'An unknown error occurred.'; // Default message
                    if (error && error.body && error.body.message) {
                        message = error.body.message;  // Standard Salesforce error
                    } else if (error && error.message) {
                        message = error.message;  // Other JavaScript or network errors
                    }
                    console.error('Error: ', error); // Log the complete error for debugging
                }
            ).finally(
                () => {
                    this.isLoadingMore = false; // Hide bottom spinner
                }
            )
        }        
    }

    handleFieldChange(event) {
        this.fieldValue = event.detail.value;
        // Find the selected option based on value
        const selectedOption = this.fieldOptions.find(option => option.value === this.fieldValue);
        // Get the type if the option exists
        this.fieldType = selectedOption ? selectedOption.type : '';
        if (selectedOption?.is_lookup) {
            this.fieldValue = selectedOption.object_id_field;
            this.is_lookup = selectedOption.is_lookup;
        }
    }

    handleOperatorChange(event) {
        this.operatorValue = event.detail.value;
    }

    handleInputChange(event) {
        let trimmedInput
        trimmedInput = event.detail.value.trim();
        this.input = trimmedInput;
    }

    handleFilters() {
        this.isLoading = true;
        if((this.fieldValue != '' && this.operatorValue != '' && this.input != '')){
            var filterParams = {
                field: this.fieldValue,
                operator: this.operatorValue,
                value: this.input,
                type: this.fieldType
            };
            if (this.is_lookup) {
                filterParams['is_lookup'] = true;
            }
            this.filtersCriteria = [filterParams];           
            this.offset = 0;
            this.initializeGrid();
        }
        else{
            if(this.fieldValue == ''){
                this.showToast('Error', 'Please select Field Name to apply filters.', 'error');
            }
            else if(this.operatorValue == ''){
                this.showToast('Error', 'Please select Operator to apply filters.', 'error');
            }
            else if(this.input == ''){
                this.showToast('Error', 'Please enter any value to apply filters.', 'error');
            }
            this.isLoading = false;
        }
    }

    handleClearFilters() {
        this.offset = 0;
        this.limit = 50;
        this.fieldValue = '';
        this.is_lookup = false;
        this.operatorValue = '';
        this.input = '';
        this.groupValue = '';
        this.filtersCriteria = [];
        this.sortingCriteria = {};
        this.initializeGrid();
        if(this.noRecords){
            this.noRecords = false;
        }
    }

    recordCountFormatting(count){
        const formattedNumber = new Intl.NumberFormat('en-US').format(count);
        return formattedNumber;
    }

    formatData(columns, data) {
        return data.map(record => {
            columns.forEach(column => {
                if (column.type === 'Currency(18, 0)' && record[column.fieldName]) {
                    record[column.fieldName] = this.formatCurrency(record[column.fieldName]);
                } else if (column.type === 'timestamp' && record[column.fieldName]) {
                    record[column.fieldName] = this.formatDate(record[column.fieldName]);
                } else if (column.type === 'phone' && record[column.fieldName]) {
                    record[column.fieldName] = this.formatPhoneNumber(record[column.fieldName]);
                } else if((column.type === 'richText' && record[column.fieldName]) ){
                    record[column.fieldName] = htmlToPlainText(record[column.fieldName]);
                }
            });
            return record;
        });
    }

    formatCurrency(amount) {
        try {
            return new Intl.NumberFormat(this.orgLocale, {
                style: 'currency',
                currency: this.currencyCode,
                currencyDisplay: 'symbol',
            }).format(amount);
        } catch (error) {
            console.error('Error formatting currency:', error);
            return 'Error';
        }
    }

    formatDate(date) {
        try {
            // Ensure the input is a Date object
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            // Check if the conversion to Date was successful
            if (isNaN(dateObj)) {
                throw new Error('Invalid date format. Ensure the date string is compatible with the Date constructor.');
            }
            return new Intl.DateTimeFormat(this.orgLocale, {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: this.userTimeZone,
            }).format(dateObj);
        } catch (error) {
            console.error('Error formatting date/time with timezone:', error);
            return 'Error';
        }
    }

    formatPhoneNumber(phone) {
        try {
            // Remove non-digit characters
            let formattedPhone = phone.replace(/\D/g, '');
            // If the number has 11 digits and starts with '1', drop the leftmost digit
            if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
                formattedPhone = formattedPhone.substring(1);
            }
            return formattedPhone;
        } catch (error) {
            console.error('Error formatting phone number:', error);
            return 'Error';
        }
    }

    onHandleSort(event) {
        this.isLoading = true;
        // Extract column name from the event
        const { fieldName: column } = event.detail;  
        // Find the original field name (if the column is a link field)
        let sortColumn = column;
        const columnConfig = this.columns.find(col => col.fieldName === column);
        if (columnConfig && columnConfig.type === 'url' && columnConfig.typeAttributes?.label?.fieldName) {
            sortColumn = columnConfig.typeAttributes.label.fieldName; // Get actual field name
        }
        if (columnConfig.hasOwnProperty('field_name_mapping')) {     
            sortColumn = columnConfig.object_id_field;
        }
        // Toggle sort direction based on the current direction
        let direction = 'asc';
        if (this.sortedBy === sortColumn) {
            direction = this.sortedDirection === 'asc' ? 'desc' : 'asc';
        }
        // Update the sorting state
        this.sortedBy = sortColumn;
        this.sortedDirection = direction;
        this.sortingCriteria = {
            direction: this.sortedDirection,
            column: sortColumn
        };
        if (columnConfig.hasOwnProperty('field_name_mapping')) {
            this.sortingCriteria['is_lookup'] = true;
        }
        this.offset = 0;
        this.initializeGrid();
    }

    // Helper function to show toast
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant, // e.g., 'error', 'success', 'info', 'warning'
        });
        this.dispatchEvent(event);
    }

    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        this.isSalesforceInstance = !this.isCommunity;
        this.setPanelHeight();
    }

    setPanelHeight(){
        if(this.isCommunity){
            this.datatableHeight = 'datatableHeightCommunity';
            this.divHeight = 'datatableDivHeightCommunity';
        }
        else{
            this.datatableHeight = 'datatableHeightSF';
            this.divHeight = 'datatableDivHeightSF';
        }
    }
}