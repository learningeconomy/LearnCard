/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_14Inputs */

const en_developerportal_credentialbuilder_validationerrors_genericsuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check JSON tab for malformed data`)
};

const es_developerportal_credentialbuilder_validationerrors_genericsuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifica la pestaña JSON para datos malformados`)
};

const fr_developerportal_credentialbuilder_validationerrors_genericsuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiez l'onglet JSON pour des données malformées`)
};

const ar_developerportal_credentialbuilder_validationerrors_genericsuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق من علامة التبويب JSON بحثًا عن بيانات غير صالحة`)
};

/**
* | output |
* | --- |
* | "Check JSON tab for malformed data" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_14Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_genericsuggestions_14 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_14Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Genericsuggestions_14Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_genericsuggestions_14(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_genericsuggestions_14(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_genericsuggestions_14(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_genericsuggestions_14(inputs)
});
export { developerportal_credentialbuilder_validationerrors_genericsuggestions_14 as "developerPortal.credentialBuilder.validationErrors.genericSuggestions.1" }