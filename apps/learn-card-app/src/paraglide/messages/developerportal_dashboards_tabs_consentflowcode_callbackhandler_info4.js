/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Info4Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_callbackhandler_info4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Info4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`After consent, LearnCard redirects to your returnTo URL with did and vp query parameters.`)
};

const es_developerportal_dashboards_tabs_consentflowcode_callbackhandler_info4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Info4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Después del consentimiento, LearnCard redirige a tu URL returnTo con los parámetros de consulta did y vp.`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_callbackhandler_info4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Info4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Après consentement, LearnCard redirige vers votre URL returnTo avec les paramètres de requête did et vp.`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_callbackhandler_info4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Info4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بعد الموافقة، يعيد LearnCard التوجيه إلى رابط returnTo الخاص بك مع معلمات الاستعلام did و vp.`)
};

/**
* | output |
* | --- |
* | "After consent, LearnCard redirects to your returnTo URL with did and vp query parameters." |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Info4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_callbackhandler_info4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Info4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Info4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_callbackhandler_info4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_callbackhandler_info4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_callbackhandler_info4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_callbackhandler_info4(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_callbackhandler_info4 as "developerPortal.dashboards.tabs.consentFlowCode.callbackHandler.info" }