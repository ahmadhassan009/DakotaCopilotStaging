import { LightningElement,api,track, wire} from 'lwc';
import { NavigationMixin,CurrentPageReference} from "lightning/navigation";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import activeCommunities from '@salesforce/label/c.active_communities';
import getRecordsViewAll from '@salesforce/apex/MassFollowSharePageController.getRecordsViewAll';
import getRecordCountViewAll from '@salesforce/apex/MassFollowSharePageController.getRecordCountViewAll';
import getOptionsFromApex from '@salesforce/apex/MassFollowSharePageController.getOptionsFromApex';
import getAllFavoriteRecords from '@salesforce/apex/RecordsFavoriteController.getAllFavoriteRecords';
import massRemoveFromFavorites from '@salesforce/apex/RecordsFavoriteController.massRemoveFromFavorites';
import massAddToFavorites from '@salesforce/apex/RecordsFavoriteController.massAddToFavorites';
import getfollowRecordCount from '@salesforce/apex/RecordsFavoriteController.getfollowRecordCount';
import { loadStyle } from 'lightning/platformResourceLoader';
import massFollowCssSyling from '@salesforce/resourceUrl/massFollowCssSyling';
import TIME_ZONE from '@salesforce/i18n/timeZone';
import Allowed_Follow_Record_Count from '@salesforce/label/c.Allowed_Follow_Record_Count';
import AUM_FIELD from '@salesforce/schema/Account.AUM__c';
import TYPE_FIELD from '@salesforce/schema/Account.Type';
import CRD_FIELD from '@salesforce/schema/Account.CRD__c';
import LastModifiedDate_FIELD from '@salesforce/schema/Account.LastModifiedDate';

import TITLE_FIELD from '@salesforce/schema/Contact.Title';
import Contact_Type_FIELD from '@salesforce/schema/Contact.Contact_Type__c';
import Phone_FIELD from '@salesforce/schema/Contact.Phone';
import Email_FIELD from '@salesforce/schema/Contact.Email';

import FUND_BALANLE_FIELD from '@salesforce/schema/Investment__c.Fund_Balance__c';
import ASSET_CLASS_FIELD from '@salesforce/schema/Investment__c.Asset_Class_picklist__c';
import SUB_ASSET_CLASS_FIELD from '@salesforce/schema/Investment__c.Sub_Asset_Class_Picklist__c';
import FUNDING_YEAR_FIELD from '@salesforce/schema/Investment__c.Funding_Year__c';

import DATE_FIELD from '@salesforce/schema/Update__c.Last_Updated_Date__c';
import JOB_TITLE_FIELD from '@salesforce/schema/Update__c.New_Title__c';
import OLD_TITLE_FIELD from '@salesforce/schema/Update__c.Old_Title__c';

import { fireEvent } from 'c/pubsub';

const COLUMNS = [
    {
        type: "button-icon",
        initialWidth: 50,
        typeAttributes: {
            iconName: {
                fieldName: "favoriteIcon",
            },
            name: "fav_record",
            iconClass: {
                fieldName: "favIconColor",
            },
            variant: "bare",
            title: {
                fieldName: 'iconStatus'
            },
            disabled: { fieldName: 'isDisabled' }
        }
    },
    { label: 'Account Name', sortable: true, fieldName: "Id", type: 'url', typeAttributes: {label: { fieldName: 'recordName' }, tooltip:  { fieldName: 'recordName' }, target: '_self'}},
    { label: 'Type', sortable: true, fieldName: TYPE_FIELD.fieldApiName, type: 'text'},
    { label: 'AUM', sortable: true,  fieldName: AUM_FIELD.fieldApiName,  type: "currency",         
        typeAttributes: { 
            currencyCode: 'USD', 
            minimumFractionDigits: 0, 
            maximumFractionDigits : 0},
        cellAttributes: { alignment: 'left' },
    },
    { label: 'Metro Area', sortable: true, fieldName: "metroAreaId", type: 'url', typeAttributes: {label: { fieldName: 'metroAreaName' }, tooltip:  { fieldName: 'metroAreaName' }, target: '_self'}},
    { label: 'Last Modified Date', sortable: true,fieldName: LastModifiedDate_FIELD.fieldApiName, type: 'text'}
    
]

