/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Nav_Overview1Inputs */

const en_developerportal_dashboards_nav_overview1 = /** @type {(inputs: Developerportal_Dashboards_Nav_Overview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Overview`)
};

const es_developerportal_dashboards_nav_overview1 = /** @type {(inputs: Developerportal_Dashboards_Nav_Overview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resumen`)
};

const fr_developerportal_dashboards_nav_overview1 = /** @type {(inputs: Developerportal_Dashboards_Nav_Overview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu`)
};

const ar_developerportal_dashboards_nav_overview1 = /** @type {(inputs: Developerportal_Dashboards_Nav_Overview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نظرة عامة`)
};

/**
* | output |
* | --- |
* | "Overview" |
*
* @param {Developerportal_Dashboards_Nav_Overview1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_nav_overview1 = /** @type {((inputs?: Developerportal_Dashboards_Nav_Overview1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Nav_Overview1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_nav_overview1(inputs)
	if (locale === "es") return es_developerportal_dashboards_nav_overview1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_nav_overview1(inputs)
	return ar_developerportal_dashboards_nav_overview1(inputs)
});
export { developerportal_dashboards_nav_overview1 as "developerPortal.dashboards.nav.overview" }