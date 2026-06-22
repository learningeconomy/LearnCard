/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Branding_Saveerror2Inputs */

const en_developerportal_dashboards_tabs_branding_saveerror2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Saveerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to update branding`)
};

const es_developerportal_dashboards_tabs_branding_saveerror2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Saveerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al actualizar la marca`)
};

const fr_developerportal_dashboards_tabs_branding_saveerror2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Saveerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la mise à jour de l'image de marque`)
};

const ar_developerportal_dashboards_tabs_branding_saveerror2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Saveerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل تحديث العلامة التجارية`)
};

/**
* | output |
* | --- |
* | "Failed to update branding" |
*
* @param {Developerportal_Dashboards_Tabs_Branding_Saveerror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_branding_saveerror2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Branding_Saveerror2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Branding_Saveerror2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_branding_saveerror2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_branding_saveerror2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_branding_saveerror2(inputs)
	return ar_developerportal_dashboards_tabs_branding_saveerror2(inputs)
});
export { developerportal_dashboards_tabs_branding_saveerror2 as "developerPortal.dashboards.tabs.branding.saveError" }