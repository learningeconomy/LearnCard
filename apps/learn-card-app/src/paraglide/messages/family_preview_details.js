/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Preview_DetailsInputs */

const en_family_preview_details = /** @type {(inputs: Family_Preview_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Details`)
};

const es_family_preview_details = /** @type {(inputs: Family_Preview_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Detalles`)
};

const fr_family_preview_details = /** @type {(inputs: Family_Preview_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Détails`)
};

const ar_family_preview_details = /** @type {(inputs: Family_Preview_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التفاصيل`)
};

/**
* | output |
* | --- |
* | "Details" |
*
* @param {Family_Preview_DetailsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_preview_details = /** @type {((inputs?: Family_Preview_DetailsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Preview_DetailsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_preview_details(inputs)
	if (locale === "es") return es_family_preview_details(inputs)
	if (locale === "fr") return fr_family_preview_details(inputs)
	return ar_family_preview_details(inputs)
});
export { family_preview_details as "family.preview.details" }