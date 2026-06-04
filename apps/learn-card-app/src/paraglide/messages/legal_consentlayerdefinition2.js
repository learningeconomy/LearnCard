/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Legal_Consentlayerdefinition2Inputs */

const en_legal_consentlayerdefinition2 = /** @type {(inputs: Legal_Consentlayerdefinition2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You decide what data connects to which apps, and for how long.`)
};

const es_legal_consentlayerdefinition2 = /** @type {(inputs: Legal_Consentlayerdefinition2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tú decides qué datos se conectan con qué aplicaciones y por cuánto tiempo.`)
};

const de_legal_consentlayerdefinition2 = /** @type {(inputs: Legal_Consentlayerdefinition2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Du entscheidest, welche Daten mit welchen Apps verbunden werden und für wie lange.`)
};

const ar_legal_consentlayerdefinition2 = /** @type {(inputs: Legal_Consentlayerdefinition2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنت تقرر أي البيانات تتصل بأي تطبيق، ولأي مدة.`)
};

const fr_legal_consentlayerdefinition2 = /** @type {(inputs: Legal_Consentlayerdefinition2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous décidez quelles données se connectent à quelles applications, et pour combien de temps.`)
};

const ko_legal_consentlayerdefinition2 = /** @type {(inputs: Legal_Consentlayerdefinition2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`어떤 데이터를 어떤 앱에 얼마나 오래 연결할지 직접 결정합니다.`)
};

/**
* | output |
* | --- |
* | "You decide what data connects to which apps, and for how long." |
*
* @param {Legal_Consentlayerdefinition2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const legal_consentlayerdefinition2 = /** @type {((inputs?: Legal_Consentlayerdefinition2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Legal_Consentlayerdefinition2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_legal_consentlayerdefinition2(inputs)
	if (locale === "es") return es_legal_consentlayerdefinition2(inputs)
	if (locale === "de") return de_legal_consentlayerdefinition2(inputs)
	if (locale === "ar") return ar_legal_consentlayerdefinition2(inputs)
	if (locale === "fr") return fr_legal_consentlayerdefinition2(inputs)
	return ko_legal_consentlayerdefinition2(inputs)
});
export { legal_consentlayerdefinition2 as "legal.consentLayerDefinition" }