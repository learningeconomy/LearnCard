/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Datesuggestions_04Inputs */

const en_developerportal_credentialbuilder_validationerrors_datesuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Datesuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ensure date fields use ISO 8601 format`)
};

const es_developerportal_credentialbuilder_validationerrors_datesuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Datesuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Asegúrate de que los campos de fecha usen formato ISO 8601`)
};

const fr_developerportal_credentialbuilder_validationerrors_datesuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Datesuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assurez-vous que les champs de date utilisent le format ISO 8601`)
};

const ar_developerportal_credentialbuilder_validationerrors_datesuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Datesuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تأكد من أن حقول التاريخ تستخدم تنسيق ISO 8601`)
};

/**
* | output |
* | --- |
* | "Ensure date fields use ISO 8601 format" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Datesuggestions_04Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_datesuggestions_04 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Datesuggestions_04Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Datesuggestions_04Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_datesuggestions_04(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_datesuggestions_04(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_datesuggestions_04(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_datesuggestions_04(inputs)
});
export { developerportal_credentialbuilder_validationerrors_datesuggestions_04 as "developerPortal.credentialBuilder.validationErrors.dateSuggestions.0" }