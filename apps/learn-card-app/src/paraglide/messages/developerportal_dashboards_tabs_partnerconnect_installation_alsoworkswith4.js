/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Alsoworkswith4Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_installation_alsoworkswith4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Alsoworkswith4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Also works with yarn add or pnpm add`)
};

const es_developerportal_dashboards_tabs_partnerconnect_installation_alsoworkswith4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Alsoworkswith4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`También funciona con yarn add o pnpm add`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_installation_alsoworkswith4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Alsoworkswith4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fonctionne aussi avec yarn add ou pnpm add`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_installation_alsoworkswith4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Alsoworkswith4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يعمل أيضًا مع yarn add أو pnpm add`)
};

/**
* | output |
* | --- |
* | "Also works with yarn add or pnpm add" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Alsoworkswith4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_installation_alsoworkswith4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Alsoworkswith4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Alsoworkswith4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_installation_alsoworkswith4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_installation_alsoworkswith4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_installation_alsoworkswith4(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_installation_alsoworkswith4(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_installation_alsoworkswith4 as "developerPortal.dashboards.tabs.partnerConnect.installation.alsoWorksWith" }