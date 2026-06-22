/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Features_Launchfeature3Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_features_launchfeature3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Features_Launchfeature3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launch Features`)
};

const es_developerportal_dashboards_tabs_partnerconnect_features_launchfeature3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Features_Launchfeature3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lanzar Funcionalidades`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_features_launchfeature3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Features_Launchfeature3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lancer des Fonctionnalités`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_features_launchfeature3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Features_Launchfeature3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تشغيل الميزات`)
};

/**
* | output |
* | --- |
* | "Launch Features" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Features_Launchfeature3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_features_launchfeature3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Features_Launchfeature3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Features_Launchfeature3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_features_launchfeature3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_features_launchfeature3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_features_launchfeature3(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_features_launchfeature3(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_features_launchfeature3 as "developerPortal.dashboards.tabs.partnerConnect.features.launchFeature" }