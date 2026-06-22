/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Connections_Nocontracttitle3Inputs */

const en_developerportal_dashboards_tabs_connections_nocontracttitle3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Nocontracttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No contract configured`)
};

const es_developerportal_dashboards_tabs_connections_nocontracttitle3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Nocontracttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No hay contrato configurado`)
};

const fr_developerportal_dashboards_tabs_connections_nocontracttitle3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Nocontracttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun contrat configuré`)
};

const ar_developerportal_dashboards_tabs_connections_nocontracttitle3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Nocontracttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم تكوين عقد`)
};

/**
* | output |
* | --- |
* | "No contract configured" |
*
* @param {Developerportal_Dashboards_Tabs_Connections_Nocontracttitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_connections_nocontracttitle3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Connections_Nocontracttitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Connections_Nocontracttitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_connections_nocontracttitle3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_connections_nocontracttitle3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_connections_nocontracttitle3(inputs)
	return ar_developerportal_dashboards_tabs_connections_nocontracttitle3(inputs)
});
export { developerportal_dashboards_tabs_connections_nocontracttitle3 as "developerPortal.dashboards.tabs.connections.noContractTitle" }