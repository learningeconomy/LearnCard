/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Fieldeditor_Variable3Inputs */

const en_developerportal_credentialbuilder_fieldeditor_variable3 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Variable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Variable:`)
};

const es_developerportal_credentialbuilder_fieldeditor_variable3 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Variable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Variable:`)
};

const fr_developerportal_credentialbuilder_fieldeditor_variable3 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Variable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Variable :`)
};

const ar_developerportal_credentialbuilder_fieldeditor_variable3 = /** @type {(inputs: Developerportal_Credentialbuilder_Fieldeditor_Variable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متغير:`)
};

/**
* | output |
* | --- |
* | "Variable:" |
*
* @param {Developerportal_Credentialbuilder_Fieldeditor_Variable3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_fieldeditor_variable3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Fieldeditor_Variable3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Fieldeditor_Variable3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_fieldeditor_variable3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_fieldeditor_variable3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_fieldeditor_variable3(inputs)
	return ar_developerportal_credentialbuilder_fieldeditor_variable3(inputs)
});
export { developerportal_credentialbuilder_fieldeditor_variable3 as "developerPortal.credentialBuilder.fieldEditor.variable" }