const CONTACT_COLUMNS = [
    {
        type: "button-icon",
        initialWidth: 50,
        typeAttributes: {
            iconName: {
                fieldName: "favoriteIcon",
            },
            name: "fav_record",
            iconClass: {
                fieldName: "favIconColor",
            },
            variant: "bare",
            title: {
                fieldName: 'iconStatus'
            },
            disabled: { fieldName: 'isDisabled' }
        }
    },
    { label: 'Contact Name', sortable: true, fieldName: "Id", type: 'url', typeAttributes: {label: { fieldName: 'recordName' }, tooltip:  { fieldName: 'recordName' }, target: '_self'}},
    { label: 'Title', sortable: true, fieldName: TITLE_FIELD.fieldApiName, type: 'text'},
    { label: 'Contact Type', sortable: true, fieldName: Contact_Type_FIELD.fieldApiName, type: 'text'},
    { label: 'Phone', sortable: true, fieldName: Phone_FIELD.fieldApiName, type: 'phone' },
    { label: 'Email', sortable: true, fieldName: Email_FIELD.fieldApiName, type: 'email' },
]

const INVESTMENT_COLUMNS = [
    {
        type: "button-icon",
        initialWidth: 50,
        typeAttributes: {
            iconName: {
                fieldName: "favoriteIcon",
            },
            name: "fav_record",
            iconClass: {
                fieldName: "favIconColor",
            },
            variant: "bare",
            title: {
                fieldName: 'iconStatus'
            },
            disabled: { fieldName: 'isDisabled' }
        }
    },
    { label: 'Investment Name', sortable: true, fieldName: 'Id', type: 'url', typeAttributes: { label: { fieldName: 'recordName' }, target: '_self', tooltip: { fieldName: 'recordName'} } },
    { label: 'Fund Balance', sortable: true, fieldName: FUND_BALANLE_FIELD.fieldApiName, type: 'currency', typeAttributes: { minimumFractionDigits: 0, maximumFractionDigits: 0 }},
    { label: 'Asset Class', sortable: true, fieldName: ASSET_CLASS_FIELD.fieldApiName, type: 'picklist' },
    { label: 'Sub-Asset Class', sortable: true, fieldName: SUB_ASSET_CLASS_FIELD.fieldApiName, type: 'picklist' },
    { label: 'Funding Year', sortable: true, fieldName: FUNDING_YEAR_FIELD.fieldApiName, type: 'text' }
]

const JOBCOLUMNS = [
    {
        type: "button-icon",
        initialWidth: 50,
        typeAttributes: {
            iconName: {
                fieldName: "favoriteIcon",
            },
            name: "fav_record",
            iconClass: {
                fieldName: "favIconColor",
            },
            variant: "bare",
            title: {
                fieldName: 'iconStatus'
            },
            disabled: { fieldName: 'isDisabled' }
        }
    },
    { label: 'Contact Name', sortable: true, fieldName: 'contactId', type: 'url', typeAttributes: { label: { fieldName: 'contactName' }, target: '_self', tooltip: { fieldName: 'contactName'} } },
    { label: 'Firm Left', sortable: true, fieldName: "firmLeftId", type: 'url', wrapText: true, typeAttributes: { label: { fieldName: 'firmLeftName' }, tooltip: { fieldName: 'firmLeftName' }, target: '_self' } },
    { label: 'Firm Joined', sortable: true, fieldName: "firmJoinedId", type: 'url', wrapText: true, typeAttributes: { label: { fieldName: 'firmJoinedName' }, tooltip: { fieldName: 'firmJoinedName' }, target: '_self' } },
    { label: 'New Title', sortable: true, fieldName: JOB_TITLE_FIELD.fieldApiName, type: 'text', wrapText: true },
    { label: 'Last Updated Date', sortable: true, fieldName: DATE_FIELD.fieldApiName, type: 'text' }
]

