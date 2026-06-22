/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Issuecredentialsdesc5Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_templatetype_issuecredentialsdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Issuecredentialsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue Credentials: Templates for credentials your app issues to users via sendCredential()`)
};

const es_developerportal_dashboards_tabs_partnerconnect_templatetype_issuecredentialsdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Issuecredentialsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emisión de Credenciales: Plantillas para credenciales que tu app emite a usuarios mediante sendCredential()`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_templatetype_issuecredentialsdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Issuecredentialsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émission de Justificatifs : Modèles pour les justificatifs que votre app émet aux utilisateurs via sendCredential()`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_templatetype_issuecredentialsdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Issuecredentialsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار المؤهلات: قوالب للمؤهلات التي يصدرها تطبيقك للمستخدمين عبر sendCredential()`)
};

/**
* | output |
* | --- |
* | "Issue Credentials: Templates for credentials your app issues to users via sendCredential()" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Issuecredentialsdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_templatetype_issuecredentialsdesc5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Issuecredentialsdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Issuecredentialsdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_templatetype_issuecredentialsdesc5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_templatetype_issuecredentialsdesc5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_templatetype_issuecredentialsdesc5(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_templatetype_issuecredentialsdesc5(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_templatetype_issuecredentialsdesc5 as "developerPortal.dashboards.tabs.partnerConnect.templateType.issueCredentialsDesc" }