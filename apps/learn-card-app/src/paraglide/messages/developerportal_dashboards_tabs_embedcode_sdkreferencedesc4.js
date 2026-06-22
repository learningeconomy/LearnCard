/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedcode_Sdkreferencedesc4Inputs */

const en_developerportal_dashboards_tabs_embedcode_sdkreferencedesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Sdkreferencedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reference for all available initialization options`)
};

const es_developerportal_dashboards_tabs_embedcode_sdkreferencedesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Sdkreferencedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Referencia para todas las opciones de inicialización disponibles`)
};

const fr_developerportal_dashboards_tabs_embedcode_sdkreferencedesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Sdkreferencedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Référence pour toutes les options d'initialisation disponibles`)
};

const ar_developerportal_dashboards_tabs_embedcode_sdkreferencedesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Sdkreferencedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مرجع لجميع خيارات التهيئة المتاحة`)
};

/**
* | output |
* | --- |
* | "Reference for all available initialization options" |
*
* @param {Developerportal_Dashboards_Tabs_Embedcode_Sdkreferencedesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedcode_sdkreferencedesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedcode_Sdkreferencedesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedcode_Sdkreferencedesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedcode_sdkreferencedesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedcode_sdkreferencedesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedcode_sdkreferencedesc4(inputs)
	return ar_developerportal_dashboards_tabs_embedcode_sdkreferencedesc4(inputs)
});
export { developerportal_dashboards_tabs_embedcode_sdkreferencedesc4 as "developerPortal.dashboards.tabs.embedCode.sdkReferenceDesc" }