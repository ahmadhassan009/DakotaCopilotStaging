import { LightningElement, wire, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord } from 'lightning/uiRecordApi';
import INVESTMENT_STRATEGY_OBJECT from '@salesforce/schema/Investment_Strategy__c';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import getlayoutData from '@salesforce/apex/PerformanceRelatedToInvestmentFirm.getlayoutData';
import getManagerPersentationName from '@salesforce/apex/PerformanceRelatedToInvestmentFirm.getManagerPersentationName';
import isSourceSelfReported from '@salesforce/apex/PerformanceRelatedToInvestmentFirm.isSourceSelfReported';

export default class CustomDetailView extends NavigationMixin(LightningElement) {
    @api recordId;
    @track lastModifiedDateValue;
    fieldsToShowDynamically = [];
    layoutColumnZerofieldOrder =[];
    layoutColumnOnefieldOrder =[];
    resultantArray = [];
    dataLables;
    dataTypes;
    managerPresentationURL;
    isRendered = false;
    investmentStrategyObject = INVESTMENT_STRATEGY_OBJECT;
    isSourceSelfReported = false;
    @wire(getObjectInfo, { objectApiName: '$investmentStrategyObject' })
     async investmentStrategyInfo({ data, error }) {
        if (data) { 
            this.dataTypes = Object.values(data.fields).map((fld) => {

                let { apiName, dataType,label } = fld;

                return { apiName,dataType,label,hasDefaultValue: false };
            });

            await this.getlayoutData();
        }
    }

    getlayoutData() {
        return getlayoutData ({
            recordId: this.recordId
        }).then((result) => {
            if(result){
                let urlArray = (this.managerPresentationURL) ? this.managerPresentationURL.replaceAll('https://', '').replaceAll('</', '<').replaceAll('>,<','').replaceAll('view<','view,').split("view,") : null;
                let tempArray = [];
                for (let i = 0; i < urlArray?.length; i++) {
                    if(urlArray[i].split('/')[4] && urlArray[i].split('/')[4].length==18) {
                        tempArray.push(urlArray[i].split('/')[4]);
                    }
                }
                getManagerPersentationName({
                    idsList:tempArray
                }).then((response) => {
                    let managerPresentationURls = '';
                    if(response.length>0) {
                        managerPresentationURls = '<ul>';
                        for(let i=0;i<response.length;i++) {
                            managerPresentationURls += '<li><a style="font-size: 14px;" href="/'+response[i].Id+'">'+response[i].Name+'</a></li>'
                        }
                        managerPresentationURls += '</ul>';
                    }
                    var object = this.dataTypes.reduce(
                        (obj, item) => Object.assign(obj, { [item.apiName]: {item} }), {});
                    this.resultantArray = [];
                    let headerLableAndStatus = Object.keys(result)
                    for( let i=0;i<headerLableAndStatus.length;i++) {
                        let hederList = headerLableAndStatus[i].split("_");
                        this.layoutColumnZerofieldOrder = [];
                        this.layoutColumnOnefieldOrder = [];
                        if(result[headerLableAndStatus[i]].length>0){
    
                            for( let j=0;j<result[headerLableAndStatus[i]][0]?.length;j++) {
                                if(object[result[headerLableAndStatus[i]][0][j]]?.item) {
                                    if(object[result[headerLableAndStatus[i]][0][j]]?.item?.apiName == 'Manager_Presentation_URL__c') {
                                        object[result[headerLableAndStatus[i]][0][j]].item['hasDefaultValue'] = true;
                                        object[result[headerLableAndStatus[i]][0][j]].item['defaultValue'] = managerPresentationURls;
                                    }
                                    this.layoutColumnZerofieldOrder.push(object[result[headerLableAndStatus[i]][0][j]].item);
                                }
                            }
                            for( let j=0;j<result[headerLableAndStatus[i]][1]?.length;j++) {
                                if(object[result[headerLableAndStatus[i]][1][j]]?.item) {
                                    if(object[result[headerLableAndStatus[i]][1][j]]?.item?.apiName == 'Manager_Presentation_URL__c') {
                                        object[result[headerLableAndStatus[i]][1][j]].item['hasDefaultValue'] = true;
                                        object[result[headerLableAndStatus[i]][1][j]].item['defaultValue'] = managerPresentationURls;
                                    }
                                    this.layoutColumnOnefieldOrder.push(object[result[headerLableAndStatus[i]][1][j]].item);
                                }
                            }
                            this.resultantArray.push({
                                hederName:hederList[0],
                                showHeader : (hederList[1]=="false")?false:true,
                                col1:this.layoutColumnZerofieldOrder,
                                col2:this.layoutColumnOnefieldOrder
                            });
                            this.fieldsToShowDynamically = [...this.fieldsToShowDynamically,...this.layoutColumnZerofieldOrder.concat(this.layoutColumnOnefieldOrder) ]
                        }
                    }
                    this.isRendered = true;
                    this.isFirstRender = false;
                }).catch((error) => {
                    console.log(error);
                })
            }
        })
    }

    // @wire(getRecord, { recordId: '$recordId', fields: [MANAGER_PRESENTATION_URL]})
    // async wiredRecord({ data, error }) {
    //     if (data) {
    //         this.managerPresentationURL =  data?.fields?.Manager_Presentation_URL__c?.value;
    //          this.investmentStrategyObject = INVESTMENT_STRATEGY_OBJECT;
    //     }
    // }

    
    connectedCallback() {
        isSourceSelfReported({
            recordId: this.recordId
        }).then(isSelfReported => {
            if (isSelfReported) {
                this.isSourceSelfReported = true;
            }
        }).catch(error => {
            this.isLoading = false;
            console.log(error);
        });
    }
}