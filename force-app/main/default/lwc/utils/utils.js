import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import bounceEmailLabelCustomLabel from '@salesforce/label/c.Member_Comment_Bounced_Email_Label';
import bounceEmailTextCustomLabel from '@salesforce/label/c.Member_Comment_Bounced_Email_Text';
import bounceEmailCustomLabel from '@salesforce/label/c.Member_Comment_Bounced_Email';

export const bounceEmailLabel = bounceEmailLabelCustomLabel;
export const bounceEmailText = bounceEmailTextCustomLabel;
export const bounceEmail = bounceEmailCustomLabel;
/**
 * @description method to show toast events
 */
 export function showNotification(title, message, variant) {
    const evt = new ShowToastEvent({
        title: title,
        message: message,
        variant: variant,
    });
    this.dispatchEvent(evt);
}

export function setNotificationFlags(result) {
    if(result) {
        this.hasCreatePermission = true;
        this.hasPermission = true;
        this.doesNotHasPermission = false;
    } else {
        this.hasCreatePermission = false;
        this.hasPermission = false;
        this.doesNotHasPermission = true;
        this.offset = 0;
        this.showNotification('Error', this.permissionErrMsg, 'error');
    }
}