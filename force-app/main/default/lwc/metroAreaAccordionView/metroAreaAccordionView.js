import {
    LightningElement,
    api,
    track,
    wire
} from 'lwc';
import {
    getObjectInfo,
    getPicklistValues
} from 'lightning/uiObjectInfoApi';
import { CurrentPageReference } from 'lightning/navigation';
import {fireEvent,registerListener,unregisterAllListeners} from 'c/pubsub';
import STATE from '@salesforce/schema/Metro_Area__c.State__c';
import METRO_AREA_OBJECT from '@salesforce/schema/Metro_Area__c';
import getAllCountriesList from '@salesforce/apex/MetroAreaListViewController.getAllCountriesList';
import getAllCountriesListForState from '@salesforce/apex/MetroAreaListViewController.getAllCountriesListForState';
import getAllListViewNames from '@salesforce/apex/MetroAreaListViewController.getAllListViewNames';
import getMetroAreaRecords from '@salesforce/apex/MetroAreaListViewController.getMetroAreaRecords';
import deleteListView from '@salesforce/apex/MetroAreaListViewController.deleteListView';
import getListViewDetails from '@salesforce/apex/MetroAreaListViewController.getListViewDetails';
import upsertListView from '@salesforce/apex/MetroAreaListViewController.upsertListView';
import isDuplicateListViewName from '@salesforce/apex/MetroAreaListViewController.isDuplicateListViewName';
import getMetroAreaRecordsCount from '@salesforce/apex/MetroAreaListViewController.getMetroAreaRecordsCount';
import getAllFavoriteRecords from '@salesforce/apex/RecordsFavoriteController.getAllFavoriteRecords';
import removeFromFavorites from '@salesforce/apex/RecordsFavoriteController.removeFromFavorites';
import addToFavorites from '@salesforce/apex/RecordsFavoriteController.addToFavorites';
import activeCommunities from '@salesforce/label/c.active_communities';
import Allowed_Follow_Record_Count from '@salesforce/label/c.Allowed_Follow_Record_Count';
import {
    NavigationMixin
} from "lightning/navigation";

import {
    loadStyle,
} from 'lightning/platformResourceLoader';
import metroAreaListViewDatatableCSS from '@salesforce/resourceUrl/metroAreaListViewDatatableCSS';

const STATE_MAP = {
    'AL': 'Alabama',
    'AK': 'Alaska',
    'AB': 'Alberta',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'BC': 'British Columbia',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'FL': 'Florida',
    'GA': 'Georgia',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MB': 'Manitoba',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NB': 'New Brunswick',
    'NL': 'Newfoundland and Labrador',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'NT': 'Northwest Territories',
    'NS': 'Nova Scotia',
    'NU': 'Nunavut',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'ON': 'Ontario',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'PE': 'Prince Edward Island',
    'QC': 'Quebec',
    'RI': 'Rhode Island',
    'SK': 'Saskatchewan',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming',
    'YT': 'Yukon',
};

const COLUMNS = [{
        label: "Metro Area Name",
        sortable: true,
        fieldName: "MetroAreaId",
        type: "url",
        hideDefaultActions: true,
        typeAttributes: {
            label: {
                fieldName: 'MetroAreaName'
            },
            tooltip: {
                fieldName: 'MetroAreaName'
            },
            target: '_parent'
        }
    },
    {
        label: "Number of Accounts",
        sortable: true,
        fieldName: "NumOfAccounts",
        type: "Text",
        hideDefaultActions: true
    },
    {
        label: "Number of Contacts",
        sortable: true,
        fieldName: "NumOfContacts",
        type: "Text",
        hideDefaultActions: true
    },
    {
        type: "button-icon",
        initialWidth: 120,
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
            }
        }
    }
]

const ALL_COLUMNS = [{
        label: "Metro Area Name",
        sortable: true,
        fieldName: "MetroAreaId",
        type: "url",
        hideDefaultActions: true,
        typeAttributes: {
            label: {
                fieldName: 'MetroAreaName'
            },
            tooltip: {
                fieldName: 'MetroAreaName'
            },
            target: '_parent'
        }
    },
    {
        label: "Country",
        sortable: true,
        fieldName: "CountryName",
        type: "Text",
        hideDefaultActions: true
    },
    {
        label: "Number of Accounts",
        sortable: true,
        fieldName: "NumOfAccounts",
        type: "Text",
        hideDefaultActions: true
    },
    {
        label: "Number of Contacts",
        sortable: true,
        fieldName: "NumOfContacts",
        type: "Text",
        hideDefaultActions: true
    },
    {
        type: "button-icon",
        initialWidth: 120,
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
            }
        }
    }
]

export default class MetroAreaAccordionView extends NavigationMixin(LightningElement) {
    @api recordId;
    @track error;
    @track countryList = [];
    @track showModal = false;
    @track showToast = false;
    libInitialized = false;
    searchPlaceHolder = 'Search metro area name or state...';
    isLoading = true;
    columns = COLUMNS;
    title = '';
    toastmessage = '';
    iconName = '';
    alternativeText = '';
    toastMsgClasses = '';
    toastMsgIconClasses = '';
    searchTerm = [];
    recordsExist = true;
    metroAreaFilteredRecords = [];
    activeCountry = 'United States';
    lastActiveCountry;
    isMyTerritoriesClicked = false;
    totalRecordsCount = 0;
    favRecordsList = [];
    offset = 0;
    limit = 40;
    sortBy = 'Sort_Order__c';
    sortDirection = 'desc';
    sortedBy = 'NumOfAccounts';
    defaultSortDirection = 'desc';
    sortByFieldLabel = 'Number of Accounts';
    fromLoadMore = false;
    isSearched = false;
    infiniteLoading = false;
    allFavoriteRecords = [];
    fromConnectedCallback = false;
    isCommunity;
    isModalOpen = false;
    listViewName = '';
    filterFieldName = 'Name';
    isNameFilterField = true;
    operator = 'Equals';
    filterValue = '';
    filterStateValue = [];
    listViewNames = [];
    isListView = false;
    isDeleteListViewModalOpen = false;
    listViewToBeDeleted;
    updatedListViewName = '';
    updatedOperator = '';
    updatedFilteredMetroAreaNames = '';
    listViewToBeEditedId = '';
    listViewPopupTitle = '';
    customListViewMap = new Map();
    favRecordsCount = 0;
    isDisabled = false;
    activeListView;
    isNewListView;
    activeState = '';
    showRecordsByState = false;
    showSingleStateMetroAreas = false;
    maxFollowCount = Allowed_Follow_Record_Count;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    get options() {
        return [{
                label: 'Equals',
                value: 'Equals'
            },
            {
                label: 'Not Equals',
                value: 'Not Equals'
            },
            {
                label: 'Contains',
                value: 'Contains'
            },
            {
                label: 'Does Not Contain',
                value: 'Does Not Contain'
            },
            {
                label: 'Starts With',
                value: 'Starts With'
            }
        ];
    }

