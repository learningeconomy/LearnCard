/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Branding_Colors_Amber1Inputs */

const en_developerportal_dashboards_tabs_branding_colors_amber1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Colors_Amber1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Amber`)
};

const es_developerportal_dashboards_tabs_branding_colors_amber1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Colors_Amber1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Amber]`)
};

const fr_developerportal_dashboards_tabs_branding_colors_amber1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Colors_Amber1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Amber]`)
};

const ar_developerportal_dashboards_tabs_branding_colors_amber1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Colors_Amber1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Amber]`)
};

/**
* | output |
* | --- |
* | "Amber" |
*
* @param {Developerportal_Dashboards_Tabs_Branding_Colors_Amber1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_branding_colors_amber1 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Branding_Colors_Amber1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Branding_Colors_Amber1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_branding_colors_amber1(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_branding_colors_amber1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_branding_colors_amber1(inputs)
	return ar_developerportal_dashboards_tabs_branding_colors_amber1(inputs)
});
export { developerportal_dashboards_tabs_branding_colors_amber1 as "developerPortal.dashboards.tabs.branding.colors.amber" }