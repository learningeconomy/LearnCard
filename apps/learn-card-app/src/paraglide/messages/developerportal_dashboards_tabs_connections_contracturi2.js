/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Connections_Contracturi2Inputs */

const en_developerportal_dashboards_tabs_connections_contracturi2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Contracturi2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contract URI`)
};

const es_developerportal_dashboards_tabs_connections_contracturi2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Contracturi2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URI del Contrato`)
};

const fr_developerportal_dashboards_tabs_connections_contracturi2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Contracturi2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URI du Contrat`)
};

const ar_developerportal_dashboards_tabs_connections_contracturi2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Contracturi2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط العقد`)
};

/**
* | output |
* | --- |
* | "Contract URI" |
*
* @param {Developerportal_Dashboards_Tabs_Connections_Contracturi2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_connections_contracturi2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Connections_Contracturi2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Connections_Contracturi2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_connections_contracturi2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_connections_contracturi2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_connections_contracturi2(inputs)
	return ar_developerportal_dashboards_tabs_connections_contracturi2(inputs)
});
export { developerportal_dashboards_tabs_connections_contracturi2 as "developerPortal.dashboards.tabs.connections.contractUri" }