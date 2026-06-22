/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Activity_Csvstatus_Expired2Inputs */

const en_developerportal_dashboards_activity_csvstatus_expired2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Csvstatus_Expired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expired`)
};

const es_developerportal_dashboards_activity_csvstatus_expired2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Csvstatus_Expired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expirado`)
};

const fr_developerportal_dashboards_activity_csvstatus_expired2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Csvstatus_Expired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expiré`)
};

const ar_developerportal_dashboards_activity_csvstatus_expired2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Csvstatus_Expired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منتهي الصلاحية`)
};

/**
* | output |
* | --- |
* | "Expired" |
*
* @param {Developerportal_Dashboards_Activity_Csvstatus_Expired2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_activity_csvstatus_expired2 = /** @type {((inputs?: Developerportal_Dashboards_Activity_Csvstatus_Expired2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Activity_Csvstatus_Expired2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_activity_csvstatus_expired2(inputs)
	if (locale === "es") return es_developerportal_dashboards_activity_csvstatus_expired2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_activity_csvstatus_expired2(inputs)
	return ar_developerportal_dashboards_activity_csvstatus_expired2(inputs)
});
export { developerportal_dashboards_activity_csvstatus_expired2 as "developerPortal.dashboards.activity.csvStatus.expired" }