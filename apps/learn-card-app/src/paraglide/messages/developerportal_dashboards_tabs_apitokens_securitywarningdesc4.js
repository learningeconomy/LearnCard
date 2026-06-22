/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Securitywarningdesc4Inputs */

const en_developerportal_dashboards_tabs_apitokens_securitywarningdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Securitywarningdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Never expose your API token in client-side code or commit it to version control.`)
};

const es_developerportal_dashboards_tabs_apitokens_securitywarningdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Securitywarningdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nunca expongas tu token de API en código del lado del cliente ni lo subas al control de versiones.`)
};

const fr_developerportal_dashboards_tabs_apitokens_securitywarningdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Securitywarningdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`N'exposez jamais votre jeton API dans du code côté client et ne le validez pas dans un système de contrôle de version.`)
};

const ar_developerportal_dashboards_tabs_apitokens_securitywarningdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Securitywarningdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا تفضح رمز API الخاص بك أبدًا في كود جانب العميل أو ترفعه إلى نظام التحكم في الإصدارات.`)
};

/**
* | output |
* | --- |
* | "Never expose your API token in client-side code or commit it to version control." |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Securitywarningdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_securitywarningdesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Securitywarningdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Securitywarningdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_securitywarningdesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_securitywarningdesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_securitywarningdesc4(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_securitywarningdesc4(inputs)
});
export { developerportal_dashboards_tabs_apitokens_securitywarningdesc4 as "developerPortal.dashboards.tabs.apiTokens.securityWarningDesc" }