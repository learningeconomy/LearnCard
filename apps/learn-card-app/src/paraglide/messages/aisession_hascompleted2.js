/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aisession_Hascompleted2Inputs */

const en_aisession_hascompleted2 = /** @type {(inputs: Aisession_Hascompleted2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`has successfully completed`)
};

const es_aisession_hascompleted2 = /** @type {(inputs: Aisession_Hascompleted2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ha completado con éxito`)
};

const fr_aisession_hascompleted2 = /** @type {(inputs: Aisession_Hascompleted2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`a terminé avec succès`)
};

const ar_aisession_hascompleted2 = /** @type {(inputs: Aisession_Hascompleted2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أكمل بنجاح`)
};

/**
* | output |
* | --- |
* | "has successfully completed" |
*
* @param {Aisession_Hascompleted2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aisession_hascompleted2 = /** @type {((inputs?: Aisession_Hascompleted2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aisession_Hascompleted2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aisession_hascompleted2(inputs)
	if (locale === "es") return es_aisession_hascompleted2(inputs)
	if (locale === "fr") return fr_aisession_hascompleted2(inputs)
	return ar_aisession_hascompleted2(inputs)
});
export { aisession_hascompleted2 as "aiSession.hasCompleted" }