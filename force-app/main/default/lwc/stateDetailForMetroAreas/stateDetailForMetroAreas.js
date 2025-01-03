import { LightningElement, api } from 'lwc';

export default class StateDetailForMetroAreas extends LightningElement {
    @api stateName;
    allStates = [];
    statesExist = false;

    connectedCallback() {
    }

    
}