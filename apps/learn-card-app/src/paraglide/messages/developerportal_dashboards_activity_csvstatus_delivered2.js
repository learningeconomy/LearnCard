/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Activity_Csvstatus_Delivered2Inputs */

const en_developerportal_dashboards_activity_csvstatus_delivered2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Csvstatus_Delivered2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delivered`)
};

const es_developerportal_dashboards_activity_csvstatus_delivered2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Csvstatus_Delivered2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entregado`)
};

const fr_developerportal_dashboards_activity_csvstatus_delivered2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Csvstatus_Delivered2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Livré`)
};

const ar_developerportal_dashboards_activity_csvstatus_delivered2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Csvstatus_Delivered2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم التسليم`)
};

/**
* | output |
* | --- |
* | "Delivered" |
*
* @param {Developerportal_Dashboards_Activity_Csvstatus_Delivered2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_activity_csvstatus_delivered2 = /** @type {((inputs?: Developerportal_Dashboards_Activity_Csvstatus_Delivered2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Activity_Csvstatus_Delivered2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_activity_csvstatus_delivered2(inputs)
	if (locale === "es") return es_developerportal_dashboards_activity_csvstatus_delivered2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_activity_csvstatus_delivered2(inputs)
	return ar_developerportal_dashboards_activity_csvstatus_delivered2(inputs)
});
export { developerportal_dashboards_activity_csvstatus_delivered2 as "developerPortal.dashboards.activity.csvStatus.delivered" }