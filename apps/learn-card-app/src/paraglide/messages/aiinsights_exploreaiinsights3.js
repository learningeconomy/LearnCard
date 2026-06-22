/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Exploreaiinsights3Inputs */

const en_aiinsights_exploreaiinsights3 = /** @type {(inputs: Aiinsights_Exploreaiinsights3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explore Insights`)
};

const es_aiinsights_exploreaiinsights3 = /** @type {(inputs: Aiinsights_Exploreaiinsights3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorar Insights`)
};

const fr_aiinsights_exploreaiinsights3 = /** @type {(inputs: Aiinsights_Exploreaiinsights3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorer les Insights`)
};

const ar_aiinsights_exploreaiinsights3 = /** @type {(inputs: Aiinsights_Exploreaiinsights3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استكشف الرؤى`)
};

/**
* | output |
* | --- |
* | "Explore Insights" |
*
* @param {Aiinsights_Exploreaiinsights3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_exploreaiinsights3 = /** @type {((inputs?: Aiinsights_Exploreaiinsights3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Exploreaiinsights3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_exploreaiinsights3(inputs)
	if (locale === "es") return es_aiinsights_exploreaiinsights3(inputs)
	if (locale === "fr") return fr_aiinsights_exploreaiinsights3(inputs)
	return ar_aiinsights_exploreaiinsights3(inputs)
});
export { aiinsights_exploreaiinsights3 as "aiInsights.exploreAiInsights" }