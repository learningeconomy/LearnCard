/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Branding_Displayname2Inputs */

const en_developerportal_dashboards_tabs_branding_displayname2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Displayname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Display Name`)
};

const es_developerportal_dashboards_tabs_branding_displayname2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Displayname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre para Mostrar`)
};

const fr_developerportal_dashboards_tabs_branding_displayname2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Displayname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom Affiché`)
};

const ar_developerportal_dashboards_tabs_branding_displayname2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Displayname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاسم المعروض`)
};

/**
* | output |
* | --- |
* | "Display Name" |
*
* @param {Developerportal_Dashboards_Tabs_Branding_Displayname2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_branding_displayname2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Branding_Displayname2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Branding_Displayname2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_branding_displayname2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_branding_displayname2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_branding_displayname2(inputs)
	return ar_developerportal_dashboards_tabs_branding_displayname2(inputs)
});
export { developerportal_dashboards_tabs_branding_displayname2 as "developerPortal.dashboards.tabs.branding.displayName" }