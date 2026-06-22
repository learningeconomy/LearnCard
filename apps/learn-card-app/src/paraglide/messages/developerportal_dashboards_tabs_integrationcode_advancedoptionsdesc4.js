/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Advancedoptionsdesc4Inputs */

const en_developerportal_dashboards_tabs_integrationcode_advancedoptionsdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Advancedoptionsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Customize branding, webhooks, and delivery options.`)
};

const es_developerportal_dashboards_tabs_integrationcode_advancedoptionsdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Advancedoptionsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personaliza la marca, los webhooks y las opciones de entrega.`)
};

const fr_developerportal_dashboards_tabs_integrationcode_advancedoptionsdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Advancedoptionsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personnalisez la marque, les webhooks et les options de livraison.`)
};

const ar_developerportal_dashboards_tabs_integrationcode_advancedoptionsdesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Advancedoptionsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخصيص العلامة التجارية والويبهوكس وخيارات التسليم.`)
};

/**
* | output |
* | --- |
* | "Customize branding, webhooks, and delivery options." |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Advancedoptionsdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_advancedoptionsdesc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Advancedoptionsdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Advancedoptionsdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_advancedoptionsdesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_advancedoptionsdesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_advancedoptionsdesc4(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_advancedoptionsdesc4(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_advancedoptionsdesc4 as "developerPortal.dashboards.tabs.integrationCode.advancedOptionsDesc" }