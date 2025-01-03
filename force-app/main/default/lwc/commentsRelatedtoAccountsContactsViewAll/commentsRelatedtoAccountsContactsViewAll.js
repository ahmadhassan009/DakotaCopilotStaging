import { LightningElement, api, wire, track } from 'lwc';
import getMemberComments from '@salesforce/apex/MemberNotesController.getMemberComments';
import saveMemberComment from '@salesforce/apex/MemberNotesController.saveMemberComment';
import deleteMemberComment from '@salesforce/apex/MemberNotesController.deleteMemberComment';
import updateMemberComment from '@salesforce/apex/MemberNotesController.updateMemberComment';
import getRelatedMemberCommentsCount from '@salesforce/apex/MemberNotesController.getRelatedMemberCommentsCount';
import activeCommunities from '@salesforce/label/c.active_communities';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CurrentPageReference } from 'lightning/navigation';
import { registerListener, unregisterAllListeners } from 'c/pubsub';

export default class CommentsRelatedtoAccountsContacts extends LightningElement {

    @api recordId;
    @api objectApiName;
    @track error;
    @track comments = [];
    @track isLoading = false;
    @api recordName;
    @track objectName;
    @track plusSign = '';
    @track commentss = [];
    recordLink;
    homeLink;
    newComment;
    updateComment;
    selectedItem;
    deletePopup = false;
    editPopup = false;
    limit = 45000;
    offset = 0;
    initialLimit = 20;
    scrollLimit = 20;
    recordLimit = 20;
    relatedMemberCommentsRecords;
    totalRelatedRecordCount = 0;
    @api isCommunity;
    headingLinkClass = 'slds-breadcrumb__item slds-line-height--reset heading-link-class';

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    @wire(CurrentPageReference) pageRef;
    
    connectedCallback(){
        if(this.isCommunity == null)
            this.isCommunity = "true";
        if(this.isCommunity == "true")
            registerListener('EventName', this.methodName(this), this);

        this.isLoading = true;
        getMemberComments({objectName: this.objectApiName, recordId: this.recordId, recordLimit: this.limit})
        .then(result => {
            this.isLoading = false;
            this.comments = [];
            for (var i = 0; i < result.length; i++) {
                this.comments[i] = result [i];
            }
            
            if(this.objectApiName == 'Account'){
                this.objectName = this.objectApiName;
                if(this.isCommunity == "true")
                {
                    this.recordLink = "/" + this.communityName + "/s/account/" + this.recordId;
                    this.homeLink = "/" + this.communityName + '/s/account/Account/Default';
                }
                else
                {
                    this.recordLink =  "/" + this.recordId;
                    this.homeLink = '/lightning/o/Account/list';
                }
                
             }
             else{
                this.objectName = this.objectApiName;
                if(this.isCommunity == "true")
                {
                    this.recordLink = "/" + this.communityName + "/s/contact/" + this.recordId;
                    this.homeLink = "/" + this.communityName + '/s/contact/Contact/Default';
                }
                else
                {
                    this.recordLink =  "/" + this.recordId;
                    this.homeLink = '/lightning/o/Contact/list';
                }
             }

            this.commentss = [];
            let j = 0;
            while(j < this.initialLimit) {
                this.commentss.push({Id:this.comments[j].Id, isEditDeleteAccessPresent: this.comments[j].isEditDeleteAccessPresent, name: this.comments[j].name,
                     commentTime:this.comments[j].commentTime, approvalNotes: this.comments[j].approvalNotes, approvalNotesDate: this.comments[j].approvalNotesDate
                     });  
                j++;
            }
        })
        .catch(error => {
            this.isLoading = false;
            this.error = error;
        });

        // Get related member Comments count
        getRelatedMemberCommentsCount({
            recordId: this.recordId,
            objectName: this.objectApiName
        }) .then (relatedMemberComments => { 
            if (relatedMemberComments) {
                this.totalRelatedRecordCount = relatedMemberComments;
                this.offset = relatedMemberComments;
                this.isLoading = false;
                // For showing + sign with count
                if((this.offset <= this.initialLimit) || (this.offset) == 0)
                {
                    this.plusSign = '';
                }
                else
                {
                    this.offset = this.initialLimit;
                    this.plusSign = '+';
                }
            }
            else if(relatedMemberComments == 0){
                this.offset = 0;
                this.totalRelatedRecordCount = 0;
            }

        }) .catch(error => {
            this.isLoading=false;
            console.log("Error:" , error);
        });
   }    

   disconnectedCallback() {
    // unsubscribe from eventdetails event
    unregisterAllListeners(this);  
    }

   methodName(data){
    this.recordId = data.pageRef.state.recordId;
    this.recordName = data.pageRef.state.recordName;
    this.objectApiName = data.pageRef.state.objectName;
   }

    saveComment() {
        this.newComment = [this.template.querySelector("[data-field='newComment']").value];
        let tempComment = this.newComment[0];
        
        if(tempComment != undefined){
            var comment = tempComment.replace(/^\s+|\s+$/g, '');
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
                    this.connectedCallback();
                    this.newComment = '';
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
                    this.connectedCallback();
                }
                this.selectedItem = '';
            })
            .catch(error => {
                this.isLoading = false;
                this.error = error;
            });
    }

    updateComments() {
        
        this.isLoading = true;
        let tempComment = this.updateComment;
        var comment = tempComment.replace(/^\s+|\s+$/g, '');
        if(comment){
            updateMemberComment({objectName: this.objectApiName, recordId: this.recordId, commId: this.selectedItem, comment: this.updateComment, recordLimit: this.limit})
                .then(result => {
                    this.editPopup = false;
                    this.isLoading = false;
                    this.connectedCallback();
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

    //infinite scroll 
    handleScroll(event) {
        let area = this.template.querySelector('.scrollArea');
        let threshold = event.target.clientHeight;
        let areaHeight = area.clientHeight;
        let scrollTop = event.target.scrollTop;
        if (areaHeight - threshold <= scrollTop + 10) {
            
            try {
                if (this.totalRelatedRecordCount > this.offset)
                {
                    if (((this.offset + 20) >= this.totalRelatedRecordCount) || (this.offset == 0)) {
                        this.offset = this.totalRelatedRecordCount;
                        this.plusSign = '';
                    } else {
                        this.offset = parseInt(this.offset) + parseInt(this.scrollLimit);
                        this.plusSign = '+';
                    }
                    let j = 0, t = this.commentss.length;
                    while (j < this.scrollLimit) {
                        this.commentss.push({Id: this.comments[j + t].Id, isEditDeleteAccessPresent: this.comments[j + t].isEditDeleteAccessPresent, accountName: this.comments[j + t].accountName, contactName: this.comments[j + t].contactName, name: this.comments[j + t].name, commentTime: this.comments[j + t].commentTime, 
                            accountAccountType: this.comments[j + t].accountAccountType, accountAccountAum: this.comments[j + t].accountAccountAum, accountAccountMetroArea: this.comments[j + t].accountAccountMetroArea, contactAccountName: this.comments[j + t].contactAccountName,
                            contactAccountType: this.comments[j + t].contactAccountType, contactAccountAum: this.comments[j + t].contactAccountAum, contactAccountMetroArea: this.comments[j + t].contactAccountMetroArea, approvalNotes: this.comments[j + t].approvalNotes,
                            approvalNotesDate: this.comments[j+t].approvalNotesDate
                        });
                        j++;
                    }
                }  
            } catch (error) {
                console.log('Error : ' + error);
            }
        }
    }
}