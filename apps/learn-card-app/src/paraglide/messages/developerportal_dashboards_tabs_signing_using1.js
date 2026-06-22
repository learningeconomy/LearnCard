/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Signing_Using1Inputs */

const en_developerportal_dashboards_tabs_signing_using1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Using1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Using: ${i?.name}`)
};

const es_developerportal_dashboards_tabs_signing_using1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Using1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Usando: ${i?.name}`)
};

const fr_developerportal_dashboards_tabs_signing_using1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Using1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Utilisation : ${i?.name}`)
};

const ar_developerportal_dashboards_tabs_signing_using1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Using1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`الاستخدام: ${i?.name}`)
};

/**
* | output |
* | --- |
* | "Using: {name}" |
*
* @param {Developerportal_Dashboards_Tabs_Signing_Using1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_signing_using1 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Signing_Using1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Signing_Using1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_signing_using1(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_signing_using1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_signing_using1(inputs)
	return ar_developerportal_dashboards_tabs_signing_using1(inputs)
});
export { developerportal_dashboards_tabs_signing_using1 as "developerPortal.dashboards.tabs.signing.using" }