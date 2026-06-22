/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Branding_Profileimagedesc3Inputs */

const en_developerportal_dashboards_tabs_branding_profileimagedesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Profileimagedesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your organization's logo`)
};

const es_developerportal_dashboards_tabs_branding_profileimagedesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Profileimagedesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El logotipo de tu organización`)
};

const fr_developerportal_dashboards_tabs_branding_profileimagedesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Profileimagedesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le logo de votre organisation`)
};

const ar_developerportal_dashboards_tabs_branding_profileimagedesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Profileimagedesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شعار مؤسستك`)
};

/**
* | output |
* | --- |
* | "Your organization's logo" |
*
* @param {Developerportal_Dashboards_Tabs_Branding_Profileimagedesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_branding_profileimagedesc3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Branding_Profileimagedesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Branding_Profileimagedesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_branding_profileimagedesc3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_branding_profileimagedesc3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_branding_profileimagedesc3(inputs)
	return ar_developerportal_dashboards_tabs_branding_profileimagedesc3(inputs)
});
export { developerportal_dashboards_tabs_branding_profileimagedesc3 as "developerPortal.dashboards.tabs.branding.profileImageDesc" }