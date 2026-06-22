/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Invalidcontext4Inputs */

const en_developerportal_credentialbuilder_validationerrors_invalidcontext4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Invalidcontext4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid JSON-LD context`)
};

const es_developerportal_credentialbuilder_validationerrors_invalidcontext4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Invalidcontext4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contexto JSON-LD inválido`)
};

const fr_developerportal_credentialbuilder_validationerrors_invalidcontext4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Invalidcontext4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contexte JSON-LD invalide`)
};

const ar_developerportal_credentialbuilder_validationerrors_invalidcontext4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Invalidcontext4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سياق JSON-LD غير صالح`)
};

/**
* | output |
* | --- |
* | "Invalid JSON-LD context" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Invalidcontext4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_invalidcontext4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Invalidcontext4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Invalidcontext4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_invalidcontext4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_invalidcontext4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_invalidcontext4(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_invalidcontext4(inputs)
});
export { developerportal_credentialbuilder_validationerrors_invalidcontext4 as "developerPortal.credentialBuilder.validationErrors.invalidContext" }