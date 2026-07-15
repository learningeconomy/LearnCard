/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Boosttitle4Inputs */

const en_boostcms_boosttitle4 = /** @type {(inputs: Boostcms_Boosttitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost Title`)
};

const es_boostcms_boosttitle4 = /** @type {(inputs: Boostcms_Boosttitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Título del Boost`)
};

const fr_boostcms_boosttitle4 = /** @type {(inputs: Boostcms_Boosttitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Titre du Boost`)
};

const ar_boostcms_boosttitle4 = /** @type {(inputs: Boostcms_Boosttitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost Title`)
};

/**
* | output |
* | --- |
* | "Boost Title" |
*
* @param {Boostcms_Boosttitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_boosttitle4 = /** @type {((inputs?: Boostcms_Boosttitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Boosttitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_boosttitle4(inputs)
	if (locale === "es") return es_boostcms_boosttitle4(inputs)
	if (locale === "fr") return fr_boostcms_boosttitle4(inputs)
	return ar_boostcms_boosttitle4(inputs)
});
export { boostcms_boosttitle4 as "boostCMS.boostTitle" }