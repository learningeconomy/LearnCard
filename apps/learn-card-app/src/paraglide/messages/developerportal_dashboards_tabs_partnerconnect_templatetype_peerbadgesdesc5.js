/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Peerbadgesdesc5Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_templatetype_peerbadgesdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Peerbadgesdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Peer Badges: Templates users can send to each other via initiateTemplateIssue()`)
};

const es_developerportal_dashboards_tabs_partnerconnect_templatetype_peerbadgesdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Peerbadgesdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insignias entre Pares: Plantillas que los usuarios pueden enviarse entre sí mediante initiateTemplateIssue()`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_templatetype_peerbadgesdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Peerbadgesdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badges entre Pairs : Modèles que les utilisateurs peuvent s'envoyer via initiateTemplateIssue()`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_templatetype_peerbadgesdesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Peerbadgesdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشارات بين الأقران: قوالب يمكن للمستخدمين إرسالها لبعضهم البعض عبر initiateTemplateIssue()`)
};

/**
* | output |
* | --- |
* | "Peer Badges: Templates users can send to each other via initiateTemplateIssue()" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Peerbadgesdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_templatetype_peerbadgesdesc5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Peerbadgesdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Peerbadgesdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_templatetype_peerbadgesdesc5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_templatetype_peerbadgesdesc5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_templatetype_peerbadgesdesc5(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_templatetype_peerbadgesdesc5(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_templatetype_peerbadgesdesc5 as "developerPortal.dashboards.tabs.partnerConnect.templateType.peerBadgesDesc" }