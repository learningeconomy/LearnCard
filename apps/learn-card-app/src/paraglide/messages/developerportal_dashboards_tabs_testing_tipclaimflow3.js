/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Tipclaimflow3Inputs */

const en_developerportal_dashboards_tabs_testing_tipclaimflow3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Tipclaimflow3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complete the claim flow to verify the full experience`)
};

const es_developerportal_dashboards_tabs_testing_tipclaimflow3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Tipclaimflow3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Completa el flujo de reclamo para verificar la experiencia completa`)
};

const fr_developerportal_dashboards_tabs_testing_tipclaimflow3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Tipclaimflow3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terminez le flux de réclamation pour vérifier l'expérience complète`)
};

const ar_developerportal_dashboards_tabs_testing_tipclaimflow3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Tipclaimflow3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أكمل عملية المطالبة للتحقق من التجربة الكاملة`)
};

/**
* | output |
* | --- |
* | "Complete the claim flow to verify the full experience" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Tipclaimflow3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_tipclaimflow3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Tipclaimflow3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Tipclaimflow3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_tipclaimflow3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_tipclaimflow3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_tipclaimflow3(inputs)
	return ar_developerportal_dashboards_tabs_testing_tipclaimflow3(inputs)
});
export { developerportal_dashboards_tabs_testing_tipclaimflow3 as "developerPortal.dashboards.tabs.testing.tipClaimFlow" }