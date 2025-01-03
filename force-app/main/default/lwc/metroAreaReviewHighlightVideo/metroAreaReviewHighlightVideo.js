import { LightningElement, wire, api, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import SVG_FULLSCREEN from '@salesforce/resourceUrl/full_screen';
const METROAREA_REVIEW_HIGHLIGHT_FIELD = 'Metro_Area__c.Metro_Area_Review_Highlight__c';
const metroAreaFields = [
	METROAREA_REVIEW_HIGHLIGHT_FIELD
];

export default class MetroAreaReviewHighlightVideo extends LightningElement {
    @api recordId;
    metroAreaVideoURL;
    isMetroAreaVideoAvailable;
    isValidURL = false;
    svgURL = `${SVG_FULLSCREEN}#fullscreen`

    @wire(getRecord, { recordId: '$recordId', fields: metroAreaFields })
    loadMetroArea({ error, data }) {
        if (error) {

            //event fired to show if error found
            const selectedEvent = new CustomEvent("progressvaluechange", {
                detail: false
              });
            // Dispatches the event.
            this.dispatchEvent(selectedEvent);
            
        }
        else if (data) {
            const videoURL = getFieldValue(data, METROAREA_REVIEW_HIGHLIGHT_FIELD);
            if (videoURL != null && videoURL != '' && videoURL != undefined) {
                this.metroAreaVideoURL = videoURL;

                const isValidUrl = urlString =>{
                    var inputElement = document.createElement('input');
                    inputElement.type = 'url';
                    inputElement.value = urlString;
                    if (!inputElement.checkValidity()) {
                      return false;
                    } else {
                      return true;
                    }
                }
                
                this.isValidURL = isValidUrl(videoURL);
                this.isMetroAreaVideoAvailable = true;
            }
            else {
                this.isMetroAreaVideoAvailable = false;
            }
            
            //event fired to show if data found
            const selectedEvent = new CustomEvent("progressvaluechange", {
                detail: true
              });
            // Dispatches the event.
            this.dispatchEvent(selectedEvent);
        }
    }
    
    openFullScreen() {
        window.open(this.metroAreaVideoURL);
    }
}