/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Prooferror4Inputs */

const en_developerportal_credentialbuilder_validationerrors_prooferror4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Prooferror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Signing/proof error`)
};

const es_developerportal_credentialbuilder_validationerrors_prooferror4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Prooferror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error de firma/prueba`)
};

const fr_developerportal_credentialbuilder_validationerrors_prooferror4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Prooferror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur de signature/preuve`)
};

const ar_developerportal_credentialbuilder_validationerrors_prooferror4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Prooferror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خطأ في التوقيع/الإثبات`)
};

/**
* | output |
* | --- |
* | "Signing/proof error" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Prooferror4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_prooferror4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Prooferror4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Prooferror4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_prooferror4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_prooferror4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_prooferror4(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_prooferror4(inputs)
});
export { developerportal_credentialbuilder_validationerrors_prooferror4 as "developerPortal.credentialBuilder.validationErrors.proofError" }