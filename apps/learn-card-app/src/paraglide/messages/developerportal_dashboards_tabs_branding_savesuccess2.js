/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Branding_Savesuccess2Inputs */

const en_developerportal_dashboards_tabs_branding_savesuccess2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Savesuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Branding updated successfully!`)
};

const es_developerportal_dashboards_tabs_branding_savesuccess2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Savesuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Marca actualizada con éxito!`)
};

const fr_developerportal_dashboards_tabs_branding_savesuccess2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Savesuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Image de marque mise à jour avec succès !`)
};

const ar_developerportal_dashboards_tabs_branding_savesuccess2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Savesuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تحديث العلامة التجارية بنجاح!`)
};

/**
* | output |
* | --- |
* | "Branding updated successfully!" |
*
* @param {Developerportal_Dashboards_Tabs_Branding_Savesuccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_branding_savesuccess2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Branding_Savesuccess2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Branding_Savesuccess2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_branding_savesuccess2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_branding_savesuccess2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_branding_savesuccess2(inputs)
	return ar_developerportal_dashboards_tabs_branding_savesuccess2(inputs)
});
export { developerportal_dashboards_tabs_branding_savesuccess2 as "developerPortal.dashboards.tabs.branding.saveSuccess" }