/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Noaccesssubtitle3Inputs */

const en_admintools_noaccesssubtitle3 = /** @type {(inputs: Admintools_Noaccesssubtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`sneaky sneaky...`)
};

const es_admintools_noaccesssubtitle3 = /** @type {(inputs: Admintools_Noaccesssubtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`travieso travieso...`)
};

const fr_admintools_noaccesssubtitle3 = /** @type {(inputs: Admintools_Noaccesssubtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`futé futé...`)
};

const ar_admintools_noaccesssubtitle3 = /** @type {(inputs: Admintools_Noaccesssubtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`sneaky sneaky...`)
};

/**
* | output |
* | --- |
* | "sneaky sneaky..." |
*
* @param {Admintools_Noaccesssubtitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_noaccesssubtitle3 = /** @type {((inputs?: Admintools_Noaccesssubtitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Noaccesssubtitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_noaccesssubtitle3(inputs)
	if (locale === "es") return es_admintools_noaccesssubtitle3(inputs)
	if (locale === "fr") return fr_admintools_noaccesssubtitle3(inputs)
	return ar_admintools_noaccesssubtitle3(inputs)
});
export { admintools_noaccesssubtitle3 as "adminTools.noAccessSubtitle" }