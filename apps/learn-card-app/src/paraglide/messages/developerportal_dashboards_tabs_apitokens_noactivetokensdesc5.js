/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Noactivetokensdesc5Inputs */

const en_developerportal_dashboards_tabs_apitokens_noactivetokensdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Noactivetokensdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create a token to start issuing credentials via API`)
};

const es_developerportal_dashboards_tabs_apitokens_noactivetokensdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Noactivetokensdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea un token para empezar a emitir credenciales vía API`)
};

const fr_developerportal_dashboards_tabs_apitokens_noactivetokensdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Noactivetokensdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez un jeton pour commencer à émettre des credentials via l'API`)
};

const ar_developerportal_dashboards_tabs_apitokens_noactivetokensdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Noactivetokensdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ رمزًا للبدء في إصدار بيانات الاعتماد عبر API`)
};

/**
* | output |
* | --- |
* | "Create a token to start issuing credentials via API" |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Noactivetokensdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_noactivetokensdesc5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Noactivetokensdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Noactivetokensdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_noactivetokensdesc5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_noactivetokensdesc5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_noactivetokensdesc5(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_noactivetokensdesc5(inputs)
});
export { developerportal_dashboards_tabs_apitokens_noactivetokensdesc5 as "developerPortal.dashboards.tabs.apiTokens.noActiveTokensDesc" }