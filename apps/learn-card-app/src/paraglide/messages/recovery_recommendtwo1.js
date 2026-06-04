/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Recommendtwo1Inputs */

const en_recovery_recommendtwo1 = /** @type {(inputs: Recovery_Recommendtwo1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We recommend setting up at least two recovery methods.`)
};

const es_recovery_recommendtwo1 = /** @type {(inputs: Recovery_Recommendtwo1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recomendamos configurar al menos dos métodos de recuperación.`)
};

const de_recovery_recommendtwo1 = /** @type {(inputs: Recovery_Recommendtwo1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wir empfehlen, mindestens zwei Wiederherstellungsmethoden einzurichten.`)
};

const ar_recovery_recommendtwo1 = /** @type {(inputs: Recovery_Recommendtwo1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نوصي بإعداد طريقتين للاستعادة على الأقل.`)
};

const fr_recovery_recommendtwo1 = /** @type {(inputs: Recovery_Recommendtwo1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous recommandons de configurer au moins deux méthodes de récupération.`)
};

const ko_recovery_recommendtwo1 = /** @type {(inputs: Recovery_Recommendtwo1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`최소 두 가지 복구 방법을 설정하는 것을 권장합니다.`)
};

/**
* | output |
* | --- |
* | "We recommend setting up at least two recovery methods." |
*
* @param {Recovery_Recommendtwo1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_recommendtwo1 = /** @type {((inputs?: Recovery_Recommendtwo1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Recommendtwo1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_recommendtwo1(inputs)
	if (locale === "es") return es_recovery_recommendtwo1(inputs)
	if (locale === "de") return de_recovery_recommendtwo1(inputs)
	if (locale === "ar") return ar_recovery_recommendtwo1(inputs)
	if (locale === "fr") return fr_recovery_recommendtwo1(inputs)
	return ko_recovery_recommendtwo1(inputs)
});
export { recovery_recommendtwo1 as "recovery.recommendTwo" }