/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Missingfieldsuggestions_05Inputs */

const en_developerportal_credentialbuilder_validationerrors_missingfieldsuggestions_05 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Missingfieldsuggestions_05Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check that all required fields have values`)
};

const es_developerportal_credentialbuilder_validationerrors_missingfieldsuggestions_05 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Missingfieldsuggestions_05Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifica que todos los campos requeridos tengan valores`)
};

const fr_developerportal_credentialbuilder_validationerrors_missingfieldsuggestions_05 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Missingfieldsuggestions_05Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiez que tous les champs obligatoires ont des valeurs`)
};

const ar_developerportal_credentialbuilder_validationerrors_missingfieldsuggestions_05 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Missingfieldsuggestions_05Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق من أن جميع الحقول المطلوبة لها قيم`)
};

/**
* | output |
* | --- |
* | "Check that all required fields have values" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Missingfieldsuggestions_05Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_missingfieldsuggestions_05 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Missingfieldsuggestions_05Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Missingfieldsuggestions_05Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_missingfieldsuggestions_05(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_missingfieldsuggestions_05(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_missingfieldsuggestions_05(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_missingfieldsuggestions_05(inputs)
});
export { developerportal_credentialbuilder_validationerrors_missingfieldsuggestions_05 as "developerPortal.credentialBuilder.validationErrors.missingFieldSuggestions.0" }