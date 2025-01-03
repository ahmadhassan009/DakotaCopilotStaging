import { LightningElement,api } from 'lwc';

export default class CustomToastMessage extends LightningElement {
    @api toastmessage;
    @api title;
    @api alternativeText;
    @api iconName;
    @api toastMsgClasses;
    @api toastMsgIconClasses;
}