/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Currentgoal_Emptytitle2Inputs */

const en_dashboard_currentgoal_emptytitle2 = /** @type {(inputs: Dashboard_Currentgoal_Emptytitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No active journey yet`)
};

const es_dashboard_currentgoal_emptytitle2 = /** @type {(inputs: Dashboard_Currentgoal_Emptytitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay un trayecto activo`)
};

const fr_dashboard_currentgoal_emptytitle2 = /** @type {(inputs: Dashboard_Currentgoal_Emptytitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun parcours actif pour l'instant`)
};

const ar_dashboard_currentgoal_emptytitle2 = /** @type {(inputs: Dashboard_Currentgoal_Emptytitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد رحلة نشطة بعد`)
};

/**
* | output |
* | --- |
* | "No active journey yet" |
*
* @param {Dashboard_Currentgoal_Emptytitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_currentgoal_emptytitle2 = /** @type {((inputs?: Dashboard_Currentgoal_Emptytitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Currentgoal_Emptytitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_currentgoal_emptytitle2(inputs)
	if (locale === "es") return es_dashboard_currentgoal_emptytitle2(inputs)
	if (locale === "fr") return fr_dashboard_currentgoal_emptytitle2(inputs)
	return ar_dashboard_currentgoal_emptytitle2(inputs)
});
export { dashboard_currentgoal_emptytitle2 as "dashboard.currentGoal.emptyTitle" }