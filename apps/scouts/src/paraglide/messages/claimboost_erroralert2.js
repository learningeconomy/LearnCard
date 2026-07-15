/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claimboost_Erroralert2Inputs */

const en_claimboost_erroralert2 = /** @type {(inputs: Claimboost_Erroralert2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Something went wrong while claiming this credential. Please try again.`)
};

const es_claimboost_erroralert2 = /** @type {(inputs: Claimboost_Erroralert2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocurrió un error al reclamar esta credencial. Por favor inténtalo de nuevo.`)
};

const fr_claimboost_erroralert2 = /** @type {(inputs: Claimboost_Erroralert2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur est survenue lors de la réclamation de ce justificatif. Veuillez réessayer.`)
};

const ar_claimboost_erroralert2 = /** @type {(inputs: Claimboost_Erroralert2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ ما أثناء استلام هذا المؤهل. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Something went wrong while claiming this credential. Please try again." |
*
* @param {Claimboost_Erroralert2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claimboost_erroralert2 = /** @type {((inputs?: Claimboost_Erroralert2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claimboost_Erroralert2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claimboost_erroralert2(inputs)
	if (locale === "es") return es_claimboost_erroralert2(inputs)
	if (locale === "fr") return fr_claimboost_erroralert2(inputs)
	return ar_claimboost_erroralert2(inputs)
});
export { claimboost_erroralert2 as "claimBoost.errorAlert" }