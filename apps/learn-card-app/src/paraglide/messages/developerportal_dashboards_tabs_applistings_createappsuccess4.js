/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Applistings_Createappsuccess4Inputs */

const en_developerportal_dashboards_tabs_applistings_createappsuccess4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Createappsuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App listing created!`)
};

const es_developerportal_dashboards_tabs_applistings_createappsuccess4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Createappsuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Listado de app creado!`)
};

const fr_developerportal_dashboards_tabs_applistings_createappsuccess4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Createappsuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fiche d'application créée !`)
};

const ar_developerportal_dashboards_tabs_applistings_createappsuccess4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Createappsuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إنشاء قائمة التطبيق!`)
};

/**
* | output |
* | --- |
* | "App listing created!" |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Createappsuccess4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_createappsuccess4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Applistings_Createappsuccess4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Createappsuccess4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_createappsuccess4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_createappsuccess4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_createappsuccess4(inputs)
	return ar_developerportal_dashboards_tabs_applistings_createappsuccess4(inputs)
});
export { developerportal_dashboards_tabs_applistings_createappsuccess4 as "developerPortal.dashboards.tabs.appListings.createAppSuccess" }