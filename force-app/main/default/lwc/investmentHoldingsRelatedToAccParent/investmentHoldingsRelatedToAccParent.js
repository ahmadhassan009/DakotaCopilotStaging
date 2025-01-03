import { LightningElement, api} from 'lwc';
import getRecordTypeCounts from '@salesforce/apex/InvestmentHoldingsController.getRecordTypeCounts';
import getRecordsTypeIds from '@salesforce/apex/InvestmentHoldingsController.getRecordsTypeIds';
import investmentURL from '@salesforce/label/c.investment_image_url';

export default class InvestmentHoldingsRelatedToAccParent extends LightningElement
{
    @api recordId;
    recordTypeIdMap;
    recordsExists=false;
    collapsedOne = false;
    imageURL = investmentURL;
    imageColor = 'contact-icon iconBackgroundColorInvestment'
    connectedCallback()
    {
        this.getRecordsTypeIds();
        getRecordTypeCounts({
            recordId : this.recordId
        }).then(response => {   

            let values = Object.values(response);
            let keys = Object.keys(response);
            for (let i = 0; i < values.length; i++) {
                if( keys[i]=='Alternative_Holdings' && values[i]>0 )   
                {
                    this.recordsExists = true;
                    break;
                }  
                else if( keys[i]=='Equity_Holdings' && values[i]>0 )   
                {
                    this.recordsExists = true;
                    break;
                } 
                else if( keys[i]=='Fixed_Income_Holdings' && values[i]>0 )   
                {
                    this.recordsExists = true;
                    break;
                } 
                else if( keys[i]=='Preferred_Stock_Holdings' && values[i]>0 )   
                {
                    this.recordsExists = true;
                    break;
                } 
                
            }    
        }).catch(error => {
            this.isLoading = false;
            console.log('Cannot fetch record type counts');
        });
    }

    async getRecordsTypeIds(){
        this.recordTypeIdMap=new Map();
        await getRecordsTypeIds().then(recordTypeIdMap => {   
            for(var key in recordTypeIdMap){
                this.recordTypeIdMap.set(key, recordTypeIdMap[key]);
            }
        }).catch(error => {
            this.isLoading = false;
            console.log('Cannot fetch record type ids');
        });

    }
}