/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Launchtypeinfo_Serverheadless_Label4Inputs */

const en_developerportal_launchtypeinfo_serverheadless_label4 = /** @type {(inputs: Developerportal_Launchtypeinfo_Serverheadless_Label4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Server Headless`)
};

const es_developerportal_launchtypeinfo_serverheadless_label4 = /** @type {(inputs: Developerportal_Launchtypeinfo_Serverheadless_Label4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Server Headless`)
};

const fr_developerportal_launchtypeinfo_serverheadless_label4 = /** @type {(inputs: Developerportal_Launchtypeinfo_Serverheadless_Label4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Server Headless`)
};

const ar_developerportal_launchtypeinfo_serverheadless_label4 = /** @type {(inputs: Developerportal_Launchtypeinfo_Serverheadless_Label4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Server Headless`)
};

/**
* | output |
* | --- |
* | "Server Headless" |
*
* @param {Developerportal_Launchtypeinfo_Serverheadless_Label4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_launchtypeinfo_serverheadless_label4 = /** @type {((inputs?: Developerportal_Launchtypeinfo_Serverheadless_Label4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Launchtypeinfo_Serverheadless_Label4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_launchtypeinfo_serverheadless_label4(inputs)
	if (locale === "es") return es_developerportal_launchtypeinfo_serverheadless_label4(inputs)
	if (locale === "fr") return fr_developerportal_launchtypeinfo_serverheadless_label4(inputs)
	return ar_developerportal_launchtypeinfo_serverheadless_label4(inputs)
});
export { developerportal_launchtypeinfo_serverheadless_label4 as "developerPortal.launchTypeInfo.serverHeadless.label" }