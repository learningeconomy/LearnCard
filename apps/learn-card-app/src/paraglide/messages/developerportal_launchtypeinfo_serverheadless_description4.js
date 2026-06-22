/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Launchtypeinfo_Serverheadless_Description4Inputs */

const en_developerportal_launchtypeinfo_serverheadless_description4 = /** @type {(inputs: Developerportal_Launchtypeinfo_Serverheadless_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Backend integration with webhook notifications`)
};

const es_developerportal_launchtypeinfo_serverheadless_description4 = /** @type {(inputs: Developerportal_Launchtypeinfo_Serverheadless_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Backend integration with webhook notifications`)
};

const fr_developerportal_launchtypeinfo_serverheadless_description4 = /** @type {(inputs: Developerportal_Launchtypeinfo_Serverheadless_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Backend integration with webhook notifications`)
};

const ar_developerportal_launchtypeinfo_serverheadless_description4 = /** @type {(inputs: Developerportal_Launchtypeinfo_Serverheadless_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Backend integration with webhook notifications`)
};

/**
* | output |
* | --- |
* | "Backend integration with webhook notifications" |
*
* @param {Developerportal_Launchtypeinfo_Serverheadless_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_launchtypeinfo_serverheadless_description4 = /** @type {((inputs?: Developerportal_Launchtypeinfo_Serverheadless_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Launchtypeinfo_Serverheadless_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_launchtypeinfo_serverheadless_description4(inputs)
	if (locale === "es") return es_developerportal_launchtypeinfo_serverheadless_description4(inputs)
	if (locale === "fr") return fr_developerportal_launchtypeinfo_serverheadless_description4(inputs)
	return ar_developerportal_launchtypeinfo_serverheadless_description4(inputs)
});
export { developerportal_launchtypeinfo_serverheadless_description4 as "developerPortal.launchTypeInfo.serverHeadless.description" }