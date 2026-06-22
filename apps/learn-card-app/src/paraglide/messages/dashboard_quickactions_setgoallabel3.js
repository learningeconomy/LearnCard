/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Quickactions_Setgoallabel3Inputs */

const en_dashboard_quickactions_setgoallabel3 = /** @type {(inputs: Dashboard_Quickactions_Setgoallabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set a Goal`)
};

const es_dashboard_quickactions_setgoallabel3 = /** @type {(inputs: Dashboard_Quickactions_Setgoallabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Define una meta`)
};

const fr_dashboard_quickactions_setgoallabel3 = /** @type {(inputs: Dashboard_Quickactions_Setgoallabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Définir un objectif`)
};

const ar_dashboard_quickactions_setgoallabel3 = /** @type {(inputs: Dashboard_Quickactions_Setgoallabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدد هدفًا`)
};

/**
* | output |
* | --- |
* | "Set a Goal" |
*
* @param {Dashboard_Quickactions_Setgoallabel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_quickactions_setgoallabel3 = /** @type {((inputs?: Dashboard_Quickactions_Setgoallabel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Quickactions_Setgoallabel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_quickactions_setgoallabel3(inputs)
	if (locale === "es") return es_dashboard_quickactions_setgoallabel3(inputs)
	if (locale === "fr") return fr_dashboard_quickactions_setgoallabel3(inputs)
	return ar_dashboard_quickactions_setgoallabel3(inputs)
});
export { dashboard_quickactions_setgoallabel3 as "dashboard.quickActions.setGoalLabel" }