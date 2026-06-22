/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Templates_Openbadgessection4Inputs */

const en_developerportal_credentialbuilder_templates_openbadgessection4 = /** @type {(inputs: Developerportal_Credentialbuilder_Templates_Openbadgessection4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open Badges v3`)
};

const es_developerportal_credentialbuilder_templates_openbadgessection4 = /** @type {(inputs: Developerportal_Credentialbuilder_Templates_Openbadgessection4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open Badges v3`)
};

const fr_developerportal_credentialbuilder_templates_openbadgessection4 = /** @type {(inputs: Developerportal_Credentialbuilder_Templates_Openbadgessection4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open Badges v3`)
};

const ar_developerportal_credentialbuilder_templates_openbadgessection4 = /** @type {(inputs: Developerportal_Credentialbuilder_Templates_Openbadgessection4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open Badges v3`)
};

/**
* | output |
* | --- |
* | "Open Badges v3" |
*
* @param {Developerportal_Credentialbuilder_Templates_Openbadgessection4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_templates_openbadgessection4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Templates_Openbadgessection4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Templates_Openbadgessection4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_templates_openbadgessection4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_templates_openbadgessection4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_templates_openbadgessection4(inputs)
	return ar_developerportal_credentialbuilder_templates_openbadgessection4(inputs)
});
export { developerportal_credentialbuilder_templates_openbadgessection4 as "developerPortal.credentialBuilder.templates.openBadgesSection" }