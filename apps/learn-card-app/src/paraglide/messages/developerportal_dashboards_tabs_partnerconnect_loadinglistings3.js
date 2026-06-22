/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Loadinglistings3Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_loadinglistings3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Loadinglistings3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading app listings...`)
};

const es_developerportal_dashboards_tabs_partnerconnect_loadinglistings3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Loadinglistings3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando listados de aplicaciones...`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_loadinglistings3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Loadinglistings3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des listes d'applications...`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_loadinglistings3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Loadinglistings3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل قوائم التطبيقات...`)
};

/**
* | output |
* | --- |
* | "Loading app listings..." |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Loadinglistings3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_loadinglistings3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Loadinglistings3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Loadinglistings3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_loadinglistings3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_loadinglistings3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_loadinglistings3(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_loadinglistings3(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_loadinglistings3 as "developerPortal.dashboards.tabs.partnerConnect.loadingListings" }