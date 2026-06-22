/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Templates_Choose2Inputs */

const en_developerportal_credentialbuilder_templates_choose2 = /** @type {(inputs: Developerportal_Credentialbuilder_Templates_Choose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose a template to start with`)
};

const es_developerportal_credentialbuilder_templates_choose2 = /** @type {(inputs: Developerportal_Credentialbuilder_Templates_Choose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige una plantilla para empezar`)
};

const fr_developerportal_credentialbuilder_templates_choose2 = /** @type {(inputs: Developerportal_Credentialbuilder_Templates_Choose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez un modèle pour commencer`)
};

const ar_developerportal_credentialbuilder_templates_choose2 = /** @type {(inputs: Developerportal_Credentialbuilder_Templates_Choose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر قالبًا للبدء`)
};

/**
* | output |
* | --- |
* | "Choose a template to start with" |
*
* @param {Developerportal_Credentialbuilder_Templates_Choose2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_templates_choose2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Templates_Choose2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Templates_Choose2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_templates_choose2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_templates_choose2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_templates_choose2(inputs)
	return ar_developerportal_credentialbuilder_templates_choose2(inputs)
});
export { developerportal_credentialbuilder_templates_choose2 as "developerPortal.credentialBuilder.templates.choose" }