import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import fetchFilteredSalesTrainingRecords from '@salesforce/apex/SalesTrainingController.fetchFilteredSalesTrainingRecords';
import updateNumberOfViews from '@salesforce/apex/SalesTrainingController.updateNumberOfViews';
import LOCALE from "@salesforce/i18n/locale";
import { loadStyle } from 'lightning/platformResourceLoader';
import salesTrainingCSS from '@salesforce/resourceUrl/salesTrainingCSS';


export default class salesTrainingView extends LightningElement {
    isLoading = false;
    searchValue = '';
    sortedDirection = 'asc';
    subTopicSortyBy = 'Sub_Topic_Chapter_Number__c';
    subTopicSortyDirection = 'asc';
    sortBy = 'Chapter_Number__c';
    allSalesTrainingRecords = [];
    contentArrowUp = true;
    titleArrowUp = false;
    categoryArrowUp = false;
    whatWillYouLearnArrowUp = false;
    numOfViewsArrowUp = false;
    showMenuForContent = false;
    showMenuForTitle = false;
    showMenuForCategory = false;
    chapterNumArrowUp = true;
    showMenuForWhatWillYouLearn = false;
    showMenuForNumOfViews = false;
    contentTextProperty = 'slds-hyphenate';
    titleTextProperty = 'slds-hyphenate';
    categoryTextProperty = 'slds-truncate';
    whatWillYouLearnTextProperty = 'slds-hyphenate';
    numOfViewsTextProperty = 'slds-truncate';
    contentWrap = '';
    titleWrap = '';
    categoryWrap = '';
    whatWillYouLearnWrap = '';
    numOfViewsWrap = '';
    numOfViewsSortIcon = 'width: var(--lwc-squareIconSmallContent,0.75rem);height: var(--lwc-squareIconSmallContent,0.75rem);margin-left: var(--lwc-spacingXxSmall,0.25rem);display: none;'
    titleSortIcon = 'width: var(--lwc-squareIconSmallContent,0.75rem);height: var(--lwc-squareIconSmallContent,0.75rem);margin-left: var(--lwc-spacingXxSmall,0.25rem);display: none;'
    categorySortIcon = 'width: var(--lwc-squareIconSmallContent,0.75rem);height: var(--lwc-squareIconSmallContent,0.75rem);margin-left: var(--lwc-spacingXxSmall,0.25rem);display: none;'
    contentSortIcon = 'width: var(--lwc-squareIconSmallContent,0.75rem);height: var(--lwc-squareIconSmallContent,0.75rem);margin-left: var(--lwc-spacingXxSmall,0.25rem);display: none;';
    chapterNumSortIcon = 'width: var(--lwc-squareIconSmallContent,0.75rem);height: var(--lwc-squareIconSmallContent,0.75rem);margin-left: var(--lwc-spacingXxSmall,0.25rem);display: inline-block;';
    connectedCallback() {
        Promise.all([
            loadStyle(this, salesTrainingCSS)
        ]);
        this.isLoading = true;
        this.getSalesTrainingRecords()
    }

    sortData(children) {
        if (this.subTopicSortyBy == 'title') {
            if (this.subTopicSortyDirection == 'asc') {
                children.sort((a, b) => {
                    if (a.title && b.title) {
                        return a.title.localeCompare(b.title);
                    }
                    return 0;
                });
            }
            else {
                children.sort((a, b) => {
                    if (a.title && b.title) {
                        return b.title.localeCompare(a.title);
                    }
                    return 0;
                });
            }
        }
        else if (this.subTopicSortyBy == 'category') {
            if (this.subTopicSortyDirection == 'asc') {
                children.sort((a, b) => {
                    const categoryA = a.category || ''; // Handle missing or undefined category
                    const categoryB = b.category || ''; // Handle missing or undefined category
                    return categoryA.localeCompare(categoryB); // Compare as strings
                });

            }
            else {
                children.sort((a, b) => {
                    const categoryA = a.category || ''; // Handle missing or undefined category
                    const categoryB = b.category || ''; // Handle missing or undefined category
                    return categoryB.localeCompare(categoryA); // Compare as strings
                });
            }
        }
        else if (this.subTopicSortyBy == 'num_of_views') {
            if (this.subTopicSortyDirection == 'asc') {
                children.sort((a, b) => {
                    return a.num_of_views - b.num_of_views;
                });
            }
            else {
                children.sort((a, b) => {
                    return b.num_of_views - a.num_of_views;
                });
            }
        }
        else if (this.subTopicSortyBy == 'Sub_Topic_Chapter_Number__c') {
            if (this.subTopicSortyDirection == 'asc') {
                children.sort((a, b) => {
                    return a.sub_topic_chapter_number - b.sub_topic_chapter_number;
                });
            }
            else {
                children.sort((a, b) => {
                    return b.sub_topic_chapter_number - a.sub_topic_chapter_number;
                });
            }
        }
       
    }

