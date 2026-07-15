/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Nameplaceholder1Inputs */

const en_troops_nameplaceholder1 = /** @type {(inputs: Troops_Nameplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{mode} Name`)
};

const es_troops_nameplaceholder1 = /** @type {(inputs: Troops_Nameplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de {mode}`)
};

const fr_troops_nameplaceholder1 = /** @type {(inputs: Troops_Nameplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du/de la {mode}`)
};

const ar_troops_nameplaceholder1 = /** @type {(inputs: Troops_Nameplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم {mode}`)
};

/**
* | output |
* | --- |
* | "{mode} Name" |
*
* @param {Troops_Nameplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_nameplaceholder1 = /** @type {((inputs?: Troops_Nameplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Nameplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_nameplaceholder1(inputs)
	if (locale === "es") return es_troops_nameplaceholder1(inputs)
	if (locale === "fr") return fr_troops_nameplaceholder1(inputs)
	return ar_troops_nameplaceholder1(inputs)
});
export { troops_nameplaceholder1 as "troops.namePlaceholder" }