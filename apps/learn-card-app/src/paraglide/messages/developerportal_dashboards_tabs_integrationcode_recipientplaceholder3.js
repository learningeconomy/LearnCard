/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Recipientplaceholder3Inputs */

const en_developerportal_dashboards_tabs_integrationcode_recipientplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Recipientplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profile ID or email address`)
};

const es_developerportal_dashboards_tabs_integrationcode_recipientplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Recipientplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de perfil o dirección de correo`)
};

const fr_developerportal_dashboards_tabs_integrationcode_recipientplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Recipientplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de profil ou adresse e-mail`)
};

const ar_developerportal_dashboards_tabs_integrationcode_recipientplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Recipientplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف الملف الشخصي أو البريد الإلكتروني`)
};

/**
* | output |
* | --- |
* | "Profile ID or email address" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Recipientplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_recipientplaceholder3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Recipientplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Recipientplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_recipientplaceholder3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_recipientplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_recipientplaceholder3(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_recipientplaceholder3(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_recipientplaceholder3 as "developerPortal.dashboards.tabs.integrationCode.recipientPlaceholder" }