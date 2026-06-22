/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedconfig_Partnernameoptional4Inputs */

const en_developerportal_dashboards_tabs_embedconfig_partnernameoptional4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Partnernameoptional4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(Optional)`)
};

const es_developerportal_dashboards_tabs_embedconfig_partnernameoptional4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Partnernameoptional4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(Opcional)`)
};

const fr_developerportal_dashboards_tabs_embedconfig_partnernameoptional4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Partnernameoptional4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(Optionnel)`)
};

const ar_developerportal_dashboards_tabs_embedconfig_partnernameoptional4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Partnernameoptional4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(اختياري)`)
};

/**
* | output |
* | --- |
* | "(Optional)" |
*
* @param {Developerportal_Dashboards_Tabs_Embedconfig_Partnernameoptional4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedconfig_partnernameoptional4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedconfig_Partnernameoptional4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedconfig_Partnernameoptional4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedconfig_partnernameoptional4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedconfig_partnernameoptional4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedconfig_partnernameoptional4(inputs)
	return ar_developerportal_dashboards_tabs_embedconfig_partnernameoptional4(inputs)
});
export { developerportal_dashboards_tabs_embedconfig_partnernameoptional4 as "developerPortal.dashboards.tabs.embedConfig.partnerNameOptional" }