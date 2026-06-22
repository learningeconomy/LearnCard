/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Header1Inputs */

const en_skillprofile_header1 = /** @type {(inputs: Skillprofile_Header1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`My Skill Profile`)
};

const es_skillprofile_header1 = /** @type {(inputs: Skillprofile_Header1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mi perfil de habilidades`)
};

const fr_skillprofile_header1 = /** @type {(inputs: Skillprofile_Header1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mon profil de compétences`)
};

const ar_skillprofile_header1 = /** @type {(inputs: Skillprofile_Header1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملفي للمهارات`)
};

/**
* | output |
* | --- |
* | "My Skill Profile" |
*
* @param {Skillprofile_Header1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_header1 = /** @type {((inputs?: Skillprofile_Header1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Header1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_header1(inputs)
	if (locale === "es") return es_skillprofile_header1(inputs)
	if (locale === "fr") return fr_skillprofile_header1(inputs)
	return ar_skillprofile_header1(inputs)
});
export { skillprofile_header1 as "skillProfile.header" }