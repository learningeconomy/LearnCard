/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Signing_Checking1Inputs */

const en_developerportal_dashboards_tabs_signing_checking1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Checking1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Checking...`)
};

const es_developerportal_dashboards_tabs_signing_checking1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Checking1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificando...`)
};

const fr_developerportal_dashboards_tabs_signing_checking1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Checking1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérification...`)
};

const ar_developerportal_dashboards_tabs_signing_checking1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Checking1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ التحقق...`)
};

/**
* | output |
* | --- |
* | "Checking..." |
*
* @param {Developerportal_Dashboards_Tabs_Signing_Checking1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_signing_checking1 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Signing_Checking1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Signing_Checking1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_signing_checking1(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_signing_checking1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_signing_checking1(inputs)
	return ar_developerportal_dashboards_tabs_signing_checking1(inputs)
});
export { developerportal_dashboards_tabs_signing_checking1 as "developerPortal.dashboards.tabs.signing.checking" }