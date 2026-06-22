/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Applistings_Updateappsuccess4Inputs */

const en_developerportal_dashboards_tabs_applistings_updateappsuccess4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Updateappsuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App listing updated!`)
};

const es_developerportal_dashboards_tabs_applistings_updateappsuccess4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Updateappsuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Listado de app actualizado!`)
};

const fr_developerportal_dashboards_tabs_applistings_updateappsuccess4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Updateappsuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fiche d'application mise à jour !`)
};

const ar_developerportal_dashboards_tabs_applistings_updateappsuccess4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Updateappsuccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تحديث قائمة التطبيق!`)
};

/**
* | output |
* | --- |
* | "App listing updated!" |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Updateappsuccess4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_updateappsuccess4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Applistings_Updateappsuccess4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Updateappsuccess4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_updateappsuccess4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_updateappsuccess4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_updateappsuccess4(inputs)
	return ar_developerportal_dashboards_tabs_applistings_updateappsuccess4(inputs)
});
export { developerportal_dashboards_tabs_applistings_updateappsuccess4 as "developerPortal.dashboards.tabs.appListings.updateAppSuccess" }