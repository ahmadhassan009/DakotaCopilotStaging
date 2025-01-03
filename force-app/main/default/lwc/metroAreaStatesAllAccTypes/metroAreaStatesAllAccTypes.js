import {
    LightningElement,
    wire,
    api
} from 'lwc';
import getRelatedAccountsMetadata from '@salesforce/apex/MetroAreaListViewController.getRelatedAccountsMetadata';
import {
    loadStyle
} from 'lightning/platformResourceLoader';
import userPortalState from '@salesforce/schema/User.Portal_State__c';
import USER_ID from "@salesforce/user/Id";
import PROFILE_NAME_FIELD from '@salesforce/schema/User.Profile.Name';
import {
    getRecord
} from 'lightning/uiRecordApi';
import activeCommunities from '@salesforce/label/c.active_communities';
const fields = [userPortalState, PROFILE_NAME_FIELD];

import metroAreaByStateCSS from '@salesforce/resourceUrl/metroAreaByStateCSS';

export default class MetroAreaStatesAllAccTypes extends LightningElement {
    @api stateName;
    @api accountTypeMetadata = [];
    isCommunity = false;
    stateExists = false;

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    @wire(getRecord, {
        recordId: USER_ID,
        fields
    }) user;

    connectedCallback() {
        Promise.all([
            loadStyle(this, metroAreaByStateCSS)
        ]);

        if (this.stateName != undefined || this.stateName != null) {
            this.stateExists = true;
        }
        this.getRelatedAccountsMetadata();
    }

    getRelatedAccountsMetadata() {
        getRelatedAccountsMetadata({
            stateName: this.stateName
        })
            .then((metadatarecord) => {
                if (metadatarecord) {
                    var tempMetadataList = [];

                    for (var i = 0; i < metadatarecord.length; i++) {
                        let tempMetadataRecord = Object.assign({}, metadatarecord[i]); //cloning object
                        if (tempMetadataRecord.SubPanelSortOrder > 0) {

                            tempMetadataList.push(tempMetadataRecord);
                        }
                    }
                    this.accountTypeMetadata = tempMetadataList;
                }
            })
            .catch((error) => {
                console.log('Error : ', error);
            })
    }
}