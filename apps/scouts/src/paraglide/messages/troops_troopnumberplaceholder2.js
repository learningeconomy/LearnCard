/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Troopnumberplaceholder2Inputs */

const en_troops_troopnumberplaceholder2 = /** @type {(inputs: Troops_Troopnumberplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`00000`)
};

const es_troops_troopnumberplaceholder2 = /** @type {(inputs: Troops_Troopnumberplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`00000`)
};

const fr_troops_troopnumberplaceholder2 = /** @type {(inputs: Troops_Troopnumberplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`00000`)
};

const ar_troops_troopnumberplaceholder2 = /** @type {(inputs: Troops_Troopnumberplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`00000`)
};

/**
* | output |
* | --- |
* | "00000" |
*
* @param {Troops_Troopnumberplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_troopnumberplaceholder2 = /** @type {((inputs?: Troops_Troopnumberplaceholder2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Troopnumberplaceholder2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_troopnumberplaceholder2(inputs)
	if (locale === "es") return es_troops_troopnumberplaceholder2(inputs)
	if (locale === "fr") return fr_troops_troopnumberplaceholder2(inputs)
	return ar_troops_troopnumberplaceholder2(inputs)
});
export { troops_troopnumberplaceholder2 as "troops.troopNumberPlaceholder" }