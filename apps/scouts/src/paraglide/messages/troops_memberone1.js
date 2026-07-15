/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Memberone1Inputs */

const en_troops_memberone1 = /** @type {(inputs: Troops_Memberone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Member`)
};

const es_troops_memberone1 = /** @type {(inputs: Troops_Memberone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Miembro`)
};

const fr_troops_memberone1 = /** @type {(inputs: Troops_Memberone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Membre`)
};

const ar_troops_memberone1 = /** @type {(inputs: Troops_Memberone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عضو`)
};

/**
* | output |
* | --- |
* | "Member" |
*
* @param {Troops_Memberone1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_memberone1 = /** @type {((inputs?: Troops_Memberone1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Memberone1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_memberone1(inputs)
	if (locale === "es") return es_troops_memberone1(inputs)
	if (locale === "fr") return fr_troops_memberone1(inputs)
	return ar_troops_memberone1(inputs)
});
export { troops_memberone1 as "troops.memberOne" }