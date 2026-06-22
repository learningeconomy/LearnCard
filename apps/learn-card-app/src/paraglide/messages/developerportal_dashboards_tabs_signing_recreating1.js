/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Signing_Recreating1Inputs */

const en_developerportal_dashboards_tabs_signing_recreating1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Recreating1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recreating...`)
};

const es_developerportal_dashboards_tabs_signing_recreating1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Recreating1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recreando...`)
};

const fr_developerportal_dashboards_tabs_signing_recreating1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Recreating1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recréation...`)
};

const ar_developerportal_dashboards_tabs_signing_recreating1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Recreating1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ إعادة الإنشاء...`)
};

/**
* | output |
* | --- |
* | "Recreating..." |
*
* @param {Developerportal_Dashboards_Tabs_Signing_Recreating1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_signing_recreating1 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Signing_Recreating1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Signing_Recreating1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_signing_recreating1(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_signing_recreating1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_signing_recreating1(inputs)
	return ar_developerportal_dashboards_tabs_signing_recreating1(inputs)
});
export { developerportal_dashboards_tabs_signing_recreating1 as "developerPortal.dashboards.tabs.signing.recreating" }