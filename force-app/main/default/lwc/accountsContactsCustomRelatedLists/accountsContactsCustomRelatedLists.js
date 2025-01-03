import {
  LightningElement,
  api,
  wire,
  track
} from 'lwc';
import getRecordsInformation from '@salesforce/apex/NearbyAccountsAndContactsInMetroArea.getRecordsInformation'
import getFieldsToBeDisplayedOnCard from '@salesforce/apex/NearByAccountsController.getFieldsToBeDisplayedOnCard';
import getRelatedAccountsMetadata from '@salesforce/apex/RelatedAccountsMetaController.getRelatedAccountsMetadata';
import getRelatedAccountsAssetMetadata from '@salesforce/apex/RelatedAccountsMetaController.getRelatedAccountsAssetMetadata';
import getDefaultValueOfMarker from '@salesforce/apex/RelatedAccountsMetaController.getDefaultValueOfMarker';
import {
  subscribe,
  unsubscribe,
  onError
} from 'lightning/empApi';
import userPortalState from '@salesforce/schema/User.Portal_State__c';
import USER_ID from "@salesforce/user/Id";
import PROFILE_NAME_FIELD from '@salesforce/schema/User.Profile.Name';
import seachesAccessField from '@salesforce/schema/User.Searches_Access__c';
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
const fields = [userPortalState, PROFILE_NAME_FIELD, seachesAccessField];

export default class AccountsContactsCustomRelatedLists extends LightningElement {
  @api recordId;
  fieldsToBeDisplayed = [];
  mapMarkers = [];
  metroAreaName = '';
  childRecordsDetailNotInMetroArea = [];
  childAccountsDetails = [];
  contactsIds = [];
  accountsIds = [];
  collapsed = true;
  zoomlevel;
  isCommunity = false;
  searchesIds = [];
  accountTypeToColor = [];
  accountAssetToColor = [];
  accountIdToTypeAsset = [];
  privateChildren = {};
  @track user;
  @track error;
  hideSearches = false;

  communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

  @wire(getRecord, {
    recordId: USER_ID,
    fields
  })
  wiredUser({
    error,
    data
  }) {
    if (data) {
      this.user = data;
      var searchesAccessStatus = getFieldValue(this.user, seachesAccessField);
      var profileName = this.user.fields.Profile.displayValue;
      if ((profileName == 'Marketplace User - Emerging Manager Membership' || profileName == 'Marketplace Lite Customer') && searchesAccessStatus == false) {
        this.hideSearches = false;
      } else {
        this.hideSearches = true;
      }
      this.error = undefined;
    } else if (error) {
      this.error = error;
      this.user = undefined;
    }
  }

  get isMPState() {
    var userPortalStatus = getFieldDisplayValue(this.user, userPortalState) == 'MP 2.0';
    if (userPortalStatus == true || this.isCommunity == false) {
      return true;
    }
    return false;
  }

  handleEvent = event => {
    this.refreshAccountPanel();
  }

  @api
  refreshAccountPanel() {
    const accountsPanel = this.template.querySelector('c-accounts-panel-metro-area');
    accountsPanel.refreshTable();
  }

