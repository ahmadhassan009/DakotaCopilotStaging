import { LightningElement, track, api } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader'; 
import floatingIconCSS from '@salesforce/resourceUrl/chatbotCssFile'; // Import your static resource
import floatingIcon from '@salesforce/resourceUrl/CopilotButtonIcon';
import activeCommunities from '@salesforce/label/c.active_communities_copilot';
import isDakotaCopilotAccessibleForUser from '@salesforce/apex/DakotaCopolitController.isDakotaCopilotAccessibleForUser';


export default class FloatingIconComponent extends LightningElement {
    floatingIcon = floatingIcon
    isCommunity = false
    @api isSalesforceInstance = false
    @track showChildComponent = false // Track whether the child closed or opened
    @track minimizeChildComponent = false // For minimizing the child component
    @track showParentComponent = true // Initially show the parent component
    @track sfComponentClass = 'component-ui'
    @track sfFloatingIconClass = 'floating-icon'
    @track mpComponentClass = 'component-ui'
    @track mpFloatingIconClass = 'floating-icon'
    @api marginLeft = '20px'
    @api marginBottom = '0px'
    @track isFunctionalityAccessible = false;
    communityName = (activeCommunities.includes(location.pathname.split('/')[1]) ? location.pathname.split('/')[1] : null)



    connectedCallback() {
        this.checkIsCommunityInstance();
        this.checkFunctionalitAccessible();
        // Load the external CSS file when the component is initialized
        loadStyle(this, floatingIconCSS)
        .then(() => {
            console.log('External CSS loaded successfully.')
        })
        .catch(error => {
            console.error('Error loading external CSS', error)
        });  
    }

    async checkFunctionalitAccessible() {
        try {
            const isEnabled = await isDakotaCopilotAccessibleForUser();
            this.isFunctionalityAccessible = isEnabled;
        } catch (error) {
            console.error('Error checking functionality:', error);
        }
    }

    renderedCallback() {
        if (this.isCommunity){
            this.checkDivPosition()
        }else{
            this.observeResizeChanges()
        }
    }
    
    observeResizeChanges() {
    //    setTimeout(() => {
    //     const targetElement = document.querySelector('.utilitybar') 
    //     if (targetElement) {
    //         this.sfComponentClass = 'component-ui-offset'
    //         this.sfFloatingIconClass = 'floating-icon-offset'
    //     } else {
    //         this.sfComponentClass = 'component-ui';
    //         this.sfFloatingIconClass = 'floating-icon'
    //     } 
    //    }, 5000)

    const iconElement = this.template.querySelector('[data-id="dakota-copilot-icon-internal"]')
        if (iconElement) {
            iconElement.style.bottom = this.marginBottom // Set the bottom margin dynamicallid
            if(iconElement.style.bottom == '0px'){
                iconElement.style.zIndex = '9999';
            }
            else{
                iconElement.style.zIndex = '1';
            }
                
        }
        const iconElement2 = this.template.querySelector('[data-id="dakota-copilot-component-internal"]')
        if (iconElement2) {
            iconElement2.style.bottom = this.marginBottom
            if(iconElement2.style.bottom == '2px'){
                iconElement2.style.zIndex = '9999';
            }
            else{
                iconElement2.style.zIndex = '101';
            }
        }
    }

    checkDivPosition() {
      const iconElement = this.template.querySelector('[data-id="dakota-copilot-icon"]')
        if (iconElement) {
            iconElement.style.right = this.marginLeft // Set the right margin dynamically
            iconElement.style.zIndex = '1000'; // Set the z-index dynamically
        }
        const iconElement2 = this.template.querySelector('[data-id="dakota-copilot-component"]')
        if (iconElement2) {
            iconElement2.style.right = this.marginLeft
            iconElement.style.zIndex = '1000'; // Set the z-index dynamically
        }
    }

    disconnectedCallback() {
        // Disconnect the observer when the component is removed from the DOM
        if (this.observer) {
            this.observer.disconnect()
        }
    }

    handleDivClick() {
       // Show child when clicking on the parent (floating icon)
       this.showChildComponent = true
       this.minimizeChildComponent = false // Reset minimize state
       this.showParentComponent = false // Hide parent (floating icon)
    }
    
    get chatboxClass() {
        return `${this.minimizeChildComponent ? 'minimized' : this.sfComponentClass}`
    }

    get parentClass() {
        return this.showParentComponent ? 'parent-max' : 'parent-min'
    }

    get chatboxClassCommunity() {
        return `${this.minimizeChildComponent ? 'minimized' : this.mpComponentClass}`
    }
    
    handleToggle(event) {
        // Extract the close and minimize statuses from the event
        const { close, minimize } = event.detail
        this.showChildComponent = !close
        this.minimizeChildComponent = minimize
        this.showParentComponent = true
    }

    checkIsCommunityInstance() {
        var currentUrl = window.location.href
        this.isCommunity = currentUrl.indexOf(this.communityName) > -1 ? true : false
        this.isSalesforceInstance = !this.isCommunity
    }
}