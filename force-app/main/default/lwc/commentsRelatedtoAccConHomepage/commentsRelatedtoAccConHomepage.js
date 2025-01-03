import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import getMemberCommentsHomepage from '@salesforce/apex/MemberNotesController.getMemberCommentsHomepage';
import getTotalMemberCommentsCount from '@salesforce/apex/MemberNotesController.getTotalMemberCommentsCount';
import getSFBaseUrl from '@salesforce/apex/MemberNotesController.getSFBaseUrl';
import activeCommunities from '@salesforce/label/c.active_communities';

export default class CommentsRelatedtoAccConHomepage extends NavigationMixin(LightningElement) {

    @api recordId;
    @api objectApiName
    @track error;
    @track comments;
    @track commentss = [];   
    limit = 5;
    offset = 0;
    plusSign = '';
    scrollLimit = 5;
    totalLimit = 45000;
    totalRecordCount = 0;
    isCommunity = false;
    baseURL;
    objectTitle = '';

    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

    connectedCallback(){
        this.objectTitle = this.communityName == 'marketplace2' ? 'Marketplace News' : 'Member Comments';
        this.checkIsCommunityInstance();

        getSFBaseUrl().then(baseURL => {
            if(baseURL) {
                this.baseURL = baseURL;
            }
        })
        .catch(error => {
            this.error = error;
        });
       // Get 5 most recent comments
        getMemberCommentsHomepage({recordLimit: this.limit})
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
            this.totalRecordCount = this.comments.length;
            if(this.comments.length <= this.limit)
            {
                this.offset = this.comments.length;
            } else {
                this.offset = this.limit;
            }
            this.commentss = [];
            let j = 0;
            while(j < this.initialLimit) {
                this.commentss.push({Id:this.comments[j].Id, isEditDeleteAccessPresent: this.comments[j].isEditDeleteAccessPresent, name: this.comments[j].name, commentTime:this.comments[j].commentTime});  
                j++;
            }
        })
        .catch(error => {
            this.error = error;
            console.log('error : ', error);
        });

       // Get member Comments count
       getTotalMemberCommentsCount({
        recordLimit: this.totalLimit
       })
       .then(result => {
            if(result > this.limit)
            {
                this.offset = this.limit;
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

   // Handle view All link
   handleShowFullCommentList() {
    this.checkIsCommunityInstance(); 
       if(this.isCommunity)
       {
            var url = '/view-commentsrelatedtoaccountscontacts';

            this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
                attributes: {
                    url: url
                }
            });
       }
       else
       {
        window.open(this.baseURL +'/lightning/cmp/c__ViewAllcommentsInHomePage?c__homePage=true',"_self");
       }
    }

    //infinite scroll 
    handleScroll(event) {
        let area = this.template.querySelector('.scrollArea');
        let threshold = event.target.clientHeight;
        let areaHeight = area.clientHeight;
        let scrollTop = event.target.scrollTop;
        if (areaHeight - threshold <= scrollTop) {
            
            try {
                if (this.totalRecordCount > this.offset)
                {
                    if (((this.offset + 20) >= this.totalRecordCount) || (this.offset == 0)) {
                        this.offset = this.totalRecordCount;
                        this.plusSign = '';
                    } else {
                        this.offset = parseInt(this.offset) + parseInt(this.scrollLimit);
                        this.plusSign = '+';
                    }
                }  
            } catch (error) {
                console.log('Error : ' + error);
            }

            let j = 0, t = this.commentss.length;
            while (j < this.scrollLimit) {
                this.commentss.push({Id: this.comments[j + t].Id, accountName: this.comments[j + t].accountName, contactName: this.comments[j + t].contactName, name: this.comments[j + t].name, commentTime: this.comments[j + t].commentTime, 
                    accountAccountType: this.comments[j + t].accountAccountType, accountAccountAum: this.comments[j + t].accountAccountAum, accountAccountMetroArea: this.comments[j + t].accountAccountMetroArea, contactAccountName: this.comments[j + t].contactAccountName,
                    contactAccountType: this.comments[j + t].contactAccountType, contactAccountAum: this.comments[j + t].contactAccountAum, contactAccountMetroArea: this.comments[j + t].contactAccountMetroArea
                });
                j++;
            }
        }
    }

    checkIsCommunityInstance() {
        var currentUrl = window.location.href;
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
    }
}