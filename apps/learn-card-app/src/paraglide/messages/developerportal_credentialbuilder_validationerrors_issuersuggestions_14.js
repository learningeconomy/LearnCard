/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Issuersuggestions_14Inputs */

const en_developerportal_credentialbuilder_validationerrors_issuersuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Issuersuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check issuer name field is not empty`)
};

const es_developerportal_credentialbuilder_validationerrors_issuersuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Issuersuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifica que el nombre del emisor no esté vacío`)
};

const fr_developerportal_credentialbuilder_validationerrors_issuersuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Issuersuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiez que le champ du nom de l'émetteur n'est pas vide`)
};

const ar_developerportal_credentialbuilder_validationerrors_issuersuggestions_14 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Issuersuggestions_14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق من أن حقل اسم المصدر ليس فارغًا`)
};

/**
* | output |
* | --- |
* | "Check issuer name field is not empty" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Issuersuggestions_14Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_issuersuggestions_14 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Issuersuggestions_14Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Issuersuggestions_14Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_issuersuggestions_14(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_issuersuggestions_14(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_issuersuggestions_14(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_issuersuggestions_14(inputs)
});
export { developerportal_credentialbuilder_validationerrors_issuersuggestions_14 as "developerPortal.credentialBuilder.validationErrors.issuerSuggestions.1" }