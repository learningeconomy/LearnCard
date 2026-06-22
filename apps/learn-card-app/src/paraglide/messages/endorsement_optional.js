/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_OptionalInputs */

const en_endorsement_optional = /** @type {(inputs: Endorsement_OptionalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Optional`)
};

const es_endorsement_optional = /** @type {(inputs: Endorsement_OptionalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Opcional`)
};

const fr_endorsement_optional = /** @type {(inputs: Endorsement_OptionalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Facultatif`)
};

const ar_endorsement_optional = /** @type {(inputs: Endorsement_OptionalInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختياري`)
};

/**
* | output |
* | --- |
* | "Optional" |
*
* @param {Endorsement_OptionalInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_optional = /** @type {((inputs?: Endorsement_OptionalInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_OptionalInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_optional(inputs)
	if (locale === "es") return es_endorsement_optional(inputs)
	if (locale === "fr") return fr_endorsement_optional(inputs)
	return ar_endorsement_optional(inputs)
});
export { endorsement_optional as "endorsement.optional" }