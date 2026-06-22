/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Toastfailed2Inputs */

const en_skillprofile_step2_toastfailed2 = /** @type {(inputs: Skillprofile_Step2_Toastfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to add experience`)
};

const es_skillprofile_step2_toastfailed2 = /** @type {(inputs: Skillprofile_Step2_Toastfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo añadir la experiencia`)
};

const fr_skillprofile_step2_toastfailed2 = /** @type {(inputs: Skillprofile_Step2_Toastfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de l'ajout de l'expérience`)
};

const ar_skillprofile_step2_toastfailed2 = /** @type {(inputs: Skillprofile_Step2_Toastfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذّر إضافة الخبرة`)
};

/**
* | output |
* | --- |
* | "Failed to add experience" |
*
* @param {Skillprofile_Step2_Toastfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_toastfailed2 = /** @type {((inputs?: Skillprofile_Step2_Toastfailed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Toastfailed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_toastfailed2(inputs)
	if (locale === "es") return es_skillprofile_step2_toastfailed2(inputs)
	if (locale === "fr") return fr_skillprofile_step2_toastfailed2(inputs)
	return ar_skillprofile_step2_toastfailed2(inputs)
});
export { skillprofile_step2_toastfailed2 as "skillProfile.step2.toastFailed" }