    get stateOperatorOptions() {
        return [{
                label: 'Equals',
                value: 'Equals'
            },
            {
                label: 'Not Equals',
                value: 'Not Equals'
            }
        ];
    }

    get filterFieldNameOptions() {
        return [{
                label: 'Metro Area Name',
                value: 'Name'
            },
            {
                label: 'State',
                value: 'State__c'
            }
        ];
    }

    @wire(CurrentPageReference) objPageReference;

    @wire(getObjectInfo, {
        objectApiName: METRO_AREA_OBJECT
    })
    metroAreatInfo;

    /**
     * 
     * To get Metro Area State field picklist options
     */
    @wire(getPicklistValues, {
        recordTypeId: '$metroAreatInfo.data.defaultRecordTypeId',
        fieldApiName: STATE
    })
    picklistValues({
        error,
        data
    }) {
        if (data) {
            this.stateOptions = data.values;
        } else if (error) {
            console.log('Error getting State Options: ', error);
        }
    }


    connectedCallback() {
        registerListener('updateMetroAreaList',this.updateMetroAreaListView,this);
        this.isLoading = true;
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        Promise.all([
            loadStyle(this, metroAreaListViewDatatableCSS)
        ]);
        this.getAllCountriesList("");
        this.fromConnectedCallback = true;
        this.getMetroAreaRecords();
        this.setDefaultSorting();
    }

    updateMetroAreaListView(objPayLoad) {
        this.fromConnectedCallback = true;
        this.offset = 0;
        this.limit = 40;
        this.isLoading = true;
        this.metroAreaFilteredRecords = [];
            if(this.activeCountry =='My Followed Items') {
                //Marking record as non-favorite
                let favToBeRemovedId = objPayLoad;
                this.recordId = objPayLoad;
                removeFromFavorites({
                    favId: favToBeRemovedId
                }).then(() => {
                    this.favRecordsCount--;
                    this.countryList[0].Name = 'My Followed Items (' + this.favRecordsCount + ')';
                    if (this.activeCountry == 'My Followed Items') {


                        for(let i=0;i<this.favRecordsList.length;i++) {
                            if(this.favRecordsList[i] == this.recordId) {
                                this.favRecordsList.splice(i, 1);
                                break;
                            }
                        }
                        this.offset = 0;
                        this.totalRecordsCount--;
                        this.getMetroAreaRecords();

                    } else {

                        //Set the parameters and icon color for currently marked non-favorite record
                        var tempList = [];
                        this.metroAreaFilteredRecords.forEach((element, index) => {
                            let temObj = Object.assign({}, element);
                            if (element.Id == this.recordId) {
                                temObj.isFavorite = false;
                                temObj.favId = '';
                                temObj.favoriteIcon = 'utility:add';
                                temObj.favIconColor = "slds-icon-text-light addIconStyling";
                                temObj.iconStatus = 'Click To Follow';

                            }
                            tempList.push(temObj);
                        });
                        this.metroAreaFilteredRecords = [...tempList];
                        this.isLoading = false;
                    }

                    //Remove the non-favourite record from the favorite list.
                    for (let i = 0; i < this.allFavoriteRecords.length; i++) {
                        if (this.allFavoriteRecords[i].Target_Id__c == favToBeRemovedId) {
                            this.allFavoriteRecords.splice(i, 1);
                            break;
                        }
                    }
                    fireEvent(this.objPageReference,'updateFavList','');
                    /** Custom toast message */
                    this.toastmessage = 'Successfully Removed From Followed Items.';
                    this.title = 'Info';
                    this.alternativeText = 'Info';
                    this.showToast = true;
                    this.iconName = 'utility:info';
                    this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_info';
                    this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-info slds-m-right_small slds-no-flex slds-align-top'
                    setTimeout(() => {
                        this.showToast = false;
                    }, 2000);

                }).catch((error) => {
                    console.log('Error ', error);
                    this.isLoading = false;
                    /** Custom toast message */
                    this.toastmessage = 'Cannot remove this record from followed items. Contact your administrator for help.';
                    this.title = 'Error';
                    this.alternativeText = 'Error';
                    this.showToast = true;
                    this.iconName = 'utility:error';
                    this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                    this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top'
                    setTimeout(() => {
                        this.showToast = false;
                    }, 2000);
                });
            }
            else {
                if(this.favRecordsCount>0) {
                    this.favRecordsCount = this.favRecordsCount-1;
                    this.countryList[0]['Name'] ="My Followed Items ("+ this.favRecordsCount+ ")";
                    this.countryList = JSON.parse(JSON.stringify(this.countryList))
                }
                this.setDefaultSorting();
                this.getMetroAreaRecords();
            }
    }
    getAllCountriesListForState(currentActiveCountry) {
        //this.isLoading = true;
        this.listViewNames = [];
        this.customListViewMap.clear();
        this.countryList = [];
        getAllListViewNames({}).then((allListViewRecords) => {
            if (allListViewRecords.length > 0) {
                for (var i = 0; i < allListViewRecords.length; i++) {
                    this.customListViewMap.set(allListViewRecords[i].Name, allListViewRecords[i].Id);
                    this.listViewNames.push(allListViewRecords[i].Name);
                }
            }
            getAllCountriesListForState({}).then((allCountries) => {
                if (allCountries) {
                    let subTerriorities = [];
                    for (var j = 0; j < this.listViewNames.length; j++) {
                        let subMenuObj = new Object();
                        subMenuObj.Name = this.listViewNames[j];
                        if(this.isNewListView) {
                            subMenuObj.highlightPanel = true;
                            subMenuObj.subTerritory = true;
                            this.isNewListView = false;
                        } else {
                            subMenuObj.highlightPanel = false;
                            subMenuObj.subTerritory = false;
                        }
                        subTerriorities.push(subMenuObj);
                    }
                    for (var i = 0; i < allCountries.length; i++) {
                        if (allCountries[i] != null) {
                            //Open USA panel by default
                            if (allCountries[i].countryName == 'United States' || allCountries[i].countryName == 'USA') {
                                this.activeCountry = allCountries[i].countryName;
                                this.countryList.push({
                                    Name: allCountries[i].countryName,
                                    highlightPanel: true,
                                    subTerritory: false,
                                    subTerritoriesList: []
                                });
                            }  else if (!['My Territories','My Followed Items'].includes(allCountries[i].countryName) && allCountries[i].NumOfAccounts) {
                                this.favRecordsCount = allCountries[0].NumOfAccounts;
                                this.countryList.push({
                                    Name: allCountries[i].countryName,
                                    highlightPanel: false,
                                    subTerritory: false,
                                    subTerritoriesList: []
                                });
                            }
                        }
                    }
                    
                    if (this.isMyTerritoriesClicked) {
                        this.setCountryHighligtning('My Territories');
                    } else if (currentActiveCountry != "" && currentActiveCountry) {
                        this.setCountryHighligtning(currentActiveCountry);
                    }
                    this.template.querySelector('c-metro-areas-by-state').updateSelectedCountery(this.activeCountry);
                    
                }
                if (this.listViewToBeDeleted == null) {
                    this.isLoading = false;
                }

            }).catch((error) => {
                this.isLoading = false;
                console.log("Error loading All Countries List: ", error);
            });
        }).catch((error) => {
            this.isLoading = false;
            console.log("Error loading Custom List Views: ", error);
        });
    }

