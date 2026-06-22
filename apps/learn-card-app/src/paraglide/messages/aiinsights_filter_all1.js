/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Filter_All1Inputs */

const en_aiinsights_filter_all1 = /** @type {(inputs: Aiinsights_Filter_All1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All`)
};

const es_aiinsights_filter_all1 = /** @type {(inputs: Aiinsights_Filter_All1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todos`)
};

const fr_aiinsights_filter_all1 = /** @type {(inputs: Aiinsights_Filter_All1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tous`)
};

const ar_aiinsights_filter_all1 = /** @type {(inputs: Aiinsights_Filter_All1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الكل`)
};

/**
* | output |
* | --- |
* | "All" |
*
* @param {Aiinsights_Filter_All1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_filter_all1 = /** @type {((inputs?: Aiinsights_Filter_All1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Filter_All1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_filter_all1(inputs)
	if (locale === "es") return es_aiinsights_filter_all1(inputs)
	if (locale === "fr") return fr_aiinsights_filter_all1(inputs)
	return ar_aiinsights_filter_all1(inputs)
});
export { aiinsights_filter_all1 as "aiInsights.filter.all" }