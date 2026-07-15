/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Errorfetching2Inputs */

const en_credsbundle_errorfetching2 = /** @type {(inputs: Credsbundle_Errorfetching2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sorry! There was an error fetching your {type}s: {error}`)
};

const es_credsbundle_errorfetching2 = /** @type {(inputs: Credsbundle_Errorfetching2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Lo sentimos! Hubo un error al obtener tus {type}s: {error}`)
};

const fr_credsbundle_errorfetching2 = /** @type {(inputs: Credsbundle_Errorfetching2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Désolé ! Une erreur est survenue lors de la récupération de vos {type} : {error}`)
};

const ar_credsbundle_errorfetching2 = /** @type {(inputs: Credsbundle_Errorfetching2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عذراً! حدث خطأ في جلب {type} الخاصة بك: {error}`)
};

/**
* | output |
* | --- |
* | "Sorry! There was an error fetching your {type}s: {error}" |
*
* @param {Credsbundle_Errorfetching2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_errorfetching2 = /** @type {((inputs?: Credsbundle_Errorfetching2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Errorfetching2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_errorfetching2(inputs)
	if (locale === "es") return es_credsbundle_errorfetching2(inputs)
	if (locale === "fr") return fr_credsbundle_errorfetching2(inputs)
	return ar_credsbundle_errorfetching2(inputs)
});
export { credsbundle_errorfetching2 as "credsBundle.errorFetching" }