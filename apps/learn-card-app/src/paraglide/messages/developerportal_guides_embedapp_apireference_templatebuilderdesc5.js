/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Templatebuilderdesc5Inputs */

const en_developerportal_guides_embedapp_apireference_templatebuilderdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Templatebuilderdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create and manage credential templates for your embedded app`)
};

const es_developerportal_guides_embedapp_apireference_templatebuilderdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Templatebuilderdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear and manage credential templates for your embedded app`)
};

const fr_developerportal_guides_embedapp_apireference_templatebuilderdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Templatebuilderdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create and manage credential templates for your embedded app`)
};

const ar_developerportal_guides_embedapp_apireference_templatebuilderdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Templatebuilderdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء and manage credential templates for your embedded app`)
};

/**
* | output |
* | --- |
* | "Create and manage credential templates for your embedded app" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Templatebuilderdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_templatebuilderdesc5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Templatebuilderdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Templatebuilderdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_templatebuilderdesc5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_templatebuilderdesc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_templatebuilderdesc5(inputs)
	return ar_developerportal_guides_embedapp_apireference_templatebuilderdesc5(inputs)
});
export { developerportal_guides_embedapp_apireference_templatebuilderdesc5 as "developerPortal.guides.embedApp.apiReference.templateBuilderDesc" }