const ROLECOLUMNS = [
    {
        type: "button-icon",
        initialWidth: 50,
        typeAttributes: {
            iconName: {
                fieldName: "favoriteIcon",
            },
            name: "fav_record",
            iconClass: {
                fieldName: "favIconColor",
            },
            variant: "bare",
            title: {
                fieldName: 'iconStatus'
            },
            disabled: { fieldName: 'isDisabled' }
        }
    },
    { label: 'Contact Name', sortable: true, fieldName: 'contactId', type: 'url', typeAttributes: { label: { fieldName: 'contactName' }, target: '_self', tooltip: { fieldName: 'contactName'} } },
    { label: 'Account Name', sortable: true, fieldName: "accountId", type: 'url', wrapText: true, typeAttributes: { label: { fieldName: 'accountName' }, tooltip: { fieldName: 'accountName' }, target: '_self' } },
    { label: 'Old Title', sortable: true, fieldName: OLD_TITLE_FIELD.fieldApiName, type: 'text', wrapText: true },
    { label: 'New Title', sortable: true, fieldName: JOB_TITLE_FIELD.fieldApiName, type: 'text', wrapText: true },
    { label: 'Last Updated Date', sortable: true, fieldName: DATE_FIELD.fieldApiName, type: 'text' }
]
export default class MassFollowListViewAll extends NavigationMixin(LightningElement) {
    recordExist;
    @api objectName;
    objectBreadcrum;
    isCommunity;
    offset = 0;
    limit = 50;
    columns;
    totalCount;
    dataSorting = false;
    fromLoadMore = false;
    infiniteLoading = false;
    isLoading = true;
    plusSign;
    nullOrder = 'LAST';
    isCommunity = false;
    tempSortBy = '';
    defaultSortDirection = 'asc';
    sortedBy;
    nameSortDir = this.defaultSortDirection;
    sortedDirection = 'asc';
    data;    
    @track selectedIds = [];
    urlName;
    objectApiName;
    fieldsToQuery;
    @api objectNameLink;
    whereClause = '';    
    timeZone = TIME_ZONE;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    fieldDisplayPopUpFirstOpen = false;
    fieldDisplayPopup = false;
    @api filterId;
    @track savedFilters = [];
    displayOptions=false;
    buttonDisabled=false;
    displayHeader=false;
    defaultFilter;
    filterChanged=false;
    maxFollowCount = Allowed_Follow_Record_Count;
    followCount =0;
    allowSorting=true;
    allRecordIds = [];
    storeAllRecordIds = [];
    idsToRemove = [];
    removedAllClicked =false;
    sortingInprocess=false;
    @track followIds = [];
    
    @wire(CurrentPageReference) objPageReference;
    setQueryparams(urlName, objectApiName, fieldsToQuery, whereClause, columns, sortedBy, objectNameLink)
    {
        this.urlName = urlName;
        this.objectApiName = objectApiName;
        this.fieldsToQuery = fieldsToQuery;
        this.whereClause = whereClause;
        this.columns = columns;
        this.sortedBy = sortedBy;
        this.objectNameLink = objectNameLink;
    }

    connectedCallback()
    { 
        if(this.objectName=='Accounts')
        {
            this.objectBreadcrum='Accounts';
            this.setQueryparams('account', 'Account', 'Id, Name, AUM__c, toLabel(Type), MetroArea__c,MetroArea__r.Name,LastModifiedDate', '', COLUMNS, 'Id', "/"+this.communityName + '/s/account/Account/Default');
        }else if(this.objectName=='Contacts')
        {
            this.objectBreadcrum='Contacts';
            this.setQueryparams('contact', 'Contact', 'Id, Name, Title, toLabel(Contact_Type__c), Phone, Email', '', CONTACT_COLUMNS, 'Id', "/"+this.communityName + '/s/contact/Contact/Default');
        }else if(this.objectName=='Investments')
        {
            this.setQueryparams('investment', 'Investment__c', 'Id, Name, Fund_Balance__c, Asset_Class_picklist__c, Sub_Asset_Class_Picklist__c, Funding_Year__c', '', INVESTMENT_COLUMNS, 'Id', "/"+this.communityName + '/s/investment/Investment__c/Default');
        }else if(this.objectName=='Job Changes')
        {
            this.setQueryparams('', 'Update__c', 'Id, Name, Contact__c,Contact__r.Name, Firm_Joined__c, Firm_Joined__r.Name, Firm_Left__c, Firm_Left__r.Name, New_Title__c, Last_Updated_Date__c', ' and Job_Change__c=true and Contact__c!=null and Contact__r.Marketplace_Verified_Contact__c=true', JOBCOLUMNS, DATE_FIELD.fieldApiName, "/"+this.communityName + '/s/jobchanges');
        }else if(this.objectName=='Role Changes')
        {
            this.setQueryparams('', 'Update__c', 'Id, Name, Contact__c,Contact__r.Name, Account__c, Account__r.Name, Old_Title__c, New_Title__c, Last_Updated_Date__c', ' and Role_Change__c=true and Contact__c!=null and Contact__r.Marketplace_Verified_Contact__c=true', ROLECOLUMNS, DATE_FIELD.fieldApiName, "/"+this.communityName + '/s/rolechanges');
        }
        Promise.all([
            loadStyle(this, massFollowCssSyling)
        ]);
        this.recordExist = true;
        this.setRecordsInInitialState();
        getOptionsFromApex({objectAPIName: this.objectApiName})?.then((data) => {      
            data?.forEach((k,v) =>{
                let selectedValue =  ((Object.values(k)=='All Accounts' || Object.values(k)=='All Contacts') && this.filterId=='all' ) ? true:  Object.keys(k) == this.filterId;              
                this.savedFilters.push({'value':Object.keys(k), 'label':Object.values(k),'selected':selectedValue});
            });
            
          
            const filter = Object.values(this.savedFilters).find(filter => {return filter.value == this.filterId});
            if (filter) {            
            this.objectName = filter.label;
            }else if(this.filterId=='all'){
                this.objectName = this.objectName == 'Accounts' ?  'All Accounts' : 'All Contacts' ;
            }else if(this.filterId=='Recent'){
                this.objectName = 'Recently Viewed';
            }
            this.displayHeader=true;
        }).catch((error) => {
            console.log('error in fetching options : ', error);
        });;
        this.getfollowCount();
    }

