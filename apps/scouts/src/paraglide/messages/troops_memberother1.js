/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Memberother1Inputs */

const en_troops_memberother1 = /** @type {(inputs: Troops_Memberother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Members`)
};

const es_troops_memberother1 = /** @type {(inputs: Troops_Memberother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Miembros`)
};

const fr_troops_memberother1 = /** @type {(inputs: Troops_Memberother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Membres`)
};

const ar_troops_memberother1 = /** @type {(inputs: Troops_Memberother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أعضاء`)
};

/**
* | output |
* | --- |
* | "Members" |
*
* @param {Troops_Memberother1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_memberother1 = /** @type {((inputs?: Troops_Memberother1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Memberother1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_memberother1(inputs)
	if (locale === "es") return es_troops_memberother1(inputs)
	if (locale === "fr") return fr_troops_memberother1(inputs)
	return ar_troops_memberother1(inputs)
});
export { troops_memberother1 as "troops.memberOther" }