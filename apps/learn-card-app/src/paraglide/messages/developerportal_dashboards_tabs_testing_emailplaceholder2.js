/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Emailplaceholder2Inputs */

const en_developerportal_dashboards_tabs_testing_emailplaceholder2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Emailplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`your-email@example.com`)
};

const es_developerportal_dashboards_tabs_testing_emailplaceholder2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Emailplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`tu-correo@ejemplo.com`)
};

const fr_developerportal_dashboards_tabs_testing_emailplaceholder2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Emailplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`votre-email@exemple.com`)
};

const ar_developerportal_dashboards_tabs_testing_emailplaceholder2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Emailplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بريدك@مثال.com`)
};

/**
* | output |
* | --- |
* | "your-email@example.com" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Emailplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_emailplaceholder2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Emailplaceholder2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Emailplaceholder2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_emailplaceholder2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_emailplaceholder2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_emailplaceholder2(inputs)
	return ar_developerportal_dashboards_tabs_testing_emailplaceholder2(inputs)
});
export { developerportal_dashboards_tabs_testing_emailplaceholder2 as "developerPortal.dashboards.tabs.testing.emailPlaceholder" }