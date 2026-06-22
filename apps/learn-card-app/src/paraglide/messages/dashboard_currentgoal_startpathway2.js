/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Currentgoal_Startpathway2Inputs */

const en_dashboard_currentgoal_startpathway2 = /** @type {(inputs: Dashboard_Currentgoal_Startpathway2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Start a pathway`)
};

const es_dashboard_currentgoal_startpathway2 = /** @type {(inputs: Dashboard_Currentgoal_Startpathway2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciar una ruta`)
};

const fr_dashboard_currentgoal_startpathway2 = /** @type {(inputs: Dashboard_Currentgoal_Startpathway2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Commencer un itinéraire`)
};

const ar_dashboard_currentgoal_startpathway2 = /** @type {(inputs: Dashboard_Currentgoal_Startpathway2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ابدأ مسارًا`)
};

/**
* | output |
* | --- |
* | "Start a pathway" |
*
* @param {Dashboard_Currentgoal_Startpathway2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_currentgoal_startpathway2 = /** @type {((inputs?: Dashboard_Currentgoal_Startpathway2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Currentgoal_Startpathway2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_currentgoal_startpathway2(inputs)
	if (locale === "es") return es_dashboard_currentgoal_startpathway2(inputs)
	if (locale === "fr") return fr_dashboard_currentgoal_startpathway2(inputs)
	return ar_dashboard_currentgoal_startpathway2(inputs)
});
export { dashboard_currentgoal_startpathway2 as "dashboard.currentGoal.startPathway" }