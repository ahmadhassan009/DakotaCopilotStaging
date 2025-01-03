import { LightningElement, wire, api, track } from 'lwc';
import fetchFilteredRecords from '@salesforce/apex/DakotaContentController.fetchFilteredRecords';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import activeCommunities from '@salesforce/label/c.active_communities';
import { loadStyle } from 'lightning/platformResourceLoader';
import SVG_FULLSCREEN from '@salesforce/resourceUrl/dakota_search_full_screen';
import DakotaContentVideosCSS from '@salesforce/resourceUrl/DakotaContentVideosCSS';

export default class DakotaContentSearch extends LightningElement {
    @track error;
    @track isModalOpen;
    @track allDakotaContentRecords = [];
    isLoading;
    fullUrl;
    isCommunity = false;
    limit = 20;
    offset = 0;
    totalRecordCount;
    disableLoadMore = false;
    fromConstructor;
    sortedDirection = 'desc';
    pillItems;
    isShowPills;
    checkClassic;
    showToastOnClassic = false;
    headingStyle;
    searchbarStyle;
    infiniteLoading = false;
    sortedField = 'dcDate';
    defaultSortDirection = 'desc';
    nameSortDir = this.defaultSortDirection;
    successPopupShown = false;
    isSorted = false;
    dakotaContentLineColumns;
    renderedURL = '';
    svgURL = `${SVG_FULLSCREEN}#fullscreen`

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    @track dakotaContentLineColumnsBeforeSearch = [
        {
            label: "Date",
            fieldName: "dcDate",
            type: "date-local",
            sortable: true,
            initialWidth: 175,
            typeAttributes: {
                day: "numeric",
                month: "numeric",
                year: "numeric"
            }
        },
        {
            label: "Type",
            fieldName: "dcType",
            initialWidth: 250,
            type: "text",
            sortable: 'true'
        },
        {
            label: "Watch",
            type: "button-icon",
            initialWidth: 70,
            typeAttributes: {
                iconName: { fieldName: 'dakotaContentURLIconStyle' },
                name: { fieldName: 'dakotaContentURL' },
                title: { fieldName: 'parentDcName' },
                variant: "bare",
                iconClass: { fieldName: 'dakotaContentURLIconClass' },
                disabled: { fieldName: 'dakotaContentURLDisabled' }
            }
        },

        {
            label: "Featured On",
            fieldName: "parentDcURL",
            type: "url",
            typeAttributes: { label: { fieldName: 'parentDcName' }, target: '_self', tooltip: { fieldName: 'parentDcName' } },
            sortable: true
        },
        {
            label: "Content Name",
            fieldName: "childDcURLs",
            type: "richText",
            wrapText: true,
            hideDefaultActions: true
        }
    ];

    @track dakotaContentLineColumnsAfterSearch = [
        {
            label: "Date",
            fieldName: "dcDate",
            type: "date-local",
            sortable: true,
            initialWidth: 175,
            typeAttributes: {
                day: "numeric",
                month: "numeric",
                year: "numeric"
            }
        },
        {
            label: "Type",
            fieldName: "dcType",
            initialWidth: 250,
            type: "text",
            sortable: 'true'
        },
        {
            label: "Watch",
            type: "button-icon",
            initialWidth: 70,
            typeAttributes: {
                iconName: { fieldName: 'dakotaContentURLIconStyle' },
                name: { fieldName: 'dakotaContentURL' },
                title: { fieldName: 'parentDcName' },
                variant: "bare",
                iconClass: { fieldName: 'dakotaContentURLIconClass' },
                disabled: { fieldName: 'dakotaContentURLDisabled' }
            }
        },

        {
            label: "Featured On",
            fieldName: "parentDcURL",
            type: "url",
            typeAttributes: { label: { fieldName: 'parentDcName' }, target: '_self', tooltip: { fieldName: 'parentDcName' } },
        },
        {
            label: "Content Name",
            fieldName: "childDcURLs",
            type: "richText",
            wrapText: true,
            hideDefaultActions: true
        }
    ];

