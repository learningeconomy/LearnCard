/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Connections_Sharedpersonaldata3Inputs */

const en_developerportal_dashboards_tabs_connections_sharedpersonaldata3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Sharedpersonaldata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Shared Personal Data`)
};

const es_developerportal_dashboards_tabs_connections_sharedpersonaldata3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Sharedpersonaldata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Datos Personales Compartidos`)
};

const fr_developerportal_dashboards_tabs_connections_sharedpersonaldata3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Sharedpersonaldata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Données Personnelles Partagées`)
};

const ar_developerportal_dashboards_tabs_connections_sharedpersonaldata3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Sharedpersonaldata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البيانات الشخصية المشتركة`)
};

/**
* | output |
* | --- |
* | "Shared Personal Data" |
*
* @param {Developerportal_Dashboards_Tabs_Connections_Sharedpersonaldata3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_connections_sharedpersonaldata3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Connections_Sharedpersonaldata3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Connections_Sharedpersonaldata3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_connections_sharedpersonaldata3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_connections_sharedpersonaldata3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_connections_sharedpersonaldata3(inputs)
	return ar_developerportal_dashboards_tabs_connections_sharedpersonaldata3(inputs)
});
export { developerportal_dashboards_tabs_connections_sharedpersonaldata3 as "developerPortal.dashboards.tabs.connections.sharedPersonalData" }