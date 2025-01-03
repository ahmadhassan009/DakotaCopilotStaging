import { LightningElement, api} from 'lwc';

export default class Chatbot extends LightningElement {
    @api showChildComponent = false
    @api minimizeChildComponent = false

    handleCloseClick(event) {
        const buttonId = event.currentTarget.dataset.id;
        const eventData = {
            close: buttonId === 'close',
            minimize: buttonId === 'minimize'
        };
        this.dispatchEvent(new CustomEvent('toggle', { detail: eventData }));
    }
    handleMinimize() {
        // Dispatch a custom event to notify parent to minimize
        const minimizeEvent = new CustomEvent('minimize');
        this.dispatchEvent(minimizeEvent);
    }
}