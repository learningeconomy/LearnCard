/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Contextsuggestions_14Inputs */

const en_developerportal_credentialbuilder_validationerrors_contextsuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Contextsuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ensure no custom fields conflict with standard vocabulary`)
};

const es_developerportal_credentialbuilder_validationerrors_contextsuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Contextsuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Asegúrate de que los campos personalizados no entren en conflicto con el vocabulario estándar`)
};

const fr_developerportal_credentialbuilder_validationerrors_contextsuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Contextsuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assurez-vous que les champs personnalisés ne conflictent pas avec le vocabulaire standard`)
};

const ar_developerportal_credentialbuilder_validationerrors_contextsuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Contextsuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تأكد من أن الحقول المخصصة لا تتعارض مع المفردات القياسية`)
};

/**
* | output |
* | --- |
* | "Ensure no custom fields conflict with standard vocabulary" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Contextsuggestions_14Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_contextsuggestions_14 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Contextsuggestions_14Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Contextsuggestions_14Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_contextsuggestions_14(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_contextsuggestions_14(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_contextsuggestions_14(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_contextsuggestions_14(inputs)
});
export { developerportal_credentialbuilder_validationerrors_contextsuggestions_14 as "developerPortal.credentialBuilder.validationErrors.contextSuggestions.1" }