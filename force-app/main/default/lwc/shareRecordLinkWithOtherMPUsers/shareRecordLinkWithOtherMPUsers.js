import { LightningElement, api } from 'lwc';
import getAllMPUsers from '@salesforce/apex/ShareRecordLinkWithOtherMPUserController.getAllMPUsers';
import shareRecordWithOtherMPUsers from '@salesforce/apex/ShareRecordLinkWithOtherMPUserController.shareRecordWithOtherMPUsers';
import ShareIcon from "@salesforce/resourceUrl/ShareIcon";

import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ShareRecordLinkWithOtherMPUsers extends LightningElement {
    @api recordId;
    @api isHomePage;

    multipicklistOptions = [];
    filterValue = '';
    isLoading = true;
    headerStyle = 'margin-top: 15px;font-size: x-large;font-weight: bolder;';
    footerStyle = 'text-align: center;background-color: white;padding-bottom: 28px;padding-top: 15px; ';
    shareImage;
    selectedMpUsers = [];

    connectedCallback() {
        this.shareImage = ShareIcon;
        const closeAuraPopupEvent = new CustomEvent("removespinner", {});
        this.dispatchEvent(closeAuraPopupEvent);
        getAllMPUsers({}).then(allMPUsers => {
            for (let i = 0; i < allMPUsers.length; i++) {
                this.multipicklistOptions.push({
                    "Id" : allMPUsers[i].Id,
                    "label": allMPUsers[i].FirstName ?  allMPUsers[i].FirstName + ' ' : '' + allMPUsers[i].LastName,
                    "value": allMPUsers[i].FirstName ?  allMPUsers[i].FirstName + ' ' : '' + allMPUsers[i].LastName,//allMPUsers[i].Username,
                    "Email": allMPUsers[i].Email,
                    "Firstname": allMPUsers[i].FirstName,
                    "Lastname": allMPUsers[i].LastName,
                    "fieldType": 'String'
                })
            }
            this.template.querySelector('c-multi-select-combobox-custom')?.handleListChange(this.multipicklistOptions, [])
            this.isLoading = false;
        }).catch(error => {
            console.log('Cannot fetch MP Users');
        });
    }

    handleChangeMultiPickList(event) {
        this.selectedMpUsers = [];
        event.detail?.forEach(mpUser => {
            if (mpUser.Email && this.selectedMpUsers.filter(v => v.Email == mpUser.Email)?.length == 0) {
                this.selectedMpUsers.push(JSON.parse(JSON.stringify(mpUser)));
            }
        });
    }


    closeModal() {
        const closeAuraPopupEvent = new CustomEvent("closepopup", {});
        this.dispatchEvent(closeAuraPopupEvent);
    }

    shareRecord() {
        this.isLoading = true;
        if (this.selectedMpUsers?.length > 0) {
            shareRecordWithOtherMPUsers({
                recordId: this.recordId,
                selectedMpUsers: this.selectedMpUsers
            }).then(isEmailSent => {
                if (isEmailSent) {
                    this.showToastMessage('', 'success', 'Record shared successfully.');
                    this.closeModal();
                    this.isLoading = false;
                }
            }).catch(error => {
                this.showToastMessage('Error', 'error', 'Error Occurred while sharing the record.');
                this.closeModal();
                this.isLoading = false;
            });
        } else {
            this.showToastMessage('', 'info', 'Please select users to share the record.');
            this.isLoading = false;
        }
    }

    handleDropDownClose(e) {
        this.template.querySelector('c-multi-select-combobox-custom')?.handleClose();
    }

    showToastMessage(title, variant, message) {
        const event = new ShowToastEvent({
            title: title,
            variant: variant,
            message: message,
        });
        this.dispatchEvent(event);
    }

}