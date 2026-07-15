/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Scancodeclaim5Inputs */

const en_boostcms_scancodeclaim5 = /** @type {(inputs: Boostcms_Scancodeclaim5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scan Code to Claim Boost`)
};

const es_boostcms_scancodeclaim5 = /** @type {(inputs: Boostcms_Scancodeclaim5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escanear Código para Reclamar Boost`)
};

const fr_boostcms_scancodeclaim5 = /** @type {(inputs: Boostcms_Scancodeclaim5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scannez le code pour réclamer le Boost`)
};

const ar_boostcms_scancodeclaim5 = /** @type {(inputs: Boostcms_Scancodeclaim5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسح الرمز لاستلام التعزيز`)
};

/**
* | output |
* | --- |
* | "Scan Code to Claim Boost" |
*
* @param {Boostcms_Scancodeclaim5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_scancodeclaim5 = /** @type {((inputs?: Boostcms_Scancodeclaim5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Scancodeclaim5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_scancodeclaim5(inputs)
	if (locale === "es") return es_boostcms_scancodeclaim5(inputs)
	if (locale === "fr") return fr_boostcms_scancodeclaim5(inputs)
	return ar_boostcms_scancodeclaim5(inputs)
});
export { boostcms_scancodeclaim5 as "boostCMS.scanCodeClaim" }