/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Applistings_Createapp3Inputs */

const en_developerportal_dashboards_tabs_applistings_createapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Createapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create App`)
};

const es_developerportal_dashboards_tabs_applistings_createapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Createapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear App`)
};

const fr_developerportal_dashboards_tabs_applistings_createapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Createapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer une App`)
};

const ar_developerportal_dashboards_tabs_applistings_createapp3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Createapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء تطبيق`)
};

/**
* | output |
* | --- |
* | "Create App" |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Createapp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_createapp3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Applistings_Createapp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Createapp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_createapp3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_createapp3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_createapp3(inputs)
	return ar_developerportal_dashboards_tabs_applistings_createapp3(inputs)
});
export { developerportal_dashboards_tabs_applistings_createapp3 as "developerPortal.dashboards.tabs.appListings.createApp" }