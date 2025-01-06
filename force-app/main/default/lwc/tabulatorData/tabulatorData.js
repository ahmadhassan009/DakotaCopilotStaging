import { LightningElement, wire, api, track } from 'lwc'
import floatingIcon from '@salesforce/resourceUrl/dakotaCopilotViewall';
import activeCommunities from '@salesforce/label/c.active_communities_copilot';
import processQueryAllRecords from '@salesforce/apex/DakotaCopolitController.processQueryAllRecords';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import USER_LOCALE from '@salesforce/i18n/locale';
import USER_CURRENCY from '@salesforce/i18n/currency';
import TIMEZONE from '@salesforce/i18n/timeZone';

export default class TabulatorData extends LightningElement {
    botProfilePic = floatingIcon;
    fieldOptions;
    groupValue = '';
    fieldValue = '';
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
    // channelName = '/event/Tabulator_Data_Sent__e';
    // subscription = {};
    orgLocale;
    currencyCode;
    userTimeZone;
    offset = 0;
    limit = 50;
    @track sortingCriteria = {}; // Empty object by default
    @track filtersCriteria = []; // Empty object by default
    noRecords = false;
    //groupBy = '';

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
        this.checkIsCommunityInstance()
        this.initializeGrid()
    }

    initializeGrid() {
        this.isLoading = true;
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
                console.log("response view all request: ");
                console.log(result);

                const dataString = result.SQL_Query_Result;
                const columnsString = JSON.stringify(result.SQL_Query_Columns);

                const totalRecordCount = result.Record_Count;

                console.log("response view all request columnsString: ");
                console.log(columnsString);


                console.log("response view all request dataString: ");
                console.log(dataString);

            
                // Check if sessionStorage has necessary data
                if (columnsString && dataString) {
                    if(this.noRecords){
                        this.noRecords = false;
                    }
                    // Parse and map field options for dropdown/filter
                    const fieldOptionsValues = JSON.parse(columnsString);
                    this.fieldOptions = fieldOptionsValues.map(item => ({
                        label: item.title,
                        value: item.field_name
                    }));
            
                    // Parse column data for grid setup
                    const columns = JSON.parse(columnsString);
                    this.columns = columns.map(item => ({
                        label: item.title,/// name
                        fieldName: item.field_name, // name
                        sortable: true,
                        type: item.type,
                        //apiName: item.field_name
                    }));
                        
                    // Parse data for the grid
                    const data = JSON.parse(dataString);
                        
                    // this.resultantRecords = data;
                    // this.allRecords = this.resultantRecords
                    this.allRecords = data; // Keep all records for further pagination


                    // Apply formatting based on column types
                    this.allRecords = this.formatData(this.columns, this.allRecords);
                    this.resultantRecords = this.allRecords; // Load the first 50 records
                    //this.totalLoadedRecords = 50; // Update counter for loaded records

                    this.offset = result.next_offset; 
                    this.recordCount = this.recordCountFormatting(this.resultantRecords.length);
                    this.totalRecordCount = this.recordCountFormatting(totalRecordCount);
            
                    // Set loading state to false
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

    handleLoadMore(event) {
        const totalRecordCount = Number(this.totalRecordCount.replace(/,/g, ''));
        // if(totalRecordCount > this.offset){
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
                    console.log("response view all request: ");
                    console.log(result);

                    const dataString = result.SQL_Query_Result;
                    const columnsString = JSON.stringify(result.SQL_Query_Columns);

                    console.log("response view all request columnsString: ");
                    console.log(columnsString);


                    console.log("response view all request dataString: ");
                    console.log(dataString);

                
                    // Check if sessionStorage has necessary data
                    if (columnsString && dataString) {
                        // Parse and map field options for dropdown/filter
                        // const fieldOptionsValues = JSON.parse(columnsString);
                        // this.fieldOptions = fieldOptionsValues.map(item => ({
                        //     label: item.title,
                        //     value: item.title
                        // }));
                
                        // Parse column data for grid setup
                        const columns = JSON.parse(columnsString);
                        this.columns = columns.map(item => ({
                            label: item.title,/// name
                            fieldName: item.field_name, // name
                            sortable: true,
                            type: item.type,
                            //apiName: item.field
                        }));
                            
                        // Parse data for the grid
                        const data = JSON.parse(dataString);
                        //this.allRecords = data; // Keep all records for further pagination

                        // Apply formatting based on column types
                        const tempRecords= this.formatData(this.columns, data);
                        if(this.resultantRecords)
                        this.resultantRecords = this.resultantRecords.concat(tempRecords); // append 50 new loaded records
                        
                        this.recordCount = this.recordCountFormatting(this.resultantRecords.length);

                        this.offset = result.next_offset;
                        // if((this.offset + this.limit) >= totalRecordCount || (this.offset) == 0){
                        //     this.offset = totalRecordCount;
                        // } 
                        // else{
                        //     this.offset = parseInt(this.offset ) + parseInt(this.limit);
                        // }


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
        console.log("this.fieldValue: " + this.fieldValue);
    }

    handleOperatorChange(event) {
        this.operatorValue = event.detail.value;
        console.log("this.operatorValue: " + this.operatorValue);
    }

    handleInputChange(event) {
        this.input = event.detail.value;
        console.log("this.input: " + this.input);
    }

    // handleGroupChange(event) {
    //     this.groupValue = event.detail.value;
    //     console.log("this.groupValue: " + this.groupValue);
    // }

    handleFilters() {
        this.isLoading = true;
        if((this.fieldValue != '' && this.operatorValue != '' && this.input != '')){
            this.filtersCriteria =[{
                field: this.fieldValue,
                operator: this.operatorValue,
                value: this.input
            }]
            console.log('this.filtersCriteria: ' + JSON.stringify(this.filtersCriteria))
            this.offset = 0 
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

    // handleFilters() {
    //     this.isLoading = true;
    
    //     // Validate filters
    //     if (!this.areAnyFiltersFilled()) {
    //         this.showToast('Error', 'Must fill one of the filter fields.', 'error');
    //         this.isLoading = false;
    //         return;
    //     }
    
    //     if (!this.isFirstFilterValid() && this.isFirstFilterPartiallyFilled()) {
    //         this.validateFirstFilter();
    //         this.isLoading = false;
    //         return;
    //     }
    
    //     // Set filters if valid
    //     if (this.isFirstFilterValid()) {
    //         this.filtersCriteria = [{
    //             field: this.fieldValue,
    //             operator: this.operatorValue,
    //             value: this.input
    //         }];
    //     }
    
    //     if (this.groupValue) {
    //         this.groupBy = this.groupValue;
    //     }
    
    //     // Log and initialize the grid
    //     console.log('this.filtersCriteria:', JSON.stringify(this.filtersCriteria));
    //     console.log('this.groupBy', this.groupBy);
    //     this.offset = 0;
    //     this.initializeGrid();
    // }
    
    // // Helper function to check if any filters are filled
    // areAnyFiltersFilled() {
    //     return this.isFirstFilterValid() || this.isFirstFilterPartiallyFilled() || this.groupValue;
    // }
    
    // // Helper function to check if the first filter is fully valid
    // isFirstFilterValid() {
    //     return this.fieldValue && this.operatorValue && this.input;
    // }
    
    // // Helper function to check if the first filter is partially filled
    // isFirstFilterPartiallyFilled() {
    //     return this.fieldValue || this.operatorValue || this.input;
    // }
    
    // // Validate specific fields in the first filter
    // validateFirstFilter() {
    //     if (!this.fieldValue) {
    //         this.showToast('Error', 'Please select Field Name to apply filters.', 'error');
    //     }
    //     if (!this.operatorValue) {
    //         this.showToast('Error', 'Please select Operator to apply filters.', 'error');
    //     }
    //     if (!this.input) {
    //         this.showToast('Error', 'Please enter any value to apply filters.', 'error');
    //     }
    // }
    
    // handleFieldChange(event) {
    //     this.fieldValue = event.detail.value
    //     this.applyFilter()
    // }

    // handleOperatorChange(event) {
    //     this.operatorValue = event.detail.value
    //     this.applyFilter()
    // }

    // handleInputChange(event) {
    //     this.input = event.detail.value
    //     this.applyFilter()
    // }

    // applyFilter() {
    //     this.isLoading = true;
    //     this.resultantRecords = this.allRecords
    //     if (this.fieldValue && this.operatorValue && this.input) {         
    //         this.filteredRecords = this.resultantRecords.filter(record => {
    //             const fieldValue = (record[this.fieldValue]?.toString().toLowerCase()) || "" // Convert to string and lowercase
    //             const filterValue = this.input.toString().toLowerCase();
    
    //             switch (this.operatorValue) {
    //                 case '=':
    //                     return fieldValue == filterValue;
    //                 case '!=':
    //                     return fieldValue != filterValue;
    //                 case '<':
    //                     return fieldValue < filterValue;
    //                 case '<=':
    //                     return fieldValue <= filterValue;
    //                 case '>':
    //                     return fieldValue > filterValue;
    //                 case '>=':
    //                     return fieldValue >= filterValue;
    //                 case 'includes': // or 'Contains'
    //                     return fieldValue.includes(filterValue); // Ensure this works for array/strings
    //                 default:
    //                     return true; // Show all records if no valid operator
    //             }
    //         });
    //         this.resultantRecords = this.filteredRecords
    //         this.recordCount = this.recordCountFormatting(this.resultantRecords.length)
    //     } else {
    //         // Show all records if any filter criteria is missing
    //         this.resultantRecords = this.allRecords
    //         this.recordCount = this.recordCountFormatting(this.resultantRecords.length)
    //     }
    //     this.isLoading = false;
    // }

    handleClearFilters() {
        this.offset = 0;
        this.limit = 50;
        this.fieldValue = ''
        this.operatorValue = ''
        this.input = ''
        this.groupValue = ''
        //this.groupBy = ''
        this.filtersCriteria = []
        this.sortingCriteria = {}
        this.initializeGrid()
        // this.resultantRecords = this.allRecords
        // this.recordCount = this.recordCountFormatting(this.resultantRecords.length)
        if(this.noRecords){
            this.noRecords = false
        }
    }

    recordCountFormatting(count){
        const formattedNumber = new Intl.NumberFormat('en-US').format(count);
        return formattedNumber
    }

    // handleLoadMore(event) {
    //     this.isLoadingMore = true; // Show bottom spinner

    //     // Check if there's more data to load
    //     console.log('handleLoadMore called --> this.totalLoadedRecords :' + this.totalLoadedRecords);
    //     if (this.totalLoadedRecords < this.allRecords.length) {
    //         // Load the next 50 records
    //         const nextRecords = this.allRecords.slice(this.totalLoadedRecords, this.totalLoadedRecords + 50);
    //         this.resultantRecords = [...this.resultantRecords, ...nextRecords];
    //         this.totalLoadedRecords += 50; // Update the counter for loaded records
    //     }
        
    //     this.recordCount = this.recordCountFormatting(this.resultantRecords.length)

    //     this.isLoadingMore = false; // Hide bottom spinner
    // }

    formatData(columns, data) {
        return data.map(record => {
            columns.forEach(column => {
                
                if (column.type === 'Currency(18, 0)' && record[column.fieldName]) {
                    record[column.fieldName] = this.formatCurrency(record[column.fieldName]);
                } else if (column.type === 'timestamp' && record[column.fieldName]) {
                    record[column.fieldName] = this.formatDate(record[column.fieldName]);
                } else if (column.type === 'phone' && record[column.fieldName]) {
                    record[column.fieldName] = this.formatPhoneNumber(record[column.fieldName]);
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



    // groupRecords() {
    //     this.isLoading = true
    //     var groupedRecords = {};  
    //     this.resultantRecords.forEach(record => {
    //         const groupKey = record[this.groupValue]; // Get the value for the selected column
    //         if (!groupedRecords[groupKey]) {
    //             groupedRecords[groupKey] = [];
    //         }
    //         groupedRecords[groupKey].push(record);
    //     });
    
    //     // Create an array from the grouped records to show in the datatable
    //     this.groupedData = Object.keys(groupedRecords).map(key => {
    //         return {
    //             groupName: key,
    //             records: groupedRecords[key]
    //         };
    //     });
    //     this.flattenGroupedRecords()
    // }

    // flattenGroupedRecords() {
    //     var flatRecords = [];  
    //     this.groupedData.forEach(group => {
    //         group.records.forEach(record => {
    //             // Optionally, add the group name to each record for visual separation
    //             let flatRecord = { ...record, groupName: group.groupName };
    //             flatRecords.push(flatRecord);
    //         });
    //     });
    
    //     // Update the datatable records
    //     this.resultantRecords = flatRecords
    //     this.recordCount = this.recordCountFormatting(this.resultantRecords.length)
    //     this.isLoading = false
    // }

    // Sort handler
    onHandleSort(event) {
        this.isLoading = true;

        // Extract column name from the event
        const { fieldName: column} = event.detail;
        // const columnData = this.columns.find(col => col.fieldName === column);
        // const customParam = columnData ? columnData.apiName : null;
    
        // Toggle sort direction based on the current direction
        let direction = 'asc';
        if (this.sortedBy === column) {
            direction = this.sortedDirection === 'asc' ? 'desc' : 'asc';
        }
    
        // Update the sorting state
        this.sortedBy = column;
        this.sortedDirection = direction;
    
        this.sortingCriteria = {
                direction:  this.sortedDirection,
                column: column
        };
        console.log('OrderBy: '+ this.sortingCriteria.direction);
        console.log('OrderBy: '+ this.sortingCriteria.column);
        this.offset = 0 
        this.initializeGrid();
    }

    // // Sort handler
    // onHandleSort(event) {
    //     this.isLoading = true;
    //     const { fieldName: sortedBy, sortDirection } = event.detail;
    //     const cloneData = [...this.resultantRecords];

    //     // Sort the data
    //     cloneData.sort((a, b) => {
    //         let val1 = a[sortedBy] ? a[sortedBy] : ''; // Handle undefined or null values
    //         let val2 = b[sortedBy] ? b[sortedBy] : '';

    //         // Convert to lowercase strings for string comparison
    //         if (typeof val1 === 'string') {
    //             val1 = val1.toLowerCase();
    //         }
    //         if (typeof val2 === 'string') {
    //             val2 = val2.toLowerCase();
    //         }

    //         return sortDirection === 'asc' ? (val1 > val2 ? 1 : -1) : (val1 < val2 ? 1 : -1);
    //     });

    //     // Update the sorted values
    //     this.resultantRecords = cloneData;
    //     this.recordCount = this.recordCountFormatting(this.resultantRecords.length)
    //     this.sortedBy = sortedBy;
    //     this.sortedDirection = sortDirection;
    //     this.isLoading = false;
    // }

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
        this.setPanelHeight()
    }

    setPanelHeight(){
        if(this.isCommunity){
            this.datatableHeight = 'datatableHeightCommunity'
            this.divHeight = 'datatableDivHeightCommunity'
        }
        else{
            this.datatableHeight = 'datatableHeightSF'
            this.divHeight = 'datatableDivHeightSF'
        }
    }
}