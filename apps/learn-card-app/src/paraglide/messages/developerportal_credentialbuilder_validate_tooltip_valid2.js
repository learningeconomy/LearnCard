/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validate_Tooltip_Valid2Inputs */

const en_developerportal_credentialbuilder_validate_tooltip_valid2 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Valid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential is valid`)
};

const es_developerportal_credentialbuilder_validate_tooltip_valid2 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Valid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El crédito es válido`)
};

const fr_developerportal_credentialbuilder_validate_tooltip_valid2 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Valid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le crédit est valide`)
};

const ar_developerportal_credentialbuilder_validate_tooltip_valid2 = /** @type {(inputs: Developerportal_Credentialbuilder_Validate_Tooltip_Valid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاعتماد صالح`)
};

/**
* | output |
* | --- |
* | "Credential is valid" |
*
* @param {Developerportal_Credentialbuilder_Validate_Tooltip_Valid2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validate_tooltip_valid2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validate_Tooltip_Valid2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validate_Tooltip_Valid2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validate_tooltip_valid2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validate_tooltip_valid2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validate_tooltip_valid2(inputs)
	return ar_developerportal_credentialbuilder_validate_tooltip_valid2(inputs)
});
export { developerportal_credentialbuilder_validate_tooltip_valid2 as "developerPortal.credentialBuilder.validate.tooltip.valid" }