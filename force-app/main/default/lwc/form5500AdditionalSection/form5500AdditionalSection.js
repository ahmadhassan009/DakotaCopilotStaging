import { LightningElement, api } from 'lwc';
import getForm5500AdditionalInfoId from '@salesforce/apex/Form5500AdditionalSectionController.getForm5500AdditionalInfoId';

export default class Form5500AdditionalSection extends LightningElement {
    @api recordId;
    form5500RecordId;
    form5500RecordExists = false;
    activeSections = ['details'];

    isAdminSignedName=false;
    isSponsSignedName=false;
    isDFESignedName=false;

    isAdminManualSignedName=false;
    isSponsManualSignedName=false;
    isDFEManualSignedName=false;


    connectedCallback() {

        getForm5500AdditionalInfoId({
            accountId : this.recordId
        }).then(returnedResult => {
            if(returnedResult != null ) {
                this.form5500RecordId = returnedResult.Id;
                if(returnedResult.Admin_Name__c)
                {
                    this.isAdminSignedName=true;
                }
                if(returnedResult.Spons_Signed_Name__c)
                {
                    this.isSponsSignedName=true;
                }
                if(returnedResult.DFE_Signed_Name__c)
                {
                    this.isDFESignedName=true;
                }
                if(returnedResult.Admin_Manual_Signed_Name__c)
                {
                    this.isAdminManualSignedName=true;
                }
                if(returnedResult.Spons_Manual_Signed_Name__c)
                {
                    this.isSponsManualSignedName=true;
                }
                if(returnedResult.DFE_Manual_Signed_Name__c)
                {
                    this.isDFEManualSignedName=true;
                }
                this.form5500RecordExists = true;
            }
            else {
                this.form5500RecordExists = false;
            }
        }).catch(error => {
                this.form5500RecordExists = false;
        });
    }
}