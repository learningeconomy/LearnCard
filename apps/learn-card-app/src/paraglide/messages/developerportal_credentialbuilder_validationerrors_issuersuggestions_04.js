/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Issuersuggestions_04Inputs */

const en_developerportal_credentialbuilder_validationerrors_issuersuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Issuersuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issuer DID will be auto-configured at issuance`)
};

const es_developerportal_credentialbuilder_validationerrors_issuersuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Issuersuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El DID del emisor se configurará automáticamente al emitir`)
};

const fr_developerportal_credentialbuilder_validationerrors_issuersuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Issuersuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le DID de l'émetteur sera auto-configuré à l'émission`)
};

const ar_developerportal_credentialbuilder_validationerrors_issuersuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Issuersuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سيتم تكوين DID المصدر تلقائيًا عند الإصدار`)
};

/**
* | output |
* | --- |
* | "Issuer DID will be auto-configured at issuance" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Issuersuggestions_04Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_issuersuggestions_04 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Issuersuggestions_04Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Issuersuggestions_04Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_issuersuggestions_04(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_issuersuggestions_04(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_issuersuggestions_04(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_issuersuggestions_04(inputs)
});
export { developerportal_credentialbuilder_validationerrors_issuersuggestions_04 as "developerPortal.credentialBuilder.validationErrors.issuerSuggestions.0" }