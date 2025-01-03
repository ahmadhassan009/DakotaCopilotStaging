import { LightningElement , api} from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import DEGREE_FIELD from '@salesforce/schema/Education__c.Degree_Distinction__c';
import YEAR_FIELD from '@salesforce/schema/Education__c.Year_Graduated__c';
import activeCommunities from '@salesforce/label/c.active_communities';
import getEducationRecords from '@salesforce/apex/educationInContactsController.getEducationRecords';
import getRecordsCount from '@salesforce/apex/educationInContactsController.getRecordsCount';
const COLUMNS = [
    { label: 'College', sortable: true, fieldName: 'accountId', type: 'url', typeAttributes: { label: { fieldName: 'accountName' }, target: '_self', tooltip: { fieldName: 'accountName' }}},
    { label: 'Metro Area', sortable: true, fieldName: 'accMetroAreaId', type: 'url', typeAttributes: { label: { fieldName: 'accMetroAreaName' }, target: '_self', tooltip: { fieldName: 'accMetroAreaName' }}},
    { label: 'Degree Distinction', sortable: true, fieldName: DEGREE_FIELD.fieldApiName, type: 'text'},
    { label: 'Year Graduated', sortable: true, fieldName: YEAR_FIELD.fieldApiName, type: 'text'}
]

export default class educationInContacts extends NavigationMixin(LightningElement)  {
    @api recordId;
    recordsExists = false;
    columns = COLUMNS;
    data;
    isLoading=false;
    totalRecords = '0';
    defaultSortDirection = 'desc';
    sortedDirection = 'desc';
    sortedBy = YEAR_FIELD.fieldApiName;
    nameSortDir = this.defaultSortDirection;
    nullOrder = 'LAST';
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback()
    {
        this.isLoading = true;
        getRecordsCount({
            recordId : this.recordId
        }).then(returnedCount => {
            this.isLoading = false;
            if(returnedCount == 0) {
                this.recordsExists = false;
            }
            else {
                this.recordsExists = true;
            }
            if(returnedCount > 10){
                this.totalRecords = '10+';
            } 
            else {
                this.totalRecords = returnedCount;
            }
            if(returnedCount>0)
            {   
                this.getRecords(this.recordId, this.sortedBy, this.sortedDirection);
                this.sortedDirection = 'desc';
                this.sortedBy = YEAR_FIELD.fieldApiName;
            }
        }).catch(error => {
            this.isLoading = false;
        });
    }

    /**
     * To get records of Dakota Content
     */
    getRecords(recordId, sortedBy, sortedDirection)
    {   
        this.isLoading = true;
        if (sortedDirection == 'desc'){
            this.nullOrder = 'LAST';
        }
        else {
            this.nullOrder = 'FIRST';
        }
        getEducationRecords({
            recordId : recordId,
            sortedBy : sortedBy,
            sortOrder : sortedDirection,
            nullOrder: this.nullOrder
        }).then(returnedData => {
            this.isLoading = false;
            if (returnedData) {
                for(var i=0; i<returnedData.length; i++)
                {
                    if(returnedData[i].University_Alumni__c)
                    {
                        returnedData[i].accountId = "/"+this.communityName+'/s/university-alumni/'+returnedData[i].University_Alumni__c;
                        returnedData[i].accountName = returnedData[i].University_Alumni__r.Name;
                    }
                    if(returnedData[i].University_Alumni__r && returnedData[i].University_Alumni__r.Metro_Area__c)
                    {
                        returnedData[i].accMetroAreaId = "/"+this.communityName+'/s/metro-area/'+returnedData[i].University_Alumni__r.Metro_Area__c;
                        returnedData[i].accMetroAreaName = returnedData[i].University_Alumni__r.Metro_Area__r.Name;
                    }
                }
                this.data = returnedData;
                this.isLoading = false;   
            }
            else
            {
                this.data = null;
            }
        }).catch(error => {
            this.isLoading = false;
        });
    }

    /**
     * For sorting the table
     * @param {*} event 
     */
     updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        
        let tempSortBy = this.sortedBy;
        if(this.sortedBy === 'accountId') {
            tempSortBy = 'University_Alumni__r.Name';
        }else if(this.sortedBy === 'accMetroAreaId') {
            tempSortBy = 'University_Alumni__r.Metro_Area__r.Name';
        }else if(this.sortedBy === 'Degree_Distinction__c') {
            tempSortBy = DEGREE_FIELD.fieldApiName;
        }else if(this.sortedBy === 'Year_Graduated__c') {
            tempSortBy = YEAR_FIELD.fieldApiName;
        }

        this.sortedDirection = this.nameSortDir === 'asc'? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.getRecords(this.recordId, tempSortBy, this.sortedDirection);
    }

    handleShowFullRelatedList() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordRelationshipPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Contact',
                relationshipApiName: 'Education__r',
                actionName: 'view'
            }
        });
    }
}