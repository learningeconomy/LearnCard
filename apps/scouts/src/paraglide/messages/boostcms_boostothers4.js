/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Boostothers4Inputs */

const en_boostcms_boostothers4 = /** @type {(inputs: Boostcms_Boostothers4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost Others`)
};

const es_boostcms_boostothers4 = /** @type {(inputs: Boostcms_Boostothers4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost a Otros`)
};

const fr_boostcms_boostothers4 = /** @type {(inputs: Boostcms_Boostothers4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Booster d'autres`)
};

const ar_boostcms_boostothers4 = /** @type {(inputs: Boostcms_Boostothers4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعزيز الآخرين`)
};

/**
* | output |
* | --- |
* | "Boost Others" |
*
* @param {Boostcms_Boostothers4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_boostothers4 = /** @type {((inputs?: Boostcms_Boostothers4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Boostothers4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_boostothers4(inputs)
	if (locale === "es") return es_boostcms_boostothers4(inputs)
	if (locale === "fr") return fr_boostcms_boostothers4(inputs)
	return ar_boostcms_boostothers4(inputs)
});
export { boostcms_boostothers4 as "boostCMS.boostOthers" }