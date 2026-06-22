/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Issuererror4Inputs */

const en_developerportal_credentialbuilder_validationerrors_issuererror4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Issuererror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issuer configuration error`)
};

const es_developerportal_credentialbuilder_validationerrors_issuererror4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Issuererror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error de configuración del emisor`)
};

const fr_developerportal_credentialbuilder_validationerrors_issuererror4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Issuererror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur de configuration de l'émetteur`)
};

const ar_developerportal_credentialbuilder_validationerrors_issuererror4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Issuererror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خطأ في تكوين المصدر`)
};

/**
* | output |
* | --- |
* | "Issuer configuration error" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Issuererror4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_issuererror4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Issuererror4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Issuererror4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_issuererror4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_issuererror4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_issuererror4(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_issuererror4(inputs)
});
export { developerportal_credentialbuilder_validationerrors_issuererror4 as "developerPortal.credentialBuilder.validationErrors.issuerError" }