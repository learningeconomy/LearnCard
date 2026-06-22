/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Installsdkstep_Whatsincluded5Inputs */

const en_developerportal_guides_embedapp_installsdkstep_whatsincluded5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Whatsincluded5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What's included`)
};

const es_developerportal_guides_embedapp_installsdkstep_whatsincluded5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Whatsincluded5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What's included`)
};

const fr_developerportal_guides_embedapp_installsdkstep_whatsincluded5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Whatsincluded5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What's included`)
};

const ar_developerportal_guides_embedapp_installsdkstep_whatsincluded5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Installsdkstep_Whatsincluded5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What's included`)
};

/**
* | output |
* | --- |
* | "What's included" |
*
* @param {Developerportal_Guides_Embedapp_Installsdkstep_Whatsincluded5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_installsdkstep_whatsincluded5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Installsdkstep_Whatsincluded5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Installsdkstep_Whatsincluded5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_installsdkstep_whatsincluded5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_installsdkstep_whatsincluded5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_installsdkstep_whatsincluded5(inputs)
	return ar_developerportal_guides_embedapp_installsdkstep_whatsincluded5(inputs)
});
export { developerportal_guides_embedapp_installsdkstep_whatsincluded5 as "developerPortal.guides.embedApp.installSdkStep.whatsIncluded" }