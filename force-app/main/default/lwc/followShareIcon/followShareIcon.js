import { api, wire, LightningElement } from 'lwc';
import addToFavorites from '@salesforce/apex/RecordsFavoriteController.addToFavorites';
import getfollowRecordCount from '@salesforce/apex/RecordsFavoriteController.getfollowRecordCount';
import removeFromFavorites from '@salesforce/apex/RecordsFavoriteController.removeFromFavorites';
import getFavoriteRecordById from '@salesforce/apex/RecordsFavoriteController.getFavoriteRecordById';
import { fireEvent, registerListener, unregisterAllListeners } from 'c/pubsub';
import { CurrentPageReference } from 'lightning/navigation';
import shareButtonIcon from '@salesforce/resourceUrl/shareButtonIcon';
import Allowed_Follow_Record_Count from '@salesforce/label/c.Allowed_Follow_Record_Count';

export default class FollowShareIcon extends LightningElement {
    @wire(CurrentPageReference) objPageReference;

    // Public Properties
    @api recordId;
    @api hideFollowButton;
    @api hideShareButton;

    // Markup Variables
    sharePopup = false;
    followPopup = false;
    title = '';
    toastMessage = '';
    iconName = '';
    alternativeText = '';
    toastMsgClasses = '';
    toastMsgIconClasses = '';
    showToastFlag = false;
    isFollowButtonDisabled = true;
    imgPath = `${shareButtonIcon}#shareButtonIcon`;
    isRecordFollowed = false;
    followCount = 0
    maxFollowCount = Allowed_Follow_Record_Count;
    cls = 'slds-p-right--xx-small fav_icon_disabled_class'
    /**
     * Function sets a button margin from left according to record name.
     * @param {Integer} width 
     */
    @api
    setButtonProperties(width) {
        const lwc = this.template.querySelector('.cstm_btn_styling');
        if (lwc && lwc.style) {
            lwc.style.marginLeft = (width > 90 ? 80 : 140) + width + 'px';
            lwc.style.display = 'block';
        }
    }

    /**
     * Connected Callback of component it will run whenever component is available on DOM.
     */
    async connectedCallback() {
        this.cls = 'slds-p-right--xx-small fav_icon_disabled_class'
        // Binding an listener to change a button state whenever record followed or un followed from other component.
        registerListener('updateButtonState', this.checkButtonState, this);
        this.template.querySelector('[data-id="followIcon"]')?.classList?.add('fav_icon_disabled_class');
        await this.checkButtonState();
        await this.getfollowCount();
    }

    async getfollowCount () {
        try{
            this.followCount = await getfollowRecordCount({});
            this.isFollowButtonDisabled = false;
            this.cls='slds-p-right--xx-small';
            this.template.querySelector('[data-id="followIcon"]')?.classList?.remove('fav_icon_disabled_class');
        } catch (e) {
            console.debug(e);
        }
    }

    /**
     * This function query a favorite record by record id if exist then record is already followed.
     */
    async checkButtonState() {
        try {
            const followedRecord = await getFavoriteRecordById({
                favId: this.recordId,
            });
            if (followedRecord) {
                this.isRecordFollowed = true;
                this.changeCustomButtonStyling('Following', 'brand');
            } else {
                this.isRecordFollowed = false;
                this.changeCustomButtonStyling('Follow');
            }
        } catch (e) {
            console.debug(e);
        }
    }

