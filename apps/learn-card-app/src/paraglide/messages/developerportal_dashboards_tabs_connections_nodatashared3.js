/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Connections_Nodatashared3Inputs */

const en_developerportal_dashboards_tabs_connections_nodatashared3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Nodatashared3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent granted with no additional data shared`)
};

const es_developerportal_dashboards_tabs_connections_nodatashared3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Nodatashared3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consentimiento otorgado sin datos adicionales compartidos`)
};

const fr_developerportal_dashboards_tabs_connections_nodatashared3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Nodatashared3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consentement accordé sans partage de données supplémentaires`)
};

const ar_developerportal_dashboards_tabs_connections_nodatashared3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Nodatashared3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم منح الموافقة دون مشاركة بيانات إضافية`)
};

/**
* | output |
* | --- |
* | "Consent granted with no additional data shared" |
*
* @param {Developerportal_Dashboards_Tabs_Connections_Nodatashared3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_connections_nodatashared3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Connections_Nodatashared3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Connections_Nodatashared3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_connections_nodatashared3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_connections_nodatashared3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_connections_nodatashared3(inputs)
	return ar_developerportal_dashboards_tabs_connections_nodatashared3(inputs)
});
export { developerportal_dashboards_tabs_connections_nodatashared3 as "developerPortal.dashboards.tabs.connections.noDataShared" }