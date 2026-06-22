/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Missingfieldsuggestions_15Inputs */

const en_developerportal_credentialbuilder_validationerrors_missingfieldsuggestions_15 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Missingfieldsuggestions_15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Review recently added/modified fields`)
};

const es_developerportal_credentialbuilder_validationerrors_missingfieldsuggestions_15 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Missingfieldsuggestions_15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revisa los campos recién añadidos/modificados`)
};

const fr_developerportal_credentialbuilder_validationerrors_missingfieldsuggestions_15 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Missingfieldsuggestions_15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passez en revue les champs récemment ajoutés/modifiés`)
};

const ar_developerportal_credentialbuilder_validationerrors_missingfieldsuggestions_15 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Missingfieldsuggestions_15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`راجع الحقول المضافة/المعدلة مؤخرًا`)
};

/**
* | output |
* | --- |
* | "Review recently added/modified fields" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Missingfieldsuggestions_15Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_missingfieldsuggestions_15 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Missingfieldsuggestions_15Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Missingfieldsuggestions_15Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_missingfieldsuggestions_15(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_missingfieldsuggestions_15(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_missingfieldsuggestions_15(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_missingfieldsuggestions_15(inputs)
});
export { developerportal_credentialbuilder_validationerrors_missingfieldsuggestions_15 as "developerPortal.credentialBuilder.validationErrors.missingFieldSuggestions.1" }