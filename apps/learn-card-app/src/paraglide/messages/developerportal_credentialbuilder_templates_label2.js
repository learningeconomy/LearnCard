/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Templates_Label2Inputs */

const en_developerportal_credentialbuilder_templates_label2 = /** @type {(inputs: Developerportal_Credentialbuilder_Templates_Label2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Templates`)
};

const es_developerportal_credentialbuilder_templates_label2 = /** @type {(inputs: Developerportal_Credentialbuilder_Templates_Label2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plantillas`)
};

const fr_developerportal_credentialbuilder_templates_label2 = /** @type {(inputs: Developerportal_Credentialbuilder_Templates_Label2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modèles`)
};

const ar_developerportal_credentialbuilder_templates_label2 = /** @type {(inputs: Developerportal_Credentialbuilder_Templates_Label2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قوالب`)
};

/**
* | output |
* | --- |
* | "Templates" |
*
* @param {Developerportal_Credentialbuilder_Templates_Label2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_templates_label2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Templates_Label2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Templates_Label2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_templates_label2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_templates_label2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_templates_label2(inputs)
	return ar_developerportal_credentialbuilder_templates_label2(inputs)
});
export { developerportal_credentialbuilder_templates_label2 as "developerPortal.credentialBuilder.templates.label" }