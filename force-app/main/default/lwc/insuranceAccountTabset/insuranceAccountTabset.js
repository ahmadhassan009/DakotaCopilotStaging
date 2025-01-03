import { LightningElement , api} from 'lwc';
import getInsuranceAdditionalInfoId from '@salesforce/apex/InsuranceAdditionalSectionController.getInsuranceAdditionalInfoId';
import { loadStyle } from 'lightning/platformResourceLoader';
import InsuranceAccountDetailPage from '@salesforce/resourceUrl/InsuranceAccountDetailPage';
export default class InsuranceAccountTabset extends LightningElement {
    @api recordId;
    isLoading = false;
    insuranceRecordExists = false;

    inputVariables  = [];
    connectedCallback() {
        this.isLoading = true;
        this.inputVariables = [
            {
                name: 'recordId',
                type: 'String',
                value: this.recordId // put account Id here
            },
        ];
        try{
            Promise.all([
                loadStyle(this, InsuranceAccountDetailPage)
            ]).then(() =>{
                getInsuranceAdditionalInfoId({
                    accountId : this.recordId
                }).then(returnedResult => {
                    if(returnedResult != null ) {
                        this.isLoading = false;
                        this.insuranceRecordExists = true;
                    }
                    else {
                        this.isLoading = false;
                        this.insuranceRecordExists = false;
                    }
                }).catch(error => {
                    this.isLoading = false;
                        this.insuranceRecordExists = false;
                });
            }).catch((error)=>{
                console.log(error);
            });

            
        }
        catch(error) {
            console.log(error);
        }
    }
}