/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Connections_Description1Inputs */

const en_developerportal_dashboards_tabs_connections_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Users who have consented to share data with you`)
};

const es_developerportal_dashboards_tabs_connections_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usuarios que han consentido compartir datos contigo`)
};

const fr_developerportal_dashboards_tabs_connections_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisateurs qui ont consenti à partager leurs données avec vous`)
};

const ar_developerportal_dashboards_tabs_connections_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المستخدمون الذين وافقوا على مشاركة البيانات معك`)
};

/**
* | output |
* | --- |
* | "Users who have consented to share data with you" |
*
* @param {Developerportal_Dashboards_Tabs_Connections_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_connections_description1 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Connections_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Connections_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_connections_description1(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_connections_description1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_connections_description1(inputs)
	return ar_developerportal_dashboards_tabs_connections_description1(inputs)
});
export { developerportal_dashboards_tabs_connections_description1 as "developerPortal.dashboards.tabs.connections.description" }