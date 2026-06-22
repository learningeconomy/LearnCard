/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Tipownemail3Inputs */

const en_developerportal_dashboards_tabs_testing_tipownemail3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Tipownemail3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use your own email or user ID to quickly verify the full flow`)
};

const es_developerportal_dashboards_tabs_testing_tipownemail3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Tipownemail3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usa tu propio correo o ID de usuario para verificar rápidamente el flujo completo`)
};

const fr_developerportal_dashboards_tabs_testing_tipownemail3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Tipownemail3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisez votre propre email ou ID utilisateur pour vérifier rapidement le flux complet`)
};

const ar_developerportal_dashboards_tabs_testing_tipownemail3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Tipownemail3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدم بريدك الإلكتروني أو معرف المستخدم الخاص بك للتحقق بسرعة من التدفق الكامل`)
};

/**
* | output |
* | --- |
* | "Use your own email or user ID to quickly verify the full flow" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Tipownemail3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_tipownemail3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Tipownemail3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Tipownemail3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_tipownemail3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_tipownemail3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_tipownemail3(inputs)
	return ar_developerportal_dashboards_tabs_testing_tipownemail3(inputs)
});
export { developerportal_dashboards_tabs_testing_tipownemail3 as "developerPortal.dashboards.tabs.testing.tipOwnEmail" }