    applyTextPropertyOnColumn(event) {
        let columnHeaderName = event.currentTarget.closest('ul').dataset.id;
        let textProperty = event.currentTarget.closest('li').dataset.id;

        if (columnHeaderName == 'topic') {
            this.contentTextProperty = textProperty == 'wrap' ? 'slds-hyphenate' : 'slds-truncate';
            this.showMenuForContent = false;
        }
        else if (columnHeaderName == 'title') {
            this.titleTextProperty = textProperty == 'wrap' ? 'slds-hyphenate' : 'slds-truncate';
            this.showMenuForTitle = false;
        }
        else if (columnHeaderName == 'category') {
            this.categoryTextProperty = textProperty == 'wrap' ? 'slds-hyphenate' : 'slds-truncate';
            this.showMenuForCategory = false;
        }
        else if (columnHeaderName == 'WhatWillYouLearn') {
            this.whatWillYouLearnTextProperty = textProperty == 'wrap' ? 'slds-hyphenate' : 'slds-truncate';
            this.showMenuForWhatWillYouLearn = false;
        }
        else if (columnHeaderName == 'numOfViews') {
            this.numOfViewsTextProperty = textProperty == 'wrap' ? 'slds-hyphenate' : 'slds-truncate';
            this.showMenuForNumOfViews = false;
        }

    }

    handleContextMenu(event) {
        event.preventDefault(); // Prevent the default context menu from appearing
    }

    handleMenuIconClick(event) {
        let columnHeaderName = event.currentTarget.closest('button').dataset.id;
        if (columnHeaderName == 'topic') {
            this.showMenuForContent = !this.showMenuForContent;
            this.showMenuForNumOfViews = this.showMenuForWhatWillYouLearn = this.showMenuForCategory = this.showMenuForTitle = false;
        }
        else if (columnHeaderName == 'title') {
            this.showMenuForTitle = !this.showMenuForTitle;
            this.showMenuForNumOfViews = this.showMenuForWhatWillYouLearn = this.showMenuForCategory = this.showMenuForContent = false;
        }
        else if (columnHeaderName == 'category') {
            this.showMenuForCategory = !this.showMenuForCategory;
            this.showMenuForNumOfViews = this.showMenuForWhatWillYouLearn = this.showMenuForTitle = this.showMenuForContent = false;
        }
        else if (columnHeaderName == 'WhatWillYouLearn') {
            this.showMenuForWhatWillYouLearn = !this.showMenuForWhatWillYouLearn;
            this.showMenuForNumOfViews = this.showMenuForCategory = this.showMenuForTitle = this.showMenuForContent = false;
        }
        else if (columnHeaderName == 'numOfViews') {
            this.showMenuForNumOfViews = !this.showMenuForNumOfViews;
            this.showMenuForWhatWillYouLearn = this.showMenuForCategory = this.showMenuForTitle = this.showMenuForContent = false;
        }
    }

    closeColumnMenuPopup() {
        this.showMenuForNumOfViews = this.showMenuForWhatWillYouLearn = this.showMenuForCategory = this.showMenuForTitle = this.showMenuForContent = false;
    }

    handleSortByContent() {
        this.contentArrowUp = !this.contentArrowUp;
        this.sortedDirection = this.contentArrowUp ? 'asc' : 'desc';
        this.sortBy = 'Title__c';
        this.chapterNumSortIcon = 'width: var(--lwc-squareIconSmallContent,0.75rem);height: var(--lwc-squareIconSmallContent,0.75rem);margin-left: var(--lwc-spacingXxSmall,0.25rem);display: none;';
        this.contentSortIcon = 'width: var(--lwc-squareIconSmallContent,0.75rem);height: var(--lwc-squareIconSmallContent,0.75rem);margin-left: var(--lwc-spacingXxSmall,0.25rem);display: inline-block;';
        this.getSalesTrainingRecords();
    }
    handleSortByChapterNum() {
        this.chapterNumArrowUp = !this.chapterNumArrowUp;
        this.sortedDirection = this.chapterNumArrowUp ? 'asc' : 'desc';
        this.sortBy = 'Chapter_Number__c';
        this.contentSortIcon = 'width: var(--lwc-squareIconSmallContent,0.75rem);height: var(--lwc-squareIconSmallContent,0.75rem);margin-left: var(--lwc-spacingXxSmall,0.25rem);display: none;';
        this.chapterNumSortIcon = 'width: var(--lwc-squareIconSmallContent,0.75rem);height: var(--lwc-squareIconSmallContent,0.75rem);margin-left: var(--lwc-spacingXxSmall,0.25rem);display: inline-block;';
        this.getSalesTrainingRecords();
    }

