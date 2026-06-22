/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Recipientdesc3Inputs */

const en_developerportal_dashboards_tabs_integrationcode_recipientdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Recipientdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enter a LearnCard Profile ID or an email address`)
};

const es_developerportal_dashboards_tabs_integrationcode_recipientdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Recipientdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ingresa un ID de Perfil de LearnCard o una dirección de correo electrónico`)
};

const fr_developerportal_dashboards_tabs_integrationcode_recipientdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Recipientdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saisissez un ID de Profil LearnCard ou une adresse e-mail`)
};

const ar_developerportal_dashboards_tabs_integrationcode_recipientdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Recipientdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدخل معرف ملف شخصي لـ LearnCard أو عنوان بريد إلكتروني`)
};

/**
* | output |
* | --- |
* | "Enter a LearnCard Profile ID or an email address" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Recipientdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_recipientdesc3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Recipientdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Recipientdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_recipientdesc3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_recipientdesc3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_recipientdesc3(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_recipientdesc3(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_recipientdesc3 as "developerPortal.dashboards.tabs.integrationCode.recipientDesc" }