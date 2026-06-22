/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Stats_Templates1Inputs */

const en_developerportal_dashboards_stats_templates1 = /** @type {(inputs: Developerportal_Dashboards_Stats_Templates1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Templates`)
};

const es_developerportal_dashboards_stats_templates1 = /** @type {(inputs: Developerportal_Dashboards_Stats_Templates1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plantillas`)
};

const fr_developerportal_dashboards_stats_templates1 = /** @type {(inputs: Developerportal_Dashboards_Stats_Templates1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modèles`)
};

const ar_developerportal_dashboards_stats_templates1 = /** @type {(inputs: Developerportal_Dashboards_Stats_Templates1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`القوالب`)
};

/**
* | output |
* | --- |
* | "Templates" |
*
* @param {Developerportal_Dashboards_Stats_Templates1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_stats_templates1 = /** @type {((inputs?: Developerportal_Dashboards_Stats_Templates1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Stats_Templates1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_stats_templates1(inputs)
	if (locale === "es") return es_developerportal_dashboards_stats_templates1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_stats_templates1(inputs)
	return ar_developerportal_dashboards_stats_templates1(inputs)
});
export { developerportal_dashboards_stats_templates1 as "developerPortal.dashboards.stats.templates" }