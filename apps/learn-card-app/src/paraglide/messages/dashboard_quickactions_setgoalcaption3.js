/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Quickactions_Setgoalcaption3Inputs */

const en_dashboard_quickactions_setgoalcaption3 = /** @type {(inputs: Dashboard_Quickactions_Setgoalcaption3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get a personal path`)
};

const es_dashboard_quickactions_setgoalcaption3 = /** @type {(inputs: Dashboard_Quickactions_Setgoalcaption3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtén un camino personal`)
};

const fr_dashboard_quickactions_setgoalcaption3 = /** @type {(inputs: Dashboard_Quickactions_Setgoalcaption3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenez un parcours personnel`)
};

const ar_dashboard_quickactions_setgoalcaption3 = /** @type {(inputs: Dashboard_Quickactions_Setgoalcaption3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`احصل على مسار شخصي`)
};

/**
* | output |
* | --- |
* | "Get a personal path" |
*
* @param {Dashboard_Quickactions_Setgoalcaption3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_quickactions_setgoalcaption3 = /** @type {((inputs?: Dashboard_Quickactions_Setgoalcaption3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Quickactions_Setgoalcaption3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_quickactions_setgoalcaption3(inputs)
	if (locale === "es") return es_dashboard_quickactions_setgoalcaption3(inputs)
	if (locale === "fr") return fr_dashboard_quickactions_setgoalcaption3(inputs)
	return ar_dashboard_quickactions_setgoalcaption3(inputs)
});
export { dashboard_quickactions_setgoalcaption3 as "dashboard.quickActions.setGoalCaption" }