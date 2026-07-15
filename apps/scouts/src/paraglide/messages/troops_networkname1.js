/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Networkname1Inputs */

const en_troops_networkname1 = /** @type {(inputs: Troops_Networkname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Network Name`)
};

const es_troops_networkname1 = /** @type {(inputs: Troops_Networkname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de Red`)
};

const fr_troops_networkname1 = /** @type {(inputs: Troops_Networkname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du réseau`)
};

const ar_troops_networkname1 = /** @type {(inputs: Troops_Networkname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Network Name`)
};

/**
* | output |
* | --- |
* | "Network Name" |
*
* @param {Troops_Networkname1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_networkname1 = /** @type {((inputs?: Troops_Networkname1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Networkname1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_networkname1(inputs)
	if (locale === "es") return es_troops_networkname1(inputs)
	if (locale === "fr") return fr_troops_networkname1(inputs)
	return ar_troops_networkname1(inputs)
});
export { troops_networkname1 as "troops.networkName" }