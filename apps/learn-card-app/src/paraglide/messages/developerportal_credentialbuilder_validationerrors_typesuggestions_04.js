/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Typesuggestions_04Inputs */

const en_developerportal_credentialbuilder_validationerrors_typesuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Typesuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ensure "type" array includes "VerifiableCredential"`)
};

const es_developerportal_credentialbuilder_validationerrors_typesuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Typesuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Asegúrate de que el arreglo "type" incluya "VerifiableCredential"`)
};

const fr_developerportal_credentialbuilder_validationerrors_typesuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Typesuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assurez-vous que le tableau "type" inclut "VerifiableCredential"`)
};

const ar_developerportal_credentialbuilder_validationerrors_typesuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Typesuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تأكد من أن مصفوفة "type" تتضمن "VerifiableCredential"`)
};

/**
* | output |
* | --- |
* | "Ensure \"type\" array includes \"VerifiableCredential\"" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Typesuggestions_04Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_typesuggestions_04 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Typesuggestions_04Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Typesuggestions_04Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_typesuggestions_04(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_typesuggestions_04(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_typesuggestions_04(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_typesuggestions_04(inputs)
});
export { developerportal_credentialbuilder_validationerrors_typesuggestions_04 as "developerPortal.credentialBuilder.validationErrors.typeSuggestions.0" }