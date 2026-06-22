/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Activity_Loadmorefailed3Inputs */

const en_developerportal_dashboards_activity_loadmorefailed3 = /** @type {(inputs: Developerportal_Dashboards_Activity_Loadmorefailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to load more activity`)
};

const es_developerportal_dashboards_activity_loadmorefailed3 = /** @type {(inputs: Developerportal_Dashboards_Activity_Loadmorefailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al cargar más actividad`)
};

const fr_developerportal_dashboards_activity_loadmorefailed3 = /** @type {(inputs: Developerportal_Dashboards_Activity_Loadmorefailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec du chargement de plus d'activités`)
};

const ar_developerportal_dashboards_activity_loadmorefailed3 = /** @type {(inputs: Developerportal_Dashboards_Activity_Loadmorefailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل تحميل المزيد من النشاط`)
};

/**
* | output |
* | --- |
* | "Failed to load more activity" |
*
* @param {Developerportal_Dashboards_Activity_Loadmorefailed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_activity_loadmorefailed3 = /** @type {((inputs?: Developerportal_Dashboards_Activity_Loadmorefailed3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Activity_Loadmorefailed3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_activity_loadmorefailed3(inputs)
	if (locale === "es") return es_developerportal_dashboards_activity_loadmorefailed3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_activity_loadmorefailed3(inputs)
	return ar_developerportal_dashboards_activity_loadmorefailed3(inputs)
});
export { developerportal_dashboards_activity_loadmorefailed3 as "developerPortal.dashboards.activity.loadMoreFailed" }