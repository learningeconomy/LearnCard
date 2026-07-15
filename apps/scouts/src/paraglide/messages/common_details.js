/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_DetailsInputs */

const en_common_details = /** @type {(inputs: Common_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Details`)
};

const es_common_details = /** @type {(inputs: Common_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Detalles`)
};

const fr_common_details = /** @type {(inputs: Common_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Détails`)
};

const ar_common_details = /** @type {(inputs: Common_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التفاصيل`)
};

/**
* | output |
* | --- |
* | "Details" |
*
* @param {Common_DetailsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_details = /** @type {((inputs?: Common_DetailsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_DetailsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_details(inputs)
	if (locale === "es") return es_common_details(inputs)
	if (locale === "fr") return fr_common_details(inputs)
	return ar_common_details(inputs)
});
export { common_details as "common.details" }