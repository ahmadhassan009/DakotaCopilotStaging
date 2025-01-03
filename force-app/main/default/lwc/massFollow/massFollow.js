import { LightningElement, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import massFollowButtonStyling from "@salesforce/label/c.massFollowButtonStyling";
import massFollowContactButtonStyling from "@salesforce/label/c.massFollowContactButtonStyling";
import usersExportAccess from '@salesforce/apex/MassFollowSharePageController.usersExportAccess';
import massFollowWithoutExportButtonStyling from '@salesforce/label/c.massFollowWithoutExportButtonStyling';
import exportContactButtonStyling from '@salesforce/label/c.exportContactButtonStyling';

import uid from "@salesforce/user/Id";

export default class MassFollow extends NavigationMixin(LightningElement) {
    @api objectName;
    buttonName = "";
    buttonStyling = massFollowButtonStyling;
    massFollowShare = false;
    defaultFilter = {};
    @api rawFilter = "";
    userId = uid;
    buttonDisabled=false;

    @api setRawFilter(rawFilter) {
        if (rawFilter) {
            let pinedFilters = JSON.parse(rawFilter);
            const accountFilterName = 'PinnedListView_'+ this.userId + "_Account";
            const contactFilterName = 'PinnedListView_'+ this.userId + "_Contact";
            this.defaultFilter.Accounts ='all';
            this.defaultFilter.Contacts ='Recent';
            if (accountFilterName && contactFilterName) {
                Object.keys(pinedFilters).forEach((e) => {
                    if (e.endsWith(accountFilterName)) {
                        this.defaultFilter.Accounts = pinedFilters?.[e]?.state?.listViewId;
                    } else if (e.endsWith(contactFilterName)) {
                        this.defaultFilter.Contacts = pinedFilters?.[e]?.state?.listViewId ;
                    }
                });
            }
            this.rawFilter = rawFilter;
        }
    }

    connectedCallback() {

        this.buttonName = "Mass Follow " + this.objectName;
        usersExportAccess().then((exportAccess) => {
            if (exportAccess) {                
                this.buttonStyling = this.objectName == "Contacts" ? massFollowContactButtonStyling : massFollowButtonStyling;
            }else {
                this.buttonStyling = this.objectName == "Contacts" ? exportContactButtonStyling : massFollowWithoutExportButtonStyling;
            }      

            setTimeout(() => {
                this.massFollowShare = true;
            }, 2500);  
        }).catch((error) => {
            console.log('Error in fetching users export access : ', error);
        }); 
        
    }

    goTomassFollowPage() {        
        this.buttonDisabled=true;
        let defaultFilterName = this.defaultFilter?.[this.objectName] || "all";
        let filterId =
            location?.href?.split("?").length > 1
                ? location?.href?.split("=")[1]
                : defaultFilterName;

        let url =
            "/mass-follow-list-view-all?objectName=" +
            this.objectName +
            "&filterId=" +
            filterId;
        this[NavigationMixin.Navigate]({
            type: "standard__webPage",
            attributes: {
                url: url
            }
        });

        setTimeout(() => {
            this.buttonDisabled = false;
        }, 2000); 
    }
}