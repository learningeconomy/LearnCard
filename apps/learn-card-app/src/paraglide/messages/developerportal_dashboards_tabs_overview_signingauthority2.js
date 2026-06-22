/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Overview_Signingauthority2Inputs */

const en_developerportal_dashboards_tabs_overview_signingauthority2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Signingauthority2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Signing Authority`)
};

const es_developerportal_dashboards_tabs_overview_signingauthority2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Signingauthority2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autoridad de Firma`)
};

const fr_developerportal_dashboards_tabs_overview_signingauthority2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Signingauthority2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autorité de Signature`)
};

const ar_developerportal_dashboards_tabs_overview_signingauthority2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Signingauthority2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سلطة التوقيع`)
};

/**
* | output |
* | --- |
* | "Signing Authority" |
*
* @param {Developerportal_Dashboards_Tabs_Overview_Signingauthority2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_overview_signingauthority2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Overview_Signingauthority2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Overview_Signingauthority2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_overview_signingauthority2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_overview_signingauthority2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_overview_signingauthority2(inputs)
	return ar_developerportal_dashboards_tabs_overview_signingauthority2(inputs)
});
export { developerportal_dashboards_tabs_overview_signingauthority2 as "developerPortal.dashboards.tabs.overview.signingAuthority" }