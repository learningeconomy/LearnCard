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

const fr_boost_learninghistory1 = /** @type {(inputs: Boost_Learninghistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Historique d'apprentissage`)
};

const ar_boost_learninghistory1 = /** @type {(inputs: Boost_Learninghistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجل التعلم`)
};

/**
* | output |
* | --- |
* | "Learning History" |
*
* @param {Boost_Learninghistory1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_learninghistory1 = /** @type {((inputs?: Boost_Learninghistory1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Learninghistory1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_learninghistory1(inputs)
	if (locale === "es") return es_boost_learninghistory1(inputs)
	if (locale === "fr") return fr_boost_learninghistory1(inputs)
	return ar_boost_learninghistory1(inputs)
});
export { boost_learninghistory1 as "boost.learningHistory" }