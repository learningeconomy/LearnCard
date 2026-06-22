/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Features_Peerbadges3Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_features_peerbadges3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Features_Peerbadges3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Peer-to-Peer Badges`)
};

const es_developerportal_dashboards_tabs_partnerconnect_features_peerbadges3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Features_Peerbadges3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insignias entre Pares`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_features_peerbadges3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Features_Peerbadges3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badges entre Pairs`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_features_peerbadges3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Features_Peerbadges3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشارات بين الأقران`)
};

/**
* | output |
* | --- |
* | "Peer-to-Peer Badges" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Features_Peerbadges3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_features_peerbadges3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Features_Peerbadges3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Features_Peerbadges3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_features_peerbadges3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_features_peerbadges3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_features_peerbadges3(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_features_peerbadges3(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_features_peerbadges3 as "developerPortal.dashboards.tabs.partnerConnect.features.peerBadges" }