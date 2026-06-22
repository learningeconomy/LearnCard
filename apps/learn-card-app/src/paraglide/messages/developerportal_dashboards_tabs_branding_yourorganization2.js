/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Branding_Yourorganization2Inputs */

const en_developerportal_dashboards_tabs_branding_yourorganization2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Yourorganization2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your Organization`)
};

const es_developerportal_dashboards_tabs_branding_yourorganization2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Yourorganization2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu Organización`)
};

const fr_developerportal_dashboards_tabs_branding_yourorganization2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Yourorganization2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre Organisation`)
};

const ar_developerportal_dashboards_tabs_branding_yourorganization2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Yourorganization2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مؤسستك`)
};

/**
* | output |
* | --- |
* | "Your Organization" |
*
* @param {Developerportal_Dashboards_Tabs_Branding_Yourorganization2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_branding_yourorganization2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Branding_Yourorganization2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Branding_Yourorganization2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_branding_yourorganization2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_branding_yourorganization2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_branding_yourorganization2(inputs)
	return ar_developerportal_dashboards_tabs_branding_yourorganization2(inputs)
});
export { developerportal_dashboards_tabs_branding_yourorganization2 as "developerPortal.dashboards.tabs.branding.yourOrganization" }