/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Boostmyself4Inputs */

const en_boostcms_boostmyself4 = /** @type {(inputs: Boostcms_Boostmyself4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost Myself`)
};

const es_boostcms_boostmyself4 = /** @type {(inputs: Boostcms_Boostmyself4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost a Mí Mismo`)
};

const fr_boostcms_boostmyself4 = /** @type {(inputs: Boostcms_Boostmyself4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Me booster`)
};

const ar_boostcms_boostmyself4 = /** @type {(inputs: Boostcms_Boostmyself4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعزيز نفسي`)
};

/**
* | output |
* | --- |
* | "Boost Myself" |
*
* @param {Boostcms_Boostmyself4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_boostmyself4 = /** @type {((inputs?: Boostcms_Boostmyself4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Boostmyself4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_boostmyself4(inputs)
	if (locale === "es") return es_boostcms_boostmyself4(inputs)
	if (locale === "fr") return fr_boostcms_boostmyself4(inputs)
	return ar_boostcms_boostmyself4(inputs)
});
export { boostcms_boostmyself4 as "boostCMS.boostMyself" }