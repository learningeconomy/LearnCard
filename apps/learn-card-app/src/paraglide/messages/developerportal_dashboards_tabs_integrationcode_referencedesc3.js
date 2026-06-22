/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Referencedesc3Inputs */

const en_developerportal_dashboards_tabs_integrationcode_referencedesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Referencedesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy individual URIs or export all as a config file for your codebase.`)
};

const es_developerportal_dashboards_tabs_integrationcode_referencedesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Referencedesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copia URI individuales o exporta todo como un archivo de configuración para tu código.`)
};

const fr_developerportal_dashboards_tabs_integrationcode_referencedesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Referencedesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiez des URI individuels ou exportez tout en fichier de configuration pour votre code.`)
};

const ar_developerportal_dashboards_tabs_integrationcode_referencedesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Referencedesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انسخ الروابط الفردية أو صدّر الكل كملف إعدادات لقاعدة الكود الخاصة بك.`)
};

/**
* | output |
* | --- |
* | "Copy individual URIs or export all as a config file for your codebase." |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Referencedesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_referencedesc3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Referencedesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Referencedesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_referencedesc3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_referencedesc3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_referencedesc3(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_referencedesc3(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_referencedesc3 as "developerPortal.dashboards.tabs.integrationCode.referenceDesc" }