    constructor() {
        super();
        this.getURL();
        this.dakotaContentLineColumns = this.dakotaContentLineColumnsBeforeSearch;
        this.fromConstructor = true;
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
        this.pillItems = [];
        this.fetchRecords();
        this.isShowPills = false;
        this.isLoading = true;
        this.isModalOpen = false;
        this.fullUrl = "";
    }

    @api
    setRenderedURL(url) {
        this.renderedURL = url;
        if (this.renderedURL && this.allDakotaContentRecords?.length > 0) {
            let tempList = [];
            this.allDakotaContentRecords.forEach((obj) => {
                if (obj.dakotaContentURL == this.renderedURL) {
                    obj.dakotaContentURLIconClass = obj.dakotaContentURLIconClass + ' cstm_color';
                } else {
                    obj.dakotaContentURLIconClass = (obj.Presentation_Recording_url != null ? 'slds-button__icon slds-button__icon_large' : 'slds-hide');
                }
                tempList.push(obj);
            });
            this.allDakotaContentRecords = [...tempList];
        }
    }

    @api
    closeVideoContent() {
        this.renderedURL = '';
        let tempList = [];
        this.allDakotaContentRecords.forEach((obj) => {
            obj.dakotaContentURLIconClass = (obj.Presentation_Recording_url != null ? 'slds-button__icon slds-button__icon_large' : 'slds-hide');
            tempList.push(obj);
        });
        this.allDakotaContentRecords = [...tempList];
        this.isModalOpen = false;
    }

    getURL() {
        window.postMessage({
            key: "getVideoIframeURL"
        }, '*');
    }

    connectedCallback() {
        Promise.all([
            loadStyle(this, DakotaContentVideosCSS)
        ]);

        var str = window.location.origin;
        if (str.includes("lightning.force.com") || this.isCommunity == true) {
            this.checkClassic = false;
        }
        else {
            this.checkClassic = true;
        }

        if (this.checkClassic) {
            this.headingStyle = 'line-height: 1.25 !important;'
            this.searchbarStyle = 'padding-right: 5px; width:397px; padding-top: 14px;'
        }
        else {
            this.searchbarStyle = 'padding-right: 5px; width:397px;'
        }
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        let row = event.detail.row;
        this.closeModal();

        if (actionName.fieldName == 'dakotaContentURL') {
            this.fullUrl = row.dakotaContentURL;
            let tempList = [];
            this.allDakotaContentRecords.forEach((obj) => {
                if (obj.dakotaContentURL == row.dakotaContentURL) {
                    obj.dakotaContentURLIconClass = obj.dakotaContentURLIconClass + ' cstm_color';
                } else {
                    obj.dakotaContentURLIconClass = (obj.Presentation_Recording_url != null ? 'slds-button__icon slds-button__icon_large' : 'slds-hide');
                }
                tempList.push(obj);
            });
            this.allDakotaContentRecords = [...tempList];
            this.openModal();
        }
    }

    openModal() {
        // to open modal set isModalOpen tarck value as true
        this.isModalOpen = true;
        window.postMessage({
            key: "openVideoContent",
            details: {
                isModalOpen: this.isModalOpen,
                svgURL: this.svgURL,
                fullUrl: this.fullUrl
            }
        }, '*');
    }

    closeModal() {
        // to close modal set isModalOpen tarck value as false
        this.isModalOpen = false;
    }

    openFullScreen() {
        window.open(this.fullUrl);
    }

    showToast(type, title, message, variant, mode) {
        const evt = new ShowToastEvent({
            type: type,
            title: title,
            message: message,
            variant: variant,
            mode: mode
        });
        this.dispatchEvent(evt);
    }