    handleSortbyTitle() {
        this.isLoading = true;
        this.allSalesTrainingRecords = [];
        this.subTopicSortyBy = 'title';
        this.titleArrowUp = !this.titleArrowUp;
        this.subTopicSortyDirection = this.titleArrowUp ? 'asc' : 'desc';
        this.categorySortIcon = this.numOfViewsSortIcon = 'width: var(--lwc-squareIconSmallContent,0.75rem);height: var(--lwc-squareIconSmallContent,0.75rem);margin-left: var(--lwc-spacingXxSmall,0.25rem);display:none;'
        this.titleSortIcon = 'width: var(--lwc-squareIconSmallContent,0.75rem);height: var(--lwc-squareIconSmallContent,0.75rem);margin-left: var(--lwc-spacingXxSmall,0.25rem);display: inline-block;';
        this.getSalesTrainingRecords();
    }

    handleSortByNumOfViews() {
        this.isLoading = true;
        this.allSalesTrainingRecords = [];
        this.subTopicSortyBy = 'num_of_views';
        this.numOfViewsArrowUp = !this.numOfViewsArrowUp;
        this.subTopicSortyDirection = this.numOfViewsArrowUp ? 'asc' : 'desc';
        this.titleSortIcon = this.categorySortIcon = 'width: var(--lwc-squareIconSmallContent,0.75rem);height: var(--lwc-squareIconSmallContent,0.75rem);margin-left: var(--lwc-spacingXxSmall,0.25rem);display:none;'
        this.numOfViewsSortIcon = 'width: var(--lwc-squareIconSmallContent,0.75rem);height: var(--lwc-squareIconSmallContent,0.75rem);margin-left: var(--lwc-spacingXxSmall,0.25rem);display: inline-block;';
        this.getSalesTrainingRecords();
    }

    handleSortByCategory() {
        this.isLoading = true;
        this.allSalesTrainingRecords = [];
        this.subTopicSortyBy = 'category';
        this.categoryArrowUp = !this.categoryArrowUp;
        this.subTopicSortyDirection = this.categoryArrowUp ? 'asc' : 'desc';
        this.titleSortIcon = this.numOfViewsSortIcon = 'width: var(--lwc-squareIconSmallContent,0.75rem);height: var(--lwc-squareIconSmallContent,0.75rem);margin-left: var(--lwc-spacingXxSmall,0.25rem);display:none;'
        this.categorySortIcon = 'width: var(--lwc-squareIconSmallContent,0.75rem);height: var(--lwc-squareIconSmallContent,0.75rem);margin-left: var(--lwc-spacingXxSmall,0.25rem);display: inline-block;';
        this.getSalesTrainingRecords();
    }

