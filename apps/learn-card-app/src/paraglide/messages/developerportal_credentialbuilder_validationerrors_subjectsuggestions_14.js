/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Subjectsuggestions_14Inputs */

const en_developerportal_credentialbuilder_validationerrors_subjectsuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Subjectsuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check that recipient fields are properly configured`)
};

const es_developerportal_credentialbuilder_validationerrors_subjectsuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Subjectsuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifica que los campos del destinatario estén configurados correctamente`)
};

const fr_developerportal_credentialbuilder_validationerrors_subjectsuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Subjectsuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiez que les champs du destinataire sont correctement configurés`)
};

const ar_developerportal_credentialbuilder_validationerrors_subjectsuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Subjectsuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق من أن حقول المستلم تم تكوينها بشكل صحيح`)
};

/**
* | output |
* | --- |
* | "Check that recipient fields are properly configured" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Subjectsuggestions_14Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_subjectsuggestions_14 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Subjectsuggestions_14Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Subjectsuggestions_14Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_subjectsuggestions_14(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_subjectsuggestions_14(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_subjectsuggestions_14(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_subjectsuggestions_14(inputs)
});
export { developerportal_credentialbuilder_validationerrors_subjectsuggestions_14 as "developerPortal.credentialBuilder.validationErrors.subjectSuggestions.1" }