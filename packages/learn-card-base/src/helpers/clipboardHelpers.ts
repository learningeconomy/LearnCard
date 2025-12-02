/**
 * Creates an invisible textarea element
 */
const createDummyTextElement = text => {
    const dummyElement = document.createElement('textarea');
    dummyElement.value = text;

    dummyElement.style.position = 'absolute';
    dummyElement.style.top = '0';
    dummyElement.style.left = '-9999px';
    dummyElement.style.opacity = '0';
    dummyElement.setAttribute('readOnly', 'readOnly');

    return dummyElement;
};

/**
 * Copies text the old way by creating a dummy text element
 */
const fallbackCopyTextToClipboard = (text, successMessage) => {
    const textArea = createDummyTextElement(text);
    document.body.appendChild(textArea);

    // get users current selection
    const selected =
        document.getSelection().rangeCount > 0 ? document.getSelection().getRangeAt(0) : false;

    copyTextFromElement(textArea, successMessage);
    document.body.removeChild(textArea);

    // restore user selection
    if (selected) {
        document.getSelection().removeAllRanges();
        document.getSelection().addRange(selected);
    }
};


/*function to copy text from element*/
const copyTextFromElement = (element, successMessage) => {
    // select the text
    element.select();
    element.setSelectionRange(0, 99999); /*For mobile devices*/

    // copy the text
    document.execCommand('copy');

    // show success message
    if (successMessage) {
        alert(successMessage);
    }
}