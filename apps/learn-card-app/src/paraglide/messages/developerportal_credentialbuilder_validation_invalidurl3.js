/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validation_Invalidurl3Inputs */

const en_developerportal_credentialbuilder_validation_invalidurl3 = /** @type {(inputs: Developerportal_Credentialbuilder_Validation_Invalidurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Must be a valid URL (e.g., https://example.com)`)
};

const es_developerportal_credentialbuilder_validation_invalidurl3 = /** @type {(inputs: Developerportal_Credentialbuilder_Validation_Invalidurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Must be a valid URL (e.g., https://example.com)`)
};

const fr_developerportal_credentialbuilder_validation_invalidurl3 = /** @type {(inputs: Developerportal_Credentialbuilder_Validation_Invalidurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Must be a valid URL (e.g., https://example.com)`)
};

const ar_developerportal_credentialbuilder_validation_invalidurl3 = /** @type {(inputs: Developerportal_Credentialbuilder_Validation_Invalidurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Must be a valid URL (e.g., https://example.com)`)
};

/**
* | output |
* | --- |
* | "Must be a valid URL (e.g., https://example.com)" |
*
* @param {Developerportal_Credentialbuilder_Validation_Invalidurl3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validation_invalidurl3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validation_Invalidurl3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validation_Invalidurl3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validation_invalidurl3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validation_invalidurl3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validation_invalidurl3(inputs)
	return ar_developerportal_credentialbuilder_validation_invalidurl3(inputs)
});
export { developerportal_credentialbuilder_validation_invalidurl3 as "developerPortal.credentialBuilder.validation.invalidUrl" }