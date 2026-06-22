/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Applistings_Createapperror4Inputs */

const en_developerportal_dashboards_tabs_applistings_createapperror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Createapperror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to create app listing`)
};

const es_developerportal_dashboards_tabs_applistings_createapperror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Createapperror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al crear el listado de app`)
};

const fr_developerportal_dashboards_tabs_applistings_createapperror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Createapperror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la création de la fiche d'application`)
};

const ar_developerportal_dashboards_tabs_applistings_createapperror4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Createapperror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل إنشاء قائمة التطبيق`)
};

/**
* | output |
* | --- |
* | "Failed to create app listing" |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Createapperror4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_createapperror4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Applistings_Createapperror4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Createapperror4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_createapperror4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_createapperror4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_createapperror4(inputs)
	return ar_developerportal_dashboards_tabs_applistings_createapperror4(inputs)
});
export { developerportal_dashboards_tabs_applistings_createapperror4 as "developerPortal.dashboards.tabs.appListings.createAppError" }