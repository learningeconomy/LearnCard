/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Proofsuggestions_14Inputs */

const en_developerportal_credentialbuilder_validationerrors_proofsuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Proofsuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check wallet connection status`)
};

const es_developerportal_credentialbuilder_validationerrors_proofsuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Proofsuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifica el estado de conexión de la cartera`)
};

const fr_developerportal_credentialbuilder_validationerrors_proofsuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Proofsuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiez l'état de connexion du portefeuille`)
};

const ar_developerportal_credentialbuilder_validationerrors_proofsuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Proofsuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق من حالة اتصال المحفظة`)
};

/**
* | output |
* | --- |
* | "Check wallet connection status" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Proofsuggestions_14Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_proofsuggestions_14 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Proofsuggestions_14Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Proofsuggestions_14Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_proofsuggestions_14(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_proofsuggestions_14(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_proofsuggestions_14(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_proofsuggestions_14(inputs)
});
export { developerportal_credentialbuilder_validationerrors_proofsuggestions_14 as "developerPortal.credentialBuilder.validationErrors.proofSuggestions.1" }