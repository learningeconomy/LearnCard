/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Overview_Copycodeforwebsite4Inputs */

const en_developerportal_dashboards_tabs_overview_copycodeforwebsite4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Copycodeforwebsite4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy code for your website`)
};

const es_developerportal_dashboards_tabs_overview_copycodeforwebsite4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Copycodeforwebsite4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar código para tu sitio web`)
};

const fr_developerportal_dashboards_tabs_overview_copycodeforwebsite4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Copycodeforwebsite4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier le code pour votre site web`)
};

const ar_developerportal_dashboards_tabs_overview_copycodeforwebsite4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Copycodeforwebsite4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسخ الكود لموقعك على الويب`)
};

/**
* | output |
* | --- |
* | "Copy code for your website" |
*
* @param {Developerportal_Dashboards_Tabs_Overview_Copycodeforwebsite4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_overview_copycodeforwebsite4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Overview_Copycodeforwebsite4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Overview_Copycodeforwebsite4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_overview_copycodeforwebsite4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_overview_copycodeforwebsite4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_overview_copycodeforwebsite4(inputs)
	return ar_developerportal_dashboards_tabs_overview_copycodeforwebsite4(inputs)
});
export { developerportal_dashboards_tabs_overview_copycodeforwebsite4 as "developerPortal.dashboards.tabs.overview.copyCodeForWebsite" }