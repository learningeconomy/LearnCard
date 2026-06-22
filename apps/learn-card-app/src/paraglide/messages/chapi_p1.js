/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Chapi_P1Inputs */

const en_chapi_p1 = /** @type {(inputs: Chapi_P1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The Credential Handler API (CHAPI) is an open-source solution for communicating Verifiable Credentials on the Web.`)
};

const es_chapi_p1 = /** @type {(inputs: Chapi_P1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La API de gestión de credenciales (CHAPI) es una solución de código abierto para comunicar credenciales verificables en la web.`)
};

const fr_chapi_p1 = /** @type {(inputs: Chapi_P1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'API de gestion des justificatifs (CHAPI) est une solution open source pour communiquer des justificatifs vérifiables sur le Web.`)
};

const ar_chapi_p1 = /** @type {(inputs: Chapi_P1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`واجهة برمجة معالج بيانات الاعتماد (CHAPI) هي حل مفتوح المصدر لتبادل بيانات الاعتماد القابلة للتحقق على الويب.`)
};

/**
* | output |
* | --- |
* | "The Credential Handler API (CHAPI) is an open-source solution for communicating Verifiable Credentials on the Web." |
*
* @param {Chapi_P1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const chapi_p1 = /** @type {((inputs?: Chapi_P1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Chapi_P1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_chapi_p1(inputs)
	if (locale === "es") return es_chapi_p1(inputs)
	if (locale === "fr") return fr_chapi_p1(inputs)
	return ar_chapi_p1(inputs)
});
export { chapi_p1 as "chapi.p1" }