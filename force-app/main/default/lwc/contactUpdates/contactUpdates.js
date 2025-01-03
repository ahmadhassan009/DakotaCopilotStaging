import { LightningElement } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import jobChanges from '@salesforce/resourceUrl/jobChanges';
import roleChanges from '@salesforce/resourceUrl/roleChanges';

export default class ContactUpdates extends LightningElement {
    handleJobTitle()
    {
        Promise.all([
            loadStyle(this, jobChanges)
        ]);
    }
    handleRoleTitle()
    {
        Promise.all([
            loadStyle(this, roleChanges)
        ]);
    }
}