    /**
     * Get all the custom list views and countries list view
     */
    getAllCountriesList(currentActiveCountry) {
        this.listViewNames = [];
        this.customListViewMap.clear();
        getAllListViewNames({}).then((allListViewRecords) => {
            if (allListViewRecords.length > 0) {
                for (var i = 0; i < allListViewRecords.length; i++) {
                    this.customListViewMap.set(allListViewRecords[i].Name, allListViewRecords[i].Id);
                    this.listViewNames.push(allListViewRecords[i].Name);
                }
            }
            getAllCountriesList({}).then((allCountries) => {
                if (allCountries) {
                    let subTerriorities = [];
                    for (var j = 0; j < this.listViewNames.length; j++) {
                        let subMenuObj = new Object();
                        subMenuObj.Name = this.listViewNames[j];
                        if(this.isNewListView) {
                            subMenuObj.highlightPanel = true;
                            subMenuObj.subTerritory = true;
                            this.isNewListView = false;
                        } else {
                            subMenuObj.highlightPanel = false;
                            subMenuObj.subTerritory = false;
                        }
                        subTerriorities.push(subMenuObj);
                    }
                    for (var i = 0; i < allCountries.length; i++) {
                        if (allCountries[i] != null) {
                            //Open USA panel by default
                            if (allCountries[i].countryName == 'United States' || allCountries[i].countryName == 'USA') {
                                this.activeCountry = allCountries[i].countryName;
                                this.countryList.push({
                                    Name: allCountries[i].countryName,
                                    highlightPanel: true,
                                    subTerritory: false,
                                    subTerritoriesList: []
                                });
                            } else if (allCountries[i].countryName == 'My Territories') {
                                this.countryList.push({
                                    Name: 'My Territories',
                                    highlightPanel: false,
                                    subTerritory: true,
                                    subTerritoriesList: subTerriorities
                                });
                            } else {
                                this.favRecordsCount = allCountries[0].NumOfAccounts;
                                let countryName = allCountries[i].countryName;
                                if (countryName == "My Followed Items") {
                                    countryName = `${countryName} (${allCountries[i].NumOfAccounts})`;
                                }
                                this.countryList.push({
                                    Name: countryName,
                                    highlightPanel: false,
                                    subTerritory: false,
                                    subTerritoriesList: []
                                });
                            }
                        }
                    }

                    if (this.isMyTerritoriesClicked) {
                        this.setCountryHighligtning('My Territories');
                    } else if (currentActiveCountry != "") {
                        this.setCountryHighligtning(currentActiveCountry);
                    }
                }
                if (this.listViewToBeDeleted == null) {
                    this.isLoading = false;
                }

            }).catch((error) => {
                this.isLoading = false;
                console.log("Error loading All Countries List: ", error);
            });
        }).catch((error) => {
            this.isLoading = false;
            console.log("Error loading Custom List Views: ", error);
        });
    }

