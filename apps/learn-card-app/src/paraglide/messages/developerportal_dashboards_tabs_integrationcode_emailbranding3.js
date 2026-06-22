/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Emailbranding3Inputs */

const en_developerportal_dashboards_tabs_integrationcode_emailbranding3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Emailbranding3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email Branding`)
};

const es_developerportal_dashboards_tabs_integrationcode_emailbranding3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Emailbranding3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marca de Correo Electrónico`)
};

const fr_developerportal_dashboards_tabs_integrationcode_emailbranding3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Emailbranding3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Image de Marque par E-mail`)
};

const ar_developerportal_dashboards_tabs_integrationcode_emailbranding3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Emailbranding3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العلامة التجارية للبريد الإلكتروني`)
};

/**
* | output |
* | --- |
* | "Email Branding" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Emailbranding3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_emailbranding3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Emailbranding3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Emailbranding3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_emailbranding3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_emailbranding3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_emailbranding3(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_emailbranding3(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_emailbranding3 as "developerPortal.dashboards.tabs.integrationCode.emailBranding" }