/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Contextsuggestions_04Inputs */

const en_developerportal_credentialbuilder_validationerrors_contextsuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Contextsuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check that @context includes required URLs`)
};

const es_developerportal_credentialbuilder_validationerrors_contextsuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Contextsuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifica que @context incluya las URL requeridas`)
};

const fr_developerportal_credentialbuilder_validationerrors_contextsuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Contextsuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiez que @context inclut les URL requises`)
};

const ar_developerportal_credentialbuilder_validationerrors_contextsuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Contextsuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تأكد من أن @context يتضمن عناوين URL المطلوبة`)
};

/**
* | output |
* | --- |
* | "Check that @context includes required URLs" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Contextsuggestions_04Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_contextsuggestions_04 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Contextsuggestions_04Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Contextsuggestions_04Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_contextsuggestions_04(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_contextsuggestions_04(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_contextsuggestions_04(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_contextsuggestions_04(inputs)
});
export { developerportal_credentialbuilder_validationerrors_contextsuggestions_04 as "developerPortal.credentialBuilder.validationErrors.contextSuggestions.0" }