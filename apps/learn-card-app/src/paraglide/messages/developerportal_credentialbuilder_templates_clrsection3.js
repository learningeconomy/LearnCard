/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Templates_Clrsection3Inputs */

const en_developerportal_credentialbuilder_templates_clrsection3 = /** @type {(inputs: Developerportal_Credentialbuilder_Templates_Clrsection3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CLR 2.0 (Multi-Achievement)`)
};

const es_developerportal_credentialbuilder_templates_clrsection3 = /** @type {(inputs: Developerportal_Credentialbuilder_Templates_Clrsection3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CLR 2.0 (Multi-Logro)`)
};

const fr_developerportal_credentialbuilder_templates_clrsection3 = /** @type {(inputs: Developerportal_Credentialbuilder_Templates_Clrsection3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CLR 2.0 (Multi-Réalisation)`)
};

const ar_developerportal_credentialbuilder_templates_clrsection3 = /** @type {(inputs: Developerportal_Credentialbuilder_Templates_Clrsection3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CLR 2.0 (إنجازات متعددة)`)
};

/**
* | output |
* | --- |
* | "CLR 2.0 (Multi-Achievement)" |
*
* @param {Developerportal_Credentialbuilder_Templates_Clrsection3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_templates_clrsection3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Templates_Clrsection3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Templates_Clrsection3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_templates_clrsection3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_templates_clrsection3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_templates_clrsection3(inputs)
	return ar_developerportal_credentialbuilder_templates_clrsection3(inputs)
});
export { developerportal_credentialbuilder_templates_clrsection3 as "developerPortal.credentialBuilder.templates.clrSection" }