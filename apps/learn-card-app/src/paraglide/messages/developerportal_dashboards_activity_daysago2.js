/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Dashboards_Activity_Daysago2Inputs */

const en_developerportal_dashboards_activity_daysago2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Daysago2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count}d ago`)
};

const es_developerportal_dashboards_activity_daysago2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Daysago2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`hace ${i?.count}d`)
};

const fr_developerportal_dashboards_activity_daysago2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Daysago2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`il y a ${i?.count}d`)
};

const ar_developerportal_dashboards_activity_daysago2 = /** @type {(inputs: Developerportal_Dashboards_Activity_Daysago2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`منذ ${i?.count} ي`)
};

/**
* | output |
* | --- |
* | "{count}d ago" |
*
* @param {Developerportal_Dashboards_Activity_Daysago2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_activity_daysago2 = /** @type {((inputs: Developerportal_Dashboards_Activity_Daysago2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Activity_Daysago2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_activity_daysago2(inputs)
	if (locale === "es") return es_developerportal_dashboards_activity_daysago2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_activity_daysago2(inputs)
	return ar_developerportal_dashboards_activity_daysago2(inputs)
});
export { developerportal_dashboards_activity_daysago2 as "developerPortal.dashboards.activity.daysAgo" }