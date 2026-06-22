/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Topskills2Inputs */

const en_aiinsights_topskills2 = /** @type {(inputs: Aiinsights_Topskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Top Skills`)
};

const es_aiinsights_topskills2 = /** @type {(inputs: Aiinsights_Topskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidades principales`)
};

const fr_aiinsights_topskills2 = /** @type {(inputs: Aiinsights_Topskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétences principales`)
};

const ar_aiinsights_topskills2 = /** @type {(inputs: Aiinsights_Topskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أهم المهارات`)
};

/**
* | output |
* | --- |
* | "Top Skills" |
*
* @param {Aiinsights_Topskills2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_topskills2 = /** @type {((inputs?: Aiinsights_Topskills2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Topskills2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_topskills2(inputs)
	if (locale === "es") return es_aiinsights_topskills2(inputs)
	if (locale === "fr") return fr_aiinsights_topskills2(inputs)
	return ar_aiinsights_topskills2(inputs)
});
export { aiinsights_topskills2 as "aiInsights.topSkills" }