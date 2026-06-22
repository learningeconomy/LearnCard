/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Signing_Description1Inputs */

const en_developerportal_dashboards_tabs_signing_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configure how credentials are signed`)
};

const es_developerportal_dashboards_tabs_signing_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura cómo se firman las credenciales`)
};

const fr_developerportal_dashboards_tabs_signing_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez comment les credentials sont signés`)
};

const ar_developerportal_dashboards_tabs_signing_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكوين كيفية توقيع بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Configure how credentials are signed" |
*
* @param {Developerportal_Dashboards_Tabs_Signing_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_signing_description1 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Signing_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Signing_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_signing_description1(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_signing_description1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_signing_description1(inputs)
	return ar_developerportal_dashboards_tabs_signing_description1(inputs)
});
export { developerportal_dashboards_tabs_signing_description1 as "developerPortal.dashboards.tabs.signing.description" }