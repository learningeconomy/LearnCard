/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Connections_Errortitle2Inputs */

const en_developerportal_dashboards_tabs_connections_errortitle2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Errortitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to load consent data`)
};

const es_developerportal_dashboards_tabs_connections_errortitle2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Errortitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al cargar datos de consentimiento`)
};

const fr_developerportal_dashboards_tabs_connections_errortitle2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Errortitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec du chargement des données de consentement`)
};

const ar_developerportal_dashboards_tabs_connections_errortitle2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Errortitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل تحميل بيانات الموافقة`)
};

/**
* | output |
* | --- |
* | "Failed to load consent data" |
*
* @param {Developerportal_Dashboards_Tabs_Connections_Errortitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_connections_errortitle2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Connections_Errortitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Connections_Errortitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_connections_errortitle2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_connections_errortitle2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_connections_errortitle2(inputs)
	return ar_developerportal_dashboards_tabs_connections_errortitle2(inputs)
});
export { developerportal_dashboards_tabs_connections_errortitle2 as "developerPortal.dashboards.tabs.connections.errorTitle" }