import { LightningElement, api} from 'lwc';
import { NavigationMixin } from "lightning/navigation";

export default class CustomListViewAllWrapper extends NavigationMixin(LightningElement) {
    @api recordId;
    @api listViewName;
    isInvestment = false;
    isManagerPresentation = false;
    isDakotaContent = false;
    isDakotaNews = false;
    isMarketplaceSearches = false;
    isFormDOffering = false;
    isFormAdvPrivateFund = false;
    isFormAdvOwner = false;
    isFormAdvScheduleD = false;
    isFormAdvCustodian = false;


    connectedCallback(){
        if(this.listViewName=='Investment__c'){
            this.isInvestment=true;
        } else if(this.listViewName=='Manager_Presentation__c'){
            this.isManagerPresentation=true;
        } else if(this.listViewName=='Dakota_Content__c'){
            this.isDakotaContent=true;
        } else if(this.listViewName=='Dakota_News__c'){
            this.isDakotaNews=true;
        } else if(this.listViewName=='Marketplace_Searches__c'){
            this.isMarketplaceSearches=true;
        } else if(this.listViewName=='Form_D_Offering__c'){
            this.isFormDOffering=true;
        } else if(this.listViewName=='Form_ADV_Private_Fund__c'){
            this.isFormAdvPrivateFund=true;
        } else if(this.listViewName=='Form_ADV_Owner__c'){
            this.isFormAdvOwner=true;
        } else if(this.listViewName=='Form_ADV_Schedule_D__c'){
            this.isFormAdvScheduleD=true;
        } else if(this.listViewName=='Schedule_D_Custodian__c'){
            this.isFormAdvCustodian=true;
        }
        
    }
  
}