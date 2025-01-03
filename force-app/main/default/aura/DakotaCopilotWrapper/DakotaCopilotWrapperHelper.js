({
    /**
     * This method adjust the global action's
     * modal styling.
     */
    initGlobalCopilotModal: function () {
        const globalCopilotSelectors = {
            modalContent: 
                ".panel.scrollable.slds-docked-composer.slds-grid.slds-grid--vertical",
            modalContainer: ".forceDockingPanel--dockableAction"
        };
        this.addClassToElement(
            globalCopilotSelectors.modalContent,
            "global_copilot_content_dimensions"
        );
        this.addClassToElement(
            globalCopilotSelectors.modalContainer,
            "global_copilot_container"
        );
    },

    /**
     * Initializes the modal icon by replacing or appending an image element
     * with the provided Cirra icon path to the header container.
     *
     * @param {Object} component - The Aura component instance.
     */
    initializeModalIcon: function (component) {
        const headerContainerSelector =
            ".slds-media.slds-media--center.slds-has-flexi-truncate";
        const headerContainer = document.querySelector(headerContainerSelector);
        const cirraIconPath = component.get("v.cirraIconPath");

        if (!cirraIconPath || !headerContainer) {
            return;
        }

        // Create and configure the image element
        const img = document.createElement("img");
        img.src = cirraIconPath;
        img.className = "global_copilot_cirra_icon";

        // Replace the first child of the header container with the new image element
        if (headerContainer.firstChild) {
            headerContainer.replaceChild(img, headerContainer.firstChild);
        } else {
            // If there's no child, append the new image element
            headerContainer.appendChild(img);
        }
    },

    /**
     * Adds a specified CSS class to an element selected by the given CSS selector.
     *
     * @param {string} selector - The CSS selector used to find the target element.
     * @param {string} className - The CSS class name to add to the target element.
     */
    addClassToElement: function (selector, className) {
        const element = document.querySelector(selector);
        console.log(document.querySelector(selector));
        console.log(element);

        if (element) {
            element.classList.add(className);
        }
    }
});