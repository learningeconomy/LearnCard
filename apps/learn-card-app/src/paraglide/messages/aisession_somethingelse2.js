/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aisession_Somethingelse2Inputs */

const en_aisession_somethingelse2 = /** @type {(inputs: Aisession_Somethingelse2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Something else...`)
};

const es_aisession_somethingelse2 = /** @type {(inputs: Aisession_Somethingelse2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Algo más...`)
};

const fr_aisession_somethingelse2 = /** @type {(inputs: Aisession_Somethingelse2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autre chose...`)
};

const ar_aisession_somethingelse2 = /** @type {(inputs: Aisession_Somethingelse2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...شيء آخر`)
};

/**
* | output |
* | --- |
* | "Something else..." |
*
* @param {Aisession_Somethingelse2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aisession_somethingelse2 = /** @type {((inputs?: Aisession_Somethingelse2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aisession_Somethingelse2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aisession_somethingelse2(inputs)
	if (locale === "es") return es_aisession_somethingelse2(inputs)
	if (locale === "fr") return fr_aisession_somethingelse2(inputs)
	return ar_aisession_somethingelse2(inputs)
});
export { aisession_somethingelse2 as "aiSession.somethingElse" }