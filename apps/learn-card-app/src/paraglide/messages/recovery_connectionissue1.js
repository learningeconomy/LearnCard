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

const de_recovery_connectionissue1 = /** @type {(inputs: Recovery_Connectionissue1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verbindungsproblem. Bitte prüfe deine Internetverbindung und versuche es erneut.`)
};

const ar_recovery_connectionissue1 = /** @type {(inputs: Recovery_Connectionissue1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشكلة في الاتصال. يرجى التحقق من الإنترنت والمحاولة مرة أخرى.`)
};

const fr_recovery_connectionissue1 = /** @type {(inputs: Recovery_Connectionissue1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Problème de connexion. Veuillez vérifier votre connexion internet et réessayer.`)
};

const ko_recovery_connectionissue1 = /** @type {(inputs: Recovery_Connectionissue1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연결 문제입니다. 인터넷을 확인하고 다시 시도해 주세요.`)
};

/**
* | output |
* | --- |
* | "Connection issue. Please check your internet and try again." |
*
* @param {Recovery_Connectionissue1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_connectionissue1 = /** @type {((inputs?: Recovery_Connectionissue1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Connectionissue1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_connectionissue1(inputs)
	if (locale === "es") return es_recovery_connectionissue1(inputs)
	if (locale === "de") return de_recovery_connectionissue1(inputs)
	if (locale === "ar") return ar_recovery_connectionissue1(inputs)
	if (locale === "fr") return fr_recovery_connectionissue1(inputs)
	return ko_recovery_connectionissue1(inputs)
});
export { recovery_connectionissue1 as "recovery.connectionIssue" }