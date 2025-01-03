import { LightningElement, wire, track, api} from 'lwc'
import { subscribe, MessageContext } from 'lightning/messageService'
import BOT_MESSAGES_CHANNEL from '@salesforce/messageChannel/Bot_Messages__c'
import floatingIcon from '@salesforce/resourceUrl/floatingButtonBotIcon';
import CHAT_HISTORY_DATA_MESSAGE_CHANNEL from '@salesforce/messageChannel/chatHistoryDataMessageChannel__c';


import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';  // Get current user ID
import NAME_FIELD from '@salesforce/schema/User.Name';  // Full Name field (combines FirstName and LastName)
import UserTimeZone from '@salesforce/schema/User.TimeZoneSidKey';



export default class ChatMessages extends LightningElement {

    subscription = null
    @track chats = []
    botName = 'Bot'
    botProfilePic = floatingIcon
    currentUserProfilePic = null
    threadId = '';
    historyChatData = [];
    chatHistoryFlag = false

    @wire(MessageContext)
    messageContext

    @wire(MessageContext)
    messageContextChatHistory

    currentUserNameBycallback;
    error;
    
    userTimeZone;
    userTimeZoneDateTimeBycallback;
 
    @wire(getRecord, { recordId: USER_ID, fields: [NAME_FIELD, UserTimeZone] })
    wiredUser({ error, data }) {
        if (data) {
            // Extract the full name from the result
            this.currentUserNameBycallback = data.fields.Name.value;
            this.userTimeZone = data.fields.TimeZoneSidKey.value;
            this.error = undefined;
            this.formatDateUserTimezone();
        } else if (error) {
            // Handle error case
            this.error = error;
            this.currentUserNameBycallback = undefined;
        }
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
        this.userTimeZoneDateTimeBycallback = `${time} ${day}-${month}-${year}`;
    }

    handleThreadIdUpdate(event) {
        this.threadId = event.detail.threadId;
        console.log('Updated threadId in parent:', this.threadId);
    }

    // handleParentVariableChange(event) {
    //     this.historyChatData = event.detail;
    //     console.log('Updated data in child component:', this.historyChatData);
    // }

    connectedCallback() {
        this.subscribeToMessageChannelChatHistory()
        this.subscribeToMessageChannel()        
        
    }

    handleChatHistoryMessage(message) {
        console.log("Received message:", message);
        // Update the data based on the message received
        this.historyChatData = message.data;

        // Add the first message from the bot
        if(this.historyChatData.length > 0){
            this.chats = this.historyChatData
            console.log("this.chats in chat Messages: ")
            console.log(this.chats)
            this.threadId = this.chats[0].threadId
            this.chatHistoryFlag = true;
        }  
    }

    // Subscribe to Lightning Message Service Channel--- from chat Messages Component
    subscribeToMessageChannelChatHistory() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContextChatHistory,
                CHAT_HISTORY_DATA_MESSAGE_CHANNEL,
                (message) => this.handleChatHistoryMessage(message)
            );
        }
    }

    // Subscribe to Lightning Message Service Channel--- from chat Messages Component
    subscribeToMessageChannel() {
        console.log('Subscribing to message channel...');

        this.subscription = subscribe(
            this.messageContext,
            BOT_MESSAGES_CHANNEL,
            (message) => this.handleMessage(message)
        )
        console.log('Subscription successful:', this.subscription); // Log subscription object

    }

    // check if chat empty to display background bot
    get isChatEmpty() {
        return this.chats.length <= 0
    }

    // get name of Bot or User from boolean
    currentMessageName(isBot, userName) {
        if(isBot){
            return this.botName
        }
        else{
            return userName
        }
    }

    // get message body
    addMessage(isBot, time, message, userName) {
        console.log('start addMessage')
        const payload = (
            {
                'isBot': isBot,
                'sender': this.currentMessageName(isBot, userName),
                'time': time,
                'message': message,
                'threadId': this.threadId
            }
        )

        this.chats = [...this.chats, payload];
        console.log('end addMessage')
    }

    // handling Message Receieved from Input Box
    handleMessage(message) {
        if (message.isChatInput){
            if (message.isClear) {
                this.chats = []
                this.threadId = ''
                return
            }
            this.addMessage(message.isBot, message.time, message.message, message.userName)
            this.addBotMessage(message.message, message.time,)
            this.chatHistoryFlag = false

        }
        console.log("this.chats: ")
        console.log(this.chats)
    }

    addBotMessage(inputMsg, userTime){
        this.addMessage(true, userTime, inputMsg)
    }

    renderedCallback() {
        // Emit the message update event to notify the parent
        const event = new CustomEvent('scrollupdate');
        this.dispatchEvent(event);
    }

    handleScrollBottomUpdate(){
        this.renderedCallback();
    }


}