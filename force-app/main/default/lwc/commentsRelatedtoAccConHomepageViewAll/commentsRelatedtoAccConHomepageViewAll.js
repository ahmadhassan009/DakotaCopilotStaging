import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import activeCommunities from '@salesforce/label/c.active_communities';
import getMemberCommentsHomepage from '@salesforce/apex/MemberNotesController.getMemberCommentsHomepage';
import getTotalMemberCommentsCount from '@salesforce/apex/MemberNotesController.getTotalMemberCommentsCount';

export default class CommentsRelatedtoAccConHomepageViewAll extends NavigationMixin(LightningElement) {

    @api recordId;
    @api objectApiName
    @track error;
    @track comments = [];
    @track commentss = [];
    @track plusSign = '';
    homeLink;
    totalLimit = 45000;
    initialLimit = 20;
    scrollLimit = 20;
    offset = 0;
    totalRelatedRecordCount = 0;
    isCommunity = false;
    objectTitle = '';

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback(){
        this.objectTitle = this.communityName == 'marketplace2' ? 'Marketplace News' : 'Member Comments';
        this.checkIsCommunityInstance();
        this.setLinks();
        // Get all comments
        getMemberCommentsHomepage({recordLimit: this.totalLimit})
        .then(result => {
            var tempComments =[];
            for (var i = 0; i < result.length; i++) {
                let tempRecord = Object.assign({}, result[i]); //cloning object
                
                if(this.isCommunity){
                    if(tempRecord.accId){
                        tempRecord.accURL  ="/"+this.communityName+"/s/detail/" + tempRecord.accId;
                    }
                    if(tempRecord.conId){
                        tempRecord.conURL ="/"+this.communityName+"/s/detail/" + tempRecord.conId;
                    }
                }
                else{
                    if(tempRecord.accId){
                        tempRecord.accURL  ="/" + tempRecord.accId; 
                    }
                    if(tempRecord.conId){
                        tempRecord.conURL ="/" + tempRecord.conId;
                    }    
                }

                if(tempRecord.accountAccountAum){
                    tempRecord.accountAccountAum = this.numberWithCommas(tempRecord.accountAccountAum);
                }
                if(tempRecord.contactAccountAum){
                    tempRecord.contactAccountAum = this.numberWithCommas(tempRecord.contactAccountAum);
                }
                tempComments.push(tempRecord);
            }
            this.comments = tempComments;

            let parentThis = this;
            this.commentss = [];
            let j = 0;
            while(j < this.initialLimit) {
                this.commentss.push({Id:this.comments[j].Id, accountName:this.comments[j].accountName, contactName:this.comments[j].contactName, name: this.comments[j].name, commentTime:this.comments[j].commentTime,
                    accountAccountType: this.comments[j].accountAccountType, accountAccountAum: this.comments[j].accountAccountAum, accountAccountMetroArea: this.comments[j].accountAccountMetroArea,
                    contactAccountName: this.comments[j].contactAccountName, contactAccountType: this.comments[j].contactAccountType, contactAccountAum: this.comments[j].contactAccountAum, 
                    contactAccountMetroArea: this.comments[j].contactAccountMetroArea, accURL:this.comments[j].accURL, conURL:this.comments[j].conURL, approvalNotes: this.comments[j].approvalNotes, 
                    approvalNotesDate: this.comments[j].approvalNotesDate});  
                j++;
            }
        })
        .catch(error => {
            this.error = error;
            console.log('error : ', error);
        });

       // Get member comments count
       getTotalMemberCommentsCount({
        recordLimit: this.totalLimit
       })
       .then(result => {
           this.offset = result;
           this.totalRelatedRecordCount = result;
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
       })
       .catch(error => {
           this.error = error;
       });
   }

   // Handle thousand seperator commas
    numberWithCommas(x) {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x))
        x = x.replace(pattern, "$1,$2");
    return x;
    }

    //Set Back link
    setLinks() {
        this.homeLink = "/"+this.communityName + '/s/';
    }

    //infinite scroll 
    handleScroll(event) {
        let area = this.template.querySelector('.scrollArea');
        let threshold = event.target.clientHeight;
        let areaHeight = area.clientHeight;
        let scrollTop = event.target.scrollTop;
        if(areaHeight - threshold <= scrollTop + 10) {
           
            try {
                if(this.totalRelatedRecordCount > this.offset)
                {
                    if(((this.offset+20) >= this.totalRelatedRecordCount )|| (this.offset == 0))
                    {
                        this.offset = this.totalRelatedRecordCount;
                        this.plusSign = '';
                    } else {
                        this.offset = parseInt(this.offset ) + parseInt(this.scrollLimit);
                        this.plusSign = '+';
                    }
                    let j = 0, t = this.commentss.length;
                    while(j < this.scrollLimit) {
                        this.commentss.push( {Id:this.comments[j+t].Id, accountName:this.comments[j+t].accountName, contactName:this.comments[j+t].contactName, name: this.comments[j+t].name, commentTime:this.comments[j+t].commentTime,
                            accountAccountType: this.comments[j+t].accountAccountType, accountAccountAum: this.comments[j+t].accountAccountAum, accountAccountMetroArea: this.comments[j+t].accountAccountMetroArea,
                            contactAccountName: this.comments[j+t].contactAccountName, contactAccountType: this.comments[j+t].contactAccountType, contactAccountAum: this.comments[j+t].contactAccountAum, 
                            contactAccountMetroArea: this.comments[j+t].contactAccountMetroArea, accURL:this.comments[j+t].accURL, conURL:this.comments[j+t].conURL, approvalNotes: this.comments[j+t].approvalNotes,
                            approvalNotesDate: this.comments[j+t].approvalNotesDate});
                            j++;
                    }
                }    
            } catch (error) {
                console.log('Error : ' + error);
            }
        }
    }

    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
    }
}