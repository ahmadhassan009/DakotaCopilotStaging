import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import isTrialUser from '@salesforce/apex/ExportRecordsMainController.isTrialUser';
import exportButtonStyling from '@salesforce/label/c.exportButtonStyling';

export default class ListViewExportButton extends NavigationMixin(LightningElement) {
    isTrialUser = true;
    @api objectName;
    buttonName = '';
    buttonStyling = exportButtonStyling

    connectedCallback() {
        this.buttonName = 'Export '+this.objectName+'s';
        isTrialUser({}).then(isTrial => {
            setTimeout(() => {
                this.isTrialUser = isTrial;
            }, 1000);
        }).catch(error => {});
    }

    @api
    displayButton() {
    const exportButton = this.template.querySelector('.exportButtonCustom');
        if(exportButton) {
            this.template.querySelector('.exportButtonCustom').style.removeProperty('display');
        }
    }

    goToExportPage() {
        var url = (this.objectName == 'Account' ? '/accounts-export' : '/contacts-export');
        this[NavigationMixin.Navigate]({
        type: 'standard__webPage',
            attributes: {
                url: url
            }
        });
    }
}