    getSalesTrainingRecords() {
        this.isLoading = true;
        fetchFilteredSalesTrainingRecords({
            searchFilters: this.searchValue,
            sortOrder: this.sortedDirection,
            sortBy: this.sortBy,
        }).then(result => {
            if (result != null && result.length > 0) {
                var tempSalesTrainingRecords = [];
                for (var i = 0; i < result.length; i++) {
                    let tempSalesTrainingRecord = {};
                    let fetchedSalesTrainingRecord = Object.assign({}, result[i]);
                    tempSalesTrainingRecord.topic = fetchedSalesTrainingRecord.topic;
                    tempSalesTrainingRecord.chapterNumber = fetchedSalesTrainingRecord.chapterNumber;
                    tempSalesTrainingRecord.Id = fetchedSalesTrainingRecord.Id;
                    if (fetchedSalesTrainingRecord.childrenTrainingRecords != undefined && fetchedSalesTrainingRecord.childrenTrainingRecords.length > 0) {
                        tempSalesTrainingRecord._children = [];
                        for (var j = 0; j < fetchedSalesTrainingRecord.childrenTrainingRecords.length; j++) {
                            let childTrainingRecord = fetchedSalesTrainingRecord.childrenTrainingRecords[j];
                            if (childTrainingRecord.video_document_link != null && !childTrainingRecord.video_document_link.startsWith('https://')) {
                                childTrainingRecord.video_document_link = 'https://' + childTrainingRecord.video_document_link;
                            }
                            tempSalesTrainingRecord._children.push(childTrainingRecord);
                        }
                        this.sortData(tempSalesTrainingRecord._children);
                        tempSalesTrainingRecord._children[0].topic = fetchedSalesTrainingRecord.topic;
                        tempSalesTrainingRecord._children[0].chapterNumber = fetchedSalesTrainingRecord.chapterNumber;
                    }
                    tempSalesTrainingRecords.push(tempSalesTrainingRecord);
                }
                this.allSalesTrainingRecords = tempSalesTrainingRecords;
            }
            else if (this.searchValue != '') {
                this.allSalesTrainingRecords = [];
            }

            this.isLoading = false;
        }
        ).catch(error => {
            this.isLoading = false;
            console.log('this.error:  ', error)
            this.showToast('Error', 'Error', 'Error getting records from Server: ' + error.message, 'error', 'dismissible');
        })
    }

    checkEnterKeyPress(event) {
        if (event.keyCode == 13) {
            this.fetchSearchedRecords();
        }
    }

    fetchSearchedRecords() {
        let tempSearchValue = this.template.querySelector('[data-id="searchValue"]').value;
        this.searchValue = tempSearchValue.trim();
        if (this.searchValue?.length == 1) {
            this.showToast('Warning', 'Warning', 'Search term must be longer than one character', 'warning', 'dismissible');
            return;
        }

        this.searchValue = this.searchValue.replace(/'/g, "\\\'");
        this.getSalesTrainingRecords();
    }

    resetFilters() {
        this.isLoading = true;
        this.template.querySelector('[data-id="searchValue"]').value = '';
        this.searchValue = '';
        this.sortedDirection = 'asc';
        this.subTopicSortyBy = 'Sub_Topic_Chapter_Number__c';
        this.subTopicSortyDirection = 'asc';
        this.sortBy = 'Chapter_Number__c';
        this.contentArrowUp = true;
        this.allSalesTrainingRecords = [];
        this.chapterNumArrowUp = true;
        this.chapterNumSortIcon = 'width: var(--lwc-squareIconSmallContent,0.75rem);height: var(--lwc-squareIconSmallContent,0.75rem);margin-left: var(--lwc-spacingXxSmall,0.25rem);display: inline-block;';
        this.contentSortIcon = 'width: var(--lwc-squareIconSmallContent,0.75rem);height: var(--lwc-squareIconSmallContent,0.75rem);margin-left: var(--lwc-spacingXxSmall,0.25rem);display: none;';
        this.categorySortIcon = this.numOfViewsSortIcon = this.titleSortIcon = 'width: var(--lwc-squareIconSmallContent,0.75rem);height: var(--lwc-squareIconSmallContent,0.75rem);margin-left: var(--lwc-spacingXxSmall,0.25rem);display:none;'
        this.titleArrowUp = this.categoryArrowUp = this.whatWillYouLearnArrowUp = this.numOfViewsArrowUp = false;
        this.categoryTextProperty = this.numOfViewsTextProperty = 'slds-truncate';
        this.whatWillYouLearnTextProperty = this.contentTextProperty = this.titleTextProperty = 'slds-hyphenate';
        this.showMenuForContent = this.showMenuForTitle = this.showMenuForCategory = this.showMenushowMenuForWhatWillYouLearnorContent = this.showMenuForNumOfViews = false;
        this.getSalesTrainingRecords();
    }

    handleOnChange() {
        let tempSearchValue = this.template.querySelector('[data-id="searchValue"]').value;
        if (tempSearchValue == null || tempSearchValue == '') {
            this.resetFilters();
        }
    }

    handleLinkClick(event) {
        this.isLoading = true;
        let targetId = event.currentTarget.closest('td').dataset.id
        updateNumberOfViews({
            recordId: targetId,
        }).then(viewsUpdated => {
            if (viewsUpdated) {
                this.getSalesTrainingRecords();
            } else {
                this.isLoading = false;
            }
        }).catch(error => {
            this.isLoading = false;
        });
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
}