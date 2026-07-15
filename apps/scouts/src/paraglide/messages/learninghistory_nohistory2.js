/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Learninghistory_Nohistory2Inputs */

const en_learninghistory_nohistory2 = /** @type {(inputs: Learninghistory_Nohistory2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No learning history yet`)
};

const es_learninghistory_nohistory2 = /** @type {(inputs: Learninghistory_Nohistory2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay historial de aprendizaje`)
};

const fr_learninghistory_nohistory2 = /** @type {(inputs: Learninghistory_Nohistory2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun historique d'apprentissage`)
};

const ar_learninghistory_nohistory2 = /** @type {(inputs: Learninghistory_Nohistory2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا يوجد تاريخ تعلم بعد`)
};

/**
* | output |
* | --- |
* | "No learning history yet" |
*
* @param {Learninghistory_Nohistory2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const learninghistory_nohistory2 = /** @type {((inputs?: Learninghistory_Nohistory2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Learninghistory_Nohistory2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_learninghistory_nohistory2(inputs)
	if (locale === "es") return es_learninghistory_nohistory2(inputs)
	if (locale === "fr") return fr_learninghistory_nohistory2(inputs)
	return ar_learninghistory_nohistory2(inputs)
});
export { learninghistory_nohistory2 as "learningHistory.noHistory" }