    async getfollowCount () {
        try{
            this.followCount = await getfollowRecordCount({});
        } catch (e) {
            console.debug(e);
        }
    }

    setRecordsInInitialState() {
        this.isLoading = true;
        var currentUrl = window?.location?.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        this.setFieldSorting();
        this.getRecordsViewAll(this.tempSortBy, this.sortedDirection, this.limit, this.offset,null,false);
    }

    setFieldSorting() {
        this.tempSortBy = this.sortedBy;
        if(this.sortedBy === 'Id') {
            this.tempSortBy = 'Name';
        }else if(this.sortedBy === 'metroAreaId') {
            this.tempSortBy = 'MetroArea__r.Name';
        }
    }

    getRecordsViewAll(sortedBy, sortedDirection, limit, offset, filter,loadmore) {
        if (sortedDirection == 'desc') {
            this.nullOrder = 'LAST';
        } else {
            this.nullOrder = 'FIRST';
        }
        
        getRecordCountViewAll({
            objectApiName: this.objectApiName,
            sortedBy: sortedBy,
            sortOrder: sortedDirection,
            nullOrder: this.nullOrder,
            filterId: filter || this.filterId
        }).then((recIds) => {
            if (recIds) {
                this.totalCount = recIds.length;                
                this.storeAllRecordIds = recIds.map(a=>a.Id);
                this.allRecordIds = loadmore ==false ? this.storeAllRecordIds : this.allRecordIds;
                
                getRecordsViewAll({
                    fieldsToQuery: this.fieldsToQuery,
                    objectApiName: this.objectApiName,
                        sortedBy: sortedBy,
                        sortOrder: sortedDirection,
                        recLimit: limit,
                        offset: offset,
                        nullOrder: this.nullOrder,
                        filterId: filter || this.filterId
                    })
                    .then((Records) => {
                        if (Records) {    
                            let len = Records.length;   
                            let recordList = [];
                            let preSelectedIds = [];
                            for (let i = 0; i < len; i++) {
                                let returnedData = Object.assign({}, Records[i]); 
                                returnedData.isDisabled = true;             
                                                       
                                if(returnedData.Name) {
                                    returnedData.matchId = returnedData.Id;
                                    returnedData.Id = "/" + this.communityName + '/s/'+this.urlName+'/' + returnedData.Id;                            
                                    returnedData.recordName = returnedData.Name;
                                }
                                if (returnedData.LastModifiedDate) {
                                    returnedData.LastModifiedDate = this.updateDateFormate(returnedData.LastModifiedDate);
                                }
                                if (returnedData.MetroArea__c && returnedData.MetroArea__r) {
                                    returnedData.metroAreaId = "/" + this.communityName + '/s/metro-area/' + returnedData.MetroArea__c;
                                    returnedData.metroAreaName = returnedData.MetroArea__r.Name;
                                }                                
                                 
                                if(this.objectName=='Job Changes' ||  this.objectName=='Role Changes')
                                {
                                    returnedData.matchId = returnedData.Contact__c;
                                    if (returnedData.Contact__c && returnedData.Contact__r) {
                                        returnedData.contactId = "/" + this.communityName + '/s/contact/' + returnedData.Contact__c;
                                        returnedData.contactName = returnedData.Contact__r.Name;
                                    }
                                    if (returnedData.Account__c && returnedData.Account__r) {
                                        returnedData.accountId = "/" + this.communityName + '/s/account/' + returnedData.Account__c;
                                        returnedData.accountName = returnedData.Account__r.Name;
                                    }
                                    if (returnedData.Firm_Joined__c && returnedData.Firm_Joined__r) {
                                        returnedData.firmJoinedId = "/" + this.communityName + '/s/account/' + returnedData.Firm_Joined__c;
                                        returnedData.firmJoinedName = returnedData.Firm_Joined__r.Name;
                                    }
                                    if (returnedData.Firm_Left__c && returnedData.Firm_Left__r) {
                                        returnedData.firmLeftId = "/" + this.communityName + '/s/account/' + returnedData.Firm_Left__c;
                                        returnedData.firmLeftName = returnedData.Firm_Left__r.Name;
                                    }                            
                                    if (returnedData.Last_Updated_Date__c) {
                                        returnedData.Last_Updated_Date__c = this.updateDateFormate(returnedData.Last_Updated_Date__c);
                                    }
                                }    
                                preSelectedIds.push(returnedData.matchId);               
                                returnedData.favoriteIcon = 'utility:add';
                                returnedData.favIconColor = 'slds-icon-text-light addIconStyling';
                                returnedData.iconStatus = 'Follow';
                                recordList.push(returnedData);
                            }
                          

                            this.selectedIds = this.removedAllClicked ? this.selectedIds : this.selectedIds.concat(JSON.parse(JSON.stringify(preSelectedIds)));
                            this.selectedIds = [...this.selectedIds];

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
                            if (this.data.length >= this.totalCount && this.totalCount!=2000) {
                                this.plusSign = '';
                            } else {
                                this.plusSign = '+';
                            }
                        } else {
                            this.data = null;
                        }
                        this.getAllFavoriteRecordsFromAPI();
                        if (this.dataSorting) {
                            this.dataSorting = false;
                        }                              
                        this.sortingInprocess = false;                  
                    })
                    .catch((error) => {
                        console.log('Error in fetching records : ', error);
                        this.isLoading = false;
                        this.allowSorting=true;
                        this.sortingInprocess = false;
                        this.infiniteLoading = false;
                    });
            }else{
                this.isLoading = false;                
                this.sortingInprocess = false;
                this.plusSign = '';
            }            
        }).catch((error) => {
            console.log('Error in fetching records length : ', error);
            this.isLoading = false;
            this.allowSorting=true;            
            this.sortingInprocess = false;
        });
    }

