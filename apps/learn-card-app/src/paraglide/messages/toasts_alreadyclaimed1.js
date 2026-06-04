/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Alreadyclaimed1Inputs */

const en_toasts_alreadyclaimed1 = /** @type {(inputs: Toasts_Alreadyclaimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You have already claimed this credential.`)
};

const es_toasts_alreadyclaimed1 = /** @type {(inputs: Toasts_Alreadyclaimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ya has reclamado esta credencial.`)
};

const de_toasts_alreadyclaimed1 = /** @type {(inputs: Toasts_Alreadyclaimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Du hast diese Berechtigung bereits beansprucht.`)
};

const ar_toasts_alreadyclaimed1 = /** @type {(inputs: Toasts_Alreadyclaimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد طالبت بالفعل ببيانات الاعتماد هذه.`)
};

const fr_toasts_alreadyclaimed1 = /** @type {(inputs: Toasts_Alreadyclaimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez déjà réclamé cette accréditation.`)
};

const ko_toasts_alreadyclaimed1 = /** @type {(inputs: Toasts_Alreadyclaimed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 자격 증명은 이미 수령하셨습니다.`)
};

/**
* | output |
* | --- |
* | "You have already claimed this credential." |
*
* @param {Toasts_Alreadyclaimed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_alreadyclaimed1 = /** @type {((inputs?: Toasts_Alreadyclaimed1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Alreadyclaimed1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_alreadyclaimed1(inputs)
	if (locale === "es") return es_toasts_alreadyclaimed1(inputs)
	if (locale === "de") return de_toasts_alreadyclaimed1(inputs)
	if (locale === "ar") return ar_toasts_alreadyclaimed1(inputs)
	if (locale === "fr") return fr_toasts_alreadyclaimed1(inputs)
	return ko_toasts_alreadyclaimed1(inputs)
});
export { toasts_alreadyclaimed1 as "toasts.alreadyClaimed" }