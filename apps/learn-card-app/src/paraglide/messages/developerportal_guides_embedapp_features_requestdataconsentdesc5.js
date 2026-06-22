/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Features_Requestdataconsentdesc5Inputs */

const en_developerportal_guides_embedapp_features_requestdataconsentdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Requestdataconsentdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ask users for permission to access specific data fields or write data back to their profile via a ConsentFlow contract.`)
};

const es_developerportal_guides_embedapp_features_requestdataconsentdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Requestdataconsentdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ask users for permission to access specific data fields or write data back to their profile via a ConsentFlow contract.`)
};

const fr_developerportal_guides_embedapp_features_requestdataconsentdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Requestdataconsentdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ask users for permission to access specific data fields or write data back to their profile via a ConsentFlow contract.`)
};

const ar_developerportal_guides_embedapp_features_requestdataconsentdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Requestdataconsentdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ask users for permission to access specific data fields or write data back to their profile via a ConsentFlow contract.`)
};

/**
* | output |
* | --- |
* | "Ask users for permission to access specific data fields or write data back to their profile via a ConsentFlow contract." |
*
* @param {Developerportal_Guides_Embedapp_Features_Requestdataconsentdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_features_requestdataconsentdesc5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Features_Requestdataconsentdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Features_Requestdataconsentdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_features_requestdataconsentdesc5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_features_requestdataconsentdesc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_features_requestdataconsentdesc5(inputs)
	return ar_developerportal_guides_embedapp_features_requestdataconsentdesc5(inputs)
});
export { developerportal_guides_embedapp_features_requestdataconsentdesc5 as "developerPortal.guides.embedApp.features.requestDataConsentDesc" }