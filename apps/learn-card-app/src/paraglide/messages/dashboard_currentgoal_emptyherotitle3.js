/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Currentgoal_Emptyherotitle3Inputs */

const en_dashboard_currentgoal_emptyherotitle3 = /** @type {(inputs: Dashboard_Currentgoal_Emptyherotitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set your direction`)
};

const es_dashboard_currentgoal_emptyherotitle3 = /** @type {(inputs: Dashboard_Currentgoal_Emptyherotitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Define tu rumbo`)
};

const fr_dashboard_currentgoal_emptyherotitle3 = /** @type {(inputs: Dashboard_Currentgoal_Emptyherotitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Définissez votre cap`)
};

const ar_dashboard_currentgoal_emptyherotitle3 = /** @type {(inputs: Dashboard_Currentgoal_Emptyherotitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدد وجهتك`)
};

/**
* | output |
* | --- |
* | "Set your direction" |
*
* @param {Dashboard_Currentgoal_Emptyherotitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_currentgoal_emptyherotitle3 = /** @type {((inputs?: Dashboard_Currentgoal_Emptyherotitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Currentgoal_Emptyherotitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_currentgoal_emptyherotitle3(inputs)
	if (locale === "es") return es_dashboard_currentgoal_emptyherotitle3(inputs)
	if (locale === "fr") return fr_dashboard_currentgoal_emptyherotitle3(inputs)
	return ar_dashboard_currentgoal_emptyherotitle3(inputs)
});
export { dashboard_currentgoal_emptyherotitle3 as "dashboard.currentGoal.emptyHeroTitle" }