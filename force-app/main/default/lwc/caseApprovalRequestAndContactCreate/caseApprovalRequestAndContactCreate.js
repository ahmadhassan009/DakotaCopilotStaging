import { LightningElement, api, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { getRecord } from "lightning/uiRecordApi";
import getUserEmail from '@salesforce/apex/caseApprovalRequestController.getUserEmail';
import updateCaseApproved from '@salesforce/apex/caseApprovalRequestController.updateCaseApproved';
import { NavigationMixin } from 'lightning/navigation';
import MAILING_STREET from '@salesforce/schema/Case.Mailing_Street__c';
import MAILING_CITY from '@salesforce/schema/Case.Mailing_City__c';
import MAILING_STATE from '@salesforce/schema/Case.Mailing_State__c';
import MAILING_ZIP_POSTAL_CODE from '@salesforce/schema/Case.Mailing_Zip_Postal_Code__c';
import MAILING_COUNTRY from '@salesforce/schema/Case.Mailing_Country__c';
import PHONE from '@salesforce/schema/Case.Phone__c';
import ASSET_CLASS_COVERAGE from '@salesforce/schema/Case.Asset_Class_Coverage__c';
import CONTACT_TYPE from '@salesforce/schema/Case.Contact_Type__c';
import TITLE from '@salesforce/schema/Case.Title__c';
import EMAIL from '@salesforce/schema/Case.Email__c';
import METROAREA from '@salesforce/schema/Case.Metro_Area__c';
import CASE_APPROVED from '@salesforce/schema/Case.Case_Approved__c';
import ACCOUNT_TYPE from '@salesforce/schema/Case.Account.Type';
import USER_ID from '@salesforce/user/Id';
import CASE_APPROVERS from '@salesforce/label/c.Case_Approvers';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const FIELDS = [MAILING_STREET, MAILING_CITY, MAILING_STATE, MAILING_ZIP_POSTAL_CODE, MAILING_COUNTRY, PHONE, ASSET_CLASS_COVERAGE, CONTACT_TYPE, TITLE,
    EMAIL, METROAREA, ACCOUNT_TYPE, CASE_APPROVED];

export default class CaseApprovalRequestAndContactCreate extends NavigationMixin(LightningElement) {

    @api recordId;
    fieldMissing = false;
    case;
    biography;
    mailingStreet;
    mailingCity;
    mailingState;
    mailingZipPostalCode;
    mailingCountry;
    Phone;
    assetClassCoverage;
    contactType;
    title;
    email;
    metroarea;
    accountType;
    CaseApproved;
    userEmail;
    label = CASE_APPROVERS;
    userId = USER_ID;
    country = false;
    sfdcBaseURL;
    missingFields = [];

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.recordId = currentPageReference.state.recordId;
        }
    }

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredRecord({ error, data }) {
        if (error) {
            let message = 'Unknown error';
            if (Array.isArray(error.body)) {
                message = error.body.map(e => e.message).join(', ');
            } else if (typeof error.body.message === 'string') {
                message = error.body.message;
            }
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error loading case',
                    message,
                    variant: 'error',
                }),
            );
        } else if (data) {
            this.case = data;

            this.mailingStreet = this.case.fields.Mailing_Street__c.value;
            this.mailingCity = this.case.fields.Mailing_City__c.value;
            this.mailingState = this.case.fields.Mailing_State__c.value;
            this.mailingZipPostalCode = this.case.fields.Mailing_Zip_Postal_Code__c.value;
            this.mailingCountry = this.case.fields.Mailing_Country__c.value;
            this.Phone = this.case.fields.Phone__c.value;
            this.assetClassCoverage = this.case.fields.Asset_Class_Coverage__c.value;
            this.contactType = this.case.fields.Contact_Type__c.value;
            this.title = this.case.fields.Title__c.value;
            this.email = this.case.fields.Email__c.value;
            this.metroarea = this.case.fields.Metro_Area__c.value;
            this.accountType = this.case.fields.Account.value.fields.Type.value;
            this.CaseApproved = this.case.fields.Case_Approved__c.value;

            let country = this.mailingCountry;
            let countryVal;
            if (this.mailingCountry != null) {
                countryVal = country.toLowerCase();
            }

            getUserEmail({
                userId: this.userId
            }).then(userRecord => {

                if (userRecord) {
                    this.userEmail = userRecord.Email;
                }

                if (this.CaseApproved) {

                    this[NavigationMixin.Navigate]({
                        type: 'standard__recordPage',
                        attributes: {
                            recordId: this.recordId,
                            objectApiName: 'Case',
                            actionName: 'view'
                        }
                    });

                    this.dispatchEvent(
                        new ShowToastEvent({
                            message: 'Case is already approved!',
                            variant: 'success',
                            mode: 'dismissable'
                        }),
                    );
                }
                else if (!(this.label.includes(this.userEmail))) {
                    // navigate to a Case object record.
                    this[NavigationMixin.Navigate]({
                        type: 'standard__recordPage',
                        attributes: {
                            recordId: this.recordId,
                            objectApiName: 'Case',
                            actionName: 'view'
                        }
                    });

                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: "Access Denied",
                            message: 'You do not have access to approve!',
                            variant: 'error',
                            mode: 'dismissable'
                        }),
                    );
                }
                else if (((this.mailingStreet == null || this.mailingCity == null || this.mailingCountry == null || this.mailingZipPostalCode == null ||
                    this.assetClassCoverage == null || this.contactType == null || this.title == null || this.email == null || this.metroarea == null || this.Phone == null) ||
                    ((countryVal != "usa" && countryVal != "us" && countryVal != "united states") && this.mailingState == null)) && this.accountType != "Family Office") {
                    if (this.mailingStreet == null) {
                        this.missingFields.push('Mailing Street');
                    }

                    if (this.mailingCity == null) {
                        this.missingFields.push('Mailing City');
                    }

                    if ((countryVal != "usa" && countryVal != "us" && countryVal != "united states") && this.mailingState == null) {
                        this.missingFields.push('Mailing State');
                    }

                    if (this.mailingZipPostalCode == null) {
                        this.missingFields.push('Mailing Zip/Postal Code');
                    }

                    if (this.mailingCountry == null) {
                        this.missingFields.push('Mailing Country');
                    }

                    if (this.Phone == null) {
                        this.missingFields.push('Phone');
                    }

                    if (this.assetClassCoverage == null) {
                        this.missingFields.push('Asset Class Coverage');
                    }

                    if (this.contactType == null) {
                        this.missingFields.push('Contact Type');
                    }

                    if (this.title == null) {
                        this.missingFields.push('Title');
                    }

                    if (this.email == null) {
                        this.missingFields.push('Email');
                    }

                    if (this.metroarea == null) {
                        this.missingFields.push('Metro Area');
                    }
                    this.fieldMissing = true;
                }
                else if (this.accountType == "Family Office" && this.title == null) {

                    if (this.title == null) {
                        this.missingFields.push('Title');
                    }
                    this.fieldMissing = true;
                }
                else {
                    updateCaseApproved({
                        recordId: this.recordId
                    }).then(returnedKnowledgeBaseRecords => {
                        if (returnedKnowledgeBaseRecords) {

                            // navigate to a Case object record.
                            this.sfdcBaseURL = window.location.origin;
                            window.location.replace(this.sfdcBaseURL + '/lightning/r/Case/' + this.recordId + '/view');

                            this.dispatchEvent(
                                new ShowToastEvent({
                                    message: 'Case is approved!',
                                    variant: 'success',
                                    mode: 'dismissable'
                                }),
                            );
                        }
                    }).catch(error => {
                        this[NavigationMixin.Navigate]({
                            type: 'standard__recordPage',
                            attributes: {
                                recordId: this.recordId,
                                objectApiName: 'Case',
                                actionName: 'view'
                            }
                        });
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Failed to approve Case',
                                message: error.body.message,
                                variant: 'error',
                                mode: 'dismissable'
                            }),
                        );
                    });
                }
            }).catch(error => {
                console.log("Error user record:", error);
            });
        }
    }
}