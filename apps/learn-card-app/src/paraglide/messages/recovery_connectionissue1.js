/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Connectionissue1Inputs */

const en_recovery_connectionissue1 = /** @type {(inputs: Recovery_Connectionissue1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connection issue. Please check your internet and try again.`)
};

const es_recovery_connectionissue1 = /** @type {(inputs: Recovery_Connectionissue1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Problema de conexión. Verifica tu internet e inténtalo de nuevo.`)
};

const fr_recovery_connectionissue1 = /** @type {(inputs: Recovery_Connectionissue1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Problème de connexion. Veuillez vérifier votre connexion internet et réessayer.`)
};

const ar_recovery_connectionissue1 = /** @type {(inputs: Recovery_Connectionissue1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشكلة في الاتصال. يرجى التحقق من الإنترنت والمحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Connection issue. Please check your internet and try again." |
*
* @param {Recovery_Connectionissue1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_connectionissue1 = /** @type {((inputs?: Recovery_Connectionissue1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Connectionissue1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_connectionissue1(inputs)
	if (locale === "es") return es_recovery_connectionissue1(inputs)
	if (locale === "fr") return fr_recovery_connectionissue1(inputs)
	return ar_recovery_connectionissue1(inputs)
});
export { recovery_connectionissue1 as "recovery.connectionIssue" }