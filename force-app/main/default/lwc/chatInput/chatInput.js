import { LightningElement, wire, track} from 'lwc'
import { publish, MessageContext } from 'lightning/messageService'
import BOT_MESSAGES_CHANNEL from '@salesforce/messageChannel/Bot_Messages__c'
import newChatImg from '@salesforce/resourceUrl/clock'
import sendImg from '@salesforce/resourceUrl/send'
import newImg from '@salesforce/resourceUrl/new'
import { getRecord } from 'lightning/uiRecordApi'
import Id from '@salesforce/user/Id'
import UserName from '@salesforce/schema/User.Name'
import UserPhotoUrl from '@salesforce/schema/User.MediumBannerPhotoUrl'
import UserTimeZone from '@salesforce/schema/User.TimeZoneSidKey';


export default class ChatInput extends LightningElement {

    newChatIcon = newChatImg
    sendIcon = sendImg
    newIcon = newImg
    sendButtonPressed = false
    //currentUserName = 'User'
    userTimeZone
    userTimeZoneDateTime
    inputData = ''


    @wire(MessageContext)
    messageContext

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
    

  

    // Save input in Variable
    handleInputChange(event) {
        // this.inputData = event.target.value
        // const textarea = event.target; // Ensure this targets the textarea
        // textarea.style.height = "30px";
        // // Adjust height to fit content, max height for 3 lines
        // textarea.style.height = Math.min(textarea.scrollHeight, 60) + "px"; // 72px is the height for 3 lines

        this.inputData = event.target.value;
        const textarea = event.target; // Ensure this targets the textarea
        const container = textarea.closest('.input-box'); // Find the parent container div
    


        // If textarea is empty, reset heights to defaults
        if (!this.inputData.trim()) {
            textarea.style.height = "30px"; // Default textarea height
            container.style.height = "36px"; // Default container height (textarea height + padding/margin)
            return;
        }
        //Reset textarea height to its minimum height before recalculating
        textarea.style.height = "30px"; 
        textarea.style.height = Math.min(textarea.scrollHeight, 55) + "px";
        container.style.height = Math.min(textarea.scrollHeight, 55) + 8 + "px"; // Add padding or margin adjustment if needed
        
    }

    // Function to handle 'Enter' key press event
    handleKeyDown(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            // Prevent default behavior (moving to the next line)
            event.preventDefault();
    
            // Handle any custom behavior here, such as sending the input
            console.log("Enter pressed without Shift");
            this.handleSend(event); // Example: Trigger a send action
        }
    }

    // send the query to backend
    handleSend() {      
        Promise.all([
            this.valueToSend = true,
            this.handleSendClick(),
            this.formatDateUserTimezone()
        ])
        .then(results => {
            // let date = new Date()
            // let time = date.getHours() + ':' + date.getMinutes()

            const payload = {
                isChatInput: true,
                isBot: false,
                time: this.userTimeZoneDateTime,
                message: this.inputData,
               // userName: this.currentUserName
            }
            publish(this.messageContext, BOT_MESSAGES_CHANNEL, payload)
            this.resetTextarea()

        })
        .catch(error => {
            console.error("Error in handleSend:", error); // Log the error details for debugging
            // Handle any errors from either of the promises
            this.error = error;
            this.isLoading = false; // Hide loading indicator if there's an error
        });
    }

    resetTextarea(){
        this.inputData = ''
        const textarea = this.template.querySelector('textarea'); // Use appropriate selector
        textarea.value = ''
        textarea.style.height = "30px" // Default textarea height
        const container = textarea.closest('.input-box'); // Find the parent container div
        container.style.height = "36px" // Default container height (textarea height + padding/margin)
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

    // clear the chat
    handleClear() {
        const payload = {
            isChatInput: true,
            isClear: true,
        }
        publish(this.messageContext, BOT_MESSAGES_CHANNEL, payload)
    }

    handleSendClick() {
        // Dispatch a custom event to send the value to the parent
        const event = new CustomEvent('valuechange', {
            detail: this.valueToSend
        });
        this.dispatchEvent(event); // Dispatch the event
    }

    handleHistory(){
        // Fire a custom event to the parent with the updated visibility state
        const event = new CustomEvent('updatevisibility', {
            detail: { isVisible: true } // Pass 'false' to hide the parent component
        });
        this.dispatchEvent(event); // Fire the event to notify the parent component
    }
}