  registerItem(event) {
    event.stopPropagation();
    const item = event.detail;
    // create key for each child against its name
    if (!this.privateChildren.hasOwnProperty(item.name)) this.privateChildren[item.name] = {};
    // store each item against its guid
    this.privateChildren[item.name][item.type] = item;
  }
  chevronButtonClicked() {
    this.collapsed = !this.collapsed;
  }
  refreshButtonClicked() {
    getDefaultValueOfMarker({
      metroAreaId: this.recordId
    }).then(returnedMetroArea => {
      if (returnedMetroArea) {
        if (returnedMetroArea.Zoom_Level__c != null) {
          this.zoomlevel = returnedMetroArea.Zoom_Level__c;
        } else {
          this.zoomlevel = 14;
        }
      }
    });

  }
  clearAllButtonClicked() {
    const allAccounts = this.template.querySelector('c-accounts-panel-metro-area');
    if (allAccounts != null) {
      allAccounts.clearAll();
    }

    const marketplaceSearch = this.template.querySelector('c-marketplace-search-panel-metro-area');
    if (marketplaceSearch != null) {
      marketplaceSearch.clearAll();
    }

    const homeOfficeNotobjChild = this.template.querySelector('c-contacts-home-office-not-in-metro-area');
    if (homeOfficeNotobjChild != null) {
      homeOfficeNotobjChild.clearAll();
    }

    const homeOfficeObjChild = this.template.querySelector('c-contacts-home-office-in-metro-area');
    if (homeOfficeObjChild != null) {
      homeOfficeObjChild.clearAll();
    }

    // DSC-287 : Calling clear all of parent component for account panels 
    const accountParentChild = this.template.querySelector('c-account-type-related-list');
    if (accountParentChild != null) {
      accountParentChild.clearAll();
      Object.values(this.privateChildren['c-specific-account-type-list']).forEach((element, index) => {
        element.callbacks.clearAll(index);
      });
    }

    this.mapMarkers = [];
    this.contactsIds = [];
    this.accountsIds = [];
    this.searchesIds = [];

    getDefaultValueOfMarker({
      metroAreaId: this.recordId
    }).then(returnedMetroArea => {
      if (returnedMetroArea) {
        if (returnedMetroArea.Location__Latitude__s != null && returnedMetroArea.Location__Longitude__s != null) {
          if (this.isMPState == true) {
            this.mapMarkers = [...this.mapMarkers, {
              location: {
                Latitude: returnedMetroArea.Location__Latitude__s,
                Longitude: returnedMetroArea.Location__Longitude__s
              },
              title: returnedMetroArea.Name,
              description: returnedMetroArea.Description__c
            }];
          } else {
            this.mapMarkers = [...this.mapMarkers, {
              location: {
                Latitude: returnedMetroArea.Location__Latitude__s,
                Longitude: returnedMetroArea.Location__Longitude__s
              },
              title: returnedMetroArea.Name
            }];
          }
          if (returnedMetroArea.Zoom_Level__c != null) {
            this.zoomlevel = returnedMetroArea.Zoom_Level__c;
          } else {
            this.zoomlevel = 14;
          }
        }
      }
    });

  }
  checkIsCommunityInstance() {
    var currentUrl = window.location.href;
    this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
    this.isSalesforceInstance = !this.isCommunity;

  }
  connectedCallback() {

    subscribe('/event/refreshComponents__e', -1, this.handleEvent).then(response => {
      this.subscription = response;
    });

    //Getting fields to be displayed on the card
    this.collapsed = true;
    this.checkIsCommunityInstance();
    getFieldsToBeDisplayedOnCard({}).then(returnedFieldsToBeDisplayed => {
      this.fieldsToBeDisplayed = returnedFieldsToBeDisplayed;
    });


    getRelatedAccountsMetadata({
      isGetForShowingRelatedLists: false,
      metroAreaId: this.recordId
    }).then(returnedAccountMetadata => {
      for (var i = 0; i < returnedAccountMetadata.length; i++) {
        var accountMetadata = returnedAccountMetadata[i].AccountTypeValues.split(",");
        if (accountMetadata.length != undefined && accountMetadata.length > 1) {
          for (var j = 0; j < accountMetadata.length; j++) {
            this.accountTypeToColor[accountMetadata[j]] = returnedAccountMetadata[i].PanelIconColor;
          }
        } else {
          this.accountTypeToColor[accountMetadata[0]] = returnedAccountMetadata[i].PanelIconColor;
        }
      }
    });

    getRelatedAccountsAssetMetadata({}).then(returnedAccountMetadata => {
      for (var i = 0; i < returnedAccountMetadata.length; i++) {
        var accountMetadata = returnedAccountMetadata[i].AccountTypeValues;
        accountMetadata = accountMetadata.substring(accountMetadata.indexOf('-') + 1);
        this.accountAssetToColor[accountMetadata] = returnedAccountMetadata[i].PanelIconColor;
      }
    });

    getDefaultValueOfMarker({
      metroAreaId: this.recordId
    }).then(returnedMetroArea => {
      if (returnedMetroArea) {
        this.metroAreaName = returnedMetroArea.Name;
        if (returnedMetroArea.Location__Latitude__s != null && returnedMetroArea.Location__Longitude__s != null) {
          if (this.isMPState == true) {
            this.mapMarkers = [...this.mapMarkers, {
              location: {
                Latitude: returnedMetroArea.Location__Latitude__s,
                Longitude: returnedMetroArea.Location__Longitude__s
              },
              title: returnedMetroArea.Name,
              description: returnedMetroArea.Description__c
            }];
          } else {
            this.mapMarkers = [...this.mapMarkers, {
              location: {
                Latitude: returnedMetroArea.Location__Latitude__s,
                Longitude: returnedMetroArea.Location__Longitude__s
              },
              title: returnedMetroArea.Name
            }];
          }
          if (returnedMetroArea.Zoom_Level__c != null) {
            this.zoomlevel = returnedMetroArea.Zoom_Level__c;
          } else {
            this.zoomlevel = 14;
          }

        }

      }
    });
  }

  handleselectedsearches(event) {
    var selectedSearches = [];
    selectedSearches = event.detail;
    this.updateMapMarkersSearches(selectedSearches);
  }

