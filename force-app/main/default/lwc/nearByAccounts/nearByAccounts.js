import {
  LightningElement,
  api,
  track,
  wire
} from 'lwc';
import activeCommunities from '@salesforce/label/c.active_communities';
import getNearByAccounts from '@salesforce/apex/NearByAccountsController.getNearByAccounts';
import getFieldsToBeDisplayedOnCard from '@salesforce/apex/NearByAccountsController.getFieldsToBeDisplayedOnCard';
import getRelatedAccountsMetadata from '@salesforce/apex/RelatedAccountsMetaController.getRelatedAccountsMetadata';
import getAccountTypeValueSetFromMetadata from '@salesforce/apex/NearByAccountsController.getAccountTypeValueSetFromMetadata';
import NearByCSS from '@salesforce/resourceUrl/NearByCSS';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import { loadStyle } from 'lightning/platformResourceLoader';
import { getPicklistValues } from "lightning/uiObjectInfoApi";
import { getRecord } from "lightning/uiRecordApi";
import ACCOUNT_TYPE from "@salesforce/schema/Account.Type";
import ACCOUNT_RECORD_TYPE_FIELD from '@salesforce/schema/Account.RecordTypeId';
import CONTACT_ACCOUNT_RECORD_TYPE_FIELD from '@salesforce/schema/Contact.Account.RecordTypeId';
import CONTACT_ACCOUNT_TYPE from "@salesforce/schema/Contact.Account.Type";


export default class AccountLocation extends LightningElement {
  @api recordId;
  @api objectApiName;
  @api isCommunity = false;
  @api isSalesforceInstance = false;
  @track maxRecordOptions;
  @track maxDistanceOptions;
  @track showRelatedSection = true;
  @track isLoading = true;
  currentRecord;
  sortedBy;
  SortedDirection;
  name;
  mapMarkers = [];
  accountTypeToColor = [];
  zoomlevel;
  accountsList;
  tempAddAction = [];
  MaxRecordvalue = '10';
  maxDistanceValue = 'No Limit';
  accountGeocoded = true;
  nearbyAccountsFound = true;
  hideDatatable = true;
  listStyling;
  fieldsToBeDisplayed = [];
  showAccTypeCheckbox = true;
  maxRecordOptions = [{
    label: '5',
    value: '5'
  },
  {
    label: '10',
    value: '10'
  },
  {
    label: '15',
    value: '15'
  },
  {
    label: '20',
    value: '20'
  },
  {
    label: '25',
    value: '25'
  },
  {
    label: '50',
    value: '50'
  }
  ];
  maxDistanceOptions = [{
    label: '1',
    value: '1'
  },
  {
    label: '3',
    value: '3'
  },
  {
    label: '5',
    value: '5'
  },
  {
    label: '10',
    value: '10'
  },
  {
    label: '20',
    value: '20'
  },
  {
    label: 'No Limit',
    value: 'No Limit'
  }
  ];
  columns = [{
    label: 'Account Name',
    fieldName: "AccountLink",
    sortable: 'true',
    type: 'url',
    typeAttributes: {
      label: {
        fieldName: NAME_FIELD.fieldApiName
      },
      tooltip: {
        fieldName: NAME_FIELD.fieldApiName
      },
      target: '_self'
    }
  },
  {
    label: 'Type',
    fieldName: 'AccountType',
    type: 'text',
    sortable: 'true'
  },
  {
    label: 'AUM',
    fieldName: 'AUM',
    sortable: 'true',
    type: 'currency',
    cellAttributes: {
      alignment: 'left'
    },
    typeAttributes: {
      minimumFractionDigits: '0'
    }
  },
  {
    label: 'Distance',
    fieldName: 'Distance',
    type: 'decimal',
    sortable: 'true'
  }
  ];

  accountTypes = [];
  selectedAccountTypes = [];
  oldSelectedAccountTypes = [];
  recordTypeId;
  currentAccountType;
  isDropDownOpen = false;

  communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
  fieldsSet;

  @wire(getRecord, { recordId: '$recordId', fields: '$fieldsSet' })
  async wiredGetRecord({
    error,
    data
  }) {
    if (data) {
      this.currentAccountType = this?.objectApiName == 'Contact' ? data?.fields?.Account?.value?.fields?.Type?.value : data?.fields?.Type?.value;
      this.recordTypeId = this?.objectApiName == 'Contact' ? data?.fields?.Account?.value?.fields?.RecordTypeId?.value : data?.fields?.RecordTypeId?.value;
    } else if (error) {
      console.debug('Error While Fetching Record Type ID Value', error);
    }
  }

