import {
    LightningElement,
    wire,
    api,
    track
} from 'lwc';
import getRelatedAccountsMetadata from '@salesforce/apex/RelatedAccountsMetaController.getRelatedAccountsMetadata';
import getRelatedAccountsAssetMetadata from '@salesforce/apex/RelatedAccountsMetaController.getRelatedAccountsAssetMetadata';
import getMetroAreaName from '@salesforce/apex/RelatedAccountsController.getMetroAreaName';
import getTotalCountOfAccountInvFocusRecords from '@salesforce/apex/RelatedAccountsMetaController.getTotalCountOfAccountInvFocusRecords';
import userPortalState from '@salesforce/schema/User.Portal_State__c';
import LPGPDataAccessUser from '@salesforce/schema/User.LP_GP_Data_Access__c';
import USER_ID from "@salesforce/user/Id";
import PROFILE_NAME_FIELD from '@salesforce/schema/User.Profile.Name';
import ALL_ACCOUNTS_COUNT_FIELD from '@salesforce/schema/Metro_Area__c.Number_Of_Marketplace2_Accounts__c';
import {
    getRecord
} from 'lightning/uiRecordApi';
import {
    getFieldDisplayValue
} from 'lightning/uiRecordApi';
import {
    getFieldValue
} from 'lightning/uiRecordApi';
import activeCommunities from '@salesforce/label/c.active_communities';
import softwareSalesProfile from '@salesforce/label/c.Software_Sales_Profile';

const fields = [userPortalState, LPGPDataAccessUser, PROFILE_NAME_FIELD];

export default class AccountTypeRelatedList extends LightningElement {
    isCommunity = false;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    @wire(getRecord, {
        recordId: USER_ID,
        fields
    }) user;

    @wire(getRecord, { recordId: "$recordId", fields: ['Metro_Area__c.Number_Of_Marketplace2_Accounts__c'] })
    metroAreaRecord;

    get isLPGPDataAccessUserState() {
        if (this.user.data != undefined && this.user.data.fields.Profile.displayValue == softwareSalesProfile) {
            this.paddingLeft = 'padding-left: 20px;';
            return true;
        }
        if (getFieldDisplayValue(this.user.data, userPortalState) == 'Marketplace2') {
            this.paddingLeft = 'padding-left: 20px;';
            return true;
        }
        if (getFieldDisplayValue(this.user.data, userPortalState) == 'MP 2.0' &&
            getFieldValue(this.user.data, LPGPDataAccessUser) == true &&
            getFieldValue(this.metroAreaRecord.data, ALL_ACCOUNTS_COUNT_FIELD) > 0) {
            this.paddingLeft = 'padding-left: 20px;';
            return true;
        }
        else {
            this.paddingLeft = '';
            return false;
        }
    }

    get isMPState() {
        var userPortalStatus = getFieldDisplayValue(this.user.data, userPortalState) == 'MP 2.0';
        var everestUser = getFieldValue(this.user.data, LPGPDataAccessUser);
        if ((userPortalStatus == true && ((everestUser == true && getFieldValue(this.metroAreaRecord.data, ALL_ACCOUNTS_COUNT_FIELD) == 0) || everestUser == false))
            || this.isCommunity == false) {
            return true;
        }
        return false;
    }

    @api recordId;
    accountTypeMetadata = [];
    @track accountAssetMetadata = [];
    @api recordName;
    allocatorsCollapsed = false;
    firmCollapsed = false;
    selectedAccountsList = [];
    mapMarkers = [];
    mapMarkersRecordsDetails = [];
    invFirmRecordCount = 0;
    invAllocatorRecordCount = 0;
    @track section1MetadataToDisplay = [];
    @track section2MetadataToDisplay = [];

