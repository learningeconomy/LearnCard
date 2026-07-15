/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Membertype1Inputs */

const en_troops_membertype1 = /** @type {(inputs: Troops_Membertype1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Member Type`)
};

const es_troops_membertype1 = /** @type {(inputs: Troops_Membertype1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tipo de Miembro`)
};

const fr_troops_membertype1 = /** @type {(inputs: Troops_Membertype1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Type de membre`)
};

const ar_troops_membertype1 = /** @type {(inputs: Troops_Membertype1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نوع العضو`)
};

/**
* | output |
* | --- |
* | "Member Type" |
*
* @param {Troops_Membertype1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_membertype1 = /** @type {((inputs?: Troops_Membertype1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Membertype1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_membertype1(inputs)
	if (locale === "es") return es_troops_membertype1(inputs)
	if (locale === "fr") return fr_troops_membertype1(inputs)
	return ar_troops_membertype1(inputs)
});
export { troops_membertype1 as "troops.memberType" }