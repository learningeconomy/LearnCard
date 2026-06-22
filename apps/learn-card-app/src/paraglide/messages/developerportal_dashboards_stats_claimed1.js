/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Stats_Claimed1Inputs */

const en_developerportal_dashboards_stats_claimed1 = /** @type {(inputs: Developerportal_Dashboards_Stats_Claimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claimed`)
};

const es_developerportal_dashboards_stats_claimed1 = /** @type {(inputs: Developerportal_Dashboards_Stats_Claimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reclamadas`)
};

const fr_developerportal_dashboards_stats_claimed1 = /** @type {(inputs: Developerportal_Dashboards_Stats_Claimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réclamés`)
};

const ar_developerportal_dashboards_stats_claimed1 = /** @type {(inputs: Developerportal_Dashboards_Stats_Claimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم المطالبة`)
};

/**
* | output |
* | --- |
* | "Claimed" |
*
* @param {Developerportal_Dashboards_Stats_Claimed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_stats_claimed1 = /** @type {((inputs?: Developerportal_Dashboards_Stats_Claimed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Stats_Claimed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_stats_claimed1(inputs)
	if (locale === "es") return es_developerportal_dashboards_stats_claimed1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_stats_claimed1(inputs)
	return ar_developerportal_dashboards_stats_claimed1(inputs)
});
export { developerportal_dashboards_stats_claimed1 as "developerPortal.dashboards.stats.claimed" }