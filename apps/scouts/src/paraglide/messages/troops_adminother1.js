/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Adminother1Inputs */

const en_troops_adminother1 = /** @type {(inputs: Troops_Adminother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admins`)
};

const es_troops_adminother1 = /** @type {(inputs: Troops_Adminother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admins`)
};

const fr_troops_adminother1 = /** @type {(inputs: Troops_Adminother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Administrateurs`)
};

const ar_troops_adminother1 = /** @type {(inputs: Troops_Adminother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admins`)
};

/**
* | output |
* | --- |
* | "Admins" |
*
* @param {Troops_Adminother1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_adminother1 = /** @type {((inputs?: Troops_Adminother1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Adminother1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_adminother1(inputs)
	if (locale === "es") return es_troops_adminother1(inputs)
	if (locale === "fr") return fr_troops_adminother1(inputs)
	return ar_troops_adminother1(inputs)
});
export { troops_adminother1 as "troops.adminOther" }