/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Subjectsuggestions_04Inputs */

const en_developerportal_credentialbuilder_validationerrors_subjectsuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Subjectsuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ensure credentialSubject has required fields`)
};

const es_developerportal_credentialbuilder_validationerrors_subjectsuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Subjectsuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Asegúrate de que credentialSubject tenga los campos requeridos`)
};

const fr_developerportal_credentialbuilder_validationerrors_subjectsuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Subjectsuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assurez-vous que credentialSubject a les champs requis`)
};

const ar_developerportal_credentialbuilder_validationerrors_subjectsuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Subjectsuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تأكد من أن credentialSubject يحتوي على الحقول المطلوبة`)
};

/**
* | output |
* | --- |
* | "Ensure credentialSubject has required fields" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Subjectsuggestions_04Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_subjectsuggestions_04 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Subjectsuggestions_04Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Subjectsuggestions_04Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_subjectsuggestions_04(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_subjectsuggestions_04(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_subjectsuggestions_04(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_subjectsuggestions_04(inputs)
});
export { developerportal_credentialbuilder_validationerrors_subjectsuggestions_04 as "developerPortal.credentialBuilder.validationErrors.subjectSuggestions.0" }