import { LightningElement, api } from 'lwc';
import fetchEvent from '@salesforce/apex/EventTaskDetailPageController.fetchEvent';
import fetchTask from '@salesforce/apex/EventTaskDetailPageController.fetchTask';
import objectNamefromId from '@salesforce/apex/EventTaskDetailPageController.objectNamefromId';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import activeCommunities from '@salesforce/label/c.active_communities';
import LOCALE from '@salesforce/i18n/locale';
import getOrganizationId from '@salesforce/apex/ActivitiesCustomRelatedListHelper.getOrganizationId';
import checkActivityPermissions from '@salesforce/apex/ActivitiesCustomRelatedListHelper.checkActivityPermissions';
import { showNotification, setNotificationFlags } from "c/utils";
import { loadStyle } from 'lightning/platformResourceLoader';
import eventTaskDetailPageCss from '@salesforce/resourceUrl/eventTaskDetailPageCss';
import deleteActivity from '@salesforce/apex/ActivitiesCustomRelatedListHelper.deleteActivity';
import recordExists from '@salesforce/apex/ActivitiesCustomRelatedListHelper.recordExists';
import getEventContacts from '@salesforce/apex/ActivitiesInAccountsController.getEventContacts';
import getTaskContacts from '@salesforce/apex/ActivitiesInAccountsController.getTaskContacts';
import uId from '@salesforce/user/Id';
import getUserTimeZone from '@salesforce/apex/EventTaskDetailPageController.getUserTimeZone';

export default class EventTaskDetailPage extends LightningElement {
  @api recordId;
  @api objectName;  
  @api objectId;  
  @api viewAll;

