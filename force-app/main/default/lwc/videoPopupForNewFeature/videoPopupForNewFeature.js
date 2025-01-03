import { LightningElement,api } from 'lwc';
import SVG_FULLSCREEN from '@salesforce/resourceUrl/full_screen_icon';

export default class VideoPopupForNewFeature extends LightningElement {
    isNewFeatureVideoAvailable = false;
    @api newFeatureVideoUrl;
    isValidURL = false;
    svgURL = `${SVG_FULLSCREEN}#fullscreen`

    /**
     * Sets video if its available. 
     */
    connectedCallback() { 
        if(this.newFeatureVideoUrl == undefined || this.newFeatureVideoUrl == null) {
            this.isNewFeatureVideoAvailable = false;
        } else {
            //validates the URL
            const isValidUrl = urlString =>{
                let inputElement = document.createElement('input');
                inputElement.type = 'url';
                inputElement.value = urlString;
                if (!inputElement.checkValidity()) {
                return false;
                } else {
                return true;
                }
            }
            
            this.isValidURL = isValidUrl(this.newFeatureVideoUrl);
            this.isNewFeatureVideoAvailable = true;
        }
    }

    /**
     * Open video in full screen.
     */
    openFullScreen(event){
        event.preventDefault();
        window.open(this.newFeatureVideoUrl);
    }
}