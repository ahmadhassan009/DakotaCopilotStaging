import LightningDatatable from "lightning/datatable";
import richTextColumnType from "./richTextColumnType.html";
import checkboxImage from "./checkboxImage.html";

/**
 * Custom component that extends LightningDatatable
 * and adds a new column type
 */
export default class CustomDatatable extends LightningDatatable {
    static customTypes={
        // custom type definition
        richText: {
            template: richTextColumnType,
            standardCellLayout: true
        },
        checkBox: {
            template: checkboxImage,
            standardCellLayout: true
        }
    }
}