  eventRecord;
  taskRecord;
  detailPage;
  contentName;
  assignToLink;
  nameLink;
  relatedToLink;
  setUpByLink;
  editEventPopup=false;
  editTaskPopup=false;
  orgId;
  startDateTime;
  endDateTime;
  activityDate;
  hasCreatePermission = false;
  doesNotHasPermission;  
  recordExist=false;
  deletePopup=false;
  contactCount='';
  getAccess=false;
  userTimeZone;
  fromReport=false;
  isLoading=false;
  showNotification = showNotification.bind(this);
  setNotificationFlags = setNotificationFlags.bind(this);
  communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);
    
  connectedCallback()
  {
    Promise.all([
      loadStyle(this, eventTaskDetailPageCss)
    ]);

    getUserTimeZone({
    }).then(currentUserTimeZone => {
        this.userTimeZone = currentUserTimeZone;
    }).catch(error => {
        console.log(error);
    });

    getOrganizationId({
    }).then(responseId => {
        this.orgId = responseId;     
    }).catch(error => {
        console.log(error);
    });

    if(this.recordId.startsWith('00T')){
        this.detailPage='Task';
        this.fetchTask();
    }else{        
        this.detailPage='Event';
        this.fetchEvent();
    }
  }

  fetchEvent()
  {
    fetchEvent({recordId : this.recordId}).then(response => {
      if(response)
      {
        this.contactCount='';
        this.eventRecord=response;
        this.contentName=response.Subject;
       
        if(response.StartDateTime)
        {
          this.startDateTime=response.StartDateTime;
          this.eventRecord.StartDateTime = this.handleDateTime(response.IsAllDayEvent,response.StartDateTime);
          
        }
        if(response.EndDateTime)
        {          
          this.endDateTime=response.EndDateTime;          
          this.eventRecord.EndDateTime = this.handleDateTime(response.IsAllDayEvent,response.EndDateTime);
        }
        if(this.eventRecord.WhatId)
        {
          this.whatId=this.eventRecord.WhatId
          this.whatName=this.eventRecord.What.Name;
        }
        if(this.eventRecord.Set_Up_By_new__c==uId)
        {
          this.getAccess=true;
        }
        if(this.eventRecord.Description)
        {
          this.eventRecord.Description= this.eventRecord.Description.replaceAll(/\n/g, "<br />");
        }
        if(!this.objectId)
        {
          this.fromReport=true;
          if(this.eventRecord.WhoId)
            this.objectId=this.eventRecord.WhoId;
          else
            this.objectId=this.eventRecord.WhatId;
        }
        else
        {
          if(this.eventRecord.WhatId)
            if(this.objectId!=this.eventRecord.WhatId)
              this.objectId=this.eventRecord.WhatId;
        }
        this.getEventContacts();
        this.setlinks(response);
        this.recordExist=true;
      }
    }).catch(error => {
        this.doesNotHasPermission=true;
         this.dispatchEvent(
             new ShowToastEvent({
                 title: 'Error',
                 message: 'Error Fetching Event Details',
                 variant: 'error'
             })
         );
    });  
  }

  fetchTask()
  {
    fetchTask({recordId : this.recordId}).then(response => {
      if(response)
      {        
        
        this.contactCount='';
        this.taskRecord=response;  
        this.contentName=response.Subject;
        if(response.ActivityDate)
        {
          this.activityDate=response.ActivityDate;
          let date = new Date(response.ActivityDate);
          this.taskRecord.ActivityDate = new Intl.DateTimeFormat(LOCALE).format(date);
        }
        if(this.taskRecord.WhatId)
        {
          this.whatId=this.taskRecord.WhatId
          this.whatName=this.taskRecord.What.Name;
        }
        if(this.taskRecord.Set_Up_By_new__c==uId)
        {
          this.getAccess=true;
        }
        if(this.taskRecord.Description)
        {
          this.taskRecord.Description= this.taskRecord.Description.replaceAll(/\n/g, "<br />");
        }
        if(!this.objectId)
        {
          this.fromReport=true;
          if(this.taskRecord.WhoId)
            this.objectId=this.taskRecord.WhoId;
          else
            this.objectId=this.taskRecord.WhatId;
        }
        else
        {
          if(this.taskRecord.WhatId)
            if(this.objectId!=this.taskRecord.WhatId)
              this.objectId=this.taskRecord.WhatId;
        }
        this.getTaskContacts();        
        this.setlinks(response);        
        this.recordExist=true;
      }
    }).catch(error => {      
      this.doesNotHasPermission=true;
         this.dispatchEvent(
             new ShowToastEvent({
                 title: 'Error',
                 message: 'Error Fetching Task Details',
                 variant: 'error'
             })
         );
    });  
  }

  async getEventContacts()
  {
    await getEventContacts({eventId : this.recordId}).then(response => {
      if(response)
      {
        if(response.length>1)
        {
          let num=response.length-1;
          this.contactCount = ' + '+num.toString();
        }
      }
    }).catch(error => {
        this.doesNotHasPermission=true;
         this.dispatchEvent(
             new ShowToastEvent({
                 title: 'Error',
                 message: 'Error Fetching Contacts of Event',
                 variant: 'error'
             })
         );
    });  
  }

  async getTaskContacts()
  {
    await getTaskContacts({taskId : this.recordId}).then(response => {
      if(response)
      {
        if(response.length>1)
        {
          let num=response.length-1;
          this.contactCount = ' + '+num.toString();
        }
      }
    }).catch(error => {
        this.doesNotHasPermission=true;
         this.dispatchEvent(
             new ShowToastEvent({
                 title: 'Error',
                 message: 'Error Fetching Contacts of Task',
                 variant: 'error'
             })
         );
    });  
  }

  setlinks(response)
  {
    if(response.OwnerId)
    {
      this.assignToLink=  "/" + this.communityName + "/s/profile/" +response.OwnerId;
    }
    if(response.WhatId)
    {
      this.relatedToLink=  "/" + this.communityName + "/s/account/" +response.WhatId;
    }
    if(response.WhoId)
    {
      this.nameLink=  "/" + this.communityName + "/s/contact/" +response.WhoId;
    }
    if(response.Set_Up_By_new__c)
    {
      this.setUpByLink=  "/" + this.communityName + "/s/profile/" +response.Set_Up_By_new__c;
    }
  }

  async handlePermissionPopup() {
    await checkActivityPermissions().then(result => {
        this.setNotificationFlags(result); 
    }).catch(error => {
        console.log(error);
    })
  }

  async handleEditClick()
  {
    await this.handlePermissionPopup();
        if(!this.hasCreatePermission) return;

    if(this.recordId.startsWith('00T')){
      this.editTaskPopup = true;
    }else{        
      this.editEventPopup = true;
    }
    
  }

  handleSave()
  {
    this.editEventPopup = false;
    this.editTaskPopup = false;
    if(this.recordId.startsWith('00T')){
      this.fetchTask();
    }else{        
        this.fetchEvent();
    }
  }

  saveEvent(event){
    const objChild = this.template.querySelector('c-create-new-event');
    objChild.saveNewEvent();
  }

  saveTask(event){
    const objChild = this.template.querySelector('c-create-new-task');
    objChild.saveNewTask();
  }

  closeEditPopup()
  {
    this.editEventPopup = false;
    this.editTaskPopup = false;
  } 
  

  deleteRow() {
    this.isLoading=true;
    this.deletePopup = false;
    recordExists({
        recordId : this.recordId
    }).then(response => {
        if(response)
        {
            deleteActivity({
                recordId : this.recordId
            }).then(response => {
                if(this.recordId.startsWith('00T')) {
                    this.toastMessage = 'Task Deleted Successfully.';
                } else {
                    this.toastMessage =  'Event Deleted Successfully.';
                }
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: this.toastMessage,
                        variant: 'success'
                    })
                );
                
                this.redirectAfterDel();
            }).catch(error => {
                console.log(error);
                let errorMsg = 'Error occured while deleting Activity.';
                if(error && error.body && error.body.message && error.body.message.includes("You don't have necessary permissions")) {
                    errorMsg = error.body.message;
                }
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error deleting record',
                        message: errorMsg,
                        variant: 'error'
                    })
                );
            });
        }
        else
        {
          this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Error',
                  message: 'The Activity you are trying to delete doesn’t exist.',
                  variant: 'error'
              })
          );
        }
    }).catch(error => {
        console.log(error);
          this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Error',
                  message: 'An error occured. Please refresh the list.',
                  variant: 'error'
              })
          );
    });
  }

  handleDeleteClick()
  {
    this.deletePopup = true;
  }

  closeDeletePopup()
  {
    this.deletePopup = false;
  }

  redirectAfterDel()
  {
    if(!this.fromReport)
    {
      objectNamefromId({recordId : this.objectId}).then(response => {
        if(response)
        {
          this.objectName=response;
          if(this.viewAll=='true'){
            window.location.href = "/"+this.communityName+'/s/view-all-in-acc-and-cont?recordId=' + this.objectId+'&showPastActivities=false';
          }
          else if(this.objectName=='Account')
          {
            window.location.href = "/"+this.communityName+'/s/account/'+this.objectId;
          }
          else
          {
            window.location.href = "/"+this.communityName+'/s/contact/'+this.objectId;
          }          
        }
      }).catch(error => {
          this.doesNotHasPermission=true;
           this.dispatchEvent(
               new ShowToastEvent({
                   title: 'Error',
                   message: 'Error Getting Object Name',
                   variant: 'error'
               })
           );
      }); 
    }
    else
    {
      window.location.href = "/" + this.communityName + "/s/report/Report/Recent";
    }
        
  }

  handleDateTime(IsAllDayEvent,DateTime)
  {
    if(IsAllDayEvent)
    {
      let date = new Date(DateTime);
      return new Intl.DateTimeFormat(LOCALE).format(date);
    }
    else
    {
      let options = {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', hour12: true, timeZone: this.userTimeZone
      };
      let formattedDate = new Date(DateTime).toLocaleString("en-US", options);
      return formattedDate.replace(',','');
    }
  }

}