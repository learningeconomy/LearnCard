/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Sectiontitles_Achievements3Inputs */

const en_developerportal_credentialbuilder_sectiontitles_achievements3 = /** @type {(inputs: Developerportal_Credentialbuilder_Sectiontitles_Achievements3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Achievements`)
};

const es_developerportal_credentialbuilder_sectiontitles_achievements3 = /** @type {(inputs: Developerportal_Credentialbuilder_Sectiontitles_Achievements3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logros`)
};

const fr_developerportal_credentialbuilder_sectiontitles_achievements3 = /** @type {(inputs: Developerportal_Credentialbuilder_Sectiontitles_Achievements3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réalisations`)
};

const ar_developerportal_credentialbuilder_sectiontitles_achievements3 = /** @type {(inputs: Developerportal_Credentialbuilder_Sectiontitles_Achievements3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإنجازات`)
};

/**
* | output |
* | --- |
* | "Achievements" |
*
* @param {Developerportal_Credentialbuilder_Sectiontitles_Achievements3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_sectiontitles_achievements3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Sectiontitles_Achievements3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Sectiontitles_Achievements3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_sectiontitles_achievements3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_sectiontitles_achievements3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_sectiontitles_achievements3(inputs)
	return ar_developerportal_credentialbuilder_sectiontitles_achievements3(inputs)
});
export { developerportal_credentialbuilder_sectiontitles_achievements3 as "developerPortal.credentialBuilder.sectionTitles.achievements" }