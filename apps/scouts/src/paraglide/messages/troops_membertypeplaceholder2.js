/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Membertypeplaceholder2Inputs */

const en_troops_membertypeplaceholder2 = /** @type {(inputs: Troops_Membertypeplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Member type`)
};

const es_troops_membertypeplaceholder2 = /** @type {(inputs: Troops_Membertypeplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tipo de miembro`)
};

const fr_troops_membertypeplaceholder2 = /** @type {(inputs: Troops_Membertypeplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Type de membre`)
};

const ar_troops_membertypeplaceholder2 = /** @type {(inputs: Troops_Membertypeplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نوع العضو`)
};

/**
* | output |
* | --- |
* | "Member type" |
*
* @param {Troops_Membertypeplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_membertypeplaceholder2 = /** @type {((inputs?: Troops_Membertypeplaceholder2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Membertypeplaceholder2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_membertypeplaceholder2(inputs)
	if (locale === "es") return es_troops_membertypeplaceholder2(inputs)
	if (locale === "fr") return fr_troops_membertypeplaceholder2(inputs)
	return ar_troops_membertypeplaceholder2(inputs)
});
export { troops_membertypeplaceholder2 as "troops.memberTypePlaceholder" }