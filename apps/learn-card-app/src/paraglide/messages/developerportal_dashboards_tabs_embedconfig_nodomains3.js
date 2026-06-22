/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedconfig_Nodomains3Inputs */

const en_developerportal_dashboards_tabs_embedconfig_nodomains3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Nodomains3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No domains whitelisted yet. The embed will not work until you add at least one domain.`)
};

const es_developerportal_dashboards_tabs_embedconfig_nodomains3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Nodomains3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay dominios autorizados. El embed no funcionará hasta que añadas al menos un dominio.`)
};

const fr_developerportal_dashboards_tabs_embedconfig_nodomains3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Nodomains3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun domaine autorisé pour le moment. L'embed ne fonctionnera pas tant que vous n'ajoutez pas au moins un domaine.`)
};

const ar_developerportal_dashboards_tabs_embedconfig_nodomains3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Nodomains3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد مجالات مسموح بها بعد. لن يعمل التضمين حتى تضيف مجالًا واحدًا على الأقل.`)
};

/**
* | output |
* | --- |
* | "No domains whitelisted yet. The embed will not work until you add at least one domain." |
*
* @param {Developerportal_Dashboards_Tabs_Embedconfig_Nodomains3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedconfig_nodomains3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedconfig_Nodomains3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedconfig_Nodomains3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedconfig_nodomains3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedconfig_nodomains3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedconfig_nodomains3(inputs)
	return ar_developerportal_dashboards_tabs_embedconfig_nodomains3(inputs)
});
export { developerportal_dashboards_tabs_embedconfig_nodomains3 as "developerPortal.dashboards.tabs.embedConfig.noDomains" }