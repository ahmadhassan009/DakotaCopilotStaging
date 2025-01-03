import { LightningElement, api, wire, track } from 'lwc';
import getMemberComments from '@salesforce/apex/MemberNotesController.getMemberComments';
import saveMemberComment from '@salesforce/apex/MemberNotesController.saveMemberComment';
import deleteMemberComment from '@salesforce/apex/MemberNotesController.deleteMemberComment';
import updateMemberComment from '@salesforce/apex/MemberNotesController.updateMemberComment';
import getRecordName from '@salesforce/apex/MemberNotesController.getRecordName';
import activeCommunities from '@salesforce/label/c.active_communities';
import getRelatedMemberCommentsCount from '@salesforce/apex/MemberNotesController.getRelatedMemberCommentsCount';
import getSFBaseUrl from '@salesforce/apex/MemberNotesController.getSFBaseUrl';
import { NavigationMixin, CurrentPageReference } from "lightning/navigation";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { fireEvent } from 'c/pubsub';


export default class CommentsRelatedtoAccountsContacts extends NavigationMixin(LightningElement) {

    @api recordId;
    @api recordName;
    @api objectApiName;
    @track error;
    @track comments;
    @track isLoading = false;
    @track recordInfoObject;
    newComment;
    updateComment;
    selectedItem;
    deletePopup = false;
    editPopup = false;
    limit = 5;
    offset = 0;
    relatedMemberCommentsRecords;
    totalRelatedContactsCount = 0;
    plusSign = '';
    isCommunity = false;
    baseURL;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    headingLinkClass = 'slds-card__header-link slds-truncate heading-link-class';

    @wire(CurrentPageReference) pageRef;
    connectedCallback(){

        this.isLoading = true;
        getSFBaseUrl().then(baseURL => {
            if(baseURL) {
                this.baseURL = baseURL;
            }
        })
        .catch(error => {
            this.error = error;
        });
        getRecordName({objectName: this.objectApiName, recordId: this.recordId})
        .then(result => {
            this.isLoading = false;
            this. recordName = result[0].recordName;
        })
        .catch(error => {
            this.isLoading = false;
            this.error = error;
        });

        getMemberComments({objectName: this.objectApiName, recordId: this.recordId, recordLimit: this.limit})
        .then(result => {
            this.isLoading = false;
            this.comments = result;
            
        })
        .catch(error => {
            this.isLoading = false;
            this.error = error;
        });

        //To get count of related contacts records
        getRelatedMemberCommentsCount({
            recordId: this.recordId,
            objectName: this.objectApiName
        }) .then (contactsRecordCount => {
                this.totalRelatedContactsCount = contactsRecordCount;
                if(this.totalRelatedContactsCount <= this.limit){
                    this.offset = this.totalRelatedContactsCount;
                    this.plusSign = '';
                } 
                else {
                    this.offset = this.limit;
                    this.plusSign = '+';
                }
            }) .catch(error => {});
   }
  
    saveComment() {
        this.newComment = [this.template.querySelector("[data-field='newComment']").value];
        let tempComment = this.newComment[0];
        var comment;
        if(tempComment != undefined){
            comment = tempComment.replace(/^\s+|\s+$/g, '');
        }
        else{
            this.isLoading = false;
            const evt = new ShowToastEvent({
                title: 'Member Comment is empty!',
                message: "An empty Member Comment can't be saved.",
                variant: 'Error'
            });
            this.dispatchEvent(evt);
        }
        if(comment){      
            this.isLoading = true;
            saveMemberComment({objectName: this.objectApiName, recordId: this.recordId, comment: this.newComment[0], recordLimit: this.limit})
                .then(result => {
                    this.isLoading = false;
                    this.comments = result;
                    this.newComment = '';
                    return refreshApex(this.connectedCallback());
                })
                .catch(error => {
                    this.isLoading = false;
                    this.error = error;
                });
        }
        else{
            this.isLoading = false;
            const evt = new ShowToastEvent({
                title: 'Member Comment is empty!',
                message: "An empty Member Comment can't be saved.",
                variant: 'Error'
            });
            this.dispatchEvent(evt);
        }
    }

    handleOnselect(event) {       
        this.selectedItem = event.currentTarget.dataset.item;
        if(event.detail.value == 'Delete')
        {
            this.deletePopup = true;
        }
        else 
        {
            this.updateComment = event.detail.value;
            this.editPopup = true;
        }
    }

    closeDeletePopup() {
        this.deletePopup = false;
    }

    closeEditPopup() {
        this.editPopup = false;
    }

    deleteComment() {
        this.deletePopup = false;
        this.isLoading = true;
        deleteMemberComment({objectName: this.objectApiName, recordId: this.recordId, commId: this.selectedItem, recordLimit: this.limit})
            .then(result => {
                this.isLoading = false;
                if(result!=null)
                {
                    this.comments = result;
                }
                this.selectedItem = '';
                return refreshApex(this.connectedCallback());
            })
            .catch(error => {
                this.isLoading = false;
                this.error = error;
            });
    }

    updateComments(event) {     
        this.isLoading = true;
        let tempComment = this.updateComment;
        var comment = tempComment.replace(/^\s+|\s+$/g, '');

        if(comment){
            this.editPopup = false;
            updateMemberComment({objectName: this.objectApiName, recordId: this.recordId, commId: this.selectedItem, comment: this.updateComment, recordLimit: this.limit})
                .then(result => {
                    this.isLoading = false;
                    this.comments = result;
                })
                .catch(error => {
                    this.isLoading = false;
                    this.error = error;
                });
        }
        else{
            this.isLoading = false;
            this.editPopup = true;
            const evt = new ShowToastEvent({
                title: 'Member Comment is empty!',
                message: "An empty Member Comment can't be saved.",
                variant: 'Error'
            });
            this.dispatchEvent(evt);
        }
    }

    setUpdatedComm(event)
    {
        this.updateComment =  event.detail.value;
    }

    handleShowFullCommentList() {
        this.checkIsCommunityInstance();
        if(this.isCommunity)
        {
            this.recordInfoObject = {

                recordId: this.recordId,
                recordName: this.recordName,
                objectName: this.objectApiName
            }
            fireEvent(this.pageRef, 'EventName', this.recordInfoObject);
    
            var url = '/view-membercommentsrelatedtoaccountcontact?recordId=' + this.recordId + '&recordName=' + encodeURIComponent(this.recordName) + '&objectName=' + this.objectApiName; 
        
            this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
                attributes: {
                    url: url 
                }
            });
        }
        else
        {
            window.open(this.baseURL +'/lightning/cmp/c__ViewAllcommentsInHomePage?c__homePage=false&c__recordId=' + this.recordId + '&c__recordName=' + this.recordName + '&c__objectName=' + this.objectApiName,"_self");
        }
        
     }
     checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
     }
}