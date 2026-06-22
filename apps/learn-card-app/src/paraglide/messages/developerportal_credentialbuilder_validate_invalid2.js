/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validate_Invalid2Inputs */

const en_developerportal_credentialbuilder_validate_invalid2 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Invalid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid`)
};

const es_developerportal_credentialbuilder_validate_invalid2 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Invalid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inválido`)
};

const fr_developerportal_credentialbuilder_validate_invalid2 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Invalid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalide`)
};

const ar_developerportal_credentialbuilder_validate_invalid2 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Invalid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير صالح`)
};

/**
* | output |
* | --- |
* | "Invalid" |
*
* @param {Developerportal_Credentialbuilder_Validate_Invalid2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validate_invalid2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validate_Invalid2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validate_Invalid2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validate_invalid2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validate_invalid2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validate_invalid2(inputs)
	return ar_developerportal_credentialbuilder_validate_invalid2(inputs)
});
export { developerportal_credentialbuilder_validate_invalid2 as "developerPortal.credentialBuilder.validate.invalid" }