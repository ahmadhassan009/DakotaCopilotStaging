import { LightningElement, wire, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord } from 'lightning/uiRecordApi';

export default class AlternativesTabInAccountDetailPage extends NavigationMixin(LightningElement) {
    @api recordId;
    isPrivateEquityAverageTicketSize = false;
    isPrivateCreditAverageTicketSize = false;
    isHedgeFundAvgTicketSize = false;
    isPrivateRealEstateAverageTicketSize = false;
    isRealAssetsAverageTicketSize = false;
    isLoading = true;
    fieldsToShowDynamically = ['Account.Private_Credit_Average_Ticket_Size__c', 'Account.Hedge_Fund_Avg_Ticket_Size__c', 'Account.Private_Equity_Average_Ticket_Size__c', 'Account.Private_Real_Estate_Average_Ticket_Size__c', 'Account.Real_Assets_Average_Ticket_Size__c'];
    @wire(getRecord, { recordId: '$recordId', fields: '$fieldsToShowDynamically' })
    async wiredRecord({ data }) {
        if (data) {
            this.isPrivateEquityAverageTicketSize = data?.fields?.Private_Equity_Average_Ticket_Size__c?.value ? true : false;
            this.isPrivateCreditAverageTicketSize = data?.fields?.Private_Credit_Average_Ticket_Size__c?.value ? true : false;
            this.isHedgeFundAvgTicketSize = data?.fields?.Hedge_Fund_Avg_Ticket_Size__c?.value ? true : false;
            this.isPrivateRealEstateAverageTicketSize = data?.fields?.Private_Real_Estate_Average_Ticket_Size__c?.value ? true : false;
            this.isRealAssetsAverageTicketSize = data?.fields?.Real_Assets_Average_Ticket_Size__c?.value ? true : false;
        }
        setInterval(() => {
            this.isLoading = false;
        }, 1000);
    }
}