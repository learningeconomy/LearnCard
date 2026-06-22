/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Branding_Profile1Inputs */

const en_developerportal_dashboards_tabs_branding_profile1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Profile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profile`)
};

const es_developerportal_dashboards_tabs_branding_profile1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Profile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Perfil`)
};

const fr_developerportal_dashboards_tabs_branding_profile1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Profile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profil`)
};

const ar_developerportal_dashboards_tabs_branding_profile1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Profile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الملف الشخصي`)
};

/**
* | output |
* | --- |
* | "Profile" |
*
* @param {Developerportal_Dashboards_Tabs_Branding_Profile1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_branding_profile1 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Branding_Profile1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Branding_Profile1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_branding_profile1(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_branding_profile1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_branding_profile1(inputs)
	return ar_developerportal_dashboards_tabs_branding_profile1(inputs)
});
export { developerportal_dashboards_tabs_branding_profile1 as "developerPortal.dashboards.tabs.branding.profile" }