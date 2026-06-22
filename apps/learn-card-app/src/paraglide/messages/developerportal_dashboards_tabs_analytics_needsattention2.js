/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Analytics_Needsattention2Inputs */

const en_developerportal_dashboards_tabs_analytics_needsattention2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Needsattention2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Needs Attention`)
};

const es_developerportal_dashboards_tabs_analytics_needsattention2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Needsattention2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Necesita Atención`)
};

const fr_developerportal_dashboards_tabs_analytics_needsattention2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Needsattention2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nécessite de l'Attention`)
};

const ar_developerportal_dashboards_tabs_analytics_needsattention2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Needsattention2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بحاجة إلى انتباه`)
};

/**
* | output |
* | --- |
* | "Needs Attention" |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Needsattention2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_needsattention2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Analytics_Needsattention2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Needsattention2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_needsattention2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_needsattention2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_needsattention2(inputs)
	return ar_developerportal_dashboards_tabs_analytics_needsattention2(inputs)
});
export { developerportal_dashboards_tabs_analytics_needsattention2 as "developerPortal.dashboards.tabs.analytics.needsAttention" }