    handleLoadMore(event) {
        this.getURL();
        let tempSortBy = this.sortedField;
        if (this.sortedField == 'parentDcURL') {
            tempSortBy = 'Name';
        } else if (this.sortedField == 'dcDate') {
            tempSortBy = 'Date__c';
        } else if (this.sortedField == 'dcType') {
            tempSortBy = 'Type__c';
        }

        if (this.disableLoadMore) {
            this.disableLoadMore = false;
            return;
        }
        if (this.fromConstructor == true) {
            this.fromConstructor = false;
            return;
        }
        const { target } = event;
        //Display a spinner to signal that data is being loaded   
        if (this.totalRecordCount > this.offset) {

            if (this.infiniteLoading)
                return;
            this.infiniteLoading = true;
            if (this.allDakotaContentRecords != null && event.target) {
                event.target.isLoading = true;
            }
            this.tableElement = event.target;
            this.loadMoreStatus = 'Loading';
            fetchFilteredRecords({
                searchFilters: JSON.stringify(this.pillItems),
                recordLimit: this.limit,
                offset: this.offset,
                sortBy: tempSortBy,
                sortOrder: this.sortedDirection
            }).then(result => {
                if (result != null && result.dcRecords != null) {
                    this.totalRecordCount = result.totalRecordCount;
                    let newData = JSON.parse(JSON.stringify(result.dcRecords));
                    let allRecords = [...this.allDakotaContentRecords, ...newData];
                    this.allDakotaContentRecords = allRecords;
                    if (this.totalRecordCount > this.limit && (this.isSearch == true || this.isSorted == true)) {
                        this.successPopupShown = false;
                    }
                    else if (this.totalRecordCount < this.limit) {
                        this.successPopupShown = true;
                    }
                    this.setDataAttributes();
                    this.isLoading = false;
                    if ((this.offset + 20) >= this.totalRecordCount || (this.offset) == 0) {
                        this.offset = this.totalRecordCount;
                    } else {
                        this.offset = parseInt(this.offset) + parseInt(this.limit);
                    }
                }

                this.loadMoreStatus = '';
                if (this.tableElement) {
                    this.tableElement.isLoading = false;
                }
                this.infiniteLoading = false;

            }).catch(error => {

                this.isLoading = false;
                this.error = error;
                console.log('this.error:  ', this.error)
                this.showToast('Error', 'Error', 'Error getting records from Server: ' + this.error, 'error', 'sticky');
            })
        }
        else {
            target.isLoading = false;
            this.disableLoadMore = true;
            if (this.allDakotaContentRecords.length == this.totalRecordCount && this.successPopupShown == false) {
                this.showToast('Success', 'Success', 'All Dakota Content records are Loaded!', 'success', 'dismissible');
                this.successPopupShown = true;
            }
        }
    }

    fetchRecords() {
        this.isLoading = true;
        let newData;
        let tempSortBy = this.sortedField;
        if (this.sortedField == 'parentDcURL') {
            tempSortBy = 'Name';
        } else if (this.sortedField == 'dcDate') {
            tempSortBy = 'Date__c';
        } else if (this.sortedField == 'dcType') {
            tempSortBy = 'Type__c';
        }

        return fetchFilteredRecords({
            searchFilters: JSON.stringify(this.pillItems),
            recordLimit: this.limit,
            offset: this.offset,
            sortBy: tempSortBy,
            sortOrder: this.sortedDirection
        }).then(result => {
            if (result) {
                if (result != null && result.dcRecords != null) {

                    if (result.dcRecords != null) {
                        this.totalRecordCount = result.totalRecordCount;

                        if (this.totalRecordCount > this.limit && (this.isSearch == true || this.isSorted == true)) {
                            this.successPopupShown = false;
                        }
                        else if (this.totalRecordCount < this.limit) {
                            this.successPopupShown = true;
                        }

                        if (this.isSorted == true) {
                            this.allDakotaContentRecords = [];
                        }
                        newData = JSON.parse(JSON.stringify(result.dcRecords));
                        let allRecords = [...this.allDakotaContentRecords, ...newData];
                        this.allDakotaContentRecords = allRecords;
                        this.offset = this.allDakotaContentRecords.length;
                        this.setDataAttributes();
                    }
                }
            }
            this.isLoading = false;

        }).catch(error => {
            this.isLoading = false;
            this.error = error;
            console.log('this.error:  ', this.error)
            this.showToast('Error', 'Error', 'Error getting records from Server: ' + this.error, 'error', 'sticky');
        })
    }

