import { LightningElement, track, wire, api } from 'lwc';
import messageGif from '@salesforce/resourceUrl/helpScreen';
import chevronRight from '@salesforce/resourceUrl/chevronright';
import { publish, MessageContext } from 'lightning/messageService'
import BOT_MESSAGES_CHANNEL from '@salesforce/messageChannel/Bot_Messages__c'
import { getRecord } from 'lightning/uiRecordApi'
import Id from '@salesforce/user/Id'
//import UserName from '@salesforce/schema/User.Name'
import UserPhotoUrl from '@salesforce/schema/User.MediumBannerPhotoUrl'
import UserTimeZone from '@salesforce/schema/User.TimeZoneSidKey';
import CHAT_HISTORY_DATA_MESSAGE_CHANNEL from '@salesforce/messageChannel/chatHistoryDataMessageChannel__c';


export default class ChatHowCanWeHelpYou extends LightningElement {
    messageGif = messageGif
    chevronRight = chevronRight
    sendButtonClicked = false
    @api showHistory = false; // Variable to track child component visibilityc

    @track buttonText = ''; // Text to pass to the child
   // currentUserName = 'User'

    userTimeZone
    userTimeZoneDateTime

    isLoading = false

    @api chats = [];

    @api dynamicClass = 'visible'

    @wire(MessageContext)
    messageContext

    @wire(MessageContext)
    messageContextChatHistory

    // get current User Name and Profile Picture
    //@wire(getRecord, { recordId: Id, fields: [UserName, UserPhotoUrl, UserTimeZone] })
    @wire(getRecord, { recordId: Id, fields: [ UserPhotoUrl, UserTimeZone] })

    userDetails({ error, data }) {
        if (data) {
    
           // this.currentUserName = data.fields.Name.value
            this.currentUserProfilePic = data.fields.MediumBannerPhotoUrl.value
            this.userTimeZone = data.fields.TimeZoneSidKey.value;

        } else if (error) {
            console.error(error)
        }
        
    }

    checkPromptEntered(event) {
        // Get the value sent from the child component
        this.sendButtonClicked = event.detail;
    }

    handleSend(event) {    
        this.buttonText = event.currentTarget.dataset.id


        Promise.all([
            this.sendButtonClicked = true,
            this.formatDateUserTimezone()
        ])
        .then(results => {
            // let date = new Date()
            // let time = date.getHours() + ':' + date.getMinutes()
            const payload = {
                isChatInput: true,
                isBot: false,
                time: this.userTimeZoneDateTime,
                message: this.buttonText,
              //  userName: this.currentUserName
            }
            publish(this.messageContext, BOT_MESSAGES_CHANNEL, payload)
            this.buttonText = ''
        })
        .catch(error => {
            // Handle any errors from either of the promises
            this.error = error;
            this.isLoading = false; // Hide loading indicator if there's an error
        });
    }

   
    
    formatDateUserTimezone(){
        const date = new Date();
        // Format both date and time in the user's timezone
        const formattedDateTime = new Intl.DateTimeFormat('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: this.userTimeZone
        }).format(date);

        // Adjust formattedDateTime to match the '09:45pm 31-10-2024' pattern
        const [datePart, time] = formattedDateTime.split(', ');
        const [month, day, year] = datePart.split('/');
        this.userTimeZoneDateTime = `${time} ${day}-${month}-${year}`;
    }

    // Method to toggle child visibility when the parent button is clicked
    toggleChildVisibility() {
        this.showHistory = !this.showHistory;

        if(this.showHistory){
            this.dynamicClass = 'hidden'
        }else{
            this.dynamicClass = 'visible'
        }
    }

    // Method to handle the event fired from child to update visibility in parent
    handleVisibilityUpdate(event) {
        this.showHistory = event.detail.isVisible; // Update visibility based on event data

        if(this.showHistory){
            this.dynamicClass = 'hidden'
        }else{
            this.dynamicClass = 'visible'
        }
    }

    handleBackClick(){
        this.showHistory = false

        if(this.showHistory){
            this.dynamicClass = 'hidden'
        }else{
            this.dynamicClass = 'visible'
        }
    }

    handleChatHistorySelected(event) {

        this.isLoading = true
        this.showHistory = false

        if(this.showHistory){
            this.dynamicClass = 'hidden'
        }else{
            this.dynamicClass = 'visible'
        }
        this.sendButtonClicked =true
        // Recieve chats from Chat History component
        this.chats = event.detail;       
        // this.dispatchEvent(new CustomEvent('parentchathistorydata', { detail: this.chats }));

        //Publish the updated data to the message channel
        const message = { data: this.chats };
        Promise.resolve().then(() => {
            publish(this.messageContextChatHistory, CHAT_HISTORY_DATA_MESSAGE_CHANNEL, message);
        });
        this.isLoading = false
    }

    handleScrollToBottom() {
        // Select the chat container element
        const chatContainer = this.template.querySelector('.msgs-box-chat-message');
        if (chatContainer) {
            // Scroll to the bottom of the container
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }
}