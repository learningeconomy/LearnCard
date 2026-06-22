/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Currentgoal_Navigatepathways2Inputs */

const en_dashboard_currentgoal_navigatepathways2 = /** @type {(inputs: Dashboard_Currentgoal_Navigatepathways2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Navigate pathways`)
};

const es_dashboard_currentgoal_navigatepathways2 = /** @type {(inputs: Dashboard_Currentgoal_Navigatepathways2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorar rutas`)
};

const fr_dashboard_currentgoal_navigatepathways2 = /** @type {(inputs: Dashboard_Currentgoal_Navigatepathways2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parcourir les itinéraires`)
};

const ar_dashboard_currentgoal_navigatepathways2 = /** @type {(inputs: Dashboard_Currentgoal_Navigatepathways2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تصفح المسارات`)
};

/**
* | output |
* | --- |
* | "Navigate pathways" |
*
* @param {Dashboard_Currentgoal_Navigatepathways2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_currentgoal_navigatepathways2 = /** @type {((inputs?: Dashboard_Currentgoal_Navigatepathways2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Currentgoal_Navigatepathways2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_currentgoal_navigatepathways2(inputs)
	if (locale === "es") return es_dashboard_currentgoal_navigatepathways2(inputs)
	if (locale === "fr") return fr_dashboard_currentgoal_navigatepathways2(inputs)
	return ar_dashboard_currentgoal_navigatepathways2(inputs)
});
export { dashboard_currentgoal_navigatepathways2 as "dashboard.currentGoal.navigatePathways" }