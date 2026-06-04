/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Learninghistory1Inputs */

const en_boost_learninghistory1 = /** @type {(inputs: Boost_Learninghistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Learning History`)
};

const es_boost_learninghistory1 = /** @type {(inputs: Boost_Learninghistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Historial de aprendizaje`)
};

const de_boost_learninghistory1 = /** @type {(inputs: Boost_Learninghistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lernverlauf`)
};

const ar_boost_learninghistory1 = /** @type {(inputs: Boost_Learninghistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجل التعلم`)
};

const fr_boost_learninghistory1 = /** @type {(inputs: Boost_Learninghistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Historique d'apprentissage`)
};

const ko_boost_learninghistory1 = /** @type {(inputs: Boost_Learninghistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`학습 이력`)
};

/**
* | output |
* | --- |
* | "Learning History" |
*
* @param {Boost_Learninghistory1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_learninghistory1 = /** @type {((inputs?: Boost_Learninghistory1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Learninghistory1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_learninghistory1(inputs)
	if (locale === "es") return es_boost_learninghistory1(inputs)
	if (locale === "de") return de_boost_learninghistory1(inputs)
	if (locale === "ar") return ar_boost_learninghistory1(inputs)
	if (locale === "fr") return fr_boost_learninghistory1(inputs)
	return ko_boost_learninghistory1(inputs)
});
export { boost_learninghistory1 as "boost.learningHistory" }