  handleAccountListUpdated(event) {
    var selectedAccounts = [];
    selectedAccounts = event.detail;
    this.childAccountsDetails = selectedAccounts;
    this.updateMapMarkersAccount(this.childAccountsDetails);
  }
 
  updateMapMarkersSearches(dataArrayToUpdateMarkers) {
    this.searchesIds = [];
    for (var i = 0; i < dataArrayToUpdateMarkers.length; i++) {
      this.searchesIds.push(dataArrayToUpdateMarkers[i].recordId);
    }
    this.updateMapMarkers();
  }
  handleselectedcontacts(event) {
    var selectedContacts = [];
    selectedContacts = event.detail;
    this.childRecordsDetailNotInMetroArea = null;
    this.childRecordsDetailNotInMetroArea = selectedContacts;
    this.updateMapMarkersContact(this.childRecordsDetailNotInMetroArea);
  }

  handleselectedAccounts(event) {
    var selectedAccounts = [];
    selectedAccounts = event.detail;
    this.childRecordDetailNotInMetroArea = null;
    this.childRecordDetailNotInMetroArea = selectedAccounts;
    this.updateMapMarkersAccount(this.childRecordDetailNotInMetroArea);
  }
  updateMapMarkersAccount(dataArrayToUpdateMarkers) {
    this.accountsIds = [];
    this.accountIdToTypeAsset = [];
    for (var i = 0; i < dataArrayToUpdateMarkers.length; i++) {
      this.accountsIds.push(dataArrayToUpdateMarkers[i].recordId);
      this.accountIdToTypeAsset[dataArrayToUpdateMarkers[i].recordId] = dataArrayToUpdateMarkers[i].accountType;
    }
    this.updateMapMarkers();
  }
  updateMapMarkersContact(dataArrayToUpdateMarkers) {
    this.contactsIds = [];
    this.accountIdToTypeAsset = [];
    for (var i = 0; i < dataArrayToUpdateMarkers.length; i++) {
      this.contactsIds.push(dataArrayToUpdateMarkers[i].recordId);
      this.accountIdToTypeAsset[dataArrayToUpdateMarkers[i].recordId] = dataArrayToUpdateMarkers[i].accountType;
    }
    this.updateMapMarkers();
  }
  updateMapMarkers() {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    })
    this.mapMarkers = [];
    getRecordsInformation({
        accountIds: JSON.stringify(this.accountsIds),
        contactIds: JSON.stringify(this.contactsIds),
        dakotaSearchesIds: JSON.stringify(this.searchesIds),
        metroAreaId: this.recordId
      })
      .then(returnedNearByAccounts => {
        if (returnedNearByAccounts != undefined) {
          if (returnedNearByAccounts.length != undefined && returnedNearByAccounts.length > 0) {
            for (var j = 0; j < returnedNearByAccounts.length; j++) {
              var descriptionString = '';
              //Adding relevant information on the card
              if (this.fieldsToBeDisplayed != [] && this.fieldsToBeDisplayed.length > 0) {
                for (var k = 0; k < this.fieldsToBeDisplayed.length; k++) {

                  if (this.fieldsToBeDisplayed[k].Name == 'AUM') {
                    var aum = returnedNearByAccounts[j].AUM == undefined ? '' : formatter.format(returnedNearByAccounts[j].AUM);
                    descriptionString = descriptionString + '<b>AUM</b>: ' + aum + '</br>';
                  } else if (this.fieldsToBeDisplayed[k].Name == 'Website') {
                    var website = returnedNearByAccounts[j].Website == undefined ? '' : returnedNearByAccounts[j].Website;
                    descriptionString = descriptionString + '<b>Website</b>: ' + website + '</br>';
                  } else if (this.fieldsToBeDisplayed[k].Name == 'Address') {
                    var address = returnedNearByAccounts[j].Address == undefined ? '' : returnedNearByAccounts[j].Address;
                    descriptionString = descriptionString + '<b>Address</b>: ' + address + '</br>';
                  } else if (this.fieldsToBeDisplayed[k].Name == 'Description') {
                    var accountDescription = returnedNearByAccounts[j].Description == undefined ? '' : returnedNearByAccounts[j].Description;
                    descriptionString = descriptionString + '<b>Description</b>: ' + accountDescription + '</br>';
                  } else if (this.fieldsToBeDisplayed[k].Name == 'Phone') {
                    var phone = returnedNearByAccounts[j].Phone == undefined ? '' : returnedNearByAccounts[j].Phone;
                    descriptionString = descriptionString + '<b>Phone</b>: ' + phone + '</br>';
                  } else if (this.fieldsToBeDisplayed[k].Name == 'Type') {
                    var accountType = returnedNearByAccounts[j].AccountType == undefined ? '' : returnedNearByAccounts[j].AccountType;
                    descriptionString = descriptionString + '<b>Type</b>: ' + accountType + '</br>';
                  } else if (this.fieldsToBeDisplayed[k].Name == 'Asset Classes' && this.isMPState == false) {
                    var accountAssetClasses = returnedNearByAccounts[j].AccountAssetClasses == undefined ? '' : returnedNearByAccounts[j].AccountAssetClasses;
                    descriptionString = descriptionString + '<b>Asset Classes</b>: ' + accountAssetClasses + '</br>';
                  } else if (this.fieldsToBeDisplayed[k].Name == 'Contact Count') {
                    var cnctCount = returnedNearByAccounts[j].contactCount == undefined ? '' : returnedNearByAccounts[j].contactCount;
                    descriptionString = descriptionString + '<b>Contact Count</b>: ' + cnctCount + '</br>';
                  } else if (this.fieldsToBeDisplayed[k].Name == 'Geo-Coordinates') {
                    var geoCoordinates = returnedNearByAccounts[j].Latitude == undefined && returnedNearByAccounts[j].Longitude == undefined ? '' : Number.parseFloat(returnedNearByAccounts[j].Latitude).toFixed(8) + ',' + Number.parseFloat(returnedNearByAccounts[j].Longitude).toFixed(8);
                    descriptionString = descriptionString + '<b>Geo-Coordinates</b>: ' + geoCoordinates + '</br>';
                  }
                }
              }

              var colorCode;
              if (this.accountIdToTypeAsset[returnedNearByAccounts[j].RecordId] != undefined &&
                this.accountIdToTypeAsset[returnedNearByAccounts[j].RecordId].includes('InvestmentFocus-')) //For Everest Specific Account Type list
              {
                var assetClass = this.accountIdToTypeAsset[returnedNearByAccounts[j].RecordId];
                colorCode = this.accountAssetToColor[assetClass.substring(assetClass.indexOf('-') + 1)];
              } else if (this.isMPState == false && returnedNearByAccounts[j].AccountAssetClasses != null) //For Everest all Account list
              {
                colorCode = this.accountAssetToColor[returnedNearByAccounts[j].AccountAssetClasses.split(';')[0]];
              } else {
                colorCode = this.accountTypeToColor[returnedNearByAccounts[j].AccountType];
              }

              //Adding the map markers on the map
              if (returnedNearByAccounts[j].Latitude != null && returnedNearByAccounts[j].Latitude != '' && returnedNearByAccounts[j].Longitude != null && returnedNearByAccounts[j].Longitude != '') {
                this.mapMarkers = [...this.mapMarkers, {
                  location: {
                    Latitude: returnedNearByAccounts[j].Latitude,
                    Longitude: returnedNearByAccounts[j].Longitude
                  },
                  title: returnedNearByAccounts[j].Name,
                  description: descriptionString,
                  mapIcon: {
                    path: 'M31 62c0-17.1 16.3-25.2 17.8-39.7A18 18 0 1 0 13 20a17.7 17.7 0 0 0 .2 2.2C14.7 36.8 31 44.9 31 62z',
                    fillColor: colorCode,
                    fillOpacity: 1,
                    strokeWeight: 1,
                    scale: .50
                  }
                }];
                this.zoomlevel = null;
              }
            }
          } else {
            this.mapMarkers = [];
            getDefaultValueOfMarker({
              metroAreaId: this.recordId
            }).then(returnedMetroArea => {
              if (returnedMetroArea) {
                if (returnedMetroArea.Location__Latitude__s != null && returnedMetroArea.Location__Longitude__s != null) {
                  if (this.isMPState == true) {
                    this.mapMarkers = [...this.mapMarkers, {
                      location: {
                        Latitude: returnedMetroArea.Location__Latitude__s,
                        Longitude: returnedMetroArea.Location__Longitude__s
                      },
                      title: returnedMetroArea.Name,
                      description: returnedMetroArea.Description__c
                    }];
                  } else {
                    this.mapMarkers = [...this.mapMarkers, {
                      location: {
                        Latitude: returnedMetroArea.Location__Latitude__s,
                        Longitude: returnedMetroArea.Location__Longitude__s
                      },
                      title: returnedMetroArea.Name
                    }];
                  }
                  if (returnedMetroArea.Zoom_Level__c != null) {
                    this.zoomlevel = returnedMetroArea.Zoom_Level__c;
                  } else {
                    this.zoomlevel = 14;
                  }

                }

              }
            });
          }
        }
      })
  }
}