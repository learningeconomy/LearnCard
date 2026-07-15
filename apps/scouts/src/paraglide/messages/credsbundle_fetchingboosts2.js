/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Fetchingboosts2Inputs */

const en_credsbundle_fetchingboosts2 = /** @type {(inputs: Credsbundle_Fetchingboosts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fetching your earned boosts...`)
};

const es_credsbundle_fetchingboosts2 = /** @type {(inputs: Credsbundle_Fetchingboosts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obteniendo tus boosts obtenidos...`)
};

const fr_credsbundle_fetchingboosts2 = /** @type {(inputs: Credsbundle_Fetchingboosts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupération de vos Boosts...`)
};

const ar_credsbundle_fetchingboosts2 = /** @type {(inputs: Credsbundle_Fetchingboosts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري جلب تعزيزاتك المكتسبة...`)
};

/**
* | output |
* | --- |
* | "Fetching your earned boosts..." |
*
* @param {Credsbundle_Fetchingboosts2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_fetchingboosts2 = /** @type {((inputs?: Credsbundle_Fetchingboosts2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Fetchingboosts2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_fetchingboosts2(inputs)
	if (locale === "es") return es_credsbundle_fetchingboosts2(inputs)
	if (locale === "fr") return fr_credsbundle_fetchingboosts2(inputs)
	return ar_credsbundle_fetchingboosts2(inputs)
});
export { credsbundle_fetchingboosts2 as "credsBundle.fetchingBoosts" }