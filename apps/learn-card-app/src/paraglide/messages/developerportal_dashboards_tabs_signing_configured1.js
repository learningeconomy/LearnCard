/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Signing_Configured1Inputs */

const en_developerportal_dashboards_tabs_signing_configured1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Configured1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Signing authority configured`)
};

const es_developerportal_dashboards_tabs_signing_configured1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Configured1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autoridad de firma configurada`)
};

const fr_developerportal_dashboards_tabs_signing_configured1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Configured1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autorité de signature configurée`)
};

const ar_developerportal_dashboards_tabs_signing_configured1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Configured1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تكوين سلطة التوقيع`)
};

/**
* | output |
* | --- |
* | "Signing authority configured" |
*
* @param {Developerportal_Dashboards_Tabs_Signing_Configured1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_signing_configured1 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Signing_Configured1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Signing_Configured1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_signing_configured1(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_signing_configured1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_signing_configured1(inputs)
	return ar_developerportal_dashboards_tabs_signing_configured1(inputs)
});
export { developerportal_dashboards_tabs_signing_configured1 as "developerPortal.dashboards.tabs.signing.configured" }