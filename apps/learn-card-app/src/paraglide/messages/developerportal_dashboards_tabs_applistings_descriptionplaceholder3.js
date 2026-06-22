/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Applistings_Descriptionplaceholder3Inputs */

const en_developerportal_dashboards_tabs_applistings_descriptionplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Descriptionplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tell users what your app does...`)
};

const es_developerportal_dashboards_tabs_applistings_descriptionplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Descriptionplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuéntales a los usuarios qué hace tu app...`)
};

const fr_developerportal_dashboards_tabs_applistings_descriptionplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Descriptionplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dites aux utilisateurs ce que fait votre application...`)
};

const ar_developerportal_dashboards_tabs_applistings_descriptionplaceholder3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Applistings_Descriptionplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أخبر المستخدمين ما الذي يفعله تطبيقك...`)
};

/**
* | output |
* | --- |
* | "Tell users what your app does..." |
*
* @param {Developerportal_Dashboards_Tabs_Applistings_Descriptionplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_applistings_descriptionplaceholder3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Applistings_Descriptionplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Applistings_Descriptionplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_applistings_descriptionplaceholder3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_applistings_descriptionplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_applistings_descriptionplaceholder3(inputs)
	return ar_developerportal_dashboards_tabs_applistings_descriptionplaceholder3(inputs)
});
export { developerportal_dashboards_tabs_applistings_descriptionplaceholder3 as "developerPortal.dashboards.tabs.appListings.descriptionPlaceholder" }