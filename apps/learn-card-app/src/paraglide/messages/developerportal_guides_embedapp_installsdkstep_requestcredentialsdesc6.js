/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Installsdkstep_Requestcredentialsdesc6Inputs */

const en_developerportal_guides_embedapp_installsdkstep_requestcredentialsdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Requestcredentialsdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search user's wallet`)
};

const es_developerportal_guides_embedapp_installsdkstep_requestcredentialsdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Requestcredentialsdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search user's wallet`)
};

const fr_developerportal_guides_embedapp_installsdkstep_requestcredentialsdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Requestcredentialsdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search user's wallet`)
};

const ar_developerportal_guides_embedapp_installsdkstep_requestcredentialsdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Requestcredentialsdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search user's wallet`)
};

/**
* | output |
* | --- |
* | "Search user's wallet" |
*
* @param {Developerportal_Guides_Embedapp_Installsdkstep_Requestcredentialsdesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_installsdkstep_requestcredentialsdesc6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Installsdkstep_Requestcredentialsdesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Installsdkstep_Requestcredentialsdesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_installsdkstep_requestcredentialsdesc6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_installsdkstep_requestcredentialsdesc6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_installsdkstep_requestcredentialsdesc6(inputs)
	return ar_developerportal_guides_embedapp_installsdkstep_requestcredentialsdesc6(inputs)
});
export { developerportal_guides_embedapp_installsdkstep_requestcredentialsdesc6 as "developerPortal.guides.embedApp.installSdkStep.requestCredentialsDesc" }