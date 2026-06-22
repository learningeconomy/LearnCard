/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Checklist_Setgoal1Inputs */

const en_dashboard_checklist_setgoal1 = /** @type {(inputs: Dashboard_Checklist_Setgoal1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set a goal`)
};

const es_dashboard_checklist_setgoal1 = /** @type {(inputs: Dashboard_Checklist_Setgoal1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Define una meta`)
};

const fr_dashboard_checklist_setgoal1 = /** @type {(inputs: Dashboard_Checklist_Setgoal1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Définissez un objectif`)
};

const ar_dashboard_checklist_setgoal1 = /** @type {(inputs: Dashboard_Checklist_Setgoal1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدد هدفًا`)
};

/**
* | output |
* | --- |
* | "Set a goal" |
*
* @param {Dashboard_Checklist_Setgoal1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_checklist_setgoal1 = /** @type {((inputs?: Dashboard_Checklist_Setgoal1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Checklist_Setgoal1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_checklist_setgoal1(inputs)
	if (locale === "es") return es_dashboard_checklist_setgoal1(inputs)
	if (locale === "fr") return fr_dashboard_checklist_setgoal1(inputs)
	return ar_dashboard_checklist_setgoal1(inputs)
});
export { dashboard_checklist_setgoal1 as "dashboard.checklist.setGoal" }