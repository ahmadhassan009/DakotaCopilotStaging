import { LightningElement, wire, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord } from "lightning/uiRecordApi";
import NAME from "@salesforce/schema/Performance__c.Name";

const fields = [NAME];
export default class PerformanceCustomRecordBanner extends NavigationMixin(LightningElement) {

    @api recordId;
    @api sObjectLabel;

    @track recordName = '';
    isLoaded = false;

    @wire(getRecord, { recordId: "$recordId", fields })
    wiredRecord({
        error,
        data
    }) {
        if (data) {
            this.sObjectData = data.fields;
            this.recordName = this.sObjectData?.['Name']?.value;
            this.isLoaded = true;
        } else if (error) {
            console.debug(error);
            this.isLoaded = true;
        }
    };
}