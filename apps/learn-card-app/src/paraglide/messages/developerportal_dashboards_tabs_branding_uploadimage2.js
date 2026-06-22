/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Branding_Uploadimage2Inputs */

const en_developerportal_dashboards_tabs_branding_uploadimage2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Uploadimage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload image`)
};

const es_developerportal_dashboards_tabs_branding_uploadimage2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Uploadimage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subir imagen`)
};

const fr_developerportal_dashboards_tabs_branding_uploadimage2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Uploadimage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger l'image`)
};

const ar_developerportal_dashboards_tabs_branding_uploadimage2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Uploadimage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحميل الصورة`)
};

/**
* | output |
* | --- |
* | "Upload image" |
*
* @param {Developerportal_Dashboards_Tabs_Branding_Uploadimage2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_branding_uploadimage2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Branding_Uploadimage2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Branding_Uploadimage2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_branding_uploadimage2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_branding_uploadimage2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_branding_uploadimage2(inputs)
	return ar_developerportal_dashboards_tabs_branding_uploadimage2(inputs)
});
export { developerportal_dashboards_tabs_branding_uploadimage2 as "developerPortal.dashboards.tabs.branding.uploadImage" }