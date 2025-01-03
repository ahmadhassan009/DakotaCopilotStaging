import { api, LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


export default class CreateNewNote extends LightningElement {
    @api recordId;
    @track areDetailsVisible=false;
    @track isLoadingCreateCon=false;
    @api isAccount;
    @api isContact;
    @api parentRecordId;
    toastMessage = 'Unkown Error Occured';

    handleSuccess(event) {
        const saveEvent = new CustomEvent('saverecord', {});
        this.dispatchEvent(saveEvent);
        this.isLoadingCreateCon = false;

        if(this.recordId != null) {
            this.toastMessage = 'Note Updated Successfully';
        } else {
            this.toastMessage =  'Note Created Successfully';
        }
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: this.toastMessage,
                variant: 'success'
            })
         );
    }

    handlesubmit(event)
    {
        this.isLoadingCreateCon = true;
    }

    handleFormError(event){
        let message = event.detail.message;
        console.log('error message is ', message);
        this.isLoadingCreateCon = false;
        if( event.detail &&  event.detail.output && JSON.stringify(event.detail.output) === '{}') {
            if(!message.includes("You don't have access to this record")) {
                message = 'The Note you are trying to update doesn’t exist.';
                this.dispatchEvent(new CustomEvent('refreshtable', {}));
            }
            this.isLoadingCreateCon = false;
        } else if(this.recordId != null) {
            message = 'An error occurred while trying to update the record. Please try again.';
        } else {
            message =  'An error occurred while trying to create the record. Please try again.';
        }
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: message,
                variant: 'error'
            })
         );
    }


    handleLoad(event) {
        this.areDetailsVisible=true; 
        const viewLoaded = new CustomEvent('recordviewload', {});
        this.dispatchEvent(viewLoaded);

    }

    closeModal(event) {
        const closeModalEvent = new CustomEvent('closemodal', {});
        this.dispatchEvent(closeModalEvent);
    }

}