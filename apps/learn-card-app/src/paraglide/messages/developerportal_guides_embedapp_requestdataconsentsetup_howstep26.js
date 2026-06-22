/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep26Inputs */

const en_developerportal_guides_embedapp_requestdataconsentsetup_howstep26 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep26Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User reviews and approves (or declines) the request`)
};

const es_developerportal_guides_embedapp_requestdataconsentsetup_howstep26 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep26Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User reviews and approves (or declines) the request`)
};

const fr_developerportal_guides_embedapp_requestdataconsentsetup_howstep26 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep26Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User reviews and approves (or declines) the request`)
};

const ar_developerportal_guides_embedapp_requestdataconsentsetup_howstep26 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep26Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User reviews and approves (or declines) the request`)
};

/**
* | output |
* | --- |
* | "User reviews and approves (or declines) the request" |
*
* @param {Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep26Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestdataconsentsetup_howstep26 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep26Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep26Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestdataconsentsetup_howstep26(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestdataconsentsetup_howstep26(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestdataconsentsetup_howstep26(inputs)
	return ar_developerportal_guides_embedapp_requestdataconsentsetup_howstep26(inputs)
});
export { developerportal_guides_embedapp_requestdataconsentsetup_howstep26 as "developerPortal.guides.embedApp.requestDataConsentSetup.howStep2" }