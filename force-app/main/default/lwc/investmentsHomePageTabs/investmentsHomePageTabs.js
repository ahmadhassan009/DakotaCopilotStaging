import { LightningElement, api } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import newInvestments from '@salesforce/resourceUrl/newInvestments';
import newInvestments13f from '@salesforce/resourceUrl/newInvestmetns13f';
import newAccounts from '@salesforce/resourceUrl/newAccounts';
import newContacts from '@salesforce/resourceUrl/newContacts';
import formDOffering from '@salesforce/resourceUrl/formDOffering'; 
import investmentURL from '@salesforce/label/c.investment_image_url';

export default class InvestmentsHomePageTabs extends LightningElement {
    @api isMPCommunity;
    imageURL = investmentURL;
    imageURL1 = investmentURL;
    imageColor = 'contact-icon iconBackgroundColorInvestment';
    imageColor1 = 'contact-icon iconBackgroundColorInvestment';
    visiblity1 = 'visibility: unset;';
    visiblity2 = 'visibility: hidden;';
    display1 = 'display: block';
    display2 = 'display: none';
    handleInvestmentsTitlePI()
    {
        this.switchIconsAndColors('visibility: unset;', 'visibility: hidden;', 'display: block', 'display: none', '','',newInvestments);
    }
    handleInvestmentsTitle13()
    {
        this.switchIconsAndColors('visibility: unset;', 'visibility: hidden;', 'display: block', 'display: none', '','',newInvestments13f);
    }
    handleFormOffering()
    {
        this.switchIconsAndColors('visibility: hidden;', 'visibility: unset;', 'display: none', 'display: block', '/img/icon/t4v35/custom/custom87_120.png','contact-icon iconBackgroundColorFormd',formDOffering);
    }
    handleAccountsTitle()
    {
        this.switchIconsAndColors('visibility: hidden;', 'visibility: unset;', 'display: none', 'display: block', '/img/icon/t4v35/standard/account_120.png','contact-icon iconBackgroundColorAccount',newAccounts);
    }
     handleContactsTitle()
    {
        this.switchIconsAndColors('visibility: hidden;', 'visibility: unset;', 'display: none', 'display: block', '/img/icon/t4v35/standard/contact_120.png','contact-icon iconBackgroundColorContact',newContacts);
    }

    switchIconsAndColors(visiblity1, visiblity2, display1, display2, imageURL, imageColor,resource){
        this.visiblity1 = visiblity1;
        this.visiblity2 = visiblity2;
        this.display1 = display1;
        this.display2 = display2;
        this.imageURL = imageURL != '' ? imageURL : this.imageURL;
        this.imageColor = imageColor != '' ? imageColor : this.imageColor;
        Promise.all([
            loadStyle(this, resource)
        ]);
    }
}