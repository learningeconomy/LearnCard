/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Stats_Pending1Inputs */

const en_developerportal_dashboards_stats_pending1 = /** @type {(inputs: Developerportal_Dashboards_Stats_Pending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pending`)
};

const es_developerportal_dashboards_stats_pending1 = /** @type {(inputs: Developerportal_Dashboards_Stats_Pending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pendientes`)
};

const fr_developerportal_dashboards_stats_pending1 = /** @type {(inputs: Developerportal_Dashboards_Stats_Pending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En attente`)
};

const ar_developerportal_dashboards_stats_pending1 = /** @type {(inputs: Developerportal_Dashboards_Stats_Pending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قيد الانتظار`)
};

/**
* | output |
* | --- |
* | "Pending" |
*
* @param {Developerportal_Dashboards_Stats_Pending1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_stats_pending1 = /** @type {((inputs?: Developerportal_Dashboards_Stats_Pending1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Stats_Pending1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_stats_pending1(inputs)
	if (locale === "es") return es_developerportal_dashboards_stats_pending1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_stats_pending1(inputs)
	return ar_developerportal_dashboards_stats_pending1(inputs)
});
export { developerportal_dashboards_stats_pending1 as "developerPortal.dashboards.stats.pending" }