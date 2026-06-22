/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Methods_Initiatetemplateissue_Tip15Inputs */

const en_developerportal_guides_embedapp_apireference_methods_initiatetemplateissue_tip15 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Initiatetemplateissue_Tip15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create templates in the LearnCard dashboard first`)
};

const es_developerportal_guides_embedapp_apireference_methods_initiatetemplateissue_tip15 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Initiatetemplateissue_Tip15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear templates in the LearnCard dashboard first`)
};

const fr_developerportal_guides_embedapp_apireference_methods_initiatetemplateissue_tip15 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Initiatetemplateissue_Tip15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create templates in the LearnCard dashboard first`)
};

const ar_developerportal_guides_embedapp_apireference_methods_initiatetemplateissue_tip15 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Initiatetemplateissue_Tip15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء templates in the LearnCard dashboard first`)
};

/**
* | output |
* | --- |
* | "Create templates in the LearnCard dashboard first" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Methods_Initiatetemplateissue_Tip15Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_methods_initiatetemplateissue_tip15 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Methods_Initiatetemplateissue_Tip15Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Methods_Initiatetemplateissue_Tip15Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_methods_initiatetemplateissue_tip15(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_methods_initiatetemplateissue_tip15(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_methods_initiatetemplateissue_tip15(inputs)
	return ar_developerportal_guides_embedapp_apireference_methods_initiatetemplateissue_tip15(inputs)
});
export { developerportal_guides_embedapp_apireference_methods_initiatetemplateissue_tip15 as "developerPortal.guides.embedApp.apiReference.methods.initiateTemplateIssue.tip1" }