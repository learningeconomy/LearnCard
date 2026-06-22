/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Branding_Displaynameplaceholder3Inputs */

const en_developerportal_dashboards_tabs_branding_displaynameplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Displaynameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., AARP Skills Builder`)
};

const es_developerportal_dashboards_tabs_branding_displaynameplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Displaynameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., AARP Skills Builder`)
};

const fr_developerportal_dashboards_tabs_branding_displaynameplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Displaynameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., AARP Skills Builder`)
};

const ar_developerportal_dashboards_tabs_branding_displaynameplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Displaynameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: AARP Skills Builder`)
};

/**
* | output |
* | --- |
* | "e.g., AARP Skills Builder" |
*
* @param {Developerportal_Dashboards_Tabs_Branding_Displaynameplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_branding_displaynameplaceholder3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Branding_Displaynameplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Branding_Displaynameplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_branding_displaynameplaceholder3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_branding_displaynameplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_branding_displaynameplaceholder3(inputs)
	return ar_developerportal_dashboards_tabs_branding_displaynameplaceholder3(inputs)
});
export { developerportal_dashboards_tabs_branding_displaynameplaceholder3 as "developerPortal.dashboards.tabs.branding.displayNamePlaceholder" }