    @api
    clearAll() {
        // DSC-287 : clearing the list of account Ids. Child component is Clear All is called in accountsContactsCustomRelatedList component
        this.mapMarkersRecordsDetails = [];
    }
    removeRecordsOfSpecificType(accountType) {
        var arrayToReturn = [];
        for (var i = 0; i < this.mapMarkersRecordsDetails.length; i++) {
            if (this.mapMarkersRecordsDetails[i].accountType != accountType) {
                arrayToReturn.push(this.mapMarkersRecordsDetails[i]);
            }
        }
        return arrayToReturn;
    }
    firmChevronButtonClicked() {
        this.firmCollapsed = !this.firmCollapsed;
    }

    allocatorsChevronButtonClicked() {
        this.allocatorsCollapsed = !this.allocatorsCollapsed;
    }

    handleSelectedAccounts(event) {

        var uniqueItemsArray = [];
        var dataArrayToUpdateMarkers = [];
        var updatedMapMarkersRecordsDetails = [];
        dataArrayToUpdateMarkers = event.detail;
        this.mapMarkersRecordsDetails = this.removeRecordsOfSpecificType(dataArrayToUpdateMarkers.accountType);
        for (var i = 0; i < dataArrayToUpdateMarkers.length; i++) {
            this.mapMarkersRecordsDetails.push(dataArrayToUpdateMarkers[i]);
        }
        let recordsSet = new Set()
        for (var i = 0; i < this.mapMarkersRecordsDetails.length; i++) {
            if (!(recordsSet.has(this.mapMarkersRecordsDetails[i].recordId))) {
                updatedMapMarkersRecordsDetails.push(this.mapMarkersRecordsDetails[i]);
                uniqueItemsArray.push(this.mapMarkersRecordsDetails[i].mapMarker);
                recordsSet.add(this.mapMarkersRecordsDetails[i].recordId);
            }
        }
        this.mapMarkers = uniqueItemsArray;
        this.mapMarkersRecordsDetails = updatedMapMarkersRecordsDetails;
        const selectedEvent = new CustomEvent("accountlistupdated", {
            detail: this.mapMarkersRecordsDetails
        })
        this.dispatchEvent(selectedEvent);
    }

    @wire(getRelatedAccountsMetadata, {
        isGetForShowingRelatedLists: true,
        metroAreaId: '$recordId'
    })
    loadAccountTypeMetadata(metadataRecord) {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        
        if (metadataRecord?.data) {
            var tempMetadataList = [];
            for (var i = 0; i < metadataRecord?.data?.length; i++) {
                let tempMetadataRecord = Object.assign({}, metadataRecord.data[i]); //cloning object
                if (this.isCommunity) {
                    if (tempMetadataRecord.SubPanelSortOrder > 0) {
                        tempMetadataList.push(tempMetadataRecord);
                    }
                } else {
                    tempMetadataList.push(tempMetadataRecord);
                }
            }
            this.accountTypeMetadata = tempMetadataList;
            for (var i = 0; i < this.accountTypeMetadata.length; i++) {
                if (this.accountTypeMetadata[i].SectionNumber == '1') {
                    this.section1MetadataToDisplay.push(this.accountTypeMetadata[i]);
                }
                else {
                    this.section2MetadataToDisplay.push(this.accountTypeMetadata[i]);
                }
            }
        }
    };

    @wire(getRelatedAccountsAssetMetadata)
    loadAccountAssetMetadata(metadatarecord) {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        if (metadatarecord.data && this.isCommunity)
        {
            this.accountAssetMetadata = metadatarecord.data;
        }
    };

    @wire(getTotalCountOfAccountInvFocusRecords, {
        metroAreaId: '$recordId'
    })
    loadTotalCountOfAccountInvFocusRecords(returnedCount) {
        if (returnedCount.data) {
            this.invFirmRecordCount = returnedCount.data;
        }
    };

    @wire(getMetroAreaName, {
        recordId: '$recordId'
    })
    loadMetroAreaName(metroAreaName) {

        if (JSON.stringify(metroAreaName) != '{}') {
            if (metroAreaName.data !== undefined && metroAreaName.data != null) {
                if (metroAreaName.data.length != 0) {
                    this.recordName = metroAreaName.data[0].Name;
                }
            }
        }


    };
}