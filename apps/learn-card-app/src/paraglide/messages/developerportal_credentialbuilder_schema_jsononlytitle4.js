/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Schema_Jsononlytitle4Inputs */

const en_developerportal_credentialbuilder_schema_jsononlytitle4 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Jsononlytitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON-Only Mode`)
};

const es_developerportal_credentialbuilder_schema_jsononlytitle4 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Jsononlytitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modo Solo JSON`)
};

const fr_developerportal_credentialbuilder_schema_jsononlytitle4 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Jsononlytitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mode JSON Uniquement`)
};

const ar_developerportal_credentialbuilder_schema_jsononlytitle4 = /** @type {(inputs: Developerportal_Credentialbuilder_Schema_Jsononlytitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وضع JSON فقط`)
};

/**
* | output |
* | --- |
* | "JSON-Only Mode" |
*
* @param {Developerportal_Credentialbuilder_Schema_Jsononlytitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_schema_jsononlytitle4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Schema_Jsononlytitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Schema_Jsononlytitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_schema_jsononlytitle4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_schema_jsononlytitle4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_schema_jsononlytitle4(inputs)
	return ar_developerportal_credentialbuilder_schema_jsononlytitle4(inputs)
});
export { developerportal_credentialbuilder_schema_jsononlytitle4 as "developerPortal.credentialBuilder.schema.jsonOnlyTitle" }