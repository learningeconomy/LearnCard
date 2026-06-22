/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Embedconfig_Requestbackgroundissuancedesc5Inputs */

const en_developerportal_dashboards_tabs_embedconfig_requestbackgroundissuancedesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Requestbackgroundissuancedesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ask the user for permission to issue future credentials without requiring email verification each time.`)
};

const es_developerportal_dashboards_tabs_embedconfig_requestbackgroundissuancedesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Requestbackgroundissuancedesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pregunta al usuario permiso para emitir credenciales futuras sin requerir verificación por correo cada vez.`)
};

const fr_developerportal_dashboards_tabs_embedconfig_requestbackgroundissuancedesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Requestbackgroundissuancedesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander à l'utilisateur l'autorisation d'émettre des credentials futurs sans nécessiter de vérification par email à chaque fois.`)
};

const ar_developerportal_dashboards_tabs_embedconfig_requestbackgroundissuancedesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Embedconfig_Requestbackgroundissuancedesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اطلب من المستخدم الإذن لإصدار بيانات اعتماد مستقبلية دون الحاجة إلى التحقق عبر البريد الإلكتروني في كل مرة.`)
};

/**
* | output |
* | --- |
* | "Ask the user for permission to issue future credentials without requiring email verification each time." |
*
* @param {Developerportal_Dashboards_Tabs_Embedconfig_Requestbackgroundissuancedesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_embedconfig_requestbackgroundissuancedesc5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Embedconfig_Requestbackgroundissuancedesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Embedconfig_Requestbackgroundissuancedesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_embedconfig_requestbackgroundissuancedesc5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_embedconfig_requestbackgroundissuancedesc5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_embedconfig_requestbackgroundissuancedesc5(inputs)
	return ar_developerportal_dashboards_tabs_embedconfig_requestbackgroundissuancedesc5(inputs)
});
export { developerportal_dashboards_tabs_embedconfig_requestbackgroundissuancedesc5 as "developerPortal.dashboards.tabs.embedConfig.requestBackgroundIssuanceDesc" }