import { LightningElement, track, api } from 'lwc'
import USER_LOCALE from '@salesforce/i18n/locale';
import USER_CURRENCY from '@salesforce/i18n/currency';
import TIMEZONE from '@salesforce/i18n/timeZone';

export default class TabulatorDataSnap extends LightningElement {
    table
    tabulatorInitialized = false
    @track columns = []
    @track resultantRecords
    @track isLoading = false
    fieldOptions
    @api recordReceived

    recordCount
    totalRecordCount

    orgLocale;
    currencyCode;
    userTimeZone;

    connectedCallback() {

        if (USER_LOCALE && USER_CURRENCY && TIMEZONE) {
            this.orgLocale = USER_LOCALE;
            this.currencyCode = USER_CURRENCY;
            this.userTimeZone = TIMEZONE;
        }

        this.isLoading = true;
        this.initializeGrid()
    }

    initializeGrid() {
      const columnsString = JSON.stringify(this.recordReceived.SQL_Query_Columns)
      const dataString = this.recordReceived.SQL_Query_Result
      const totalRecordCount = this.recordReceived.Record_Count

      console.log('columnsString : '+ columnsString)
      console.log('dataString' + dataString)
  
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
          this.columns = columns.map(item => ({
              label: item.title,
              fieldName: item.field_name,
              type: item.type,
              initialWidth: 180, // Set the initial width for this column
          }));
  
          // Parse data for the grid
          const data = JSON.parse(dataString);
          const previewRecord = data.slice(0, 5);
          this.resultantRecords = previewRecord;
          //Parse the data for formattig
          console.log('columns : '  + this.columns);
          this.resultantRecords = this.formatData(this.columns, this.resultantRecords);

          this.recordCount = this.totalRecordsCount(this.resultantRecords.length)
          this.totalRecordCount = this.totalRecordsCount(totalRecordCount)
          // Set loading state to false
          this.isLoading = false;
      } else {
          console.error('SQL Query Columns or Results are missing from sessionStorage.');
          this.isLoading = false;
      }
    }

    totalRecordsCount(count){
        const formattedNumber = new Intl.NumberFormat('en-US').format(count);
        return formattedNumber
    }

    formatData(columns, data) {

        //console.log('columns : '  + columns);
       // console.log('data' + data);
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
          // console.log('line 203 :' + date);
            
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
        console.log('phone' + phone);
        try {
            // Remove non-digit characters
            let formattedPhone = phone.replace(/\D/g, '');
    
            // If the number has 11 digits and starts with '1', drop the leftmost digit
            if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
                formattedPhone = formattedPhone.substring(1);
            }
    
            console.log('formattedPhone' + formattedPhone);
            return formattedPhone;
        } catch (error) {
            console.error('Error formatting phone number:', error);
            return 'Error';
        }
    }
}