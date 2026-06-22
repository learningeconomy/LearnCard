/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Integrationcode_Copyallconfig4Inputs */

const en_developerportal_dashboards_tabs_integrationcode_copyallconfig4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Copyallconfig4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Copy All as Config (${i?.count} templates)`)
};

const es_developerportal_dashboards_tabs_integrationcode_copyallconfig4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Copyallconfig4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Copiar Todo como Configuración (${i?.count} plantillas)`)
};

const fr_developerportal_dashboards_tabs_integrationcode_copyallconfig4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Copyallconfig4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Tout Copier en Config (${i?.count} modèles)`)
};

const ar_developerportal_dashboards_tabs_integrationcode_copyallconfig4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Integrationcode_Copyallconfig4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`نسخ الكل كإعدادات (${i?.count} قالب)`)
};

/**
* | output |
* | --- |
* | "Copy All as Config ({count} templates)" |
*
* @param {Developerportal_Dashboards_Tabs_Integrationcode_Copyallconfig4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_integrationcode_copyallconfig4 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Integrationcode_Copyallconfig4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Integrationcode_Copyallconfig4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_integrationcode_copyallconfig4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_integrationcode_copyallconfig4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_integrationcode_copyallconfig4(inputs)
	return ar_developerportal_dashboards_tabs_integrationcode_copyallconfig4(inputs)
});
export { developerportal_dashboards_tabs_integrationcode_copyallconfig4 as "developerPortal.dashboards.tabs.integrationCode.copyAllConfig" }