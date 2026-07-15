/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Adminone1Inputs */

const en_troops_adminone1 = /** @type {(inputs: Troops_Adminone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin`)
};

const es_troops_adminone1 = /** @type {(inputs: Troops_Adminone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin`)
};

const fr_troops_adminone1 = /** @type {(inputs: Troops_Adminone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Administrateur`)
};

const ar_troops_adminone1 = /** @type {(inputs: Troops_Adminone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin`)
};

/**
* | output |
* | --- |
* | "Admin" |
*
* @param {Troops_Adminone1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_adminone1 = /** @type {((inputs?: Troops_Adminone1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Adminone1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_adminone1(inputs)
	if (locale === "es") return es_troops_adminone1(inputs)
	if (locale === "fr") return fr_troops_adminone1(inputs)
	return ar_troops_adminone1(inputs)
});
export { troops_adminone1 as "troops.adminOne" }