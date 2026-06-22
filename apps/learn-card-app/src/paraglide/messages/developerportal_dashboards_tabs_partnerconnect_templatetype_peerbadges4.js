/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Peerbadges4Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_templatetype_peerbadges4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Peerbadges4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Peer Badges`)
};

const es_developerportal_dashboards_tabs_partnerconnect_templatetype_peerbadges4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Peerbadges4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insignias entre Pares`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_templatetype_peerbadges4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Peerbadges4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badges entre Pairs`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_templatetype_peerbadges4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Peerbadges4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشارات بين الأقران`)
};

/**
* | output |
* | --- |
* | "Peer Badges" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Peerbadges4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_templatetype_peerbadges4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Peerbadges4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Templatetype_Peerbadges4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_templatetype_peerbadges4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_templatetype_peerbadges4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_templatetype_peerbadges4(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_templatetype_peerbadges4(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_templatetype_peerbadges4 as "developerPortal.dashboards.tabs.partnerConnect.templateType.peerBadges" }