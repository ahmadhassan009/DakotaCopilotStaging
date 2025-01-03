import { LightningElement,api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import getRecordsCount from '@salesforce/apex/EducationRelatedToUniversityController.getRecordsCount';
import getEducationRecords from '@salesforce/apex/EducationRelatedToUniversityController.getEducationRecords';
import YEAR_FIELD from '@salesforce/schema/Education__c.Year_Graduated__c';
import DEGREE_DISTINCTION from '@salesforce/schema/Education__c.Degree_Distinction__c';
import activeCommunities from '@salesforce/label/c.active_communities';

const COLUMNS = [

    { label: 'Contact Name', sortable: true, fieldName: "contactId", type: 'url', typeAttributes: {label: { fieldName: 'contactName' }, tooltip:  { fieldName: 'contactName' }, target: '_self'}},
    { label: 'Company', sortable: true, fieldName: "conAccountId", type: 'url', typeAttributes: {label: { fieldName: 'conAccountName' }, tooltip:  { fieldName: 'conAccountName' }, target: '_self'}},
    { label: 'Type', sortable: true, fieldName: "accountType", type: 'text'},
    { label: 'Title', sortable: true, fieldName: "conTitle", type: 'text'},
    { label: 'Metro Area', sortable: true, fieldName: "conMetroAreaId", type: 'url', typeAttributes: {label: { fieldName: 'conMetroAreaName' }, tooltip:  { fieldName: 'conMetroAreaName' }, target: '_self'}},
    { label: 'Email', sortable: true, fieldName: "conEmail", type: 'email'},
    { label: 'Degree Distinction', sortable: true, fieldName: DEGREE_DISTINCTION.fieldApiName, type: 'text'},
    { label: 'Year Graduated', sortable: true, fieldName: YEAR_FIELD.fieldApiName, type: 'text'}
]

export default class EducationRelatedToUniversity extends NavigationMixin(LightningElement) {
    @api recordId;
    columns = COLUMNS;
    isLoading = true;
    totalRecords = '0';
    nullOrder = 'FIRST';
    sortedBy = YEAR_FIELD.fieldApiName;
    sortedDirection = 'desc';
    defaultSortDirection = 'desc';
    recordsExist = false;
    recordName;
    data;
    isCommunity = false;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    //For Community User
    checkIsCommunityInstance()
    {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
    }

    /**
     * Connected call hook
     * Gets executed when component is loaded
     * Fetching record count and first 10 records of Education
    */ 
    connectedCallback() {
        this.isLoading = true;


        //To fetch number of Education records
        getRecordsCount({
            recordId: this.recordId
        })
        .then((totalCount) => {
            if(totalCount <= 0) {
                this.recordsExist = false;
            }
            else {
                this.recordsExist = true;
            }
            if(totalCount > 10){
                this.totalRecords = '10+';
            } 
            else {
                this.totalRecords = totalCount;
            }
            if(totalCount > 0) {
                //To fetch Education records
                this.getEducationRecords(this.recordId, this.sortedBy, this.sortedDirection);
                this.sortedDirection = 'ASC';
                this.sortedBy = YEAR_FIELD.fieldApiName;
            }            
        })
        .catch((error) => {
            console.log('Error for count : ', error);
            this.isLoading = false;
        });
    }

    /**
     * To get Education records linked to the account
     * @param recordId current account record Id
     * @param sortedBy field to be sorted on (Default sorted on Year Graduated)
     * @param sortedDirection sorting direction
    */ 
   getEducationRecords(recordId, sortedBy, sortedDirection) {
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
                    if(returnedData[i].Contact__c) {
                        returnedData[i].contactId = "/" + this.communityName + '/s/contact/' + returnedData[i].Contact__c;
                        returnedData[i].contactName = returnedData[i].Contact__r.Name;
                    }
                    if(returnedData[i].Contact__r.AccountId) {
                        returnedData[i].conAccountId = "/" + this.communityName + '/s/account/' + returnedData[i].Contact__r.AccountId;
                        returnedData[i].conAccountName = returnedData[i].Contact__r.Account.Name;
                    }
                    if(returnedData[i].Contact__r.Account_Type__c) {
                        returnedData[i].accountType = returnedData[i].Contact__r.Account_Type__c;
                    }
                    if(returnedData[i].Contact__r.Title) {
                        returnedData[i].conTitle = returnedData[i].Contact__r.Title;
                    }
                    if(returnedData[i].Contact__r.Metro_Area__c) {
                        returnedData[i].conMetroAreaId = "/" + this.communityName + '/s/metro-area/' + returnedData[i].Contact__r.Metro_Area__c;
                        returnedData[i].conMetroAreaName = returnedData[i].Contact__r.Metro_Area__r.Name;
                    }
                    if(returnedData[i].Contact__r.Email) {
                        returnedData[i].conEmail = returnedData[i].Contact__r.Email;
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
     * For sorting the table based on column and sort direction
     * @param {*} event 
    */ 
    updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;

        let tempSortBy = this.sortedBy;
        if(this.sortedBy === 'contactId') {
            tempSortBy = 'Contact__r.Name';
        } else if(this.sortedBy === 'conAccountId') {
            tempSortBy = 'Contact__r.Account.Name';
        } else if(this.sortedBy == 'accountType') {
            tempSortBy = 'Contact__r.Account_Type__c';
        } else if(this.sortedBy === 'conTitle') {
            tempSortBy = 'Contact__r.Title';
        } else if(this.sortedBy === 'conMetroAreaId') {
            tempSortBy = 'Contact__r.Metro_Area__r.Name';
        } else if(this.sortedBy === 'conEmail') {
            tempSortBy = 'Contact__r.Email';
        } else if(this.sortedBy === 'Year_Graduated__c') {
            tempSortBy = YEAR_FIELD.fieldApiName;
        } else if (this.sortedBy === 'Degree_Distinction__c') {
            tempSortBy = DEGREE_DISTINCTION.fieldApiName;
        }
        this.getEducationRecords(this.recordId, tempSortBy, this.sortedDirection);
    }

    /**
    * For redirecting to Standard View All page
    */
    handleShowFullRelatedList() 
    {
        //CUSTOM VIEW ALL
        this.checkIsCommunityInstance(); 
        var url = '/Alumni?recordId=' + this.recordId;
        if(this.isCommunity)
        {
            this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
                attributes: {
                    url: url
                }
            });
        }
        else
        {
            let cmpDef={
                componentDef:"c:educationContactsRelatedToAccountViewAll",
                attributes: {
                    recordId:this.recordId
                },
            };
            let encdedDef=btoa(JSON.stringify(cmpDef));
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                url:"/one/one.app#"+encdedDef
                }
            });
        }
    }
           
}