  @wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: ACCOUNT_TYPE })
  async wiredPicklistValues({
    error,
    data
  }) {
    if (data) {
      await this.getAccountTypeValueSetFromMetadata(data);
      document?.addEventListener('click', () => {
        this.handleListClose()
      });
    } else if (error) {
      console.debug('Error While Fetching Picklist Values', error);
    }
  }

  async getAccountTypeValueSetFromMetadata(data) {
    try {
      const values = await getAccountTypeValueSetFromMetadata();
      const accountTypesSupported = values?.split(';');
      if (accountTypesSupported?.length > 0) {
        const accountTypes = [];
        data?.values?.map(opt => {
          if (accountTypesSupported?.includes(opt.value)) {
            const obj = {
              "label": opt.label,
              "value": opt.value,
              "selected": false
            };
            accountTypes.push(obj);
          }
        });
        this.accountTypes = accountTypes;
        if (this.currentAccountType) {
          const elementFind = this.accountTypes?.find(opt => opt.value === this.currentAccountType);
          if (elementFind) {
            this.selectedAccountTypes.push(this.currentAccountType);
            elementFind.selected = true;
          }
          this.template.querySelector('c-multi-select-combobox-custom')?.handleListChange(this.accountTypes, true);
        }
      }
    } catch (e) {
      console.debug('Error while querying picklist values', e);
    }
  }

  //To set the header/title of the component
  get cardTitle() {
    return 'Nearby Accounts Map View';
  }

  /**
   * To show related list of nearby accounts
   */
  ShowRelatedList() {
    this.showRelatedSection = true;
  }

  /**
   * To hide related list of nearby accounts
   */
  HideRelatedList() {
    this.showRelatedSection = false;
  }

  /**
   * To check whether the instance is salesforce or community. 
   * This will be used for creating URL's
   */
  checkIsCommunityInstance() {
    var currentUrl = window.location.href;
    this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
    this.isSalesforceInstance = !this.isCommunity;
  }

  /**
   * @param {*} maximumDistance 
   * @param {*} maxRecords 
   * @param {*} sameType 
   * To get current account and nearby accounts details on the basis of filters
   */
  getAccountAndNearByAccountInformation(maximumDistance, maxRecords, sameType) {
    this.accountsList = null;
    this.mapMarkers = [];
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    })
    getNearByAccounts({
      recordId: this.recordId,
      entity: this.objectApiName,
      maxDistance: maximumDistance,
      recordLimit: maxRecords,
      sameAccountType: sameType
    }).then(returnedNearByAccounts => {
      /**
       * Showing message or related list on front end on the basis of returned result
       * If current account is not geocoded then length of returned result will be 0
       */
      if (returnedNearByAccounts) {
        if (returnedNearByAccounts.length == 0) {
          this.zoomlevel = null;
          this.accountGeocoded = false;
          this.nearbyAccountsFound = true;
          this.hideDatatable = true;
        } else if (returnedNearByAccounts.length >= 1) {
          /**
           * If no nearby accounts were found then length of returned result will be 1
           */
          if (returnedNearByAccounts.length == 1) {
            this.zoomlevel = 15;
            this.nearbyAccountsFound = false;
            this.accountGeocoded = true;
            this.hideDatatable = true;
          }
          /**
           * If nearby accounts are found then length of returned will be greater than 1
           */
          else {
            this.zoomlevel = null;
            this.hideDatatable = false;
            this.nearbyAccountsFound = true;
            this.accountGeocoded = true;

            // To set nearby account list height based total number of records returned
            if ((returnedNearByAccounts.length - 1) >= 10) {
              this.listStyling = 'width:100%; height:315px; border-style: solid; border-width: thin; border-color: #D7DAE9;';
            } else if ((returnedNearByAccounts.length - 1) == 1) {
              this.listStyling = 'width:100%; height:69px; border-style: solid; border-width: thin; border-color: #D7DAE9;';
            } else if ((returnedNearByAccounts.length - 1) == 2) {
              this.listStyling = 'width:100%; height:96px; border-style: solid; border-width: thin; border-color: #D7DAE9;';
            } else if ((returnedNearByAccounts.length - 1) == 3) {
              this.listStyling = 'width:100%; height:123px; border-style: solid; border-width: thin; border-color: #D7DAE9;';
            } else if ((returnedNearByAccounts.length - 1) == 4) {
              this.listStyling = 'width:100%; height:150px; border-style: solid; border-width: thin; border-color: #D7DAE9;';
            } else if ((returnedNearByAccounts.length - 1) <= 5) {
              this.listStyling = 'width:100%; height:177px; border-style: solid; border-width: thin; border-color: #D7DAE9;';
            } else if ((returnedNearByAccounts.length - 1) <= 7) {
              this.listStyling = 'width:100%; height:232px; border-style: solid; border-width: thin; border-color: #D7DAE9;';
            } else if ((returnedNearByAccounts.length - 1) <= 9) {
              this.listStyling = 'width:100%; height:286px; border-style: solid; border-width: thin; border-color: #D7DAE9;';
            }
          }

          var tempAccountList = [];
          /**
           * Looping through the returned results
           */
          for (var j = 0; j < returnedNearByAccounts.length; j++) {
            var descriptionString = '';
            /**
             * Adding relevant information on the card
             */
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
                } else if (this.objectApiName != 'Conference__c' && this.fieldsToBeDisplayed[k].Name == 'Contact Count') {
                  var cnctCount = returnedNearByAccounts[j].contactCount == undefined ? 0 : returnedNearByAccounts[j].contactCount;
                  descriptionString = descriptionString + '<b>Contact Count</b>: ' + cnctCount + '</br>';
                } else if (this.fieldsToBeDisplayed[k].Name == 'Geo-Coordinates') {
                  var geoCoordinates = returnedNearByAccounts[j].Latitude == undefined && returnedNearByAccounts[j].Longitude == undefined ? '' : Number.parseFloat(returnedNearByAccounts[j].Latitude).toFixed(8) + ',' + Number.parseFloat(returnedNearByAccounts[j].Longitude).toFixed(8);
                  descriptionString = descriptionString + '<b>Geo-Coordinates</b>: ' + geoCoordinates + '</br>';
                }
              }
            }
            /**
             * Adding the map markers on the map
             */
            if (returnedNearByAccounts[j].Latitude != null && returnedNearByAccounts[j].Latitude != '' && returnedNearByAccounts[j].Longitude != null && returnedNearByAccounts[j].Longitude != '') {

              if (j != 0) {
                this.mapMarkers = [...this.mapMarkers, {
                  location: {
                    Latitude: returnedNearByAccounts[j].Latitude,
                    Longitude: returnedNearByAccounts[j].Longitude
                  },
                  title: returnedNearByAccounts[j].Name,
                  description: descriptionString,
                  mapIcon: {
                    path: 'M31 62c0-17.1 16.3-25.2 17.8-39.7A18 18 0 1 0 13 20a17.7 17.7 0 0 0 .2 2.2C14.7 36.8 31 44.9 31 62z',
                    fillColor: this.accountTypeToColor[returnedNearByAccounts[j].AccountType],
                    fillOpacity: 1,
                    strokeWeight: 1,
                    scale: .50
                  }
                }];
              } else {
                this.mapMarkers = [...this.mapMarkers, {
                  location: {
                    Latitude: returnedNearByAccounts[j].Latitude,
                    Longitude: returnedNearByAccounts[j].Longitude
                  },
                  title: returnedNearByAccounts[j].Name,
                  description: descriptionString
                }];

              }
            }

            /**
             * Creating URL of Account for Salesforce instance and community instance
             */
            let tempAccountRecord = Object.assign({}, returnedNearByAccounts[j]);
            if (this.isCommunity) {
              tempAccountRecord.AccountLink = "/" + this.communityName + "/s/detail/" + tempAccountRecord.RecordId;

            } else if (!this.isCommunity) {
              tempAccountRecord.AccountLink = "/" + tempAccountRecord.RecordId;
            }
            /**
             * Limiting returned distance up till 2 decimal points
             */
            tempAccountRecord.Distance = Number.parseFloat(tempAccountRecord.Distance).toFixed(2);
            /**
             * Record on the 0th index will be the primrary/current record so it won't be shown in related list
             */
            if (j != 0) {
              tempAccountList.push(tempAccountRecord);
            }
          }
          this.accountsList = tempAccountList;
        }
      }
      this.isLoading = false;
    }).catch(error => {
      this.isLoading = false;
      console.log("Error:", error);
    });
  }

  handleChangeMultiPickList(event) {
    this.selectedAccountTypes = event?.detail?.map(selectedOption => selectedOption.value);
  }

  storeOldValues(event) {
    this.oldSelectedAccountTypes = event?.detail?.map(selectedOption => selectedOption.value) || [];
    this.selectedAccountTypes = event?.detail?.map(selectedOption => selectedOption.value) || [];
    this.isDropDownOpen = true;
  }

  /**
   * On change of any filter, get the value of the filters and fetch the results again on the basis of new filters
   * @param {*} event 
   */
  getFilteredRecords(event) {
    this.isLoading = true;
    const sameType = this.objectApiName != 'Conference__c' ? this.selectedAccountTypes : [];
    this.isLoading = true;
    let maxRecords = this.template.querySelector('[data-id="maxRecords"]').value;
    let maximumDistance = this.template.querySelector('[data-id="maxDistance"]').value;
    if (maximumDistance == 'No Limit') {
      maximumDistance = 0;
    } else {
      maximumDistance = parseInt(maximumDistance);
    }
    maxRecords = parseInt(maxRecords);
    this.getAccountAndNearByAccountInformation(maximumDistance, maxRecords, sameType);
  }

  handleListClose() {
    const multiPicklist = this.template.querySelector('c-multi-select-combobox-custom')
    if (JSON.stringify(this.oldSelectedAccountTypes) != JSON.stringify(this.selectedAccountTypes) && this.isDropDownOpen) {
      this.getFilteredRecords();
    }
    multiPicklist?.handleClose();
    this.isDropDownOpen = false;
  }

  /**
   * For sorting the table
   * @param {*} event 
   */
  updateColumnSorting(event) {
    this.sortedBy = event.detail.fieldName;
    this.SortedDirection = event.detail.sortDirection;
    this.sortData(this.sortedBy, this.SortedDirection);
  }

  /**
   * Helper function to sort the table
   * @param {*} fieldname 
   * @param {*} direction 
   */
  sortData(fieldname, direction) {
    // serialize the data before calling sort function
    let parseData = JSON.parse(JSON.stringify(this.accountsList));

    // Return the value stored in the field
    let keyValue = (a) => {
      if (fieldname == 'AccountLink') {
        fieldname = 'Name';
      }
      if (fieldname == 'Distance') {
        return parseFloat(a[fieldname]);
      } else {
        return a[fieldname];
      }
    };

    // checking reverse direction 
    let isReverse = direction === 'asc' ? 1 : -1;

    // sorting data 
    parseData.sort((x, y) => {
      x = keyValue(x) ? keyValue(x) : ''; // handling null values
      y = keyValue(y) ? keyValue(y) : '';

      // sorting values based on direction
      return isReverse * ((x > y) - (y > x));
    });

    // set the sorted data to data table data
    this.accountsList = parseData;
  }

  refreshMap() {
    this.isLoading = true;
    const oldRecordType = this.recordTypeId;
    this.recordTypeId = '';
    this.recordTypeId = oldRecordType;
    let maxRecords = '10';
    let maximumDistance = 'No Limit';
    this.selectedAccountTypes = [];
    if (this.objectApiName != 'Conference__c') {
      this.accountTypes?.forEach(opt => {
        if (opt.value === this.currentAccountType) {
          opt.selected = true;
          this.selectedAccountTypes.push(this.currentAccountType);
        } else {
          opt.selected = false;
        }
      });
      this.template.querySelector('c-multi-select-combobox-custom')?.handleListChange(this.accountTypes, true);
    }
    this.template.querySelector('[data-id="maxRecords"]').value = maxRecords;
    this.template.querySelector('[data-id="maxDistance"]').value = maximumDistance;
    this.connectedCallback();
  }

  connectedCallback() {
    this.isLoading = true;

    Promise.all([
      loadStyle(this, NearByCSS)
    ]);

    this.checkIsCommunityInstance();
    if (this.objectApiName == 'Conference__c') {
      this.showAccTypeCheckbox = false;
    }
    this.fieldsSet = this?.objectApiName == 'Contact' ? [CONTACT_ACCOUNT_RECORD_TYPE_FIELD, CONTACT_ACCOUNT_TYPE] : [ACCOUNT_RECORD_TYPE_FIELD, ACCOUNT_TYPE];
    /**
     * Getting colors of the pins to be shown on the map
     */
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
      /**
       * Getting fields to be displayed on the card
       */
      getFieldsToBeDisplayedOnCard({}).then(returnedFieldsToBeDisplayed => {
        this.fieldsToBeDisplayed = returnedFieldsToBeDisplayed;
      })
        .then(returnedValue => {
          /**
           * Getting current account and nearby account details
           */
          this.getAccountAndNearByAccountInformation(0, 10, this.selectedAccountTypes);
        });
    }).catch(error => {
      this.isLoading = false;
      console.log("Error:", error);
    });

  }
}