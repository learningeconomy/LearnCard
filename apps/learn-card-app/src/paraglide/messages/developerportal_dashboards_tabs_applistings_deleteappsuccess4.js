/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Applistings_Deleteappsuccess4Inputs */

const en_developerportal_dashboards_tabs_applistings_deleteappsuccess4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Deleteappsuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App listing deleted`)
};

const es_developerportal_dashboards_tabs_applistings_deleteappsuccess4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Deleteappsuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Listado de app eliminado`)
};

const fr_developerportal_dashboards_tabs_applistings_deleteappsuccess4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Deleteappsuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fiche d'application supprimée`)
};

const ar_developerportal_dashboards_tabs_applistings_deleteappsuccess4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Deleteappsuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم حذف قائمة التطبيق`)
};

/**
* | output |
* | --- |
* | "App listing deleted" |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Deleteappsuccess4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_deleteappsuccess4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Applistings_Deleteappsuccess4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Deleteappsuccess4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_deleteappsuccess4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_deleteappsuccess4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_deleteappsuccess4(inputs)
	return ar_developerportal_dashboards_tabs_applistings_deleteappsuccess4(inputs)
});
export { developerportal_dashboards_tabs_applistings_deleteappsuccess4 as "developerPortal.dashboards.tabs.appListings.deleteAppSuccess" }