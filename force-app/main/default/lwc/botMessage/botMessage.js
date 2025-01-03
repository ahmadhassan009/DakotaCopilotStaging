import { LightningElement, api, track } from 'lwc';
import processQuery from '@salesforce/apex/DakotaCopolitController.processQuery';
import createReport from '@salesforce/apex/CreateReportAPI.createReport';
// import publishEvent from '@salesforce/apex/TabulatorEventBus.publishEvent';
import { NavigationMixin } from 'lightning/navigation';
import customButtonCSS from '@salesforce/resourceUrl/chatbotCssFile';
import { loadStyle } from 'lightning/platformResourceLoader';
import activeCommunities from '@salesforce/label/c.active_communities_copilot';
import refreshIcon from '@salesforce/resourceUrl/refresh';


export default class BotMessage extends NavigationMixin(LightningElement) {
  @api chatMessageInput
  @track chatMessage
  isData = false
  isReport = false
  isMessage = false
  isRegenerate = false
  reportFilters
  isCommunity = false;
  @api isSalesforceInstance = false;
  @api threadId = '';
  @api chatHistoryFlag = false
  @api chatHistoryBotMsgList = []

  pressRegenerate = false

  recordsPreview;
  isLoading = false

  refreshIcon = refreshIcon

  isLoadingRegenerate = 'spinner-container-hidden'

  communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null);

  connectedCallback() {
    this.checkIsCommunityInstance(); 
    loadStyle(this, customButtonCSS)
    .then(() => {
        console.log('External CSS loaded successfully.');
    })
    .catch(error => {
        console.error('Error loading external CSS', error);
    });

    this.chatMessage = Object.assign({}, this.chatMessageInput) // for Deep copying

    if(this.chatHistoryFlag && this.chatMessageInput){

      this.isRegenerate = this.chatHistoryFlag
      console.log('this.isRegenerate: ' + this.isRegenerate)

      this.chatHistoryBotMsgList = [
        ...this.chatHistoryBotMsgList,
        { ...this.chatMessageInput } // Store a copy of the chatMessageInput object
    ];
    console.log('this.chatHistoryBotMsgList')
    console.log(this.chatHistoryBotMsgList)

    }
    else{
      this.handleSend()
    }
    
  }

  handleRegenerateClick(event){
    this.pressRegenerate =true
    this.isLoadingRegenerate = 'spinner-container-visible'
    const messageIndex = event.currentTarget.dataset.index;
    const selectedMessage = this.chatHistoryBotMsgList[messageIndex];
    console.log('Regenerate button clicked. Selected message:', selectedMessage.message);
    this.threadId = selectedMessage.threadId;
    processQuery({ query: selectedMessage.message, threadId: '', requestType: 'Regenerate'})
    .then(
      (result) => {
      console.log("response Regenerate body: ");
      console.log(result);
        this.pressRegenerate =true
        this.handleHerokuResult(result)
      }
    )
    .catch(
      (error) => {
        let message = 'An unknown error occurred.'; // Default message

        if (error && error.body && error.body.message) {
            message = error.body.message;  // Standard Salesforce error
        } else if (error && error.message) {
            message = error.message;  // Other JavaScript or network errors
        }
    
        console.error('Error: ', error); // Log the complete error for debugging
        this.displayMessage(message);
      }
    ).finally(
      () => {
        this.isLoadingRegenerate = 'spinner-container-hidden'
      }
    )
  }

  // Sending Input data to Heroku API and showing its Response
  handleSend() {
    this.isBotLoading = true
    let inputData = this.chatMessage.message
    if (inputData != null & inputData.trim().length !== 0) {
      // var result = {"flag":2,"SQL_Query":"SELECT \"name\", \"billingcountry\" FROM salesforceproduction.account WHERE \"billingcountry\" IN ('Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy', 'Kosovo', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia', 'Norway', 'Poland', 'Portugal', 'Romania', 'Russia', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Turkey', 'Ukraine', 'United Kingdom', 'Vatican City') AND \"ack_id__c\" IS NULL LIMIT 30","SQL_Query_Result":"[{\"name\":\"Sparta Gestion\",\"billingcountry\":\"France\"},{\"name\":\"Seven2\",\"billingcountry\":\"France\"},{\"name\":\"Deutsche Bank Luxembourg S.A.\",\"billingcountry\":\"Luxembourg\"},{\"name\":\"Northern Foods Limited\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"Caledonia Private Capital\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"Daymer Bay Capital\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"Blue Colibri Capital\",\"billingcountry\":\"Luxembourg\"},{\"name\":\"FH M\\u00fcnster\",\"billingcountry\":\"Germany\"},{\"name\":\"foryouandyourcustomers\",\"billingcountry\":\"Germany\"},{\"name\":\"IQ EQ Fund Management\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"North Yorkshire Pension Fund\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"Telax\",\"billingcountry\":\"Sweden\"},{\"name\":\"Nottinghamshire Local Government Pension\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"Oxfordshire Pension Fund\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"Ambienta\",\"billingcountry\":\"Italy\"},{\"name\":\"The Maples Group\",\"billingcountry\":\"Ireland\"},{\"name\":\"Adelis Equity Partners AB\",\"billingcountry\":\"Sweden\"},{\"name\":\"Schleupen\",\"billingcountry\":\"Germany\"},{\"name\":\"Serco Group Plc\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"Skylabs\",\"billingcountry\":\"Italy\"},{\"name\":\"North of South Capital LLP\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"Londinium Asset Management Ltd.\",\"billingcountry\":\"Monaco\"},{\"name\":\"Boots Corporation\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"GBS Finance\",\"billingcountry\":\"Spain\"},{\"name\":\"BASF Corporation\",\"billingcountry\":\"Germany\"},{\"name\":\"Rail & Public Transport Corporation (NL)\",\"billingcountry\":\"Netherlands\"},{\"name\":\"Brainvest Wealth Management SA\",\"billingcountry\":\"Switzerland\"},{\"name\":\"Independent Franchise Partners\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"Acropolis Capital Partners Ltd\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"Tyco Holdings U K Limited\",\"billingcountry\":\"United Kingdom\"}]","SQL_Query_Columns":[{"title":"Name","field":"name"},{"title":"Billingcountry","field":"billingcountry"}]}
      // var result = {"flag":2,"SQL_Query":"SELECT \"name\", \"billingcountry\" FROM salesforceproduction.account WHERE \"billingcountry\" IN ('Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy', 'Kosovo', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia', 'Norway', 'Poland', 'Portugal', 'Romania', 'Russia', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Turkey', 'Ukraine', 'United Kingdom', 'Vatican City') AND \"ack_id__c\" IS NULL LIMIT 30","SQL_Query_Result":"[{\"name\":\"Sparta Gestion\",\"billingcountry\":\"France\"},{\"name\":\"Seven2\",\"billingcountry\":\"France\"},{\"name\":\"Deutsche Bank Luxembourg S.A.\",\"billingcountry\":\"Luxembourg\"},{\"name\":\"Northern Foods Limited\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"Caledonia Private Capital\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"Daymer Bay Capital\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"Blue Colibri Capital\",\"billingcountry\":\"Luxembourg\"},{\"name\":\"FH M\\u00fcnster\",\"billingcountry\":\"Germany\"},{\"name\":\"foryouandyourcustomers\",\"billingcountry\":\"Germany\"},{\"name\":\"IQ EQ Fund Management\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"North Yorkshire Pension Fund\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"Telax\",\"billingcountry\":\"Sweden\"},{\"name\":\"Nottinghamshire Local Government Pension\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"Oxfordshire Pension Fund\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"Ambienta\",\"billingcountry\":\"Italy\"},{\"name\":\"The Maples Group\",\"billingcountry\":\"Ireland\"},{\"name\":\"Adelis Equity Partners AB\",\"billingcountry\":\"Sweden\"},{\"name\":\"Schleupen\",\"billingcountry\":\"Germany\"},{\"name\":\"Serco Group Plc\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"Skylabs\",\"billingcountry\":\"Italy\"},{\"name\":\"North of South Capital LLP\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"Londinium Asset Management Ltd.\",\"billingcountry\":\"Monaco\"},{\"name\":\"Boots Corporation\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"GBS Finance\",\"billingcountry\":\"Spain\"},{\"name\":\"BASF Corporation\",\"billingcountry\":\"Germany\"},{\"name\":\"Rail & Public Transport Corporation (NL)\",\"billingcountry\":\"Netherlands\"},{\"name\":\"Brainvest Wealth Management SA\",\"billingcountry\":\"Switzerland\"},{\"name\":\"Independent Franchise Partners\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"Acropolis Capital Partners Ltd\",\"billingcountry\":\"United Kingdom\"},{\"name\":\"Tyco Holdings U K Limited\",\"billingcountry\":\"United Kingdom\"}]","SQL_Query_Columns":[{"title":"Name","field":"name"}]}
      // this.handleHerokuResult(result) 
      this.threadId = this.chatMessage.threadId
      console.log('this.threadId in child compo send function: ' + this.threadId)

       processQuery({ query: inputData, threadId: this.threadId, requestType: 'Prompt Request'})
         .then(
           (result) => {
            console.log("response result body: ");
            console.log(result);

             this.handleHerokuResult(result)
           }
         )
         .catch(
           (error) => {
              let message = 'An unknown error occurred.'; // Default message

              if (error && error.body && error.body.message) {
                  message = error.body.message;  // Standard Salesforce error
              } else if (error && error.message) {
                  message = error.message;  // Other JavaScript or network errors
              }
          
              console.error('Error: ', error); // Log the complete error for debugging
              this.displayMessage(message);
           }
         ).finally(
           () => {
           }
         )
    } else {
      this.displayMessage('Invalid Input.')
    }
  }

  // Handle success response from Heroku
  handleHerokuResult(result) {
    
    console.log('Heroku Result',JSON.stringify(result));
    switch (result.flag) {

      case 1:{
        const errorMessage = result.answer
        console.log('line 154 : errorMessage : ' + errorMessage) ; 
        this.displayMessage(errorMessage)
        if (this.threadId == '' && result.chat_record?.threadid) {
          this.threadId = result.chat_record.threadid;
          console.log('this.threadId in response body: ' + this.threadId);
        }
        else{
          this.threadId = '';   
        }
        // this.threadId = temp_chat_record.threadid;
        this.dispatchEvent(new CustomEvent('threadidupdate', {
        detail: { threadId: this.threadId }
        }));
        break
      }
      case 2: {
        console.log('CASE 2');
        // data Table
        console.log('result.SQL_Query_Columns:' + result.SQL_Query_Columns);
        console.log('result.SQL_Query_Result:' + result.SQL_Query_Result);
        if (result.SQL_Query_Columns != null & result.SQL_Query_Result !='') {

          // sessionStorage.setItem('flag', result.flag)
          // sessionStorage.setItem('SQL_Query_Result', result.SQL_Query_Result)
          // sessionStorage.setItem('SQL_Query_Columns', JSON.stringify(result.SQL_Query_Columns))

          this.recordsPreview = result;

          if(this.threadId == '' && result.chat_record.threadid){
            this.threadId = result.chat_record.threadid;
            console.log('this.threadId in response body: ' + this.threadId);
          }

          // this.threadId = temp_chat_record.threadid;
          this.dispatchEvent(new CustomEvent('threadidupdate', {
          detail: { threadId: this.threadId }
          }));
          this.isData = true
        }
        else if (result.SQL_Query_Result ==''){
          this.displayMessage('There is no such data. Please rephrase your prompt.')
        }
        break
      }
      default: 
        this.displayMessage('Please try again in a few moments. If the problem continues, feel free to contact our support team. Thank you for your patience!')
    }
  }

  displayMessage(msg) {
    if(this.isRegenerate)
    this.isRegenerate = false
    this.isMessage = true
    this.chatMessage.message = msg
  }

  // Nagivate to the Full-Page dataTable to display all data
  handleViewAllData() {
    this.isLoading = true
    sessionStorage.setItem('SQL_Default_Query', this.recordsPreview.SQL_Default_Query)

    // publishEvent({ queryData: this.recordsPreview.SQL_Query })
    // .then(() => {
    //     console.log('Platform Event published successfully 1122');
    // })
    // .catch(error => {
    //     console.error('Error publishing Platform Event:', error);
    // });

    var url = '/view-dakota-copilot-records';
    
    if(this.isCommunity){
      this[NavigationMixin.Navigate]({
      type: 'standard__webPage',
          attributes: {
              url: url
          }
      });
    }
    else{
      // this[NavigationMixin.Navigate]({
      //   type: 'standard__navItemPage',
      //   attributes: {
      //     apiName: 'Report'
      //   },
      //   state: {
      //     c__dateStamp: Date.now()
      // }
      // })

      this[NavigationMixin.Navigate]({
        type: 'standard__component',  // Type for Aura component navigation
        attributes: {
            componentName: 'c__TabulatorDataWrapper'  // The name of your Aura component
        },
        state: {
            //c__dateStamp: Date.now()  // Pass any state parameters as needed
            c__showTabulatorData: false // Pass 'true' as a string
        }
      });
    }
    this.isLoading = false
  }

  
  checkIsCommunityInstance() {
    var currentUrl = window.location.href;
    this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false;
    this.isSalesforceInstance = !this.isCommunity;
  }

  // Create report and Redirect to that Report
  handleCreateReport() {
    createReport({ reportFilters: this.reportFilters })
      .then((result) => {
        this.handleReportCreation(result)
      })
      .catch((error) => {
        let message = 'An unknown error occurred.'; // Default message

              if (error && error.body && error.body.message) {
                  message = error.body.message;  // Standard Salesforce error
              } else if (error && error.message) {
                  message = error.message;  // Other JavaScript or network errors
              }
          
              console.error('Error: ', error); // Log the complete error for debugging
              this.displayMessage(message);
      })
  }

  // Report is created and open Report in Salesforce
  handleReportCreation(createdReportID) {
    if (createdReportID !== '') {
      this[NavigationMixin.Navigate]({
        type: 'standard__recordPage',
        attributes: {
          recordId: createdReportID, // createdReportID will be Report ID
          objectApiName: 'Report',
          actionName: 'view'
        }
      })
    }
  }

  renderedCallback() {
    if(this.pressRegenerate == false){
      // Emit an event to notify `ChatMessages` component
      const event = new CustomEvent('scrollbottomupdate');
      this.dispatchEvent(event);
    }
    this.pressRegenerate =false
  }
}