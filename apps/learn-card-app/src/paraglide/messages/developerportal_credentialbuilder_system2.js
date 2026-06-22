/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_System2Inputs */

const en_developerportal_credentialbuilder_system2 = /** @type {(inputs: Developerportal_Credentialbuilder_System2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`System`)
};

const es_developerportal_credentialbuilder_system2 = /** @type {(inputs: Developerportal_Credentialbuilder_System2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sistema`)
};

const fr_developerportal_credentialbuilder_system2 = /** @type {(inputs: Developerportal_Credentialbuilder_System2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Système`)
};

const ar_developerportal_credentialbuilder_system2 = /** @type {(inputs: Developerportal_Credentialbuilder_System2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نظام`)
};

/**
* | output |
* | --- |
* | "System" |
*
* @param {Developerportal_Credentialbuilder_System2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_system2 = /** @type {((inputs?: Developerportal_Credentialbuilder_System2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_System2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_system2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_system2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_system2(inputs)
	return ar_developerportal_credentialbuilder_system2(inputs)
});
export { developerportal_credentialbuilder_system2 as "developerPortal.credentialBuilder.system" }