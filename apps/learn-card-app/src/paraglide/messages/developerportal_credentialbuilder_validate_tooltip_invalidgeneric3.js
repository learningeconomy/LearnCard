/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ error: NonNullable<unknown> }} Developerportal_Credentialbuilder_Validate_Tooltip_Invalidgeneric3Inputs */

const en_developerportal_credentialbuilder_validate_tooltip_invalidgeneric3 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Invalidgeneric3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Validation failed: ${i?.error}`)
};

const es_developerportal_credentialbuilder_validate_tooltip_invalidgeneric3 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Invalidgeneric3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Validation failed: ${i?.error}`)
};

const fr_developerportal_credentialbuilder_validate_tooltip_invalidgeneric3 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Invalidgeneric3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Validation failed: ${i?.error}`)
};

const ar_developerportal_credentialbuilder_validate_tooltip_invalidgeneric3 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Invalidgeneric3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Validation failed: ${i?.error}`)
};

/**
* | output |
* | --- |
* | "Validation failed: {error}" |
*
* @param {Developerportal_Credentialbuilder_Validate_Tooltip_Invalidgeneric3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validate_tooltip_invalidgeneric3 = /** @type {((inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Invalidgeneric3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validate_Tooltip_Invalidgeneric3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validate_tooltip_invalidgeneric3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validate_tooltip_invalidgeneric3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validate_tooltip_invalidgeneric3(inputs)
	return ar_developerportal_credentialbuilder_validate_tooltip_invalidgeneric3(inputs)
});
export { developerportal_credentialbuilder_validate_tooltip_invalidgeneric3 as "developerPortal.credentialBuilder.validate.tooltip.invalidGeneric" }