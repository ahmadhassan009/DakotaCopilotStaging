import { LightningElement, wire, api, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import SVG_FULLSCREEN from '@salesforce/resourceUrl/full_screen';
const DAKOTACONTENT_PRESENTATION_RECORDING_FIELD = 'Dakota_Content__c.Presentation_Recording_url__c';
const dakotaContentFields = [
	DAKOTACONTENT_PRESENTATION_RECORDING_FIELD
];

export default class DakotaContentVideo extends LightningElement {
    @api recordId;
    isValidURL = false;
    dakotaContentVideoURL;
    isDakotaContentVideoAvailable;
    svgURL = `${SVG_FULLSCREEN}#fullscreen`

    @wire(getRecord, { recordId: '$recordId', fields: dakotaContentFields })
    loadDakotaContentRecord({ error, data }) {
        if (error) {
            console.log("Error:", error);
        }
        else if (data) {
            const videoURL = getFieldValue(data, DAKOTACONTENT_PRESENTATION_RECORDING_FIELD);
            if (videoURL != null && videoURL != '' && videoURL != undefined) {
                this.dakotaContentVideoURL = videoURL;

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
                this.isDakotaContentVideoAvailable = true;
            }
            else {
                this.isDakotaContentVideoAvailable = false;
            }
        }
    }

    openFullScreen() {
        window.open(this.dakotaContentVideoURL);
    }
}