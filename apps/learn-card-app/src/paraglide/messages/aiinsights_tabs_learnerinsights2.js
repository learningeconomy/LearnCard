/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Tabs_Learnerinsights2Inputs */

const en_aiinsights_tabs_learnerinsights2 = /** @type {(inputs: Aiinsights_Tabs_Learnerinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Learner insights`)
};

const es_aiinsights_tabs_learnerinsights2 = /** @type {(inputs: Aiinsights_Tabs_Learnerinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insights de estudiantes`)
};

const fr_aiinsights_tabs_learnerinsights2 = /** @type {(inputs: Aiinsights_Tabs_Learnerinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insights des apprenants`)
};

const ar_aiinsights_tabs_learnerinsights2 = /** @type {(inputs: Aiinsights_Tabs_Learnerinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رؤى المتعلمين`)
};

/**
* | output |
* | --- |
* | "Learner insights" |
*
* @param {Aiinsights_Tabs_Learnerinsights2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_tabs_learnerinsights2 = /** @type {((inputs?: Aiinsights_Tabs_Learnerinsights2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Tabs_Learnerinsights2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_tabs_learnerinsights2(inputs)
	if (locale === "es") return es_aiinsights_tabs_learnerinsights2(inputs)
	if (locale === "fr") return fr_aiinsights_tabs_learnerinsights2(inputs)
	return ar_aiinsights_tabs_learnerinsights2(inputs)
});
export { aiinsights_tabs_learnerinsights2 as "aiInsights.tabs.learnerInsights" }