/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestdataconsentsetup_Requestconsentclientdesc8Inputs */

const en_developerportal_guides_embedapp_requestdataconsentsetup_requestconsentclientdesc8 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Requestconsentclientdesc8Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use the Partner SDK to prompt the user for consent in your embedded app.`)
};

const es_developerportal_guides_embedapp_requestdataconsentsetup_requestconsentclientdesc8 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Requestconsentclientdesc8Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use the Partner SDK to prompt the user for consent in your embedded app.`)
};

const fr_developerportal_guides_embedapp_requestdataconsentsetup_requestconsentclientdesc8 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Requestconsentclientdesc8Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use the Partner SDK to prompt the user for consent in your embedded app.`)
};

const ar_developerportal_guides_embedapp_requestdataconsentsetup_requestconsentclientdesc8 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Requestconsentclientdesc8Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use the Partner SDK to prompt the user for consent in your embedded app.`)
};

/**
* | output |
* | --- |
* | "Use the Partner SDK to prompt the user for consent in your embedded app." |
*
* @param {Developerportal_Guides_Embedapp_Requestdataconsentsetup_Requestconsentclientdesc8Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestdataconsentsetup_requestconsentclientdesc8 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Requestconsentclientdesc8Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestdataconsentsetup_Requestconsentclientdesc8Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestdataconsentsetup_requestconsentclientdesc8(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestdataconsentsetup_requestconsentclientdesc8(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestdataconsentsetup_requestconsentclientdesc8(inputs)
	return ar_developerportal_guides_embedapp_requestdataconsentsetup_requestconsentclientdesc8(inputs)
});
export { developerportal_guides_embedapp_requestdataconsentsetup_requestconsentclientdesc8 as "developerPortal.guides.embedApp.requestDataConsentSetup.requestConsentClientDesc" }