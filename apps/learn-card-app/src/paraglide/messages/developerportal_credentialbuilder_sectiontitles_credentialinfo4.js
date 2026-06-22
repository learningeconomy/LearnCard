/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Sectiontitles_Credentialinfo4Inputs */

const en_developerportal_credentialbuilder_sectiontitles_credentialinfo4 = /** @type {(inputs: Developerportal_Credentialbuilder_Sectiontitles_Credentialinfo4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Info`)
};

const es_developerportal_credentialbuilder_sectiontitles_credentialinfo4 = /** @type {(inputs: Developerportal_Credentialbuilder_Sectiontitles_Credentialinfo4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Información de la Credencial`)
};

const fr_developerportal_credentialbuilder_sectiontitles_credentialinfo4 = /** @type {(inputs: Developerportal_Credentialbuilder_Sectiontitles_Credentialinfo4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Informations du Crédential`)
};

const ar_developerportal_credentialbuilder_sectiontitles_credentialinfo4 = /** @type {(inputs: Developerportal_Credentialbuilder_Sectiontitles_Credentialinfo4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معلومات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Credential Info" |
*
* @param {Developerportal_Credentialbuilder_Sectiontitles_Credentialinfo4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_sectiontitles_credentialinfo4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Sectiontitles_Credentialinfo4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Sectiontitles_Credentialinfo4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_sectiontitles_credentialinfo4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_sectiontitles_credentialinfo4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_sectiontitles_credentialinfo4(inputs)
	return ar_developerportal_credentialbuilder_sectiontitles_credentialinfo4(inputs)
});
export { developerportal_credentialbuilder_sectiontitles_credentialinfo4 as "developerPortal.credentialBuilder.sectionTitles.credentialInfo" }