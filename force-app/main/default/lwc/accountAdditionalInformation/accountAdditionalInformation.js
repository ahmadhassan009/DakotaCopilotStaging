import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getPickListValues from '@salesforce/apex/AccountAdditionalInformationController.getPickListValues';
import getAccAddInfo from '@salesforce/apex/AccountAdditionalInformationController.getAccAddInfo';
import saveData from '@salesforce/apex/AccountAdditionalInformationController.saveData';
import addRemoveSalesCycles from '@salesforce/apex/AccountAdditionalInformationController.addRemoveSalesCycles';
import fetchAccountOwners from '@salesforce/apex/AccountAdditionalInformationController.fetchAccountOwners';

export default class AccountAdditionalInformation extends LightningElement {
    @api recordId;
    options = [];
    salesCycleValue;
    accOwnerValue;
    isLoading = false;
    editPopup = false;
    additionalOptions;
    previousAdditionalOptions;
    saveDisable = true;
    accountOwnersData;
    selectedOwnerId;
    selectedOwnerName;
    isValueSelected = false;
    oldSalesCycleValue;
    oldSelectedOwnerId;

    /**
     * Check Permissions of component for Current user.
     * Call functions to get and set Picklist options and field values.
     */
    connectedCallback(){
        this.getAccountAdditionalInformation();
        this.getPicklistValues();
        this.fetchAccountOwnersList();
    }

    /**
     * 
     */
    fetchAccountOwnersList()
    {
        this.isLoading = true;
        fetchAccountOwners({
        }).then(returnedData => {
            this.isLoading = false;
            if(returnedData!=null && returnedData.length>0)
            {   
                this.accountOwnersData = returnedData;
            }
        }).catch(error => {
            this.isLoading = false;
            console.log(error);
        });
    }

    /**
     * Gets Account Additional Information values from controller and sets in the fields.
     */
    getAccountAdditionalInformation()
    {
        this.isLoading = true;
        getAccAddInfo({
            recordId: this.recordId
        }).then(returnedData => {
            this.isLoading = false;
            if(returnedData!=null)
            {
                if(returnedData.Contact__c!=null)
                {
                    this.selectedOwnerId = returnedData.Contact__c;
                    this.oldSelectedOwnerId = returnedData.Contact__c;
                    this.selectedOwnerName = returnedData.Contact__r.Name;
                    this.isValueSelected = true;
                }
                if(returnedData.Selected_Sales_Cycle__c!=null)
                {
                    this.salesCycleValue = returnedData.Selected_Sales_Cycle__c;
                    this.oldSalesCycleValue = returnedData.Selected_Sales_Cycle__c;
                }
            }
            else
            {
                this.salesCycleValue = 'Prospecting';
                this.oldSalesCycleValue = 'Prospecting';
            }
        }).catch(error => {
            this.isLoading = false;
            console.log(error);
        });      
    }

    /**
     * Gets options from controller and sets in Picklist.
     */
     getPicklistValues()
     {
         this.isLoading = true;
         getPickListValues({
         }).then(returnedData => {
             this.isLoading = false;
             if(returnedData!=null && returnedData.length>0)
             {
                 var addOptions = returnedData.join("\n");
                 if(addOptions!=null && addOptions!='')
                 {
                     this.additionalOptions = addOptions;
                     this.updateDropDownOptions(returnedData);
                 }  
             }
         }).catch(error => {
             this.isLoading = false;
             console.log(error);
         });
     }

    /**
     * Saves the changed value of picklist in js variable and later use that to pass to apex controller.
     */
    handlePicklistChange(event) {
        this.salesCycleValue = event.detail.value;
    }

