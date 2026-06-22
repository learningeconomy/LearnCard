/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Closeconfirm_Body1Inputs */

const en_skills_closeconfirm_body1 = /** @type {(inputs: Skills_Closeconfirm_Body1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Do you want to discard your selected skills?`)
};

const es_skills_closeconfirm_body1 = /** @type {(inputs: Skills_Closeconfirm_Body1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Quieres descartar las habilidades seleccionadas?`)
};

const fr_skills_closeconfirm_body1 = /** @type {(inputs: Skills_Closeconfirm_Body1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voulez-vous abandonner les compétences sélectionnées ?`)
};

const ar_skills_closeconfirm_body1 = /** @type {(inputs: Skills_Closeconfirm_Body1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل تريد تجاهل المهارات التي حددتها؟`)
};

/**
* | output |
* | --- |
* | "Do you want to discard your selected skills?" |
*
* @param {Skills_Closeconfirm_Body1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_closeconfirm_body1 = /** @type {((inputs?: Skills_Closeconfirm_Body1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Closeconfirm_Body1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_closeconfirm_body1(inputs)
	if (locale === "es") return es_skills_closeconfirm_body1(inputs)
	if (locale === "fr") return fr_skills_closeconfirm_body1(inputs)
	return ar_skills_closeconfirm_body1(inputs)
});
export { skills_closeconfirm_body1 as "skills.closeConfirm.body" }