    /**
     * Get Metro Area records
     */
    getMetroAreaRecords() {
        
        // To get total record count first
        getMetroAreaRecordsCount({
            searchList: this.searchTerm,
            isListView: this.isListView,
            activeCountry: this.activeCountry
        }).then((totalRecordCount) => {
            if (this.activeCountry != 'My Followed Items')
                this.totalRecordsCount = totalRecordCount;
            getMetroAreaRecords({
                searchList: this.searchTerm,
                activeCountry: this.activeCountry,
                isListView: this.isListView,
                sortBy: this.sortBy,
                sortOrder: this.sortDirection,
                offset: this.offset,
                recLimit: this.limit,
                favList: this.favRecordsList
            }).then((allMetroAreaRecords) => {
                if (allMetroAreaRecords.length > 0) {
                    var tempList = [];
                    if (this.isMyFav == true) {
                        this.favRecordsList = [];
                        this.totalRecordsCount = 0;
                        this.allFavoriteRecords.forEach((favElement, favIndex) => {  
                            var MetroAreaIdList = allMetroAreaRecords.map(function (el) { return el.MetroAreaId; });                          
                            if (favElement.Object_Name__c == 'Metro_Area__c' && MetroAreaIdList.includes(favElement.Target_Id__c)) {
                                this.favRecordsList.push(favElement.Target_Id__c);
                                this.totalRecordsCount++;
                            }
                            
                        });
                        
                    }
                    this.isMyFav = false;
                    for (var i = 0; i < allMetroAreaRecords.length; i++) {
                        let temObj = Object.assign({}, allMetroAreaRecords[i]);
                        temObj.NumOfAccounts = allMetroAreaRecords[i].NumOfAccounts;
                        temObj.NumOfContacts = allMetroAreaRecords[i].NumOfContacts;
                        temObj.Id = temObj.MetroAreaId;
                        if (allMetroAreaRecords[i].isFavorite == undefined) temObj.isFavorite = false;

                        //If country name is set 'All' from backend, don't show country as "All" in listview.
                        if (allMetroAreaRecords[i].Country != 'All') {
                            temObj.CountryName = allMetroAreaRecords[i].Country;
                        }
                        if (this.isCommunity) {
                            temObj.MetroAreaId = allMetroAreaRecords[i].MetroAreaId != undefined && allMetroAreaRecords[i].MetroAreaId != null ? "/" + this.communityName + "/s/metro-area/" + allMetroAreaRecords[i].MetroAreaId : null;
                        } else {
                            temObj.MetroAreaId = allMetroAreaRecords[i].MetroAreaId != undefined && allMetroAreaRecords[i].MetroAreaId != null ? "/" + allMetroAreaRecords[i].MetroAreaId : null;
                        }
                        tempList.push(temObj);
                    }

                    if (this.fromLoadMore) {
                        this.metroAreaFilteredRecords = this.metroAreaFilteredRecords.concat(tempList);
                        this.fromLoadMore = false;
                        if (this.tableElement) {
                            this.tableElement.isLoading = false;
                        }
                    } else {
                        this.metroAreaFilteredRecords = [...tempList];
                    }
                    // To highlight the country in case of search
                    if (this.isSearched) {
                        let arrOfCountries = [];
                        this.activeCountry = 'All';
                        this.metroAreaFilteredRecords.forEach((metroAreaRecord, index) => {
                            arrOfCountries.push(metroAreaRecord.Country);
                        });
                        const returnedCountrySet = new Set(arrOfCountries);
                        if (returnedCountrySet.size == 1) {
                            this.activeCountry = [...returnedCountrySet][0];
                        }

                        this.countryList.forEach((country, index) => {
                            if (country.Name.split(' (')[0] == this.activeCountry) {
                                this.countryList[index].highlightPanel = true;
                            } else {
                                this.countryList[index].highlightPanel = false;
                            }
                        });
                        this.columns = this.activeCountry == 'All' || this.activeCountry == 'My Followed Items' ? ALL_COLUMNS : COLUMNS;

                        this.scrollToSearchedCountry();
                        this.setColums();
                        this.isSearched = false;
                    }
                    
                    this.infiniteLoading = false;
                    this.offset = this.metroAreaFilteredRecords.length;
                    this.recordsExist = true;

                    // For showing + sign with count
                    if (this.offset >= this.totalRecordsCount || this.offset == 0) {
                        this.plusSign = '';
                    } else {
                        this.plusSign = '+';
                    }
                } else {
                    this.recordsExist = false;
                    this.plusSign = '';
                    this.setCountryHighligtning(this.activeCountry);
                }
                //Fetch all favorite records when the component is loaded
                if (this.fromConnectedCallback)
                    this.getAllFavoriteRecordsFromAPI();
                if(this.showSingleStateMetroAreas && this.recordsExist) {
                    this.showRecordsByState = false;
                    this.isLoading = false;
                }
            }).catch((error) => {
                console.log('error : ', error);
                this.isLoading = false;
            });
        }).catch(error => console.log(error));
    }

