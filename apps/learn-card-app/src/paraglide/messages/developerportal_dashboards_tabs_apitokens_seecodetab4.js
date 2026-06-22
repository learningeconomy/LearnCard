/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Apitokens_Seecodetab4Inputs */

const en_developerportal_dashboards_tabs_apitokens_seecodetab4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Seecodetab4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`See the Code tab for full integration examples.`)
};

const es_developerportal_dashboards_tabs_apitokens_seecodetab4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Seecodetab4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mira la pestaña Código para ejemplos completos de integración.`)
};

const fr_developerportal_dashboards_tabs_apitokens_seecodetab4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Seecodetab4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consultez l'onglet Code pour des exemples d'intégration complets.`)
};

const ar_developerportal_dashboards_tabs_apitokens_seecodetab4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Apitokens_Seecodetab4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`راجع علامة تبويب الكود للحصول على أمثلة تكامل كاملة.`)
};

/**
* | output |
* | --- |
* | "See the Code tab for full integration examples." |
*
* @param {Developerportal_Dashboards_Tabs_Apitokens_Seecodetab4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_apitokens_seecodetab4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Apitokens_Seecodetab4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Apitokens_Seecodetab4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_apitokens_seecodetab4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_apitokens_seecodetab4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_apitokens_seecodetab4(inputs)
	return ar_developerportal_dashboards_tabs_apitokens_seecodetab4(inputs)
});
export { developerportal_dashboards_tabs_apitokens_seecodetab4 as "developerPortal.dashboards.tabs.apiTokens.seeCodeTab" }