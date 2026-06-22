/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedcode_Sdkpartnernamedesc5Inputs */

const en_developerportal_dashboards_tabs_embedcode_sdkpartnernamedesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Sdkpartnernamedesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Displayed in the claim modal header.`)
};

const es_developerportal_dashboards_tabs_embedcode_sdkpartnernamedesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Sdkpartnernamedesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se muestra en el encabezado del modal de reclamo.`)
};

const fr_developerportal_dashboards_tabs_embedcode_sdkpartnernamedesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Sdkpartnernamedesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Affiché dans l'en-tête du modal de réclamation.`)
};

const ar_developerportal_dashboards_tabs_embedcode_sdkpartnernamedesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedcode_Sdkpartnernamedesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معروض في رأس نافذة المطالبة.`)
};

/**
* | output |
* | --- |
* | "Displayed in the claim modal header." |
*
* @param {Developerportal_Dashboards_Tabs_Embedcode_Sdkpartnernamedesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedcode_sdkpartnernamedesc5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedcode_Sdkpartnernamedesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedcode_Sdkpartnernamedesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedcode_sdkpartnernamedesc5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedcode_sdkpartnernamedesc5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedcode_sdkpartnernamedesc5(inputs)
	return ar_developerportal_dashboards_tabs_embedcode_sdkpartnernamedesc5(inputs)
});
export { developerportal_dashboards_tabs_embedcode_sdkpartnernamedesc5 as "developerPortal.dashboards.tabs.embedCode.sdkPartnerNameDesc" }