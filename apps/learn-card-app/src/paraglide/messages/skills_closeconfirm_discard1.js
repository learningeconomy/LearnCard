/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Closeconfirm_Discard1Inputs */

const en_skills_closeconfirm_discard1 = /** @type {(inputs: Skills_Closeconfirm_Discard1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yes, Discard`)
};

const es_skills_closeconfirm_discard1 = /** @type {(inputs: Skills_Closeconfirm_Discard1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sí, descartar`)
};

const fr_skills_closeconfirm_discard1 = /** @type {(inputs: Skills_Closeconfirm_Discard1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oui, abandonner`)
};

const ar_skills_closeconfirm_discard1 = /** @type {(inputs: Skills_Closeconfirm_Discard1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نعم، تجاهل`)
};

/**
* | output |
* | --- |
* | "Yes, Discard" |
*
* @param {Skills_Closeconfirm_Discard1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_closeconfirm_discard1 = /** @type {((inputs?: Skills_Closeconfirm_Discard1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Closeconfirm_Discard1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_closeconfirm_discard1(inputs)
	if (locale === "es") return es_skills_closeconfirm_discard1(inputs)
	if (locale === "fr") return fr_skills_closeconfirm_discard1(inputs)
	return ar_skills_closeconfirm_discard1(inputs)
});
export { skills_closeconfirm_discard1 as "skills.closeConfirm.discard" }