import  LightningDatatable  from 'lightning/datatable';
import swapTextTemplate from './swapTextTemplate.html';

export default class FundspCustomDataTable extends LightningDatatable {
    static customTypes = {
        swapTextAndUrl: {
            template:swapTextTemplate,
            standardCellLayout: true,
            typeAttributes: ['recordId'],
        }
    };
}