    /**
     * To scroll to the position where searched country is present in country list
     */
    scrollToSearchedCountry() {
        const searchCountryObject = this.countryList.find((countryObj) => countryObj.Name.split(' (')[0] == this.activeCountry);
        if (searchCountryObject != null) {
            if (this.activeCountry != null && this.activeCountry != undefined && this.activeCountry != '') {
                const scrollToCountry = this.template.querySelector('[data-id="' + searchCountryObject.Name + '"]');
                if (scrollToCountry != null && scrollToCountry != undefined) {
                    scrollToCountry.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                        inline: "nearest"
                    });
                }
            }
        }
    }

    handleListViewName(event) {
        this.listViewName = event.target.value.trim();
        if (this.listViewName != '' && this.isDisabled == true) {
            this.isDisabled = false;
        }
    }

    handleFilterFieldName(event) {
        this.filterFieldName = event.target.value.trim();
        this.operator = 'Equals'; // To reset the operator when field is changed
        if (this.filterFieldName == "Name") {
            this.isNameFilterField = true;
            this.filterStateValue = [];
            this.filterValue = '';
        } else {
            this.isNameFilterField = false;
        }
    }

    handleOperator(event) {
        this.operator = event.target.value.trim();
    }

    handleValue(event) {
        this.filterValue = event.target.value.trim();
        this.filterValue = this.filterValue.replace(/\s*,\s*(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/g, ",").replace(/\s{2,}/g, ' ').trim();
        if (this.listViewName != '' && this.isDisabled == true) {
            this.isDisabled = false;
        }
    }

    handleselectedStates(event) {
        let selectedStates = [];
        selectedStates = event.detail.payload.values;
        this.filterValue = selectedStates.toString();
        if (this.listViewName != '' && this.isDisabled == true) {
            this.isDisabled = false;
        }
    }

    handleDeleteListView(event) {
        this.isDeleteListViewModalOpen = true;
        this.listViewToBeDeleted = event.target.dataset.name;
    }

    closeDeleteListViewModal() {
        this.isDeleteListViewModalOpen = false;
        this.listViewToBeDeleted = null;
    }

    /**
     * Delete the custom list view
     */
    deleteListView() {
        this.isLoading = true;
        this.isDeleteListViewModalOpen = false;
        deleteListView({
            listViewName: this.listViewToBeDeleted
        }).then((isDeleted) => {
            if (isDeleted) {
                /** Custom toast message */
                this.toastmessage = 'List view removed.';
                this.title = 'Success';
                this.alternativeText = 'Success';
                this.showToast = true;
                this.iconName = 'utility:success';
                this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_success';
                this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-success slds-m-right_small slds-no-flex slds-align-top'
                setTimeout(() => {
                    this.showToast = false;
                }, 2000);
                var tempCountryList = this.countryList;
                this.countryList = [];
                var subTerritoriesListLength = (tempCountryList[1].subTerritoriesList).length;
                if ((tempCountryList[1].subTerritoriesList.filter(e => e.Name === this.listViewToBeDeleted)) != null) {
                    subTerritoriesListLength = subTerritoriesListLength - 1;
                    if (subTerritoriesListLength < 1) {
                        this.isMyTerritoriesClicked = false;
                    }
                }

                /**
                 * If the list view to be deleted is opened then delete the list view and 
                 * set 'United States' as active country
                 */
                if (this.activeCountry == this.listViewToBeDeleted || subTerritoriesListLength < 1) {
                    this.activeCountry = 'United States';
                    this.offset = 0;
                    this.isListView = false;
                    this.getAllCountriesList("");
                    this.getMetroAreaRecords();
                } else {
                    this.lastActiveCountry = this.activeCountry;
                    this.getAllCountriesList(this.activeCountry);
                }
            } else {
                /** Custom toast message */
                this.toastmessage = 'Cannot remove this list view. Contact your administrator for help.';
                this.title = 'Error';
                this.alternativeText = 'Error';
                this.showToast = true;
                this.iconName = 'utility:error';
                this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top'
                setTimeout(() => {
                    this.showToast = false;
                }, 2000);
            }
        }).catch((error) => {
            this.isLoading = false;
        });
    }

    /**
     * To save/edit the custom list view
     */
    saveListView() {
        // To disable the footer buttons 
        if (this.listViewToBeEditedId != '' || (this.listViewName != '' && this.filterValue != '')) {
            this.isDisabled = true;
        }

        if (this.listViewName == '' || this.filterValue == '') {
            /** Custom toast message */
            this.toastmessage = 'Kindly fill all the required fields.';
            this.title = 'Error';
            this.alternativeText = 'Error';
            this.showToast = true;
            this.iconName = 'utility:error';
            this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
            this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top';
            setTimeout(() => {
                this.showToast = false;
            }, 2000);
        } else if (this.listViewName.toLowerCase() == 'my territories') {
            // My Terriorities is shown as Folder so list view cannot be set as that
            // Custom toast message 
            this.toastmessage = '\'My Territories\' cannot be the name of List views.';
            this.title = 'Error';
            this.alternativeText = 'Error';
            this.showToast = true;
            this.iconName = 'utility:error';
            this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
            this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top';
            setTimeout(() => {
                this.showToast = false;
            }, 2000);
        } else {
            // Check if the list view name is not duplicate
            isDuplicateListViewName({
                listViewName: this.listViewName,
                listViewId: this.listViewToBeEditedId
            }).then((nameExists) => {
                if (nameExists == true) {
                    /** Custom toast message */
                    this.toastmessage = 'List view name already exists.';
                    this.title = 'Error';
                    this.alternativeText = 'Error';
                    this.showToast = true;
                    this.iconName = 'utility:error';
                    this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                    this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top';
                    setTimeout(() => {
                        this.showToast = false;
                    }, 2000);
                    this.isDisabled = false;
                } else {
                    // If list view name is not duplicate then save the list view
                    if (this.listViewToBeEditedId != '') {
                        this.isDisabled = true;
                    }
                    upsertListView({
                        listViewId: this.listViewToBeEditedId,
                        moduleName: 'Metro_Area__c',
                        listViewName: this.listViewName,
                        filterFieldName: this.filterFieldName,
                        operator: this.operator,
                        filterValue: this.filterValue
                    }).then(() => {
                        this.isModalOpen = false;
                        this.isDisabled = false;
                        var keyword = '';
                        var refreshMetroAreasPenal = false;
                        let activeCountryId = this.customListViewMap.get(this.activeCountry);
                        if (this.listViewToBeEditedId == '') {
                            keyword = 'created';
                        } else {
                            if (this.listViewToBeEditedId == activeCountryId) {
                                refreshMetroAreasPenal = true;
                            }
                            keyword = 'updated';
                        }

                        if(this.isNewListView) {
                            this.isListView = true;
                        }

                        //If a list view is active and we click on another list view to change its data
                        for (var i = 0; i < this.countryList.length; i++) {
                            if ((this.countryList[i].Name == 'My Territories' && this.isListView)) {
                                this.countryList[i].highlightPanel = true;
                                //If the list view is newly created, highlight this list view
                                if(this.isNewListView) {
                                    this.activeCountry = this.listViewName;
                                }
                                this.setSubTerritoriesHighligtning(this.listViewName, i);
                            }
                        }
                        if(this.activeListView != this.listViewName) {
                            refreshMetroAreasPenal = true;
                        }

                        /** Custom toast message */
                        this.toastmessage = 'List view ' + keyword + '.';
                        this.title = 'Success';
                        this.alternativeText = 'Success';
                        this.showToast = true;
                        this.iconName = 'utility:success';
                        this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_success';
                        this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-success slds-m-right_small slds-no-flex slds-align-top'
                        setTimeout(() => {
                            this.showToast = false;
                        }, 2000);
                        this.isLoading = true;
                        this.lastActiveCountry = this.activeCountry;
                        if (refreshMetroAreasPenal) {
                            if (activeCountryId != undefined && activeCountryId == this.listViewToBeEditedId) {
                                this.activeCountry = this.listViewName;
                            }
                            this.offset = 0;
                            this.limit = 40;
                            this.getMetroAreaRecords();
                        }
                        this.countryList = [];
                        this.getAllCountriesList(this.activeCountry);
                        this.listViewName = '';
                        this.operator = ' Equals';
                        this.filterValue = '';
                        this.listViewToBeEditedId = '';

                    }).catch((error) => {
                        console.log('Error : ', error);
                        this.isLoading = false;
                        this.isDisabled = false;

                        /** Custom toast message */
                        this.toastmessage = this.listViewName.length > 80 ? 'List view name should be less than 80 characters.' : error;
                        this.title = 'Error';
                        this.alternativeText = 'Error';
                        this.showToast = true;
                        this.iconName = 'utility:error';
                        this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                        this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top'
                        setTimeout(() => {
                            this.showToast = false;
                        }, 2000);
                    });
                }
            }).catch((error) => {
                console.log('Error : ', error);
                this.isLoading = false;
                /** Custom toast message */
                this.toastmessage = error;
                this.title = 'Error';
                this.alternativeText = 'Error';
                this.showToast = true;
                this.iconName = 'utility:error';
                this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top'
                setTimeout(() => {
                    this.showToast = false;
                }, 2000);
            });
        }
    }

    closePopup() {
        this.isModalOpen = false;
        if (this.isDisabled == true) {
            this.isDisabled = false;
        }
    }

    /**
     * When country is switched
     * @param {*} event 
     */
    changeCountryChevronStatus(event) {
        // If My Terriorities is clicked then highlight the list view
        if (event.currentTarget.dataset.id == 'My Territories') {
            this.isMyTerritoriesClicked = true;
            this.lastActiveCountry = this.activeCountry;
            this.activeListView = event.currentTarget.dataset.id;
            this.setCountryHighligtning(event.currentTarget.dataset.id);

        } else {
            this.plusSign = '';
            this.recordsExist = true;
            this.searchTerm = [];
            this.template.querySelector('[data-id="searchValue"]').value = '';
            this.sortBy = 'Sort_Order__c';
            this.sortedBy = 'NumOfAccounts';
            this.sortDirection = 'desc';
            this.offset = 0;
            this.limit = 40;
            this.metroAreaFilteredRecords = [];
            this.isMyTerritoriesClicked = false;
            this.lastActiveCountry = event.currentTarget.dataset.id.split(' (')[0];
            this.setCountryHighligtning(event.currentTarget.dataset.id);

            if (event.currentTarget.dataset.id.split(' (')[0] == 'My Followed Items') {
                this.isMyFav = true;
                this.favRecordsList = [];
                this.totalRecordsCount = 0;
                this.allFavoriteRecords.forEach((favElement, favIndex) => {
                    if (favElement.Object_Name__c == 'Metro_Area__c') {
                        this.favRecordsList.push(favElement.Target_Id__c);
                        this.totalRecordsCount++;
                    }
                });
            }
            if(this.showRecordsByState) {
                this.activeCountry = event.currentTarget.dataset.id.split(' (')[0];
                this.template.querySelector('c-metro-areas-by-state').updateSelectedCountery(this.activeCountry);
            } else {
                this.isLoading = true;
                this.setColums();
                this.getMetroAreaRecords();
                this.setDefaultSorting();
            }
        }
    }

    /**
     * To highlight/un-highlight sub-territories/custom list view list
     * @param {*} currentTarget 
     * @param {*} index 
     */
    setSubTerritoriesHighligtning(currentTarget, index) {
        for (var j = 0; j < this.countryList[index].subTerritoriesList.length; j++) {
            if (this.countryList[index].subTerritoriesList[j].Name == currentTarget) {
                this.activeCountry = this.countryList[index].subTerritoriesList[j].Name;
                this.countryList[index].subTerritoriesList[j].highlightPanel = true;
            } else {
                this.countryList[index].subTerritoriesList[j].highlightPanel = false;
            }
        }
    }

    /**
     * To highlight / un - highlight countries list view
     * @param {*} currentActiveCountry 
     */
    setCountryHighligtning(currentActiveCountry) {
        this.activeListView = currentActiveCountry;
        if (this.listViewNames.includes(currentActiveCountry)) {
            this.isListView = true;
        } else {
            currentActiveCountry = currentActiveCountry.split(' (')[0]
            this.isListView = false;
        }
        for (var i = 0; i < this.countryList.length; i++) {
            if (this.countryList[i].Name == 'My Territories' && this.isListView) {
                this.countryList[i].highlightPanel = true;
                this.setSubTerritoriesHighligtning(currentActiveCountry, i);
            } else if (this.countryList[i].Name.split(' (')[0] == currentActiveCountry) {
                this.activeCountry = this.lastActiveCountry;
                if (this.countryList[i].Name == 'My Territories') {
                    if (this.countryList[i].highlightPanel == true) {
                        this.countryList[i].highlightPanel = false;
                    } else {
                        this.countryList[i].highlightPanel = true;
                    }
                } else {
                    this.countryList[i].highlightPanel = true;
                }
            } else {
                //Close all other country panels
                this.countryList[i].highlightPanel = false;
                if (this.countryList[i].Name == 'My Territories') {
                    this.setSubTerritoriesHighligtning(currentActiveCountry, i);
                }
            }
        }
        if (this.listViewToBeDeleted != null) {
            this.isLoading = false;
            this.listViewToBeDeleted = null;
        }
    }

    /**
     * Function when list view is edited to get the details
     * @param {*} event 
     */
    handleEditListView(event) {
        this.isLoading = true;
        this.listViewPopupTitle = 'Edit List View';
        getListViewDetails({
            listViewName: event.target.dataset.name
        }).then((listViewDetails) => {
            if (listViewDetails) {
                this.listViewName = listViewDetails.Name;
                this.filterFieldName = listViewDetails.Field_Name__c;
                this.operator = listViewDetails.Operator__c;
                this.filterValue = listViewDetails.Filter__c;
                this.listViewToBeEditedId = listViewDetails.Id;
                // To set the field value accordingly
                if (this.filterFieldName == "Name") {
                    this.isNameFilterField = true;
                    this.filterStateValue = [];
                } else {
                    this.isNameFilterField = false;
                    this.filterStateValue = this.filterValue.split(',');
                }
                this.isModalOpen = true;
            }
            this.isLoading = false;
        }).catch((error) => {
            this.isLoading = false;
        });
    }

    searchMetroAreaOnEnter(event) {
        if (event.keyCode == 13) {
            this.fetchSearchResults();
        }
    }

    onHandleSort(event) {
        this.isLoading = true;
        this.plusSign = '';
        const {
            fieldName: sortedBy,
            sortDirection
        } = event.detail;
        this.sortBy = sortedBy;

        if (sortedBy == 'MetroAreaId') {
            this.sortBy = 'Name';
            this.sortByFieldLabel = 'Metro Area Name'
        } else if (sortedBy == 'CountryName') {
            this.sortBy = 'Country__c';
            this.sortByFieldLabel = 'Country';
        } else if (sortedBy == 'NumOfAccounts') {
            this.sortBy = 'Sort_Order__c';
            this.sortByFieldLabel = 'Number of Accounts';
        } else if (sortedBy == 'NumOfContacts') {
            this.sortBy = 'Number_of_Contacts__c';
            this.sortByFieldLabel = 'Number of Contacts';
        }

        //Setting limit & offset so that all loaded data is sorted
        this.limit = this.offset;
        this.offset = 0;

        this.sortDirection = sortDirection;
        this.metroAreaFilteredRecords = [];

        this.getMetroAreaRecords();
        this.setDefaultSorting();
    }

    fetchSearchResults(event) {
        this.recordsExist = true;
        this.searchTerm = [];
        let searchValue = '';
        this.metroAreaFilteredRecords = [];

        searchValue = this.template.querySelector('[data-id="searchValue"]').value;
        searchValue = searchValue.trim();

        if (searchValue != '') {
            this.searchTerm.push(searchValue)
        } else {
            this.searchTerm = null;
        }
        if (searchValue.toUpperCase() in STATE_MAP) {
            this.searchTerm.push(STATE_MAP[searchValue.toUpperCase()]);
        }

        //If any list view is active then on searching only the country panel should be highlighted
        for(var i=0; i<this.countryList.length; i++) {
            if (this.countryList[i].Name == 'My Territories') {
                for (var j = 0; j < this.countryList[i].subTerritoriesList.length; j++) {
                    this.countryList[i].subTerritoriesList[j].highlightPanel = false;
                }
            }
        }
        if(!this.showRecordsByState) {
            if (this.searchTerm != null && this.searchTerm.length > 0) {
                this.isLoading = true;
                this.offset = 0;
                this.activeCountry = '';
                this.sortBy = 'Sort_Order__c';
                this.sortedBy = 'NumOfAccounts';
                this.isSearched = true;
                this.getMetroAreaRecords();
                this.setDefaultSorting();
    
            } else {
                //For empty search, set the component to initial state
                this.resetFilters();
            }
        }
        else{
            this.template.querySelector('c-metro-areas-by-state').changeMessage(this.searchTerm);
            this.activeCountry ='All';
            this.countryList.forEach((country, index) => {
                if (country.Name.split(' (')[0] == this.activeCountry) {
                    this.countryList[index].highlightPanel = true;
                } else {
                    this.countryList[index].highlightPanel = false;
                }
            });
            this.scrollToSearchedCountry();
        }
    }

    /**
     * To reset the filters
     */
    resetFilters() {
        this.recordsExist = true;
        this.countryList = [];
        this.searchTerm = [];
        this.activeCountry = 'United States';
        this.sortBy = 'Sort_Order__c';
        this.sortedBy = 'NumOfAccounts';
        this.sortDirection = 'desc';
        this.offset = 0;
        this.limit = 40;
        this.metroAreaFilteredRecords = [];
        this.isListView = false;
        this.isMyTerritoriesClicked = false;
        this.showRecordsByState = false;
        this.showSingleStateMetroAreas = false;
        this.template.querySelector('[data-id="state-toggle"]').checked = false;
        this.template.querySelector('[data-id="searchValue"]').value = '';
        this.connectedCallback();
    }

    //function to provide infinite loading
    loadMoreData(event) {
        if (this.offset < this.totalRecordsCount) {
            this.isLoading = true;
            if (this.infiniteLoading) {
                return;
            }

            if (this.metroAreaFilteredRecords != null && event.target) {
                event.target.isLoading = false;
            }
            this.tableElement = event.target;
            this.infiniteLoading = true;
            this.fromLoadMore = true;
            this.getMetroAreaRecords();
        }
    }

    setColums() {
        this.columns = this.activeCountry == 'All' || this.activeCountry == 'My Followed Items' ? ALL_COLUMNS : COLUMNS;
    }

    setDefaultSorting() {

        if (this.sortBy == 'Name') {
            this.sortedBy = 'MetroAreaId';
        } else if (this.sortBy == 'Country__c') {
            this.sortedBy = 'CountryName';
        } else if (this.sortBy == 'Sort_Order__c') {
            this.sortedBy = 'NumOfAccounts';
        } else if (this.sortBy == 'Number_of_Contacts__c') {
            this.sortedBy = 'NumOfContacts';
        }
    }

    /**
     * This method is called from connected callback to get already favorited records when the component is loaded.
     * This method calls apex method to fetch all favorite records via REST UI API call
     */
    getAllFavoriteRecordsFromAPI() {
        getAllFavoriteRecords({}).then(returnedfavouriteRecords => {
            if (returnedfavouriteRecords != null && returnedfavouriteRecords.length > 0) {
                this.allFavoriteRecords = returnedfavouriteRecords;
                //Setting the already marked favorite records.
                this.allFavoriteRecords.forEach((favElement, favIndex) => {
                    this.metroAreaFilteredRecords.forEach((element, index) => {
                        if (element.Id == favElement.Target_Id__c) {
                            this.metroAreaFilteredRecords[index].isFavorite = true;
                            this.metroAreaFilteredRecords[index].favId = favElement.Favorite_Id__c;
                            this.metroAreaFilteredRecords[index].favoriteIcon = 'utility:check';
                            this.metroAreaFilteredRecords[index].favIconColor = "selectedFavIcon";
                            this.metroAreaFilteredRecords[index].iconStatus = 'Click To Unfollow';

                        }
                    });
                });

                this.metroAreaFilteredRecords = [...this.metroAreaFilteredRecords];
            }
            this.isLoading = false;
        }).catch((error) => {
            this.isLoading = false;
            /** Custom toast message */
            this.toastmessage = 'Error fetching followed record. Contact your administrator for help.';
            this.title = 'Error';
            this.alternativeText = 'Error';
            this.showToast = true;
            this.iconName = 'utility:error';
            this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
            this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top'
            setTimeout(() => {
                this.showToast = false;
            }, 2000);
            console.log('Error ', error);
        });
    }

    /**
     * To open List View creation pop-up
     */
    openModel() {
        this.listViewPopupTitle = 'Create List View';
        this.operator = 'Equals';
        this.listViewName = '';
        this.filterValue = '';
        this.filterStateValue = [];
        this.isNameFilterField = true;
        this.filterFieldName = 'Name';
        this.listViewToBeEditedId = '';
        this.isModalOpen = true;
        this.isNewListView = true;
    }

    /**
     * When favorite icon is clicked to add/remove a record from favorite list.
     * @param {*} event 
     */
    handleRowAction(event) {
        if (event.detail.action.name == 'fav_record') {
            const row = event.detail.row;
            this.recordId = row.Id;

            //Marking record as favorite
            if (!row.isFavorite) {
                if (this.allFavoriteRecords.length >= Number(this.maxFollowCount)) {
                    /** Custom toast message */
                    this.toastmessage ='You cannot follow more than '+this.maxFollowCount+' records.';
                    this.title = 'Error';
                    this.alternativeText = 'Error';
                    this.showToast = true;
                    this.iconName = 'utility:error';
                    this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                    this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top'
                    setTimeout(() => {
                        this.showToast = false;
                    }, 2000);
                    console.log('Error ', error);
                } else {
                    this.isLoading = true;
                    let favTargetType = 'Record';
                    let favTargetId = this.recordId;

                    addToFavorites({
                        recordId: favTargetId,
                        targetType: favTargetType
                    }).then((createdFavouriteRecord) => {
                        if (createdFavouriteRecord) {
                            this.favRecordsCount++;
                            this.countryList[0].Name = 'My Followed Items (' + this.favRecordsCount + ')';
                            //Set the parameters and icon color for currently marked favorite record
                            var tempList = [];
                            this.metroAreaFilteredRecords.forEach((element, index) => {
                                let temObj = Object.assign({}, element);
                                if (element.Id == this.recordId) {
                                    temObj.isFavorite = true;
                                    temObj.favId = createdFavouriteRecord.id;
                                    temObj.favoriteIcon = 'utility:check';
                                    temObj.favIconColor = "selectedFavIcon";
                                    temObj.iconStatus = 'Click To Unfollow';

                                }
                                tempList.push(temObj);
                            });
                            this.metroAreaFilteredRecords = [...tempList];
                            this.allFavoriteRecords.push(createdFavouriteRecord);
                            this.isLoading = false;

                            fireEvent(this.objPageReference,'updateFavList','');
                            //Display custom toast message for succesful favorite record created.
                            this.toastmessage = 'Successfully Followed.';
                            this.title = 'Success';
                            this.alternativeText = 'Success';
                            this.showToast = true;
                            this.iconName = 'utility:success';
                            this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_success';
                            this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-success slds-m-right_small slds-no-flex slds-align-top'
                            setTimeout(() => {
                                this.showToast = false;
                            }, 2000);
                        } else {
                            this.isLoading = false;
                            /** Custom toast message */
                            this.toastmessage = 'Cannot add this record to Followed Items. Contact your administrator for help.';
                            this.title = 'Error';
                            this.alternativeText = 'Error';
                            this.showToast = true;
                            this.iconName = 'utility:error';
                            this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                            this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top';
                            setTimeout(() => {
                                this.showToast = false;
                            }, 2000);
                        }
                    }).catch((error) => {
                        this.isLoading = false;
                        /** Custom toast message */
                        if(error && error.body && error.body.message && error.body.message.includes("Already added in the followed list")) {
                            this.toastmessage = 'Already following this record. Please refresh your page.';
                            this.title = 'info';
                            this.alternativeText = 'info';
                            this.showToast = true;
                            this.iconName = 'utility:info';
                            this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_info';
                            this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-info slds-m-right_small slds-no-flex slds-align-top'
                            setTimeout(() => {
                                this.showToast = false;
                            }, 2000);
                        }
                        else
                        {
                            this.toastmessage = 'Cannot add this record to Followed Items. Contact your administrator for help.';
                            this.title = 'Error';
                            this.alternativeText = 'Error';
                            this.showToast = true;
                            this.iconName = 'utility:error';
                            this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                            this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top';
                            setTimeout(() => {
                                this.showToast = false;
                            }, 2000);
                        }
                    });

                }
            } else {
                //Marking record as non-favorite
                this.isLoading = true;
                let favToBeRemovedId = this.recordId;
                removeFromFavorites({
                    favId: favToBeRemovedId
                }).then(() => {
                    this.favRecordsCount--;
                    this.countryList[0].Name = 'My Followed Items (' + this.favRecordsCount + ')';
                    if (this.activeCountry == 'My Followed Items') {


                        for(let i=0;i<this.favRecordsList.length;i++) {
                            if(this.favRecordsList[i] == row.Id) {
                                this.favRecordsList.splice(i, 1);
                                break;
                            }
                        }

                        this.offset = 0;
                        this.totalRecordsCount--;
                        this.getMetroAreaRecords();

                    } else {

                        //Set the parameters and icon color for currently marked non-favorite record
                        var tempList = [];
                        this.metroAreaFilteredRecords.forEach((element, index) => {
                            let temObj = Object.assign({}, element);
                            if (element.Id == this.recordId) {
                                temObj.isFavorite = false;
                                temObj.favId = '';
                                temObj.favoriteIcon = 'utility:add';
                                temObj.favIconColor = "slds-icon-text-light addIconStyling";
                                temObj.iconStatus = 'Click To Follow';

                            }
                            tempList.push(temObj);
                        });
                        this.metroAreaFilteredRecords = [...tempList];
                        this.isLoading = false;
                    }

                    //Remove the non-favourite record from the favorite list.
                    for (let i = 0; i < this.allFavoriteRecords.length; i++) {
                        if (this.allFavoriteRecords[i].Target_Id__c == favToBeRemovedId) {
                            this.allFavoriteRecords.splice(i, 1);
                            break;
                        }
                    }
                    fireEvent(this.objPageReference,'updateFavList','');
                    /** Custom toast message */
                    this.toastmessage = 'Successfully Removed From Followed Items.';
                    this.title = 'Info';
                    this.alternativeText = 'Info';
                    this.showToast = true;
                    this.iconName = 'utility:info';
                    this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_info';
                    this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-info slds-m-right_small slds-no-flex slds-align-top'
                    setTimeout(() => {
                        this.showToast = false;
                    }, 2000);

                }).catch((error) => {
                    console.log('Error ', error);
                    this.isLoading = false;
                    /** Custom toast message */
                    this.toastmessage = 'Cannot remove this record from followed items. Contact your administrator for help.';
                    this.title = 'Error';
                    this.alternativeText = 'Error';
                    this.showToast = true;
                    this.iconName = 'utility:error';
                    this.toastMsgClasses = 'slds-notify slds-notify_toast slds-theme_error';
                    this.toastMsgIconClasses = 'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top'
                    setTimeout(() => {
                        this.showToast = false;
                    }, 2000);
                });
            }
        }
    }

    /**
     * To open custom toast pop up
     */
    closeToast() {
        this.showToast = false;
    }

    async changeStateToggle() {
        this.recordsExist = true;
        //this.isLoading = true;
        this.template.querySelector('[data-id="searchValue"]').value = '';
        const element = this.template.querySelector('[data-id="state-toggle"]');
        if(element.checked) {
            //this.isLoading = true;
            this.showRecordsByState = true;
            
            //Dont highlight any country
            this.countryList.forEach((country, index) => {
                let currentCountry = this.countryList[index].Name.replace(/\([^()]*\)/g, '').trim();
                if(currentCountry == this.activeCountry) {
                    this.countryList[index].highlightPanel = true;
                } else {
                    this.countryList[index].highlightPanel = false;
                }
            });

            await this.getAllCountriesListForState();
        } else {
            this.showRecordsByState = false;
            this.resetFilters();
        }
    }

    showMetroAreasByState(event) {
        var stateDetails = JSON.parse(JSON.stringify(event.detail));
        var stateName = stateDetails.StateName;

        var url = '/state-detail-page?stateName=' + stateName;
        if(this.isCommunity)
        {
            this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
                attributes: {
                    url: url
                }
            });
        }
    }

    childDataLoaded(event){
        this.isLoading = event.detail.isloaded;
    }

    updateStateCount(event) {
        this.offset = event.detail.offset;
        var stateCount = event.detail.totalRecords;
        // For showing + sign with count
        if(this.offset >= stateCount || this.offset == 0) {
            this.plusSign = '';
        } else {
            this.plusSign = '+';
        }
    }
}