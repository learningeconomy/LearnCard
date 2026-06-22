/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Validationerrors_Proofsuggestions_04Inputs */

const en_developerportal_credentialbuilder_validationerrors_proofsuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Proofsuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This usually resolves itself - try validating again`)
};

const es_developerportal_credentialbuilder_validationerrors_proofsuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Proofsuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esto generalmente se resuelve solo - intenta validar de nuevo`)
};

const fr_developerportal_credentialbuilder_validationerrors_proofsuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Proofsuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cela se résout généralement tout seul - essayez de valider à nouveau`)
};

const ar_developerportal_credentialbuilder_validationerrors_proofsuggestions_04 = /** @type {(inputs: Developerportal_Credentialbuilder_Validationerrors_Proofsuggestions_04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عادةً ما يتم حل هذا من تلقاء نفسه - حاول التحقق مرة أخرى`)
};

/**
* | output |
* | --- |
* | "This usually resolves itself - try validating again" |
*
* @param {Developerportal_Credentialbuilder_Validationerrors_Proofsuggestions_04Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_validationerrors_proofsuggestions_04 = /** @type {((inputs?: Developerportal_Credentialbuilder_Validationerrors_Proofsuggestions_04Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Validationerrors_Proofsuggestions_04Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_validationerrors_proofsuggestions_04(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_validationerrors_proofsuggestions_04(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_validationerrors_proofsuggestions_04(inputs)
	return ar_developerportal_credentialbuilder_validationerrors_proofsuggestions_04(inputs)
});
export { developerportal_credentialbuilder_validationerrors_proofsuggestions_04 as "developerPortal.credentialBuilder.validationErrors.proofSuggestions.0" }