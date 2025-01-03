import { LightningElement,api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class MassShareListViewPopup extends LightningElement {
    @api sharePopup;
    @api recordIdList;

    handleclosepopup() {
        this.sharePopup = false;
    }

    @api showToastMessage() {
        const event = new ShowToastEvent({
            variant: 'error',
            message: 'Select at least one record and try again'
        });
        this.dispatchEvent(event);
    }
}