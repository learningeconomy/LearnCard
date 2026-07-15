/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Introslides_Organizetroops2Inputs */

const en_introslides_organizetroops2 = /** @type {(inputs: Introslides_Organizetroops2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organize into Troops`)
};

const es_introslides_organizetroops2 = /** @type {(inputs: Introslides_Organizetroops2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organízate en Troops`)
};

const fr_introslides_organizetroops2 = /** @type {(inputs: Introslides_Organizetroops2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organisez-vous en troupes`)
};

const ar_introslides_organizetroops2 = /** @type {(inputs: Introslides_Organizetroops2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organize into Troops`)
};

/**
* | output |
* | --- |
* | "Organize into Troops" |
*
* @param {Introslides_Organizetroops2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const introslides_organizetroops2 = /** @type {((inputs?: Introslides_Organizetroops2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Introslides_Organizetroops2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_introslides_organizetroops2(inputs)
	if (locale === "es") return es_introslides_organizetroops2(inputs)
	if (locale === "fr") return fr_introslides_organizetroops2(inputs)
	return ar_introslides_organizetroops2(inputs)
});
export { introslides_organizetroops2 as "introSlides.organizeTroops" }