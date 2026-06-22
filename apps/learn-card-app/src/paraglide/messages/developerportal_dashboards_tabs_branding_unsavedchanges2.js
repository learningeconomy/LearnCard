/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Branding_Unsavedchanges2Inputs */

const en_developerportal_dashboards_tabs_branding_unsavedchanges2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Unsavedchanges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(unsaved changes)`)
};

const es_developerportal_dashboards_tabs_branding_unsavedchanges2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Unsavedchanges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(cambios sin guardar)`)
};

const fr_developerportal_dashboards_tabs_branding_unsavedchanges2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Unsavedchanges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(modifications non enregistrées)`)
};

const ar_developerportal_dashboards_tabs_branding_unsavedchanges2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Unsavedchanges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(تغييرات غير محفوظة)`)
};

/**
* | output |
* | --- |
* | "(unsaved changes)" |
*
* @param {Developerportal_Dashboards_Tabs_Branding_Unsavedchanges2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_branding_unsavedchanges2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Branding_Unsavedchanges2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Branding_Unsavedchanges2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_branding_unsavedchanges2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_branding_unsavedchanges2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_branding_unsavedchanges2(inputs)
	return ar_developerportal_dashboards_tabs_branding_unsavedchanges2(inputs)
});
export { developerportal_dashboards_tabs_branding_unsavedchanges2 as "developerPortal.dashboards.tabs.branding.unsavedChanges" }