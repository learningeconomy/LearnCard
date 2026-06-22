/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step5_Toasterrorsaving3Inputs */

const en_skillprofile_step5_toasterrorsaving3 = /** @type {(inputs: Skillprofile_Step5_Toasterrorsaving3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error saving skills!`)
};

const es_skillprofile_step5_toasterrorsaving3 = /** @type {(inputs: Skillprofile_Step5_Toasterrorsaving3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Error al guardar las habilidades!`)
};

const fr_skillprofile_step5_toasterrorsaving3 = /** @type {(inputs: Skillprofile_Step5_Toasterrorsaving3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur lors de l'enregistrement des compétences !`)
};

const ar_skillprofile_step5_toasterrorsaving3 = /** @type {(inputs: Skillprofile_Step5_Toasterrorsaving3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خطأ في حفظ المهارات!`)
};

/**
* | output |
* | --- |
* | "Error saving skills!" |
*
* @param {Skillprofile_Step5_Toasterrorsaving3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step5_toasterrorsaving3 = /** @type {((inputs?: Skillprofile_Step5_Toasterrorsaving3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step5_Toasterrorsaving3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step5_toasterrorsaving3(inputs)
	if (locale === "es") return es_skillprofile_step5_toasterrorsaving3(inputs)
	if (locale === "fr") return fr_skillprofile_step5_toasterrorsaving3(inputs)
	return ar_skillprofile_step5_toasterrorsaving3(inputs)
});
export { skillprofile_step5_toasterrorsaving3 as "skillProfile.step5.toastErrorSaving" }