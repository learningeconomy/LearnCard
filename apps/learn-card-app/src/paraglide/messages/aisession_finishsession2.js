/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aisession_Finishsession2Inputs */

const en_aisession_finishsession2 = /** @type {(inputs: Aisession_Finishsession2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Finish Session`)
};

const es_aisession_finishsession2 = /** @type {(inputs: Aisession_Finishsession2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Finalizar sesión`)
};

const fr_aisession_finishsession2 = /** @type {(inputs: Aisession_Finishsession2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terminer la session`)
};

const ar_aisession_finishsession2 = /** @type {(inputs: Aisession_Finishsession2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنهاء الجلسة`)
};

/**
* | output |
* | --- |
* | "Finish Session" |
*
* @param {Aisession_Finishsession2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aisession_finishsession2 = /** @type {((inputs?: Aisession_Finishsession2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aisession_Finishsession2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aisession_finishsession2(inputs)
	if (locale === "es") return es_aisession_finishsession2(inputs)
	if (locale === "fr") return fr_aisession_finishsession2(inputs)
	return ar_aisession_finishsession2(inputs)
});
export { aisession_finishsession2 as "aiSession.finishSession" }