    updateColumnSorting(event) {

        if(this.allowSorting ){
            this.sortingInprocess = true;
            this.isLoading = true;
            this.displayOptions = false
            this.sortedBy = event.detail.fieldName;
            this.sortedDirection = event.detail.sortDirection;
            this.dataSorting = true;
            this.offset = 0;
            this.data = [];
            this.setFieldSorting();
            this.sortedDirection = this.nameSortDir === 'asc' ? 'desc' : 'asc';
            this.nameSortDir = this.sortedDirection;
            this.getRecordsViewAll(this.tempSortBy, this.sortedDirection, this.limit,this.offset,null,false);
        }else{
            this.displayToast('info','Please wait while loading is in progress.');
        }

        
    }

    loadMoreData(event) {
        if(this.offset <= 1950){
            if (this.totalCount > this.offset) {
                this.allowSorting=false;
                if (this.infiniteLoading) {
                    return;
                }
                if (this.dataSorting) {
                    return;
                }
                this.infiniteLoading = true;
                if (this.data != null && event.target) {
                    event.target.isLoading = true;
                }
                this.tableElement = event.target;
                this.fromLoadMore = true;
                this.setFieldSorting();
                this.getRecordsViewAll(this.tempSortBy, this.sortedDirection, this.limit, this.offset,null,true);
            }
        }
        else{
            if(!this.sortingInprocess){
                this.displayToast('error','Salesforce currently do not support viewing more than 2000 records in a list.');
            }
        }
    }

