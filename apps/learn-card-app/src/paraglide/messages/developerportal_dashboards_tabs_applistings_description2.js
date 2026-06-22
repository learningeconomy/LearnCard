/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Applistings_Description2Inputs */

const en_developerportal_dashboards_tabs_applistings_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage your apps in the LearnCard app store`)
};

const es_developerportal_dashboards_tabs_applistings_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Administra tus aplicaciones en la tienda de aplicaciones de LearnCard`)
};

const fr_developerportal_dashboards_tabs_applistings_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérez vos applications dans la boutique d'applications LearnCard`)
};

const ar_developerportal_dashboards_tabs_applistings_description2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة تطبيقاتك في متجر تطبيقات LearnCard`)
};

/**
* | output |
* | --- |
* | "Manage your apps in the LearnCard app store" |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_description2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Applistings_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_description2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_description2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_description2(inputs)
	return ar_developerportal_dashboards_tabs_applistings_description2(inputs)
});
export { developerportal_dashboards_tabs_applistings_description2 as "developerPortal.dashboards.tabs.appListings.description" }