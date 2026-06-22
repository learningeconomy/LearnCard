/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Closeconfirm_Title1Inputs */

const en_skills_closeconfirm_title1 = /** @type {(inputs: Skills_Closeconfirm_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Close Without Saving?`)
};

const es_skills_closeconfirm_title1 = /** @type {(inputs: Skills_Closeconfirm_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Cerrar sin guardar?`)
};

const fr_skills_closeconfirm_title1 = /** @type {(inputs: Skills_Closeconfirm_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fermer sans enregistrer ?`)
};

const ar_skills_closeconfirm_title1 = /** @type {(inputs: Skills_Closeconfirm_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإغلاق دون حفظ؟`)
};

/**
* | output |
* | --- |
* | "Close Without Saving?" |
*
* @param {Skills_Closeconfirm_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_closeconfirm_title1 = /** @type {((inputs?: Skills_Closeconfirm_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Closeconfirm_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_closeconfirm_title1(inputs)
	if (locale === "es") return es_skills_closeconfirm_title1(inputs)
	if (locale === "fr") return fr_skills_closeconfirm_title1(inputs)
	return ar_skills_closeconfirm_title1(inputs)
});
export { skills_closeconfirm_title1 as "skills.closeConfirm.title" }