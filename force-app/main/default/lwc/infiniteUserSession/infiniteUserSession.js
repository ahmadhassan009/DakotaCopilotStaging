import { LightningElement, track } from 'lwc';
import isTrailUser from '@salesforce/apex/InfiniteSessionController.isTrailUser';

export default class InfiniteUserSession extends LightningElement {
    @track progress = 600000; //After every 10 mins
    connectedCallback() {

        setInterval(() => {  
            isTrailUser().then(response => {
                console.log('updated count  value is ', this.progress/1000*60);
                if(!response) {
                    //clearInterval(myInterval); commented as this needs to be working for all users
                } 
            }).catch(error => {
                console.log('Error in retrieving count ', error);
            })
            
            this.progress = this.progress + 600000;
        }, this.progress);  

    }
}