    getAllFavoriteRecordsFromAPI() {
        getAllFavoriteRecords({}).then(returnedfavouriteRecords => {
            if (returnedfavouriteRecords != null && returnedfavouriteRecords.length > 0) {
                this.allFavoriteRecords = returnedfavouriteRecords;
                this.followIds = [];
                this.allFavoriteRecords.forEach(obj1 => {
                    this.followIds.push(obj1.Target_Id__c);
                    const index = this.data.findIndex(obj2 => obj1.Target_Id__c == obj2.matchId);
                    if (index !== -1) {                        
                        this.data[index].isFavorite = true;
                        this.data[index].favoriteIcon = 'utility:check';
                        this.data[index].favId = obj1.Favorite_Id__c;
                        this.data[index].favIconColor = "selectedFavIcon";
                        this.data[index].iconStatus = 'Unfollow';
                    }
                  });
             }
             this.data = [...this.data];
            this.isLoading = false;
            this.allowSorting=true;
        }).catch((error) => {
            this.isLoading = false;
            this.allowSorting=true;
            console.log('Error ', error);
        });
    }

    hanldeRecordSelected(event) {
        let previousIds = this.selectedIds;
        this.selectedIds=[];
        let selectedRows = event.detail.selectedRows;
        selectedRows.slice(0,2001);
        selectedRows.forEach((element)=> {
            this.selectedIds.push(element.matchId);
        });
        if((this.selectedIds.length==this.offset && this.selectedIds.length > 0 && this.totalCount >= this.offset) ||  (this.selectedIds.length==this.totalCount && this.totalCount>0 )){
            this.selectedIds = this.storeAllRecordIds;
            this.removedAllClicked = false;
        }
        if(!this.sortingInprocess){

            if(previousIds.length > this.selectedIds.length) {            
                this.idsToRemove = [...this.idsToRemove, ...this.getArrayDifference(previousIds, this.selectedIds )];
            } else if(previousIds.length == 0 && this.selectedIds.length > 0){
                this.idsToRemove = this.getArrayDifference(this.storeAllRecordIds, this.selectedIds );
            }
            else {
                let remove = this.getArrayDifference(this.selectedIds, previousIds);     
                this.idsToRemove = this.idsToRemove.length > 0 ? this.getArrayDifference(this.idsToRemove, remove) : remove;
            }
        }
        else {
            let remove = this.getArrayDifference(this.selectedIds, previousIds);     
            this.idsToRemove = this.idsToRemove.length > 0 ? this.getArrayDifference(this.idsToRemove, remove) : remove;
        }
        if((this.idsToRemove.length==this.offset && this.idsToRemove.length > 0 && this.totalCount >= this.offset && this.sortingInprocess == false) ||  (this.idsToRemove.length==this.totalCount && this.totalCount>0 )){
            this.idsToRemove = this.storeAllRecordIds;
            this.removedAllClicked = true;
        }

        this.allRecordIds = this.getArrayDifference([...this.storeAllRecordIds], [...this.idsToRemove]);
    }

    getArrayDifference(array1, array2) {
        return array1?.filter(id => !array2?.includes(id));
    }

    handleFollowRecord()
    {
        this.buttonDisabled=true;
        if(this.allRecordIds.length == 0 || this.selectedIds.length == 0)
        {
            this.displayToast('error','Please select at least one record and try again.');
            setTimeout(() => {
                this.buttonDisabled = false;
            }, 1000); 
        }
        else
        {       
            let recordLimitCheck = this.allFavoriteRecords ? (this.getArrayDifference(this.allRecordIds, this.allFavoriteRecords?.map( (e) => e?.Target_Id__c))?.length+this.allFavoriteRecords?.length)<=Number(this.maxFollowCount) : this.allRecordIds?.length <=Number(this.maxFollowCount);
            if(recordLimitCheck) {
                this.isLoading = true;
                massAddToFavorites({
                    recordId: this.allRecordIds
                }).then((followed) => {
                    if(followed)
                    {
                        this.displayToast('success',followed.length+' Record(s) Successfully Followed.');
                        this.selectedIds=[];
                        this.allRecordIds=[];
                        this.idsToRemove=[];
                        this.removedAllClicked = true;
                        this.data.forEach((element, index) => {
                            this.data[index].favoriteIcon = 'utility:add';
                            this.data[index].favIconColor = 'slds-icon-text-light addIconStyling';
                            this.data[index].iconStatus = 'Follow';
                        });
                        this.getAllFavoriteRecordsFromAPI();
                        fireEvent(this.objPageReference,'updateFavList','');
                    } 
                    else
                    {
                        this.displayToast('error','Please select at least one unfollowed record and try again.');
                        this.isLoading = false;
                    }    
                    this.buttonDisabled=false;              
                }).catch((error) => {
                    this.isLoading = false;
                    console.log('Error ', error);
                });
            }
            else {
                this.displayToast('error','You cannot follow more than '+this.maxFollowCount+' records.');
                setTimeout(() => {
                    this.buttonDisabled = false;
                }, 1000); 
            }
        }
    }

