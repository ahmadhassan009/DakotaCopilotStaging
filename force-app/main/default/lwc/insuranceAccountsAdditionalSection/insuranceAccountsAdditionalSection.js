import { LightningElement, api } from 'lwc';
import getInsuranceAdditionalInfoId from '@salesforce/apex/InsuranceAdditionalSectionController.getInsuranceAdditionalInfoId';

export default class InsuranceAccountsAdditionalSection extends LightningElement {
    @api recordId;
    insuranceAdditionalInformationRecordId;
    insuranceRecordExists = false;
    activeSections = ['details','additionalInfo'];


    connectedCallback() {
        getInsuranceAdditionalInfoId({
            accountId : this.recordId
        }).then(returnedResult => {
            if(returnedResult != null ) {
                this.insuranceAdditionalInformationRecordId = returnedResult.Id;
                this.insuranceRecordExists = true;
            }
            else {
                this.insuranceRecordExists = false;
            }
        }).catch(error => {
                this.insuranceRecordExists = false;
        });
    }
}