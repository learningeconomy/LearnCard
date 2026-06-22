/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Activity_Autodelivered2Inputs */

const en_developerportal_dashboards_activity_autodelivered2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Autodelivered2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-Delivered`)
};

const es_developerportal_dashboards_activity_autodelivered2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Autodelivered2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-Entregado`)
};

const fr_developerportal_dashboards_activity_autodelivered2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Autodelivered2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-Livré`)
};

const ar_developerportal_dashboards_activity_autodelivered2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Autodelivered2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تسليم تلقائي`)
};

/**
* | output |
* | --- |
* | "Auto-Delivered" |
*
* @param {Developerportal_Dashboards_Activity_Autodelivered2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_activity_autodelivered2 = /** @type {((inputs?: Developerportal_Dashboards_Activity_Autodelivered2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Activity_Autodelivered2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_activity_autodelivered2(inputs)
	if (locale === "es") return es_developerportal_dashboards_activity_autodelivered2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_activity_autodelivered2(inputs)
	return ar_developerportal_dashboards_activity_autodelivered2(inputs)
});
export { developerportal_dashboards_activity_autodelivered2 as "developerPortal.dashboards.activity.autoDelivered" }