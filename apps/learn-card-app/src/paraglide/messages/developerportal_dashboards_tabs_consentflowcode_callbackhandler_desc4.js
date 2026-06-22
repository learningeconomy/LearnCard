/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Desc4Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_callbackhandler_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Handle the redirect back from LearnCard after consent`)
};

const es_developerportal_dashboards_tabs_consentflowcode_callbackhandler_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Maneja la redirección de vuelta desde LearnCard después del consentimiento`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_callbackhandler_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérez la redirection de retour depuis LearnCard après le consentement`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_callbackhandler_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معالجة إعادة التوجيه من LearnCard بعد الموافقة`)
};

/**
* | output |
* | --- |
* | "Handle the redirect back from LearnCard after consent" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Desc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_callbackhandler_desc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Desc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Callbackhandler_Desc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_callbackhandler_desc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_callbackhandler_desc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_callbackhandler_desc4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_callbackhandler_desc4(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_callbackhandler_desc4 as "developerPortal.dashboards.tabs.consentFlowCode.callbackHandler.desc" }