    /**
     * Fetchs value of Account Owner and Sales Cycle picklist and pass to controller to save at backend.
     */
    saveInfo(){
        var salesSycleOption = this.salesCycleValue;
        if(this.salesCycleValue == '--None--')
            salesSycleOption  = '';
        if(this.oldSelectedOwnerId!=this.selectedOwnerId ||this.oldSalesCycleValue != salesSycleOption )
        {
            this.isLoading = true;
            saveData({
                recordId: this.recordId,
                salesCycleValue: salesSycleOption,
                accOwner:  this.selectedOwnerId
            }).then(returnedData => {
                this.isLoading = false;  
                if(returnedData == 'true')
                {
                    this.oldSalesCycleValue = salesSycleOption; 
                    this.oldSelectedOwnerId =  this.selectedOwnerId;       
                    this.displayMessage('Information has been updated succesfully', 'Success');
                }
                else
                    this.displayMessage(returnedData, 'Error');
            }).catch(error => {
                this.isLoading = false;
                this.displayMessage('There is a server error while saving information.', 'Error');
                console.log(error);
            });
        }
        else
        {
            this.displayMessage('There are no changes to save', 'Error');
        }
    }


    /**
     * Closes Edit Sales Cycle without changing any values
     */
    cancelEditPopup()
    {
        this.saveDisable = true;
        this.additionalOptions = this.previousAdditionalOptions;
        this.editPopup = false;
    }
    /**
     * Opens Edit Sales Cycle Values popup
     */
    openEditPopup() {
        this.saveDisable = true;
        this.editPopup = true;
        this.previousAdditionalOptions = this.additionalOptions;
    }

    /**
     * Sets Sales Cycle updated values
     */
    setUpdatedOptions(event){
        if(event.detail.value!=null && event.detail.value!='')
        {
            var formatedOptions = event.detail.value.replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, "");
            var tempOptions = formatedOptions.split("\n");
            if(formatedOptions == this.previousAdditionalOptions)
                this.saveDisable = true;
            else
            {
                if(this.checkDuplicates(formatedOptions))
                {
                    this.additionalOptions =  formatedOptions;
                    this.saveDisable = false;
                }
                else
                {
                    this.saveDisable = true;
                    this.displayMessage('Duplicate values cannot exist', 'Error');
                }
            }
        }
        else
        {
            this.saveDisable = true;
            this.displayMessage('Values must be greater then or equal to 1', 'Error');
        }
    }

    /**
     * Saves Sales Cycle updated values at backend
     */
    updateSalesCycle()
    {
        this.additionalOptions = this.additionalOptions.replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, "");
        this.editPopup = false;
        this.isLoading = true;
        addRemoveSalesCycles({
            salesCycleOptions: this.additionalOptions
        }).then(returnedData => {
            this.isLoading = false;
            if(returnedData == 'true')
            {
                this.updateDropDownOptions(this.additionalOptions.split("\n"));
                this.displayMessage('Product Sales Cycle values are updated succesfully', 'Success');
            }
            else
            {
                this.additionalOptions = this.previousAdditionalOptions;
                this.displayMessage(returnedData, 'Error');
            }  
        }).catch(error => {
            this.isLoading = false;
            this.displayMessage('There is a server error while saving information.','Error');
            console.log(error);
        });
    }

    /**
     * Helper method to set Sales Cycle dropdown options
     */
    updateDropDownOptions(optionsList)
    {
        var salessCycleOptions = [];
        salessCycleOptions.push({ label: '--None--', value:  '--None--'});
        for(var i=0; i<optionsList.length; i++)
        {
            if(optionsList[i]!=null && optionsList[i]!='')
                salessCycleOptions.push({ label: optionsList[i], value:  optionsList[i]});
        }
        if(salessCycleOptions!=null && salessCycleOptions.length>0)
            this.options = salessCycleOptions;
    }

    /**
     * Helper method to display Exceptions or Success Messages
     */
    displayMessage(message, type)
    {
        this.dispatchEvent(
            new ShowToastEvent({
                title: type,
                message: message,
                variant: type
            })
        );
    }

    /**
     * Check duplicate values in additional options.
     */
    checkDuplicates(addOptions)
    {
        addOptions = addOptions.toLowerCase();
        addOptions = addOptions.replaceAll(' ','');
        var options = addOptions.split('\n');
        return options.every(i => options.indexOf(i) === options.lastIndexOf(i));
    }

    /**
     * Get Select Account Owner from Loopk up.
     */
     handleAccountOwnerSelection(event)
     {
         this.selectedOwnerId = event.detail;
     }
}