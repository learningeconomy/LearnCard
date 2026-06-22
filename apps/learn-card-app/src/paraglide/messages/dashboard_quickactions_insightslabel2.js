/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Quickactions_Insightslabel2Inputs */

const en_dashboard_quickactions_insightslabel2 = /** @type {(inputs: Dashboard_Quickactions_Insightslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`See Insights`)
};

const es_dashboard_quickactions_insightslabel2 = /** @type {(inputs: Dashboard_Quickactions_Insightslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver perspectivas`)
};

const fr_dashboard_quickactions_insightslabel2 = /** @type {(inputs: Dashboard_Quickactions_Insightslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir les aperçus`)
};

const ar_dashboard_quickactions_insightslabel2 = /** @type {(inputs: Dashboard_Quickactions_Insightslabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض الرؤى`)
};

/**
* | output |
* | --- |
* | "See Insights" |
*
* @param {Dashboard_Quickactions_Insightslabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_quickactions_insightslabel2 = /** @type {((inputs?: Dashboard_Quickactions_Insightslabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Quickactions_Insightslabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_quickactions_insightslabel2(inputs)
	if (locale === "es") return es_dashboard_quickactions_insightslabel2(inputs)
	if (locale === "fr") return fr_dashboard_quickactions_insightslabel2(inputs)
	return ar_dashboard_quickactions_insightslabel2(inputs)
});
export { dashboard_quickactions_insightslabel2 as "dashboard.quickActions.insightsLabel" }