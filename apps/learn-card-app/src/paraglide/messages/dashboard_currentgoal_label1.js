/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Currentgoal_Label1Inputs */

const en_dashboard_currentgoal_label1 = /** @type {(inputs: Dashboard_Currentgoal_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Current goal`)
};

const es_dashboard_currentgoal_label1 = /** @type {(inputs: Dashboard_Currentgoal_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Meta actual`)
};

const fr_dashboard_currentgoal_label1 = /** @type {(inputs: Dashboard_Currentgoal_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Objectif actuel`)
};

const ar_dashboard_currentgoal_label1 = /** @type {(inputs: Dashboard_Currentgoal_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الهدف الحالي`)
};

/**
* | output |
* | --- |
* | "Current goal" |
*
* @param {Dashboard_Currentgoal_Label1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_currentgoal_label1 = /** @type {((inputs?: Dashboard_Currentgoal_Label1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Currentgoal_Label1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_currentgoal_label1(inputs)
	if (locale === "es") return es_dashboard_currentgoal_label1(inputs)
	if (locale === "fr") return fr_dashboard_currentgoal_label1(inputs)
	return ar_dashboard_currentgoal_label1(inputs)
});
export { dashboard_currentgoal_label1 as "dashboard.currentGoal.label" }