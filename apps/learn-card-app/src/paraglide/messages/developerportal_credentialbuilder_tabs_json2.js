/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Tabs_Json2Inputs */

const en_developerportal_credentialbuilder_tabs_json2 = /** @type {(inputs: Developerportal_Credentialbuilder_Tabs_Json2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON`)
};

const es_developerportal_credentialbuilder_tabs_json2 = /** @type {(inputs: Developerportal_Credentialbuilder_Tabs_Json2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON`)
};

const fr_developerportal_credentialbuilder_tabs_json2 = /** @type {(inputs: Developerportal_Credentialbuilder_Tabs_Json2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON`)
};

const ar_developerportal_credentialbuilder_tabs_json2 = /** @type {(inputs: Developerportal_Credentialbuilder_Tabs_Json2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON`)
};

/**
* | output |
* | --- |
* | "JSON" |
*
* @param {Developerportal_Credentialbuilder_Tabs_Json2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_tabs_json2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Tabs_Json2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Tabs_Json2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_tabs_json2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_tabs_json2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_tabs_json2(inputs)
	return ar_developerportal_credentialbuilder_tabs_json2(inputs)
});
export { developerportal_credentialbuilder_tabs_json2 as "developerPortal.credentialBuilder.tabs.json" }