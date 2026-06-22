/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedconfig_Modalbranding3Inputs */

const en_developerportal_dashboards_tabs_embedconfig_modalbranding3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Modalbranding3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modal Branding`)
};

const es_developerportal_dashboards_tabs_embedconfig_modalbranding3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Modalbranding3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marca del Modal`)
};

const fr_developerportal_dashboards_tabs_embedconfig_modalbranding3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Modalbranding3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marque de la Fenêtre Modale`)
};

const ar_developerportal_dashboards_tabs_embedconfig_modalbranding3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Modalbranding3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العلامة التجارية للنافذة المنبثقة`)
};

/**
* | output |
* | --- |
* | "Modal Branding" |
*
* @param {Developerportal_Dashboards_Tabs_Embedconfig_Modalbranding3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedconfig_modalbranding3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedconfig_Modalbranding3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedconfig_Modalbranding3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedconfig_modalbranding3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedconfig_modalbranding3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedconfig_modalbranding3(inputs)
	return ar_developerportal_dashboards_tabs_embedconfig_modalbranding3(inputs)
});
export { developerportal_dashboards_tabs_embedconfig_modalbranding3 as "developerPortal.dashboards.tabs.embedConfig.modalBranding" }