/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep36Inputs */

const en_developerportal_guides_embedapp_requestdataconsentsetup_howstep36 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep36Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You receive a consent ID for future data operations`)
};

const es_developerportal_guides_embedapp_requestdataconsentsetup_howstep36 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep36Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You receive a consent ID for future data operations`)
};

const fr_developerportal_guides_embedapp_requestdataconsentsetup_howstep36 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep36Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You receive a consent ID for future data operations`)
};

const ar_developerportal_guides_embedapp_requestdataconsentsetup_howstep36 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep36Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You receive a consent ID for future data operations`)
};

/**
* | output |
* | --- |
* | "You receive a consent ID for future data operations" |
*
* @param {Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep36Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestdataconsentsetup_howstep36 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep36Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestdataconsentsetup_Howstep36Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestdataconsentsetup_howstep36(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestdataconsentsetup_howstep36(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestdataconsentsetup_howstep36(inputs)
	return ar_developerportal_guides_embedapp_requestdataconsentsetup_howstep36(inputs)
});
export { developerportal_guides_embedapp_requestdataconsentsetup_howstep36 as "developerPortal.guides.embedApp.requestDataConsentSetup.howStep3" }