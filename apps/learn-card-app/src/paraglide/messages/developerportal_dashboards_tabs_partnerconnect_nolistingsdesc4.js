/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Nolistingsdesc4Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_nolistingsdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Nolistingsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create an app listing in the "App Listings" tab first.`)
};

const es_developerportal_dashboards_tabs_partnerconnect_nolistingsdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Nolistingsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea un listado de aplicación en la pestaña "Listados de Apps" primero.`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_nolistingsdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Nolistingsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez d'abord une liste d'application dans l'onglet "Listes d'Apps".`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_nolistingsdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Nolistingsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بإنشاء قائمة تطبيق في علامة تبويب "قوائم التطبيقات" أولاً.`)
};

/**
* | output |
* | --- |
* | "Create an app listing in the \"App Listings\" tab first." |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Nolistingsdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_nolistingsdesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Nolistingsdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Nolistingsdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_nolistingsdesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_nolistingsdesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_nolistingsdesc4(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_nolistingsdesc4(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_nolistingsdesc4 as "developerPortal.dashboards.tabs.partnerConnect.noListingsDesc" }