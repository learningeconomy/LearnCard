/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Preview_TrustedInputs */

const en_family_preview_trusted = /** @type {(inputs: Family_Preview_TrustedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trusted`)
};

const es_family_preview_trusted = /** @type {(inputs: Family_Preview_TrustedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`De confianza`)
};

const fr_family_preview_trusted = /** @type {(inputs: Family_Preview_TrustedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`De confiance`)
};

const ar_family_preview_trusted = /** @type {(inputs: Family_Preview_TrustedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`موثوق`)
};

/**
* | output |
* | --- |
* | "Trusted" |
*
* @param {Family_Preview_TrustedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_preview_trusted = /** @type {((inputs?: Family_Preview_TrustedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Preview_TrustedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_preview_trusted(inputs)
	if (locale === "es") return es_family_preview_trusted(inputs)
	if (locale === "fr") return fr_family_preview_trusted(inputs)
	return ar_family_preview_trusted(inputs)
});
export { family_preview_trusted as "family.preview.trusted" }