    handleItemRemove(event) {
        this.getURL();
        this.pillItems = this.pillItems.filter(item => item.name !== event.target.name);
        if (this.pillItems.length == 0) {
            this.isShowPills = false;
            this.dakotaContentLineColumns = this.dakotaContentLineColumnsBeforeSearch;
        }
        this.allDakotaContentRecords = [];
        this.totalRecordCount = 0;
        this.disableLoadMore = false;
        this.offset = 0;
        this.fetchRecords();
    }

    fetchFilteredDakotaContents() {
        this.getURL();
        if (this.template.querySelector('[data-id="searchValue"]').value != '') {
            this.dakotaContentLineColumns = this.dakotaContentLineColumnsAfterSearch;
        }
        else {
            this.dakotaContentLineColumns = this.dakotaContentLineColumnsBeforeSearch;
        }
        this.isSearch = true;
        this.isLoading = true;

        var searchValue = this.template.querySelector('[data-id="searchValue"]').value;
        searchValue = searchValue.trim();
        var searchValueExist = false;

        for (var k = 0; k < this.pillItems.length; k++) {
            if (this.pillItems[k].label.toLowerCase() == searchValue.toLowerCase()) {
                searchValueExist = true;
                break;
            }
        }

        if (searchValueExist == false) {
            this.totalRecordCount = 0;
            this.allDakotaContentRecords = [];
            this.offset = 0;
            this.limit = 20;
            this.disableLoadMore = false;
            this.isLoading = false;
            this.fromConstructor = true;

            if (searchValue != '') {
                var temppillItems = this.pillItems;
                temppillItems = [...temppillItems, { label: searchValue, name: searchValue }];
                this.pillItems = temppillItems;
                this.isShowPills = true;
            }
            this.fetchRecords();
        }
        else {
            this.isLoading = false;
            this.showToast('Warning', 'Duplicate', 'Search value already exists!', 'warning', 'dismissible');

            if (this.checkClassic) {
                this.showToastOnClassic = true;
                this.delayTimeout = setTimeout(() => {
                    this.closeToast();
                }, 5000);
            }
        }
    }
    closeToast() {
        this.showToastOnClassic = false;
    }

    resetFilters(event) {
        this.getURL();
        this.dakotaContentLineColumns = this.dakotaContentLineColumnsBeforeSearch;
        this.infiniteLoading = false;
        this.isLoading = true;
        this.template.querySelector('[data-id="searchValue"]').value = '';
        this.successPopupShown = false;
        this.isShowPills = false;
        this.allDakotaContentRecords = [];
        this.offset = 0;
        this.totalRecordCount = 0;
        this.disableLoadMore = false;
        this.pillItems = [];
        this.fromConstructor = true;
        this.sortedField = 'dcDate';
        this.sortedDirection = 'desc';
        this.fetchRecords();
    }

