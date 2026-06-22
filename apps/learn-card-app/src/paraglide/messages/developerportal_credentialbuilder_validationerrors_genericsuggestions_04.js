/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_04Inputs */

const en_developerportal_credentialbuilder_validationerrors_genericsuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Review recently changed fields`)
};

const es_developerportal_credentialbuilder_validationerrors_genericsuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revisa los campos cambiados recientemente`)
};

const fr_developerportal_credentialbuilder_validationerrors_genericsuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passez en revue les champs récemment modifiés`)
};

const ar_developerportal_credentialbuilder_validationerrors_genericsuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`راجع الحقول التي تم تغييرها مؤخرًا`)
};

/**
* | output |
* | --- |
* | "Review recently changed fields" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_04Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_genericsuggestions_04 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_04Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_04Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_genericsuggestions_04(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_genericsuggestions_04(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_genericsuggestions_04(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_genericsuggestions_04(inputs)
});
export { developerportal_credentialbuilder_validationerrors_genericsuggestions_04 as "developerPortal.credentialBuilder.validationErrors.genericSuggestions.0" }