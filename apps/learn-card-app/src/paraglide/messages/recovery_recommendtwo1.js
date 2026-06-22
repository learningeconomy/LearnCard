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

const fr_recovery_recommendtwo1 = /** @type {(inputs: Recovery_Recommendtwo1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous recommandons de configurer au moins deux méthodes de récupération.`)
};

const ar_recovery_recommendtwo1 = /** @type {(inputs: Recovery_Recommendtwo1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نوصي بإعداد طريقتين للاستعادة على الأقل.`)
};

/**
* | output |
* | --- |
* | "We recommend setting up at least two recovery methods." |
*
* @param {Recovery_Recommendtwo1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_recommendtwo1 = /** @type {((inputs?: Recovery_Recommendtwo1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Recommendtwo1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_recommendtwo1(inputs)
	if (locale === "es") return es_recovery_recommendtwo1(inputs)
	if (locale === "fr") return fr_recovery_recommendtwo1(inputs)
	return ar_recovery_recommendtwo1(inputs)
});
export { recovery_recommendtwo1 as "recovery.recommendTwo" }