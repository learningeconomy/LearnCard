/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Connections_Errorunknown2Inputs */

const en_developerportal_dashboards_tabs_connections_errorunknown2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Errorunknown2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unknown error`)
};

const es_developerportal_dashboards_tabs_connections_errorunknown2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Errorunknown2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error desconocido`)
};

const fr_developerportal_dashboards_tabs_connections_errorunknown2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Errorunknown2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur inconnue`)
};

const ar_developerportal_dashboards_tabs_connections_errorunknown2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Errorunknown2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خطأ غير معروف`)
};

/**
* | output |
* | --- |
* | "Unknown error" |
*
* @param {Developerportal_Dashboards_Tabs_Connections_Errorunknown2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_connections_errorunknown2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Connections_Errorunknown2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Connections_Errorunknown2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_connections_errorunknown2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_connections_errorunknown2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_connections_errorunknown2(inputs)
	return ar_developerportal_dashboards_tabs_connections_errorunknown2(inputs)
});
export { developerportal_dashboards_tabs_connections_errorunknown2 as "developerPortal.dashboards.tabs.connections.errorUnknown" }