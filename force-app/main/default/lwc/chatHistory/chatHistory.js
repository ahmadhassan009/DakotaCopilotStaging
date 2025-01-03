import { LightningElement,track,wire } from 'lwc';
import chevronleft from '@salesforce/resourceUrl/chevronleft';
import processQuery from '@salesforce/apex/DakotaCopolitController.processQuery';
import { getRecord } from 'lightning/uiRecordApi'
import Id from '@salesforce/user/Id'
import UserName from '@salesforce/schema/User.Name'
import UserPhotoUrl from '@salesforce/schema/User.MediumBannerPhotoUrl'
import UserTimeZone from '@salesforce/schema/User.TimeZoneSidKey';

export default class ChatHistory extends LightningElement {

    chevronleftIcon = chevronleft
    inputData = ''
    threadId = ''
    fomattedChat = []
    chatHistoryList = []
    @track isLoading = true
    currentUserName = 'User'
    userTimeZone

    @track hasHistory = false; // Flag to track if there's chat history
    chatHistoryDialogs = []

    filteredChatHistoryList = []; // New list for filtered data
    searchInput = ''; // New property for search input
    
    // get current User Name and Profile Picture
    @wire(getRecord, { recordId: Id, fields: [UserName, UserPhotoUrl, UserTimeZone] })
    userDetails({ error, data }) {
        if (data) {
            this.currentUserName = data.fields.Name.value
            this.currentUserProfilePic = data.fields.MediumBannerPhotoUrl.value
            this.userTimeZone = data.fields.TimeZoneSidKey.value;
        } else if (error) {
            console.error(error)
        }
    }


    // scenerio 2
    connectedCallback(){
         this.handleSend();
    }

    handleSearch(event) {
        this.searchInput = event.target.value.toLowerCase(); // Store search input and convert to lowercase
        console.log("this.searchInput: " + this.searchInput)
        this.filteredChatHistoryList = this.chatHistoryList.filter((chat) => {
            return chat.label.toLowerCase().includes(this.searchInput); // Filter chat list based on search input
        });
    }

    handleSend() {
        processQuery({ query: this.inputData, threadId: this.threadId, requestType: 'History Request'})
         .then(
           (result) => {
            console.log("History Response body: ")
            console.log(result)

            // Check if result has any keys (if it’s not an empty object)
            if (Object.keys(result).length > 0) {
                this.chatHistoryList = Object.entries(result).map(([threadId, chat]) => {
                    chat.formattedTimestamp = this.formatDateWithUserTimezone(chat.timestamp, this.userTimeZone)
                    return { threadId, ...chat }
                });
                this.filteredChatHistoryList = [...this.chatHistoryList]; // Copy initial data to filtered list
                this.hasHistory = true;
            } else {
                this.hasHistory = false; // No chat history
            }

            console.log("this.chatHistoryList: ")
            console.log(this.chatHistoryList)
            this.isLoading =false
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
                this.isLoading =false
               
            }
        )
    }

    formatDateWithUserTimezone(timestamp, userTimeZone) {
        // Convert the timestamp to a Date object in UTC time
        const date = new Date(timestamp * 1000); // Convert from seconds to milliseconds
        const today = new Date();
    
        // Define options for time and date formatting
        const timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: userTimeZone };
        const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: userTimeZone };
    
        // Format the time and date according to the user's timezone
        const formattedTime = new Intl.DateTimeFormat('en-US', timeOptions).format(date);
        const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(date);
    
        // Check if the date is today in the user's timezone
        const isToday = date.toLocaleDateString('en-US', { timeZone: userTimeZone }) ===
                        today.toLocaleDateString('en-US', { timeZone: userTimeZone });
    
        if (isToday) {
            return `As of Today at ${formattedTime}`;
        } else {
            return `${formattedDate} at ${formattedTime}`;
        }
    }

    handleBackButton(){
         // Dispatch an event to notify the parent
         const divClickEvent = new CustomEvent('backbuttonclick');
         this.dispatchEvent(divClickEvent);
    }

    
    // scenerio 3
    handleViewChat(event) {

        this.isLoading =true
        // Get the threadId from the data attribute
        this.threadId = event.target.dataset.threadid;
        console.log('Thread ID on click view:', this.threadId);
            
        processQuery({ query: this.inputData, threadId: this.threadId, requestType: 'Chat History Request'})
        .then(
            (result) => {
            console.log("Chat History Dialogs Response body: ")
            console.log(result)
            this.chatHistoryDialogs = result

            const transformedData = this.transformResponse(this.chatHistoryDialogs, this.threadId);
            console.log("transformedData: ");
            console.log(transformedData);

            this.fomattedChat = transformedData
            // Dispatch the event with the formatted chat data
            const chatEvent = new CustomEvent('datafromchathistory', {
                detail: this.fomattedChat // Pass the formatted chat data as the detail
            });
            this.dispatchEvent(chatEvent);
            }
        ).catch(
            (error) => {
                let message = 'An unknown error occurred.'; // Default message

                if (error && error.body && error.body.message) {
                    message = error.body.message;  // Standard Salesforce error
                } else if (error && error.message) {
                    message = error.message;  // Other JavaScript or network errors
                }
            
                console.error('Error: ', error); // Log the complete error for debugging

            }
        ).finally(
            () => {
            this.isLoading =false
            }
        )
    }

    transformResponse(response, threadId) {
        const transformedArray = [];
    
        Object.entries(response).forEach(([key, chatData]) => {
            // User message
            transformedArray.push({
                isBot: false,
                message: chatData.value,
                sender: this.currentUserName,
                threadId: threadId,
                time: this.formatDateToCustom(chatData.created_at) // Assuming timestamp is in seconds
            });
    
            // Assistant message
            if (chatData.assistant) {
                transformedArray.push({
                    isBot: true,
                    message: chatData.assistant.value,
                    sender: "Bot",
                    threadId: threadId,
                    time: this.formatDateToCustom(chatData.created_at) // Assuming timestamp is in seconds
                });
            }
            else{
                transformedArray.push({
                    isBot: true,
                    message: "Rate limit exceeded.",
                    sender: "Bot",
                    threadId: threadId,
                    time: this.formatDateToCustom(chatData.created_at) // Assuming timestamp is in seconds
                });
            }
        });
    
        return transformedArray;
    }

    formatDateToCustom(timestamp) {
        // Convert timestamp to milliseconds and create a Date object
        const date = new Date(timestamp * 1000);
        
        // Format date and time in '09:45pm 31-10-2024' format
        const formattedDateTime = new Intl.DateTimeFormat('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: this.userTimeZone
        }).format(date);

        // Adjust formattedDateTime to match '09:45pm 31-10-2024' pattern
        const [datePart, time] = formattedDateTime.split(', ');
        const [month, day, year] = datePart.split('/');
        const finalDateTime = `${time} ${day}-${month}-${year}`;

        return finalDateTime
    }
}