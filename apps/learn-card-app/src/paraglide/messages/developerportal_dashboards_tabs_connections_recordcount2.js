/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Connections_Recordcount2Inputs */

const en_developerportal_dashboards_tabs_connections_recordcount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Recordcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} consent record(s)`)
};

const es_developerportal_dashboards_tabs_connections_recordcount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Recordcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} registro(s) de consentimiento`)
};

const fr_developerportal_dashboards_tabs_connections_recordcount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Recordcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} enregistrement(s) de consentement`)
};

const ar_developerportal_dashboards_tabs_connections_recordcount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Recordcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} سجل موافقة`)
};

/**
* | output |
* | --- |
* | "{count} consent record(s)" |
*
* @param {Developerportal_Dashboards_Tabs_Connections_Recordcount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_connections_recordcount2 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Connections_Recordcount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Connections_Recordcount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_connections_recordcount2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_connections_recordcount2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_connections_recordcount2(inputs)
	return ar_developerportal_dashboards_tabs_connections_recordcount2(inputs)
});
export { developerportal_dashboards_tabs_connections_recordcount2 as "developerPortal.dashboards.tabs.connections.recordCount" }