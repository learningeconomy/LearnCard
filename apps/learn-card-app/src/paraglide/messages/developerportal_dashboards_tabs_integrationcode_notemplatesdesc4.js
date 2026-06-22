/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Notemplatesdesc4Inputs */

const en_developerportal_dashboards_tabs_integrationcode_notemplatesdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Notemplatesdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create templates first to get integration code`)
};

const es_developerportal_dashboards_tabs_integrationcode_notemplatesdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Notemplatesdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea plantillas primero para obtener el código de integración`)
};

const fr_developerportal_dashboards_tabs_integrationcode_notemplatesdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Notemplatesdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez d'abord des modèles pour obtenir le code d'intégration`)
};

const ar_developerportal_dashboards_tabs_integrationcode_notemplatesdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Notemplatesdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ قوالب أولاً للحصول على كود التكامل`)
};

/**
* | output |
* | --- |
* | "Create templates first to get integration code" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Notemplatesdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_notemplatesdesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Notemplatesdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Notemplatesdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_notemplatesdesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_notemplatesdesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_notemplatesdesc4(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_notemplatesdesc4(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_notemplatesdesc4 as "developerPortal.dashboards.tabs.integrationCode.noTemplatesDesc" }