    /**
     * This function add a record in a follow (Favorite) List.
     * @param {Object} event 
     */
    async addOrRemoveFollowedRecord(event) {
        this.isFollowButtonDisabled = true;
        this.template.querySelector('[data-id="followIcon"]')?.classList?.add('fav_icon_disabled_class');
        const targetButton = event?.currentTarget?.title;
        let buttonLabel;
        if (targetButton == 'Follow') {
            // Following a Record.
            if(Number(this.maxFollowCount)> this.followCount) {
                try {
                    buttonLabel = 'Following';
                    if (this.recordId) {
                        const createdFavoriteRecord = await addToFavorites({
                            recordId: this.recordId,
                            targetType: 'Record'
                        });
                        this.showToastMessage(
                            'success',
                            'success',
                            'utility:success',
                            'slds-notify slds-notify_toast slds-theme_success',
                            'slds-icon_container slds-icon-utility-success slds-m-right_small slds-no-flex slds-align-top',
                            'Successfully Followed.'
                        );
                        // this.openFollowPopUp();
                        this.template.querySelector('[data-id="followIcon"]')?.classList?.remove('fav_icon_disabled_class');
                        this.isFollowButtonDisabled = false;
                    }
                } catch (e) {
                    console.debug(e);
                    if (e?.body?.message?.includes("Already added in the followed list")) {
                        this.showToastMessage(
                            'info',
                            'info',
                            'utility:info',
                            'slds-notify slds-notify_toast slds-theme_info',
                            'slds-icon_container slds-icon-utility-info slds-m-right_small slds-no-flex slds-align-top',
                            'Already following this record.'
                        );
                    } else {
                        buttonLabel = 'Follow';
                        this.showToastMessage(
                            'error',
                            'error',
                            'utility:error',
                            'slds-notify slds-notify_toast slds-theme_error',
                            'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top',
                            'Cannot add this record from Followed items. Contact your administrator for help.'
                        );
                    }
                    this.template.querySelector('[data-id="followIcon"]')?.classList?.remove('fav_icon_disabled_class');
                    this.isFollowButtonDisabled = false;
                }
            }
            else {
                this.showToastMessage(
                    'error',
                    'error',
                    'utility:error',
                    'slds-notify slds-notify_toast slds-theme_error',
                    'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top',
                    'You cannot follow more than '+this.maxFollowCount+' records.'
                );
                this.template.querySelector('[data-id="followIcon"]')?.classList?.remove('fav_icon_disabled_class');
                this.isFollowButtonDisabled = false;
            }
            
        } else if (targetButton == 'Following') {
            // Unfollowing a Record.
            try {
                buttonLabel = 'Follow';
                if (this.recordId) {
                    const isRecordDeleted = await removeFromFavorites({
                        favId: this.recordId,
                    });
                    if (isRecordDeleted) {
                        this.showToastMessage(
                            'info',
                            'info',
                            'utility:info',
                            'slds-notify slds-notify_toast slds-theme_info',
                            'slds-icon_container slds-icon-utility-info slds-m-right_small slds-no-flex slds-align-top',
                            'Successfully Unfollowed.'
                        );
                    }
                    this.template.querySelector('[data-id="followIcon"]')?.classList?.remove('fav_icon_disabled_class');
                    this.isFollowButtonDisabled = false;
                }
            } catch (e) {
                console.debug(e);
                buttonLabel = 'Following';
                this.showToastMessage(
                    'error',
                    'error',
                    'utility:error',
                    'slds-notify slds-notify_toast slds-theme_error',
                    'slds-icon_container slds-icon-utility-error slds-m-right_small slds-no-flex slds-align-top',
                    'Cannot remove this record from Followed items. Contact your administrator for help.'
                );
                this.template.querySelector('[data-id="followIcon"]')?.classList?.remove('fav_icon_disabled_class');
                this.isFollowButtonDisabled = false;
            }
        }
        if (buttonLabel) {
            this.changeCustomButtonStyling(buttonLabel == 'Following' ? buttonLabel : 'Follow', buttonLabel == 'Following' ? 'brand' : undefined);
            fireEvent(this.objPageReference, 'updateFavList', '');
        }
    }

    showToastMessage(title, alternativeText, iconName, msgClass, iconClass, msg) {
        // Custom toast message
        this.toastMessage = msg;
        this.title = title;
        this.alternativeText = alternativeText;
        this.showToastFlag = true;
        this.iconName = iconName;
        this.toastMsgClasses = msgClass;
        this.toastMsgIconClasses = iconClass;
        setTimeout(() => {
            this.showToastFlag = false;
        }, 2000);
    }

    /**
     * This function changes a label and variant of button.
     * @param {String} label - such as Follow and Following 
     * @param {String} variant - such as brand
     */
    changeCustomButtonStyling(label, variant) {
        const buttonElement = this.template.querySelector('.cstm_follow_btn_div');
        if (buttonElement) {
            buttonElement.title = label;
            this.template.querySelector('.cstm_follow_btn_span').textContent = label;
            if (variant == 'brand') {
                this.isRecordFollowed = true;
                buttonElement.classList.remove('slds-button_neutral');
                buttonElement.classList.add('slds-button_brand');
            } else {
                this.isRecordFollowed = false;
                buttonElement.classList.remove('slds-button_brand');
                buttonElement.classList.add('slds-button_neutral');
            }
        }
    }

    /**
     * Handler to close the Share record popup
     */
    handleclosepopup() {
        this.sharePopup = false;
    }

    /**
     * Handler to open share record pop
     */
    openSharePopUp() {
        this.sharePopup = true;
    }

    /**
     * Open Follow Popup
     */
    openFollowPopUp() {
        this.followPopup = true;
    }

    /**
     * Close Follow Popup
     */
    handlecloseFollowpopup() {
        this.followPopup = false;
    }

    /**
     * Disconnected call back it will run whenever component detached from DOM.
     */
    disconnectedCallback() {
        unregisterAllListeners(this);
    }
}