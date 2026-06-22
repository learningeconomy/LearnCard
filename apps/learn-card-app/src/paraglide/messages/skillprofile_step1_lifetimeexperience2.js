/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step1_Lifetimeexperience2Inputs */

const en_skillprofile_step1_lifetimeexperience2 = /** @type {(inputs: Skillprofile_Step1_Lifetimeexperience2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lifetime experience in this role`)
};

const es_skillprofile_step1_lifetimeexperience2 = /** @type {(inputs: Skillprofile_Step1_Lifetimeexperience2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Experiencia total en este puesto`)
};

const fr_skillprofile_step1_lifetimeexperience2 = /** @type {(inputs: Skillprofile_Step1_Lifetimeexperience2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expérience totale dans ce rôle`)
};

const ar_skillprofile_step1_lifetimeexperience2 = /** @type {(inputs: Skillprofile_Step1_Lifetimeexperience2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إجمالي الخبرة في هذا الدور`)
};

/**
* | output |
* | --- |
* | "Lifetime experience in this role" |
*
* @param {Skillprofile_Step1_Lifetimeexperience2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step1_lifetimeexperience2 = /** @type {((inputs?: Skillprofile_Step1_Lifetimeexperience2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step1_Lifetimeexperience2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step1_lifetimeexperience2(inputs)
	if (locale === "es") return es_skillprofile_step1_lifetimeexperience2(inputs)
	if (locale === "fr") return fr_skillprofile_step1_lifetimeexperience2(inputs)
	return ar_skillprofile_step1_lifetimeexperience2(inputs)
});
export { skillprofile_step1_lifetimeexperience2 as "skillProfile.step1.lifetimeExperience" }