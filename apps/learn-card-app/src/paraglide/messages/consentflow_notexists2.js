/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Notexists2Inputs */

const en_consentflow_notexists2 = /** @type {(inputs: Consentflow_Notexists2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This Consent Flow does not or no longer exists.`)
};

const es_consentflow_notexists2 = /** @type {(inputs: Consentflow_Notexists2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Este flujo de consentimiento no existe o ya no está disponible.`)
};

const de_consentflow_notexists2 = /** @type {(inputs: Consentflow_Notexists2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dieser Zustimmungsfluss existiert nicht oder nicht mehr.`)
};

const ar_consentflow_notexists2 = /** @type {(inputs: Consentflow_Notexists2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تدفق الموافقة هذا غير موجود أو لم يعد متاحاً.`)
};

const fr_consentflow_notexists2 = /** @type {(inputs: Consentflow_Notexists2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce flux de consentement n'existe pas ou n'est plus disponible.`)
};

const ko_consentflow_notexists2 = /** @type {(inputs: Consentflow_Notexists2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 동의 흐름이 존재하지 않거나 더 이상 사용할 수 없습니다.`)
};

/**
* | output |
* | --- |
* | "This Consent Flow does not or no longer exists." |
*
* @param {Consentflow_Notexists2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_notexists2 = /** @type {((inputs?: Consentflow_Notexists2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Notexists2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_notexists2(inputs)
	if (locale === "es") return es_consentflow_notexists2(inputs)
	if (locale === "de") return de_consentflow_notexists2(inputs)
	if (locale === "ar") return ar_consentflow_notexists2(inputs)
	if (locale === "fr") return fr_consentflow_notexists2(inputs)
	return ko_consentflow_notexists2(inputs)
});
export { consentflow_notexists2 as "consentFlow.notExists" }