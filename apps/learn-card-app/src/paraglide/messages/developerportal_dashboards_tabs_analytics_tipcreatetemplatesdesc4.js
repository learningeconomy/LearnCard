/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Analytics_Tipcreatetemplatesdesc4Inputs */

const en_developerportal_dashboards_tabs_analytics_tipcreatetemplatesdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipcreatetemplatesdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add credential templates to start issuing.`)
};

const es_developerportal_dashboards_tabs_analytics_tipcreatetemplatesdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipcreatetemplatesdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añade plantillas de credenciales para empezar a emitir.`)
};

const fr_developerportal_dashboards_tabs_analytics_tipcreatetemplatesdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipcreatetemplatesdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez des modèles de credentials pour commencer à émettre.`)
};

const ar_developerportal_dashboards_tabs_analytics_tipcreatetemplatesdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipcreatetemplatesdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف قوالب بيانات اعتماد للبدء في الإصدار.`)
};

/**
* | output |
* | --- |
* | "Add credential templates to start issuing." |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Tipcreatetemplatesdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_tipcreatetemplatesdesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Analytics_Tipcreatetemplatesdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Tipcreatetemplatesdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_tipcreatetemplatesdesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_tipcreatetemplatesdesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_tipcreatetemplatesdesc4(inputs)
	return ar_developerportal_dashboards_tabs_analytics_tipcreatetemplatesdesc4(inputs)
});
export { developerportal_dashboards_tabs_analytics_tipcreatetemplatesdesc4 as "developerPortal.dashboards.tabs.analytics.tipCreateTemplatesDesc" }