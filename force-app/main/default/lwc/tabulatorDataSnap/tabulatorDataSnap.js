import { LightningElement, track, api } from 'lwc';
import USER_LOCALE from '@salesforce/i18n/locale';
import USER_CURRENCY from '@salesforce/i18n/currency';
import TIMEZONE from '@salesforce/i18n/timeZone';
import activeCommunities from '@salesforce/label/c.active_communities_copilot';
import { htmlToPlainText } from 'c/dakotaLwcUitils'; 

export default class TabulatorDataSnap extends LightningElement {
    table;
    tabulatorInitialized = false;
    @track columns = [];
    @track resultantRecords;
    @track isLoading = false;
    fieldOptions;
    @api recordReceived;
    recordCount;
    totalRecordCount;
    orgLocale;
    currencyCode;
    userTimeZone;
    isCommunity = false;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        if (USER_LOCALE && USER_CURRENCY && TIMEZONE) {
            this.orgLocale = USER_LOCALE;
            this.currencyCode = USER_CURRENCY;
            this.userTimeZone = TIMEZONE;
        }
        this.isLoading = true;
        this.initializeGrid();
    }

    initializeGrid() {
        const columnsString = JSON.stringify(this.recordReceived.SQL_Query_Columns);
        const dataString = this.recordReceived.SQL_Query_Result;
        const totalRecordCount = this.recordReceived.Record_Count;
        // Check if sessionStorage has necessary data
        if (columnsString && dataString) {
            // Parse and map field options for dropdown/filter
            const fieldOptionsValues = JSON.parse(columnsString);
            this.fieldOptions = fieldOptionsValues.map(item => ({
                label: item.title,
                value: item.field_name
            }));
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
                initialWidth: 180
            };
        });
          // Parse data for the grid
          const data = JSON.parse(dataString);
          const previewRecord = data.slice(0, 5);
          this.resultantRecords = previewRecord;
          //Parse the data for formattig
          this.resultantRecords = this.formatData(this.columns, this.resultantRecords);        
          this.resultantRecords = this.addLinks(this.resultantRecords, this.columns);
          this.recordCount = this.totalRecordsCount(this.resultantRecords.length);
          this.totalRecordCount = this.totalRecordsCount(totalRecordCount);
          // Set loading state to false
          this.isLoading = false;
      } else {
          console.error('SQL Query Columns or Results are missing from sessionStorage.');
          this.isLoading = false;
      }
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

    totalRecordsCount(count){
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
}