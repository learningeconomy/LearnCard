/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Integrationcode_Notemplatestitle4Inputs */

const en_developerportal_dashboards_tabs_integrationcode_notemplatestitle4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Notemplatestitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No templates yet`)
};

const es_developerportal_dashboards_tabs_integrationcode_notemplatestitle4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Notemplatestitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay plantillas`)
};

const fr_developerportal_dashboards_tabs_integrationcode_notemplatestitle4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Notemplatestitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas encore de modèles`)
};

const ar_developerportal_dashboards_tabs_integrationcode_notemplatestitle4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Notemplatestitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد قوالب بعد`)
};

/**
* | output |
* | --- |
* | "No templates yet" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Notemplatestitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_notemplatestitle4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Integrationcode_Notemplatestitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Notemplatestitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_notemplatestitle4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_notemplatestitle4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_notemplatestitle4(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_notemplatestitle4(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_notemplatestitle4 as "developerPortal.dashboards.tabs.integrationCode.noTemplatesTitle" }