    handleUnfollowRecord()
    {
        this.buttonDisabled=true;
        if(this.allRecordIds.length == 0 || this.selectedIds.length == 0)
        {
            this.displayToast('error','Please select at least one record and try again.');
            setTimeout(() => {
                this.buttonDisabled = false;
            }, 1000);
        }
        else
        {
            this.isLoading = true;
            massRemoveFromFavorites({
                favIdList: this.allRecordIds
            }).then((unfollowed) => {
                if(unfollowed)
                {
                    this.displayToast('info',unfollowed+' Record(s) Successfully Unfollowed.');
                    this.selectedIds=[];
                    this.allRecordIds=[];
                    this.idsToRemove=[];
                    this.removedAllClicked = true;
                    this.data.forEach((element, index) => {
                        this.data[index].favoriteIcon = 'utility:add';
                        this.data[index].favIconColor = 'slds-icon-text-light addIconStyling';
                        this.data[index].iconStatus = 'Follow';
                    });                 

                    this.getAllFavoriteRecordsFromAPI();
                    fireEvent(this.objPageReference,'updateFavList','');
                } 
                else
                {
                    this.displayToast('error','Please select at least one followed record and try again.');
                    this.isLoading = false;
                }    
                this.buttonDisabled=false;               
            }).catch((error) => {
                this.isLoading = false;
                console.log('Error ', error);
            });
        }
        
    }

    displayToast(vari,msg)
    {
        const event = new ShowToastEvent({
            variant: vari,
            message: msg
        });
        this.dispatchEvent(event);
    }

    updateDateFormate(dateWithComma) {
        let dateTime = new Date(dateWithComma);
        this.timeZone = Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone;
        let options = { hour12: true, day: '2-digit', month: '2-digit', year: 'numeric',  timeZone: this.timeZone };
        return dateTime.toLocaleString('en', options).replace(',', '');
    }

    handleChange(event) {
        this.isLoading=true;
        this.removedAllClicked = false;
        this.data = [];        
        this.idsToRemove=[];
        this.selectedIds=[];
        this.totalCount=0;
        this.limit=50;
        this.plusSign='';
        this.offset=0;
        this.sortedBy = 'Id';
        this.sortedDirection = 'asc';
        
        const selectedValue = event?.target?.dataset?.id;
        this.filterId = selectedValue;
        const filter = Object.values(this.savedFilters).find(filter => filter.value == selectedValue);        
        if (filter) {
          this.objectName = JSON.parse(JSON.stringify(filter.label));
        }
        let newOptions = [];
        this.savedFilters.forEach((k,v) =>{
            let selected = k?.value?.[0] == selectedValue;              
            newOptions.push({'value':[k?.value?.[0]], 'label':[k?.label?.[0]],'selected':selected});
        });
        this.savedFilters = [...newOptions];
        this.setFieldSorting();
        this.getRecordsViewAll(this.tempSortBy, this.sortedDirection, this.limit, this.offset,this.filterId,false );
        this.displayOptions = false;
    }
    
    handleShowOptions(event){
        let titleWidth = this.template.querySelector('.headerTitle').offsetWidth +13;
        this.dynamicStyle = 'margin-left: -'+titleWidth+'px';
        this.displayOptions = !this.displayOptions;
    }
    @api handleShowOptionsClose(event){
        if(event && event?.target?.classList.length > 0 && !Object.values(event?.target?.classList)?.includes('dropdownButtonClose'))
        {
            this.displayOptions = false;
        } else if (event?.target?.tagName === 'LIGHTNING-DATATABLE') {
            this.displayOptions = false
        }
    }
 
}