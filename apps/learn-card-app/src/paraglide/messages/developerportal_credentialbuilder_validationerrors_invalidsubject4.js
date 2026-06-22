/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Invalidsubject4Inputs */

const en_developerportal_credentialbuilder_validationerrors_invalidsubject4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Invalidsubject4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid credential subject`)
};

const es_developerportal_credentialbuilder_validationerrors_invalidsubject4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Invalidsubject4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sujeto de credencial inválido`)
};

const fr_developerportal_credentialbuilder_validationerrors_invalidsubject4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Invalidsubject4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sujet de crédential invalide`)
};

const ar_developerportal_credentialbuilder_validationerrors_invalidsubject4 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Invalidsubject4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`موضوع الاعتماد غير صالح`)
};

/**
* | output |
* | --- |
* | "Invalid credential subject" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Invalidsubject4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_invalidsubject4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Invalidsubject4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Invalidsubject4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_invalidsubject4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_invalidsubject4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_invalidsubject4(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_invalidsubject4(inputs)
});
export { developerportal_credentialbuilder_validationerrors_invalidsubject4 as "developerPortal.credentialBuilder.validationErrors.invalidSubject" }