/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Sectiontitles_Associations3Inputs */

const en_developerportal_credentialbuilder_sectiontitles_associations3 = /** @type {(inputs: Developerportal_Credentialbuilder_Sectiontitles_Associations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Associations`)
};

const es_developerportal_credentialbuilder_sectiontitles_associations3 = /** @type {(inputs: Developerportal_Credentialbuilder_Sectiontitles_Associations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Asociaciones`)
};

const fr_developerportal_credentialbuilder_sectiontitles_associations3 = /** @type {(inputs: Developerportal_Credentialbuilder_Sectiontitles_Associations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Associations`)
};

const ar_developerportal_credentialbuilder_sectiontitles_associations3 = /** @type {(inputs: Developerportal_Credentialbuilder_Sectiontitles_Associations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الارتباطات`)
};

/**
* | output |
* | --- |
* | "Associations" |
*
* @param {Developerportal_Credentialbuilder_Sectiontitles_Associations3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_sectiontitles_associations3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Sectiontitles_Associations3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Sectiontitles_Associations3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_sectiontitles_associations3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_sectiontitles_associations3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_sectiontitles_associations3(inputs)
	return ar_developerportal_credentialbuilder_sectiontitles_associations3(inputs)
});
export { developerportal_credentialbuilder_sectiontitles_associations3 as "developerPortal.credentialBuilder.sectionTitles.associations" }