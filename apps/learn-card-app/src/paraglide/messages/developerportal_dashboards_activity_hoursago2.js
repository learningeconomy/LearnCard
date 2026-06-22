/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Dashboards_Activity_Hoursago2Inputs */

const en_developerportal_dashboards_activity_hoursago2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Hoursago2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count}h ago`)
};

const es_developerportal_dashboards_activity_hoursago2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Hoursago2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`hace ${i?.count}h`)
};

const fr_developerportal_dashboards_activity_hoursago2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Hoursago2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`il y a ${i?.count}h`)
};

const ar_developerportal_dashboards_activity_hoursago2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Hoursago2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`منذ ${i?.count} س`)
};

/**
* | output |
* | --- |
* | "{count}h ago" |
*
* @param {Developerportal_Dashboards_Activity_Hoursago2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_activity_hoursago2 = /** @type {((inputs: Developerportal_Dashboards_Activity_Hoursago2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Activity_Hoursago2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_activity_hoursago2(inputs)
	if (locale === "es") return es_developerportal_dashboards_activity_hoursago2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_activity_hoursago2(inputs)
	return ar_developerportal_dashboards_activity_hoursago2(inputs)
});
export { developerportal_dashboards_activity_hoursago2 as "developerPortal.dashboards.activity.hoursAgo" }