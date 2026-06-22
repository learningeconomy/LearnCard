/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ number: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Connections_Consentrecord2Inputs */

const en_developerportal_dashboards_tabs_connections_consentrecord2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Consentrecord2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Consent Record #${i?.number}`)
};

const es_developerportal_dashboards_tabs_connections_consentrecord2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Consentrecord2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Registro de Consentimiento #${i?.number}`)
};

const fr_developerportal_dashboards_tabs_connections_consentrecord2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Consentrecord2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Enregistrement de Consentement #${i?.number}`)
};

const ar_developerportal_dashboards_tabs_connections_consentrecord2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Connections_Consentrecord2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`سجل موافقة #${i?.number}`)
};

/**
* | output |
* | --- |
* | "Consent Record #{number}" |
*
* @param {Developerportal_Dashboards_Tabs_Connections_Consentrecord2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_connections_consentrecord2 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Connections_Consentrecord2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Connections_Consentrecord2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_connections_consentrecord2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_connections_consentrecord2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_connections_consentrecord2(inputs)
	return ar_developerportal_dashboards_tabs_connections_consentrecord2(inputs)
});
export { developerportal_dashboards_tabs_connections_consentrecord2 as "developerPortal.dashboards.tabs.connections.consentRecord" }