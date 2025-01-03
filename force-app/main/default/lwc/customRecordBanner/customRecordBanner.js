import { LightningElement, wire, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import NAME from "@salesforce/schema/Investment_Strategy__c.Name";
import getCurrentUserForInvestment from '@salesforce/apex/PerformanceRelatedToInvestmentFirm.getCurrentUserForInvestment';
import getCurrentUserAccountId from '@salesforce/apex/PerformanceRelatedToInvestmentFirm.getCurrentUserAccountId';
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';
import Id from "@salesforce/user/Id";

const fields = [NAME];
export default class CustomRecordBanner extends NavigationMixin(LightningElement) {

    @api recordId;
    @track isVisible = false;
    object = {};
    accountId = '';
    @wire(getRecord, { recordId: "$recordId", fields })
    investment_Strategy__c;
    isClicked = false;
    userId = Id;

    get investmentName() {
        return getFieldValue(this.investment_Strategy__c.data, NAME);
    }
    handleClick() {

        if (!this.isClicked) {
            this.isClicked = true;

            this.object['Account__c'] = this.accountId;
            this.object['LastModifiedById'] = this.userId;
            

            const defaultValues = encodeDefaultFieldValues(this.object);
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: this.recordId,
                    actionName: "edit",
                },
                state: {
                    defaultFieldValues: defaultValues
                }
            });
        }
        setTimeout(()=>{
            this.isClicked = false;
        },1000);
    }

    connectedCallback() {
        getCurrentUserForInvestment({
            recordId: this.recordId
        }).then((result) => {
            getCurrentUserAccountId({}).then((accId) => {
                this.isVisible = result;
                this.accountId = accId;
            }).catch((error) => {
                console.log(error);
            });
        }).catch((error) => {
            console.log(error);
        });
    }
}