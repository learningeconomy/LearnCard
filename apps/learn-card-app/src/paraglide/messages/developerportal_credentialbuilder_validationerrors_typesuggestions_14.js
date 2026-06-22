/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Typesuggestions_14Inputs */

const en_developerportal_credentialbuilder_validationerrors_typesuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Typesuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check that credential types match the @context`)
};

const es_developerportal_credentialbuilder_validationerrors_typesuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Typesuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifica que los tipos de credencial coincidan con el @context`)
};

const fr_developerportal_credentialbuilder_validationerrors_typesuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Typesuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiez que les types de crédential correspondent au @context`)
};

const ar_developerportal_credentialbuilder_validationerrors_typesuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Typesuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق من أن أنواع الاعتماد تتطابق مع @context`)
};

/**
* | output |
* | --- |
* | "Check that credential types match the @context" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Typesuggestions_14Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_typesuggestions_14 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Typesuggestions_14Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Typesuggestions_14Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_typesuggestions_14(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_typesuggestions_14(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_typesuggestions_14(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_typesuggestions_14(inputs)
});
export { developerportal_credentialbuilder_validationerrors_typesuggestions_14 as "developerPortal.credentialBuilder.validationErrors.typeSuggestions.1" }