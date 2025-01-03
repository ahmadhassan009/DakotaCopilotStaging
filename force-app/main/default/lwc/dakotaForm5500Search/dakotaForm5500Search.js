import { LightningElement, api } from 'lwc';
import getCurrentRecordEin from '@salesforce/apex/Form5500SearchController.getCurrentRecordEin';
import activeCommunities from '@salesforce/label/c.active_communities';
import ApiUrl from '@salesforce/label/c.Api_url_form_5500_search';
import pdfUrl from '@salesforce/label/c.form_5500_website_pdf';
import { loadStyle } from 'lightning/platformResourceLoader';
import Form5500Search from '@salesforce/resourceUrl/Form5500Search';

const COLUMNS = [
    { label: 'Plan Name', fieldName: 'planname',sortable: true, type: 'text' ,wrapText: true },
    { label: 'Plan Year', fieldName: 'planyear',sortable: true, type: 'text',wrapText: true },
    { label: 'EIN', fieldName: 'ein',sortable: true, type: 'text',wrapText: true },
    { label: 'Received', fieldName: 'datereceived',sortable: true, type: 'date-local',typeAttributes: {day: "numeric",month: "numeric", year: "numeric"},wrapText: true },
    { label: 'Sponsor', fieldName: 'plansponsor',sortable: true, type: 'text' ,wrapText: true},
    { label: 'Participants', fieldName: 'participantsboy',sortable: true, type: 'number',wrapText: true },
    { label: 'Assets', fieldName: 'assetseoy',sortable: true, type: 'currency' ,typeAttributes:{minimumFractionDigits :'0'},wrapText: true},
    { label: 'PDF', fieldName: 'pdfUrlLink', type: 'button', sortable: true, typeAttributes: { label: { fieldName: 'pdfLink' }, name: "RegLinkCell", variant: "base", }, cellAttributes: { class: 'buttonHeight' },wrapText: true }
];


export default class dakotaForm5500Search extends LightningElement {
    @api recordId;
    showLinkPopup = true;
    recordsFound = false;
    isLoadingParent = true;
    tableData = [];
    einId='';
    isRendered= false;
    offset=0;
    accountRecord;
    accountlink;
    recordLink;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    apiUrlPara='';
    pdfLinkArray=[];
    defaultSortDirection='desc';
    sortedDirection='desc';
    sortedBy='planyear';
    serverError=false;

    connectedCallback() {
        Promise.all([
            loadStyle(this, Form5500Search)
        ]);

        this.columns = COLUMNS;
        this.getRecord();
        this.setLinks();
        this.showLinkPopup = true;
        
    }
    fetchSearchResults() {
        this.isLoadingParent = true;
        this.tableData = [];
        this.einId = this.template.querySelector('[data-id="searchAccName"]').value;
        this.offset = 0;
        this.getApiResponse();
    }
    renderedCallback() {
        if (this.recordId && !this.isRendered) {
            
        }
    }
    
    getApiResponse() {
        var requestOptions = {
            method: 'GET',
            redirect: 'follow'
        };
        fetch(this.apiUrlPara, requestOptions)
        .then(response =>
                response.json())
            .then(result => {
                var i = 0;
                if(result['hits']['hit'].length>0) {
                    this.offset=result['hits']['hit'].length;
                for (i; result['hits']['hit'].length > i; i++) {
                    var temp = result['hits']['hit'][i]['fields'];
                    temp.Id=i;
                    temp.pdfLink='Click Here';
                    temp.pdfUrlLink = pdfUrl+temp.pdfpath;
                    this.pdfLinkArray[temp.Id]=temp.pdfUrlLink;
                    temp.participantsboy=parseInt(temp.participantsboy);
                    temp.assetseoy=Number(temp.assetseoy);
                    this.tableData.push(temp);
                    this.sortData('planyear','desc');
                }
                this.recordsFound = true;
            }
            else{
                this.offset=0;
                this.recordsFound = true;
            }
                this.isLoadingParent= false;
                this.isRendered = true;
            })
            .catch(error => {
                this.offset=0;
                this.recordsFound = true;
                this.isLoadingParent= false;
                this.serverError=true;
                console.log('error', error)
            });
    }

    async getRecord(){
        await getCurrentRecordEin({
            recordId:this.recordId
        }).then(response=>{
            this.einId = response.EIN__c;
            this.accountRecordName=response.Name;
            this.apiUrlPara = ApiUrl.replace("$formEinId", this.einId);
            this.apiUrlPara =  this.apiUrlPara.replace("$formPlanname", encodeURIComponent(this.accountRecordName.replace('/', ' ')));
            this.getApiResponse();
        }).catch(error=>{
            console.log('error', error)
        }); 
    }

    setLinks() 
    {
        this.recordLink = "/"+this.communityName+"/s/account/" + this.recordId;
        this.accountlink = "/"+this.communityName + '/s/account/Account/Default';
    }

    handleRowAction(event) 
    {
        const recordId = event.detail.row.Id;
        window.open(this.pdfLinkArray[recordId], '_blank');
    }

    handleSort(event)
    {
        this.isLoadingParent = true;
        this.sortedDirection=event.detail.sortDirection;
        this.sortedBy=event.detail.fieldName;
        this.sortData(this.sortedBy,this.sortedDirection);
        this.isLoadingParent = false;
    }

    sortData(fieldname, direction) {
        let parseData = JSON.parse(JSON.stringify(this.tableData));
        // Return the value stored in the field
        let keyValue = (a) => {
            return a[fieldname];
        };
        // cheking reverse direction
        let isReverse = direction === 'asc' ? 1: -1;
        // sorting data
        parseData.sort((x, y) => {
            x = (keyValue(x) !== null) ? keyValue(x) : ''; // handling null values
            y = (keyValue(y) !== null)? keyValue(y) : '';
            if(x===''){
                return isReverse * -1;
            }
            if(y===''){
                return isReverse * 1;
            }
            // sorting values based on direction
            return isReverse * ((x > y) - (y > x));
        });
        this.tableData = parseData;
    }

    refreshTable()
    {
        this.tableData=[];
        this.isLoadingParent = true;
        this.connectedCallback();
        this.sortedDirection='desc';
        this.sortedBy='planyear';
    }
}