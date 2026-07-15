/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_NetworkInputs */

const en_troops_network = /** @type {(inputs: Troops_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Network`)
};

const es_troops_network = /** @type {(inputs: Troops_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Red`)
};

const fr_troops_network = /** @type {(inputs: Troops_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réseau`)
};

const ar_troops_network = /** @type {(inputs: Troops_NetworkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Network`)
};

/**
* | output |
* | --- |
* | "Network" |
*
* @param {Troops_NetworkInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_network = /** @type {((inputs?: Troops_NetworkInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_NetworkInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_network(inputs)
	if (locale === "es") return es_troops_network(inputs)
	if (locale === "fr") return fr_troops_network(inputs)
	return ar_troops_network(inputs)
});
export { troops_network as "troops.network" }