/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Currentgoal_Continuejourney2Inputs */

const en_dashboard_currentgoal_continuejourney2 = /** @type {(inputs: Dashboard_Currentgoal_Continuejourney2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue journey`)
};

const es_dashboard_currentgoal_continuejourney2 = /** @type {(inputs: Dashboard_Currentgoal_Continuejourney2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar trayecto`)
};

const fr_dashboard_currentgoal_continuejourney2 = /** @type {(inputs: Dashboard_Currentgoal_Continuejourney2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer le parcours`)
};

const ar_dashboard_currentgoal_continuejourney2 = /** @type {(inputs: Dashboard_Currentgoal_Continuejourney2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متابعة الرحلة`)
};

/**
* | output |
* | --- |
* | "Continue journey" |
*
* @param {Dashboard_Currentgoal_Continuejourney2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_currentgoal_continuejourney2 = /** @type {((inputs?: Dashboard_Currentgoal_Continuejourney2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Currentgoal_Continuejourney2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_currentgoal_continuejourney2(inputs)
	if (locale === "es") return es_dashboard_currentgoal_continuejourney2(inputs)
	if (locale === "fr") return fr_dashboard_currentgoal_continuejourney2(inputs)
	return ar_dashboard_currentgoal_continuejourney2(inputs)
});
export { dashboard_currentgoal_continuejourney2 as "dashboard.currentGoal.continueJourney" }