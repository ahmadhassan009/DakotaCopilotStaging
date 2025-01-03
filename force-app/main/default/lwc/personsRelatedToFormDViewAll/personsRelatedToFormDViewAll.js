import { LightningElement, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import { loadStyle } from 'lightning/platformResourceLoader';
import PersonsRelatedToFormDViewAllCSS from '@salesforce/resourceUrl/PersonsRelatedToFormDViewAllCSS';
import activeCommunities from '@salesforce/label/c.active_communities';
import getPersonsRelatedToFormDCount from '@salesforce/apex/PersonsRelatedToFormDController.getPersonsRelatedToFormDCount';
import getPersonsRelatedToFormDRecords from '@salesforce/apex/PersonsRelatedToFormDController.getPersonsRelatedToFormDRecords';
import getFormDName from '@salesforce/apex/PersonsRelatedToFormDController.getFormDName';
import Related_Person_Name from '@salesforce/schema/SEC_API_Related_Person__c.Related_Person_Name__c';
import Address from '@salesforce/schema/SEC_API_Related_Person__c.Full_Address__c';
import Relationship from '@salesforce/schema/SEC_API_Related_Person__c.Relationship__c';
import Clarification_of_Response_Related_Person from '@salesforce/schema/SEC_API_Related_Person__c.Clarification_of_Response_Related_Person__c';
import Recipient_Name from '@salesforce/schema/SEC_API_Related_Person__c.Recipient_Name__c';
import Recipient_CRD_Number from '@salesforce/schema/SEC_API_Related_Person__c.Recipient_CRD_Number__c';
import Associated_Broker_Dealer_Name from '@salesforce/schema/SEC_API_Related_Person__c.Associated_Broker_Dealer_Name__c';
import Associated_Broker_Dealer_CRD_Number from '@salesforce/schema/SEC_API_Related_Person__c.Associated_Broker_Dealer_CRD_Number__c';
import States_of_Solicitation from '@salesforce/schema/SEC_API_Related_Person__c.States_of_Solicitation__c';
import Foreign_Non_US from '@salesforce/schema/SEC_API_Related_Person__c.Foreign_Non_US__c';

const COLUMNS = [
    {
        label: "Related Person Name",
        sortable: true,
        fieldName: "recordLink",
        type: "url",
        typeAttributes: {
            label: {
                fieldName: Related_Person_Name.fieldApiName
            },
            target: '_self',
            tooltip: { 
                fieldName: Related_Person_Name.fieldApiName
            }
        }
    }, 
    {
        label: "Related Person Address",
        fieldName: Address.fieldApiName,
        type: "text"
    },
    {
        label: "Relationship",
        sortable: true,
        fieldName: Relationship.fieldApiName,
        type: "text"
    },
    {
        label: "Clarification of Response Related Person",
        fieldName: Clarification_of_Response_Related_Person.fieldApiName,
        type: "text"
    }    
];
const Recipients_COLUMNS = [
    {
        label: "Recipient Name",
        sortable: true,
        fieldName: "recordLink",
        type: "url",
        typeAttributes: {
            label: {
                fieldName: Recipient_Name.fieldApiName
            },
            target: '_self',
            tooltip: { 
                fieldName: Recipient_Name.fieldApiName
            }
        }
    }, 
    {
        label: "Recipient CRD Number",
        sortable: true,
        fieldName: Recipient_CRD_Number.fieldApiName,
        type: "text"
    },
    {
        label: "Associated Broker Dealer Name",
        sortable: true,
        fieldName: Associated_Broker_Dealer_Name.fieldApiName,
        type: "text"
    },
    {
        label: "Associated Broker Dealer CRD Number",
        sortable: true,
        fieldName: Associated_Broker_Dealer_CRD_Number.fieldApiName,
        type: "text"
    },
    {
        label: "Recipient Address",
        fieldName: Address.fieldApiName,
        type: "text"
    },
    {
        label: "States of Solicitation",
        fieldName: States_of_Solicitation.fieldApiName,
        type: "text"
    },
    {
        label: "Foreign/Non-US",
        sortable: true,
        fieldName: Foreign_Non_US.fieldApiName,
        type: 'checkBox'
    }    
];


export default class PersonsRelatedToFormDViewAll extends NavigationMixin(LightningElement) {
    @api recordId;
    @api isRecipient;
    offset = 0;
    limit = 50;
    columns = COLUMNS;
    formDNameLink;
    recordName;
    totalCount;
    dataSorting = false;
    fromLoadMore = false;
    infiniteLoading = false;
    isLoading = true;
    plusSign;
    totalRecords = '0';
    nullOrder = 'LAST';
    isCommunity = false;
    tempSortBy = '';
    defaultSortDirection = 'asc';
    sortedBy='recordLink';
    nameSortDir = this.defaultSortDirection;
    sortedDirection = 'asc';
    data;
    displayTitle;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback() {
        Promise.all([
            loadStyle(this, PersonsRelatedToFormDViewAllCSS)
        ]);
        this.isRecipient = this.isRecipient=='true' ? true : false;
        this.setRecordsInInitialState();
    }

    setRecordsInInitialState() {
        this.isLoading = true;

        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
       
        if(this.isRecipient==true) {
            this.columns = Recipients_COLUMNS;
            this.displayTitle='Recipients';
        } else {
            this.columns = COLUMNS;            
            this.displayTitle='Related Persons';
        }

        getFormDName({
            recordId: this.recordId
        }).then(FormD => {
            if (FormD != null) {
                this.recordName = FormD.Name;
                this.setLinks();
            }
        });

        
        getPersonsRelatedToFormDCount({
            recordId: this.recordId,
            isRecipient: this.isRecipient
        }).then(count => {
            if (count)
            {
                this.totalCount = count;
                this.setFieldSorting();
                this.getPersonsRelatedToFormDRecords(this.tempSortBy, this.sortedDirection, this.limit, this.offset);
            }
        }).catch(error => {
            console.log("Error in fetching total count of Related Person records : ", error);
        });
        
    }

    setFieldSorting() {
        this.tempSortBy = this.sortedBy;
        if(this.sortedBy == 'recordLink') {
            if(this.isRecipient==true) {
                this.tempSortBy = Recipient_Name.fieldApiName;
            } else{
                this.tempSortBy = Related_Person_Name.fieldApiName;
            }
        }
    }

    getPersonsRelatedToFormDRecords(sortedBy, sortedDirection, limit, offset) {
        if (sortedDirection == 'desc') {
            this.nullOrder = 'LAST';
        } else {
            this.nullOrder = 'FIRST';
        }
        getPersonsRelatedToFormDRecords({
            recordId: this.recordId,
            isRecipient: this.isRecipient,
            sortedBy: sortedBy,
            sortOrder: sortedDirection,
            recordLimit: limit,
            offset: offset,
            nullOrder: this.nullOrder
        })
            .then((returnRecords) => {
                if (returnRecords) {
                    let len = returnRecords.length;
                    let recordList = [];
                    for (let i = 0; i < len; i++) {
                        let returnedData = Object.assign({}, returnRecords[i]); //cloning object
                        returnedData.recordLink = "/" + this.communityName + '/s/sec-api-related-person/' + returnedData.Id;                       
                        recordList.push(returnedData);
                    }

                    if (this.fromLoadMore) {
                        if (this.data)
                            this.data = this.data.concat(recordList);
                        if ((this.offset + this.limit) >= this.totalCount || (this.offset) == 0) {
                            this.offset = this.totalCount;
                            this.totalRecords = this.offset;
                        } else {
                            this.offset = parseInt(this.offset) + parseInt(this.limit);
                            this.totalRecords = this.offset + '+';
                        }

                        if (this.tableElement) {
                            this.tableElement.isLoading = false;
                        }
                        this.fromLoadMore = false;
                        this.infiniteLoading = false;
                    } else {
                        this.data = recordList;
                    }

                    this.offset = this.data.length;
                    if ((this.data.length) >= this.totalCount) {
                        this.plusSign = '';
                    } else {
                        this.plusSign = '+';
                    }
                } else {
                    this.data = [];
                }
                this.isLoading = false;
                if (this.dataSorting) {
                    this.dataSorting = false;
                }
            })
            .catch((error) => {
                console.log('Error in fetching Related Person record : ', error);
                this.isLoading = false;
                this.infiniteLoading = false;
            });
    }

    /**
     * For sorting the table based on column and sort direction
     * @param {*} event 
     */
    updateColumnSorting(event) {
        this.isLoading = true;
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.dataSorting = true;
        this.data = [];

        this.setFieldSorting();

        this.sortedDirection = this.nameSortDir === 'asc' ? 'desc' : 'asc';
        this.nameSortDir = this.sortedDirection;
        this.getPersonsRelatedToFormDRecords(this.tempSortBy, this.sortedDirection, this.offset, 0);
    }

    /**
     * For loading more records on scroll down
     * @param {*} event 
     */
    loadMoreData(event) {
        if (this.totalCount > this.offset) {
            if (this.infiniteLoading) {
                return;
            }
            if (this.dataSorting) {
                return;
            }
            this.infiniteLoading = true;
            //Display a spinner to signal that data is being loaded
            if (this.data.length > 0 && event.target) {
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            this.fromLoadMore = true;
            this.setFieldSorting();
            this.getPersonsRelatedToFormDRecords(this.tempSortBy, this.sortedDirection, this.limit, this.offset);

        }
    }

    refreshTable() {
        this.offset = 0;
        this.limit = 50;
        this.plusSign = '';
        this.sortedDirection = 'asc';
        this.defaultSortDirection = 'asc';
        this.sortedBy='recordLink';
        this.nameSortDir = this.defaultSortDirection;
        this.data = [];
        this.setRecordsInInitialState();
    }

    setLinks() {
        if (this.isCommunity) {
            this.recordLink = "/" + this.communityName + "/s/form-d-offering/" + this.recordId;
            this.formDNameLink = "/" + this.communityName + '/s/form-d-offering/Form_D_Offering__c/Default';
        } else {
            this.recordLink = '/' + this.recordId;
            this.formDNameLink = '/one/one.app#/sObject/Form_D_Offering__c/list?filterName=Recent';
        }
    }
}