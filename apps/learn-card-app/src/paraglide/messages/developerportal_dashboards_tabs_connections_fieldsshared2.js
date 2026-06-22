/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Connections_Fieldsshared2Inputs */

const en_developerportal_dashboards_tabs_connections_fieldsshared2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Fieldsshared2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} field(s) shared`)
};

const es_developerportal_dashboards_tabs_connections_fieldsshared2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Fieldsshared2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} campo(s) compartido(s)`)
};

const fr_developerportal_dashboards_tabs_connections_fieldsshared2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Fieldsshared2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} champ(s) partagé(s)`)
};

const ar_developerportal_dashboards_tabs_connections_fieldsshared2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Fieldsshared2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} حقل (حقول) مشترك`)
};

/**
* | output |
* | --- |
* | "{count} field(s) shared" |
*
* @param {Developerportal_Dashboards_Tabs_Connections_Fieldsshared2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_connections_fieldsshared2 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Connections_Fieldsshared2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Connections_Fieldsshared2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_connections_fieldsshared2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_connections_fieldsshared2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_connections_fieldsshared2(inputs)
	return ar_developerportal_dashboards_tabs_connections_fieldsshared2(inputs)
});
export { developerportal_dashboards_tabs_connections_fieldsshared2 as "developerPortal.dashboards.tabs.connections.fieldsShared" }