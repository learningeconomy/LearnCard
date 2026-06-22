/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Optional2Inputs */

const en_developerportal_credentialbuilder_optional2 = /** @type {(inputs: Developerportal_Credentialbuilder_Optional2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Optional`)
};

const es_developerportal_credentialbuilder_optional2 = /** @type {(inputs: Developerportal_Credentialbuilder_Optional2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Opcional`)
};

const fr_developerportal_credentialbuilder_optional2 = /** @type {(inputs: Developerportal_Credentialbuilder_Optional2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Optionnel`)
};

const ar_developerportal_credentialbuilder_optional2 = /** @type {(inputs: Developerportal_Credentialbuilder_Optional2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختياري`)
};

/**
* | output |
* | --- |
* | "Optional" |
*
* @param {Developerportal_Credentialbuilder_Optional2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_optional2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Optional2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Optional2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_optional2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_optional2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_optional2(inputs)
	return ar_developerportal_credentialbuilder_optional2(inputs)
});
export { developerportal_credentialbuilder_optional2 as "developerPortal.credentialBuilder.optional" }