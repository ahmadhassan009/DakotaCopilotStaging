import { LightningElement, wire, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord } from 'lightning/uiRecordApi';
import Copyright_Text from '@salesforce/label/c.Copyright_Text';
import Copyright_By from '@salesforce/label/c.Copyright_By';

export default class CustomAccountRecordDetail extends NavigationMixin(LightningElement) {
    @api recordId;
    isQP = false;
    isCRD = false;
    isSubtype = false;
    isCopyright = false;
    isInsurance = false;
    isAverageTicketSize = false;
    parentAccountId;
    parentAccountName;
    recordURL;
    copyrightText = Copyright_Text;
    @track lastModifiedDateValue;
    fieldsToShowDynamically = ['Account.Display_Sub_Type__c','Account.CRD__c', 'Account.Copyright__c','Account.Number_of_QPs__c', 'Account.Average_Ticket_Size__c', 'Account.LastModifiedDate', 'Account.Parent_Account__c', 'Account.Parent_Account__r.Name'];
    @wire(getRecord, { recordId: '$recordId', fields: '$fieldsToShowDynamically'})
    async wiredRecord({data}) {
        if (data) {            
            this.isAverageTicketSize = data?.fields?.Average_Ticket_Size__c?.value ? true : false;
            this.isQP = data?.fields?.Number_of_QPs__c?.value ? true : false;
            this.isCRD = data?.fields?.CRD__c?.value ? true : false;
            this.isSubtype = data?.fields?.Display_Sub_Type__c?.value;
            this.isCopyright = data?.fields?.Copyright__c?.value && data?.fields?.Copyright__c?.value.includes(Copyright_By) ? true : false;
            this.isInsurance = data?.fields?.Copyright__c?.value && data?.fields?.Copyright__c?.value.includes(Copyright_By) ? true : false;
            this.lastModifiedDateValue = data?.fields?.LastModifiedDate?.value;
            this.parentAccountId = data?.fields?.Parent_Account__c?.value;
            this.parentAccountName = data?.fields?.Parent_Account__r?.displayValue;
            const recordUrl = await this[NavigationMixin.GenerateUrl]({
                type: 'standard__recordPage',
                attributes: {
                  recordId: this.parentAccountId,
                  objectApiName: 'Account',
                  actionName: 'view'
                }
              });
              this.recordUrl = recordUrl;
            const date = new Date(this.lastModifiedDateValue);
            const formatter = new Intl.DateTimeFormat(this.locale, {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            });
            this.lastModifiedDateValue = formatter.format(date);
            this.isRendered = true;
        }
    }

    dateFormatter(value) {
        if (value) {
            return new Date(value).toLocaleDateString();
        }
        return '';
    }
}