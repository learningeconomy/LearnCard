/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Viewall1Inputs */

const en_common_viewall1 = /** @type {(inputs: Common_Viewall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View All`)
};

const es_common_viewall1 = /** @type {(inputs: Common_Viewall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver todo`)
};

const fr_common_viewall1 = /** @type {(inputs: Common_Viewall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout voir`)
};

const ar_common_viewall1 = /** @type {(inputs: Common_Viewall1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض الكل`)
};

/**
* | output |
* | --- |
* | "View All" |
*
* @param {Common_Viewall1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_viewall1 = /** @type {((inputs?: Common_Viewall1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Viewall1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_viewall1(inputs)
	if (locale === "es") return es_common_viewall1(inputs)
	if (locale === "fr") return fr_common_viewall1(inputs)
	return ar_common_viewall1(inputs)
});
export { common_viewall1 as "common.viewAll" }