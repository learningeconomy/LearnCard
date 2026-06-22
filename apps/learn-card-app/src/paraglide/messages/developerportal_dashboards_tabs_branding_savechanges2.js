/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Branding_Savechanges2Inputs */

const en_developerportal_dashboards_tabs_branding_savechanges2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Savechanges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save Changes`)
};

const es_developerportal_dashboards_tabs_branding_savechanges2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Savechanges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar Cambios`)
};

const fr_developerportal_dashboards_tabs_branding_savechanges2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Savechanges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer les Modifications`)
};

const ar_developerportal_dashboards_tabs_branding_savechanges2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Savechanges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ التغييرات`)
};

/**
* | output |
* | --- |
* | "Save Changes" |
*
* @param {Developerportal_Dashboards_Tabs_Branding_Savechanges2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_branding_savechanges2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Branding_Savechanges2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Branding_Savechanges2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_branding_savechanges2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_branding_savechanges2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_branding_savechanges2(inputs)
	return ar_developerportal_dashboards_tabs_branding_savechanges2(inputs)
});
export { developerportal_dashboards_tabs_branding_savechanges2 as "developerPortal.dashboards.tabs.branding.saveChanges" }