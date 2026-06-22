/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Templatebuilder4Inputs */

const en_developerportal_guides_embedapp_apireference_templatebuilder4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Templatebuilder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Template Builder`)
};

const es_developerportal_guides_embedapp_apireference_templatebuilder4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Templatebuilder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Constructor de Plantillas`)
};

const fr_developerportal_guides_embedapp_apireference_templatebuilder4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Templatebuilder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Constructeur de Modèles`)
};

const ar_developerportal_guides_embedapp_apireference_templatebuilder4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Templatebuilder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منشئ القوالب`)
};

/**
* | output |
* | --- |
* | "Template Builder" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Templatebuilder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_templatebuilder4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Templatebuilder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Templatebuilder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_templatebuilder4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_templatebuilder4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_templatebuilder4(inputs)
	return ar_developerportal_guides_embedapp_apireference_templatebuilder4(inputs)
});
export { developerportal_guides_embedapp_apireference_templatebuilder4 as "developerPortal.guides.embedApp.apiReference.templateBuilder" }