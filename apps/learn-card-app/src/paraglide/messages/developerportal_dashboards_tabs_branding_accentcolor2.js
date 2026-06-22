/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Branding_Accentcolor2Inputs */

const en_developerportal_dashboards_tabs_branding_accentcolor2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Accentcolor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accent Color`)
};

const es_developerportal_dashboards_tabs_branding_accentcolor2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Accentcolor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Color de Acento`)
};

const fr_developerportal_dashboards_tabs_branding_accentcolor2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Accentcolor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Couleur d'Accent`)
};

const ar_developerportal_dashboards_tabs_branding_accentcolor2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Accentcolor2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لون التمييز`)
};

/**
* | output |
* | --- |
* | "Accent Color" |
*
* @param {Developerportal_Dashboards_Tabs_Branding_Accentcolor2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_branding_accentcolor2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Branding_Accentcolor2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Branding_Accentcolor2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_branding_accentcolor2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_branding_accentcolor2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_branding_accentcolor2(inputs)
	return ar_developerportal_dashboards_tabs_branding_accentcolor2(inputs)
});
export { developerportal_dashboards_tabs_branding_accentcolor2 as "developerPortal.dashboards.tabs.branding.accentColor" }