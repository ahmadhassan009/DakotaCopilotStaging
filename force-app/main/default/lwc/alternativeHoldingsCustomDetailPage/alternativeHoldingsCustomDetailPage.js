import { LightningElement, api } from 'lwc';
import getAlternativeHoldingsInfoId from '@salesforce/apex/AlternativeHoldingsController.getAlternativeHoldingsInfoId';
import { loadStyle } from 'lightning/platformResourceLoader';
import alternativeHoldingsCustomDetailPage from '@salesforce/resourceUrl/alternativeHoldingsCustomDetailPage';

export default class AlternativeHoldingsCustomDetailPage extends LightningElement {
    @api recordId;
    holdingRecordExists = false;
    showCurrentYearField = true;
    street;
    city;
    state;
    postalCode;
    country;
    emptyAddressPadingBottom = '';
    connectedCallback() {
        Promise.all([
            loadStyle(this, alternativeHoldingsCustomDetailPage)
        ]);
        getAlternativeHoldingsInfoId({
            recordId: this.recordId
        }).then(returnedResult => {
            if (returnedResult != null) {
                this.holdingRecordExists = true;
                if (returnedResult.Address__c != null) {
                    this.street = returnedResult.Address__c['street'];
                    this.city = returnedResult.Address__c['city'];
                    this.state = returnedResult.Address__c['state'];
                    this.postalCode = returnedResult.Address__c['postalCode'];
                    this.country = returnedResult.Address__c['country'];
                }
                else {
                    this.emptyAddressPadingBottom = 'padding-bottom: 20px;';
                }
                if (returnedResult.Current_Year_s_Depreciation__c == 0 || returnedResult.Current_Year_s_Depreciation__c == undefined) {
                    this.showCurrentYearField = false;
                }
            }
            else {
                this.holdingRecordExists = false;
            }
        }).catch(error => {
            this.holdingRecordExists = false;
        });
    }
}