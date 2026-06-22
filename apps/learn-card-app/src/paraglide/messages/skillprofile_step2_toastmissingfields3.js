/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Toastmissingfields3Inputs */

const en_skillprofile_step2_toastmissingfields3 = /** @type {(inputs: Skillprofile_Step2_Toastmissingfields3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Missing required fields`)
};

const es_skillprofile_step2_toastmissingfields3 = /** @type {(inputs: Skillprofile_Step2_Toastmissingfields3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Faltan campos obligatorios`)
};

const fr_skillprofile_step2_toastmissingfields3 = /** @type {(inputs: Skillprofile_Step2_Toastmissingfields3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Champs obligatoires manquants`)
};

const ar_skillprofile_step2_toastmissingfields3 = /** @type {(inputs: Skillprofile_Step2_Toastmissingfields3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حقول مطلوبة مفقودة`)
};

/**
* | output |
* | --- |
* | "Missing required fields" |
*
* @param {Skillprofile_Step2_Toastmissingfields3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_toastmissingfields3 = /** @type {((inputs?: Skillprofile_Step2_Toastmissingfields3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Toastmissingfields3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_toastmissingfields3(inputs)
	if (locale === "es") return es_skillprofile_step2_toastmissingfields3(inputs)
	if (locale === "fr") return fr_skillprofile_step2_toastmissingfields3(inputs)
	return ar_skillprofile_step2_toastmissingfields3(inputs)
});
export { skillprofile_step2_toastmissingfields3 as "skillProfile.step2.toastMissingFields" }