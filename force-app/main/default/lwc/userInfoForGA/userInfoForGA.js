import { LightningElement,wire } from 'lwc';
import uId from '@salesforce/user/Id';
import getUserAccountInfo from '@salesforce/apex/userInfoForGAController.getUserAccountInfo';

export default class UserInfoForGA extends LightningElement {
    userId=uId;
    investmentFocus='';
    userEmail='';
    userContactType='';
    userContactRole='';

    connectedCallback()
    {
        this.accountInfo();               
    }

    accountInfo()
    {
        //get user's Account's -> Investment_Focus_single__c
        getUserAccountInfo({
            userId : this.userId
        }).then(response => {
            if(response) {
                this.userEmail = response.email;
                this.investmentFocus = response.Investment_Focus_single__c;
                this.userContactType = response.Contact_Type__c;
                this.userContactRole = response.Role__c;
                window.postMessage({
                    key: "userInfoForGA",
                    invFocus: this.investmentFocus,
                    email: this.userEmail,
                    conType: this.userContactType,
                    role: this.userContactRole
                }, '*');              
    
            }
        }).catch(error => {
            console.log('error in getting Account Info from User Id', error);
        });
    }

}