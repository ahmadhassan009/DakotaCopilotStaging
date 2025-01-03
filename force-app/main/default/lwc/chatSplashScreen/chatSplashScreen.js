import { LightningElement } from 'lwc';
import botSplash from '@salesforce/resourceUrl/splashBot';
import marketplace from '@salesforce/resourceUrl/marketplaceLogo';


export default class ChatSplashScreen extends LightningElement {
    botSplashImg = botSplash
    marketplaceImg = marketplace
    buttonClicked = false
    
    handleGetStartedButton(){
        this.buttonClicked = true
    }
}