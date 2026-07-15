/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Leadername1Inputs */

const en_troops_leadername1 = /** @type {(inputs: Troops_Leadername1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leader Name`)
};

const es_troops_leadername1 = /** @type {(inputs: Troops_Leadername1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de Líder`)
};

const fr_troops_leadername1 = /** @type {(inputs: Troops_Leadername1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du responsable`)
};

const ar_troops_leadername1 = /** @type {(inputs: Troops_Leadername1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم القائد`)
};

/**
* | output |
* | --- |
* | "Leader Name" |
*
* @param {Troops_Leadername1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_leadername1 = /** @type {((inputs?: Troops_Leadername1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Leadername1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_leadername1(inputs)
	if (locale === "es") return es_troops_leadername1(inputs)
	if (locale === "fr") return fr_troops_leadername1(inputs)
	return ar_troops_leadername1(inputs)
});
export { troops_leadername1 as "troops.leaderName" }