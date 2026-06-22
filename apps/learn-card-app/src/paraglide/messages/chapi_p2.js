/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Chapi_P2Inputs */

const en_chapi_p2 = /** @type {(inputs: Chapi_P2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Think, trusted and confidential carrier pigeon, but for Verifiable Credentials.`)
};

const es_chapi_p2 = /** @type {(inputs: Chapi_P2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Imagina una paloma mensajera confiable y confidencial, pero para credenciales verificables.`)
};

const fr_chapi_p2 = /** @type {(inputs: Chapi_P2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Imaginez un pigeon voyageur fiable et confidentiel, mais pour les justificatifs vérifiables.`)
};

const ar_chapi_p2 = /** @type {(inputs: Chapi_P2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخيّل حمامة زاجلة موثوقة وسرية، لكن لبيانات الاعتماد القابلة للتحقق.`)
};

/**
* | output |
* | --- |
* | "Think, trusted and confidential carrier pigeon, but for Verifiable Credentials." |
*
* @param {Chapi_P2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const chapi_p2 = /** @type {((inputs?: Chapi_P2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Chapi_P2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_chapi_p2(inputs)
	if (locale === "es") return es_chapi_p2(inputs)
	if (locale === "fr") return fr_chapi_p2(inputs)
	return ar_chapi_p2(inputs)
});
export { chapi_p2 as "chapi.p2" }