    onHandleSort(event) {
        this.isLoading = true;
        this.disableLoadMore = true;
        this.isSorted = true;
        this.sortedDirection = event.detail.sortDirection;
        this.sortedField = event.detail.fieldName;
        let tempSortBy = this.sortedField;
        if (this.sortedField == 'parentDcURL') {
            tempSortBy = 'Name';
        } else if (this.sortedField == 'dcDate') {
            tempSortBy = 'Date__c';
        } else if (this.sortedField == 'dcType') {
            tempSortBy = 'Type__c';
        }
        this.sortedDirection = this.nameSortDir === 'desc' ? 'asc' : 'desc';
        this.nameSortDir = this.sortedDirection;
        fetchFilteredRecords({
            searchFilters: JSON.stringify(this.pillItems),
            recordLimit: this.limit,
            offset: 0,
            sortBy: tempSortBy,
            sortOrder: this.sortedDirection
        }).then(result => {
            if (result != null && result.dcRecords != null) {

                this.totalRecordCount = result.totalRecordCount;
                this.allDakotaContentRecords = [];
                let newData = JSON.parse(JSON.stringify(result.dcRecords));
                let allRecords = [...this.allDakotaContentRecords, ...newData];
                this.allDakotaContentRecords = allRecords;
                this.offset = this.allDakotaContentRecords.length;
                if (this.totalRecordCount > this.limit && (this.isSearch == true || this.isSorted == true)) {
                    this.successPopupShown = false;
                }
                else if (this.totalRecordCount < this.limit) {
                    this.successPopupShown = true;
                }
                this.setDataAttributes();
            }
            this.isLoading = false;
            this.infiniteLoading = false;
        }).catch(error => {
            this.isLoading = false;
            this.error = error;
            console.log('this.error:  ', this.error)
            this.showToast('Error', 'Error', 'Error getting records from Server: ' + this.error, 'error', 'sticky');
        });
    }

    checkEnterKeyPress(event) {
        if (event.keyCode == 13) {
            this.dakotaContentLineColumns = this.dakotaContentLineColumnsAfterSearch;
            this.isLoading = true;
            this.fetchFilteredDakotaContents();
        }
    }
    /**
     * Set data table attributes
     */
    setDataAttributes() {
        var isCommunityInterface = this.isCommunity;
        if (this.allDakotaContentRecords != null) {
            for (var i = 0; i < this.allDakotaContentRecords.length; i++) {
                this.allDakotaContentRecords[i].dakotaContentURL = this.allDakotaContentRecords[i].Presentation_Recording_url;
                this.allDakotaContentRecords[i].dakotaContentURLIconStyle = (this.allDakotaContentRecords[i].Presentation_Recording_url != null ? 'utility:video' : '');
                this.allDakotaContentRecords[i].dakotaContentURLIconClass = (this.allDakotaContentRecords[i].Presentation_Recording_url != null ? this.allDakotaContentRecords[i].Presentation_Recording_url === this.renderedURL ? 'slds-button__icon slds-button__icon_large cstm_color' : 'slds-button__icon slds-button__icon_large' : 'slds-hide');
                this.allDakotaContentRecords[i].dakotaContentURLColType = (this.allDakotaContentRecords[i].Presentation_Recording_url != null ? 'button-icon' : '');
                this.allDakotaContentRecords[i].dakotaContentURLDisabled = (this.allDakotaContentRecords[i].Presentation_Recording_url != null ? false : true);
                this.allDakotaContentRecords[i].parentDcName = this.allDakotaContentRecords[i].Name;
                this.allDakotaContentRecords[i].dcType = this.allDakotaContentRecords[i].Type;
                this.allDakotaContentRecords[i].dcDate = this.allDakotaContentRecords[i].dakotaContentdate;
                this.allDakotaContentRecords[i].childDcURLs = this.allDakotaContentRecords[i].childDakotaContents;
                if (isCommunityInterface) {
                    let recordId = this.allDakotaContentRecords[i].isParent == true ? this.allDakotaContentRecords[i].Id : this.allDakotaContentRecords[i].Dakota_Live_Call
                    this.allDakotaContentRecords[i].parentDcURL = "/" + this.communityName + "/s/detail/" + recordId;
                }
                else {
                    this.allDakotaContentRecords[i].parentDcURL = "/s/detail/" + his.allDakotaContentRecords[i].isParent ? this.allDakotaContentRecords[i].Id : this.allDakotaContentRecords[i].Dakota_Live_Call;
                }
            }
        }
    }
}