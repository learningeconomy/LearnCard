/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Testsubtitle2Inputs */

const en_consentflow_testsubtitle2 = /** @type {(inputs: Consentflow_Testsubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test subtitle`)
};

const es_consentflow_testsubtitle2 = /** @type {(inputs: Consentflow_Testsubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subtítulo de prueba`)
};

const de_consentflow_testsubtitle2 = /** @type {(inputs: Consentflow_Testsubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test-Untertitel`)
};

const ar_consentflow_testsubtitle2 = /** @type {(inputs: Consentflow_Testsubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عنوان فرعي تجريبي`)
};

const fr_consentflow_testsubtitle2 = /** @type {(inputs: Consentflow_Testsubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sous-titre de test`)
};

const ko_consentflow_testsubtitle2 = /** @type {(inputs: Consentflow_Testsubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`테스트 부제목`)
};

/**
* | output |
* | --- |
* | "Test subtitle" |
*
* @param {Consentflow_Testsubtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_testsubtitle2 = /** @type {((inputs?: Consentflow_Testsubtitle2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Testsubtitle2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_testsubtitle2(inputs)
	if (locale === "es") return es_consentflow_testsubtitle2(inputs)
	if (locale === "de") return de_consentflow_testsubtitle2(inputs)
	if (locale === "ar") return ar_consentflow_testsubtitle2(inputs)
	if (locale === "fr") return fr_consentflow_testsubtitle2(inputs)
	return ko_consentflow_testsubtitle2(inputs)
});
export { consentflow_testsubtitle2 as "consentFlow.testSubtitle" }