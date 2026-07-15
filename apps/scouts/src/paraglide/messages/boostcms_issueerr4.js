/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Issueerr4Inputs */

const en_boostcms_issueerr4 = /** @type {(inputs: Boostcms_Issueerr4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error issuing boost`)
};

const es_boostcms_issueerr4 = /** @type {(inputs: Boostcms_Issueerr4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al emitir el boost`)
};

const fr_boostcms_issueerr4 = /** @type {(inputs: Boostcms_Issueerr4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur lors de la délivrance du Boost`)
};

const ar_boostcms_issueerr4 = /** @type {(inputs: Boostcms_Issueerr4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error issuing boost`)
};

/**
* | output |
* | --- |
* | "Error issuing boost" |
*
* @param {Boostcms_Issueerr4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_issueerr4 = /** @type {((inputs?: Boostcms_Issueerr4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Issueerr4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_issueerr4(inputs)
	if (locale === "es") return es_boostcms_issueerr4(inputs)
	if (locale === "fr") return fr_boostcms_issueerr4(inputs)
	return ar_boostcms_issueerr4(inputs)
});
export { boostcms_issueerr4 as "boostCMS.issueErr" }