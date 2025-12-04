"use strict";

/**
 * Helper function to create iOS-compatible interactive messages with webview functionality
 * This replicates the structure that works on iOS devices for webview interactions
 */

/**
 * Creates an iOS-compatible interactive message with webview button
 * @param {Object} options - Message options
 * @param {string} options.bodyText - Main message text
 * @param {string} [options.footerText] - Footer text
 * @param {string} [options.title] - Header title
 * @param {string} [options.subtitle] - Header subtitle
 * @param {Object} [options.imageMessage] - Image message object for header
 * @param {Array} options.buttons - Array of button objects
 * @param {Object} [options.contextInfo] - Context information
 * @returns {Object} iOS-compatible interactive message structure
 */
const createIOSWebviewMessage = (options) => {
    const {
        bodyText,
        footerText,
        title,
        subtitle,
        imageMessage,
        buttons = [],
        contextInfo = {}
    } = options;

    // Process buttons for iOS compatibility
    const processedButtons = buttons.map((button, index) => {
        if (button.type === 'webview' || button.name === 'cta_url') {
            const buttonParams = {
                display_text: button.displayText || button.text,
                url: button.url,
                webview_presentation: button.webviewPresentation || null,
                payment_link_preview: button.paymentLinkPreview !== undefined ? button.paymentLinkPreview : false,
                landing_page_url: button.landingPageUrl || button.url,
                webview_interaction: button.webviewInteraction !== undefined ? button.webviewInteraction : true
            };

            return {
                name: "cta_url",
                buttonParamsJson: JSON.stringify(buttonParams)
            };
        }
        return button;
    });

    // Generate tap target configuration for iOS webview
    const urlButtons = processedButtons.filter(btn => btn.name === 'cta_url');
    const tapTargetList = urlButtons.map((button, index) => {
        let canonicalUrl = '';
        let landingPageUrl = '';
        
        try {
            const buttonParams = JSON.parse(button.buttonParamsJson);
            canonicalUrl = buttonParams.url || buttonParams.landing_page_url || '';
            landingPageUrl = buttonParams.landing_page_url || buttonParams.url || '';
        } catch (e) {
            // If parsing fails, use empty string
        }
        
        return {
            canonical_url: canonicalUrl,
            url_type: "STATIC",
            button_index: index,
            tap_target_format: 1
        };
    });

    const messageParamsJson = JSON.stringify({
        bottom_sheet: {
            in_thread_buttons_limit: 3,
            divider_indices: []
        },
        tap_target_configuration: tapTargetList.length > 0 ? tapTargetList[0] : {},
        tap_target_list: tapTargetList
    });

    // Build the interactive message structure
    const interactiveMessage = {
        body: {
            text: bodyText
        },
        nativeFlowMessage: {
            buttons: processedButtons,
            messageParamsJson: messageParamsJson
        },
        contextInfo: {
            dataSharingContext: {
                showMmDisclosure: false
            },
            ...contextInfo
        }
    };

    // Add header if provided
    if (imageMessage || title || subtitle) {
        interactiveMessage.header = {
            hasMediaAttachment: !!imageMessage
        };

        if (imageMessage) {
            interactiveMessage.header.imageMessage = imageMessage;
        }

        if (title) {
            interactiveMessage.header.title = title;
        }

        if (subtitle) {
            interactiveMessage.header.subtitle = subtitle;
        }
    }

    // Add footer if provided
    if (footerText) {
        interactiveMessage.footer = {
            text: footerText
        };
    }

    return {
        interactiveMessage
    };
};

/**
 * Creates a webview button configuration for iOS compatibility
 * @param {Object} options - Button options
 * @param {string} options.text - Button display text
 * @param {string} options.url - Target URL
 * @param {string} [options.landingPageUrl] - Landing page URL (defaults to url)
 * @param {boolean} [options.webviewInteraction=true] - Enable webview interaction
 * @param {boolean} [options.paymentLinkPreview=false] - Show payment link preview
 * @param {string|null} [options.webviewPresentation=null] - Webview presentation type
 * @returns {Object} iOS-compatible button configuration
 */
const createWebviewButton = (options) => {
    const {
        text,
        url,
        landingPageUrl,
        webviewInteraction = true,
        paymentLinkPreview = false,
        webviewPresentation = null
    } = options;

    return {
        type: 'webview',
        displayText: text,
        url: url,
        landingPageUrl: landingPageUrl || url,
        webviewInteraction: webviewInteraction,
        paymentLinkPreview: paymentLinkPreview,
        webviewPresentation: webviewPresentation
    };
};

module.exports = {
    createIOSWebviewMessage,
    createWebviewButton
};