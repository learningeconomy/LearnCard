/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Branding_Colors_Violet1Inputs */

const en_developerportal_dashboards_tabs_branding_colors_violet1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Colors_Violet1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Violet`)
};

const es_developerportal_dashboards_tabs_branding_colors_violet1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Colors_Violet1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Violet]`)
};

const fr_developerportal_dashboards_tabs_branding_colors_violet1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Colors_Violet1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Violet]`)
};

const ar_developerportal_dashboards_tabs_branding_colors_violet1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Colors_Violet1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Violet]`)
};

/**
* | output |
* | --- |
* | "Violet" |
*
* @param {Developerportal_Dashboards_Tabs_Branding_Colors_Violet1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_branding_colors_violet1 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Branding_Colors_Violet1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Branding_Colors_Violet1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_branding_colors_violet1(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_branding_colors_violet1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_branding_colors_violet1(inputs)
	return ar_developerportal_dashboards_tabs_branding_colors_violet1(inputs)
});
export { developerportal_dashboards_tabs_branding_colors_violet1 as "developerPortal.dashboards.tabs.branding.colors.violet" }