/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_24Inputs */

const en_developerportal_credentialbuilder_validationerrors_genericsuggestions_24 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Try reverting to a template preset`)
};

const es_developerportal_credentialbuilder_validationerrors_genericsuggestions_24 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Intenta revertir a una plantilla predefinida`)
};

const fr_developerportal_credentialbuilder_validationerrors_genericsuggestions_24 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Essayez de revenir à un modèle prédéfini`)
};

const ar_developerportal_credentialbuilder_validationerrors_genericsuggestions_24 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حاول العودة إلى قالب مسبق`)
};

/**
* | output |
* | --- |
* | "Try reverting to a template preset" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_24Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_genericsuggestions_24 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_24Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_24Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_genericsuggestions_24(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_genericsuggestions_24(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_genericsuggestions_24(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_genericsuggestions_24(inputs)
});
export { developerportal_credentialbuilder_validationerrors_genericsuggestions_24 as "developerPortal.credentialBuilder.validationErrors.genericSuggestions.2" }