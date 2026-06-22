/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep46Inputs */

const en_developerportal_guides_embedapp_requestdataconsentsetup_howstep46 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep46Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use the consent ID to read/write data per contract terms`)
};

const es_developerportal_guides_embedapp_requestdataconsentsetup_howstep46 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep46Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use the consent ID to read/write data per contract terms`)
};

const fr_developerportal_guides_embedapp_requestdataconsentsetup_howstep46 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep46Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use the consent ID to read/write data per contract terms`)
};

const ar_developerportal_guides_embedapp_requestdataconsentsetup_howstep46 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep46Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use the consent ID to read/write data per contract terms`)
};

/**
* | output |
* | --- |
* | "Use the consent ID to read/write data per contract terms" |
*
* @param {Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep46Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestdataconsentsetup_howstep46 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep46Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep46Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestdataconsentsetup_howstep46(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestdataconsentsetup_howstep46(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestdataconsentsetup_howstep46(inputs)
	return ar_developerportal_guides_embedapp_requestdataconsentsetup_howstep46(inputs)
});
export { developerportal_guides_embedapp_requestdataconsentsetup_howstep46 as "developerPortal.guides.embedApp.requestDataConsentSetup.howStep4" }