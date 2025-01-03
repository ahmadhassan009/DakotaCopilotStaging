import { LightningElement,api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class MassFollowList extends NavigationMixin(LightningElement) {
    @api recordIdList;
    @api objectName;
    @api recordExist;
    @api showHelpText;
    @api showHelpTextposition;


    @api showFollowToastMessage() {
        const event = new ShowToastEvent({
            variant: 'error',
            message: 'Select at least one record and try again'
        });
        this.dispatchEvent(event);
    }
    
    @api redirectToListView()
    {
        sessionStorage.setItem('MassFollowListSelectedItems', this.recordIdList); 
        var url = '/mass-follow-list-view-all?objectName=' + this.objectName + '&recordExist=' + this.recordExist;
        this[NavigationMixin.Navigate]({
        type: 'standard__webPage',
            attributes: {
                url: url
            }
        });
    }

    @api showHelpTextFunction() {
        const myElement = this.template.querySelector('[data-id="showHelpTextId"]');
        if (myElement) {
            myElement.style.left = this.showHelpTextposition+'px';
        }
    }
}