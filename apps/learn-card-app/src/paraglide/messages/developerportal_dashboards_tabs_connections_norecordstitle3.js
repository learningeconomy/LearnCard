/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Connections_Norecordstitle3Inputs */

const en_developerportal_dashboards_tabs_connections_norecordstitle3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Norecordstitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No consent records yet`)
};

const es_developerportal_dashboards_tabs_connections_norecordstitle3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Norecordstitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay registros de consentimiento`)
};

const fr_developerportal_dashboards_tabs_connections_norecordstitle3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Norecordstitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas encore d'enregistrements de consentement`)
};

const ar_developerportal_dashboards_tabs_connections_norecordstitle3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Norecordstitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد سجلات موافقة بعد`)
};

/**
* | output |
* | --- |
* | "No consent records yet" |
*
* @param {Developerportal_Dashboards_Tabs_Connections_Norecordstitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_connections_norecordstitle3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Connections_Norecordstitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Connections_Norecordstitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_connections_norecordstitle3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_connections_norecordstitle3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_connections_norecordstitle3(inputs)
	return ar_developerportal_dashboards_tabs_connections_norecordstitle3(inputs)
});
export { developerportal_dashboards_tabs_connections_norecordstitle3 as "developerPortal.dashboards.tabs.connections.noRecordsTitle" }