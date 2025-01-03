import { LightningElement, api } from 'lwc';

export default class NoPermissionsTemplate extends LightningElement {
    @api doesNotHasPermission;
}