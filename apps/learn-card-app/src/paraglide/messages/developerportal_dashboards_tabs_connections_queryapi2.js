/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Connections_Queryapi2Inputs */

const en_developerportal_dashboards_tabs_connections_queryapi2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Queryapi2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Query via API`)
};

const es_developerportal_dashboards_tabs_connections_queryapi2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Queryapi2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consultar mediante API`)
};

const fr_developerportal_dashboards_tabs_connections_queryapi2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Queryapi2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Interroger via l'API`)
};

const ar_developerportal_dashboards_tabs_connections_queryapi2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Queryapi2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاستعلام عبر API`)
};

/**
* | output |
* | --- |
* | "Query via API" |
*
* @param {Developerportal_Dashboards_Tabs_Connections_Queryapi2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_connections_queryapi2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Connections_Queryapi2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Connections_Queryapi2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_connections_queryapi2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_connections_queryapi2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_connections_queryapi2(inputs)
	return ar_developerportal_dashboards_tabs_connections_queryapi2(inputs)
});
export { developerportal_dashboards_tabs_connections_queryapi2 as "developerPortal.dashboards.tabs.connections.queryApi" }