import { LightningElement, wire, api, track } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import form_5500_website_pdf from '@salesforce/label/c.form_5500_website_pdf';
import Api_url_form_5500_search_with_plan_year from '@salesforce/label/c.Api_url_form_5500_search_with_plan_year';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const FIELDS = ['Account.Plan_Year__c', 'Account.EIN__c', 'Account.Name', 'Account.ACK_ID__c'];
export default class Form5500SearchPDF extends LightningElement {
    @api recordId;
    @track divStyle = '';
    toastMsg;
    toastVarient;

    connectedCallback() {
        this.setDivHeight(); 
    }

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredAccount({ error, data }) {
        if (data) {
            this.getApiResponse(data.fields);
            
        } else if (error) {
           console.log('Unable to fetch Account Details', error);
        }
    }
    getApiResponse(fields) {
        const requestOptions = {
            method: 'GET',
            redirect: 'follow'
        };
        let planname = fields.Name.value;
        planname = encodeURIComponent(planname.replace('/', ' '));
        const enid = fields.EIN__c.value;
        const planYear = fields.Plan_Year__c.value;
        let url = Api_url_form_5500_search_with_plan_year;
        const ackId = fields.ACK_ID__c.value;
        url = url.replace("$formEinId", enid);
        url= url.replace("$formPlanname", planname.replace('/', ' '));
        url= url.replace("$formPlanyear", planYear);
        url= url.replace("$ackId", ackId);

        fetch(url, requestOptions)
        .then(async response =>{
                let result = await response.json();
                if(result && result['hits'] && result['hits']['hit'].length>0) {
                    const temp = result['hits']['hit'][0]['fields'];
                    
                    const downloadingStartedMsg = 'Downloading has started!';
                    if (window.location.href.indexOf("vf.force") > -1) { // if lwc is rendered in salesforce (VF page)
                        alert(downloadingStartedMsg);
                    } else {// if lwc is rendered in Experience page LWC
                        this.toastMsg = downloadingStartedMsg;
                        this.toastVarient = 'success';
                        this.showToast();
                    }
                    const a = document.createElement("a");
                    a.style.display = "none";
                    document.body.appendChild(a);
                    a.href = form_5500_website_pdf+temp.pdfpath;
                    // Use download attribute to set set desired file name

                    // Trigger the download by simulating click
                    a.click();
                    document.body.removeChild(a);
                    this.closeWindow();

                } else {
                    const pdfNotFound = 'PDF Document Not Found!';
                    if (window.location.href.indexOf("c.visualforce") > -1) { // if lwc is rendered in salesforce (VF page)
                        alert(pdfNotFound);
                    } else { // if lwc is rendered in Experience page LWC
                        this.toastMsg = pdfNotFound;
                        this.toastVarient = 'info';
                        this.showToast();
                    }
                    this.closeWindow();
                }
            })
            .catch(error => {
                console.log('error', error)
            });
    }

    setDivHeight() {
        const windowHeight = window.innerHeight;
        this.divStyle = `height: ${windowHeight}px;`;
    }
    showToast() {
        const event = new ShowToastEvent({
            title: 'Form 5500 PDF',
            message: this.toastMsg,
            variant: this.toastVarient
        });
        this.dispatchEvent(event);
    }
    closeWindow() {
        setTimeout(function() {
            window.close();
         }, 12000);
    }
}