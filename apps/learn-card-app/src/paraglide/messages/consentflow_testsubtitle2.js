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

const fr_consentflow_testsubtitle2 = /** @type {(inputs: Consentflow_Testsubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sous-titre de test`)
};

const ar_consentflow_testsubtitle2 = /** @type {(inputs: Consentflow_Testsubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عنوان فرعي تجريبي`)
};

/**
* | output |
* | --- |
* | "Test subtitle" |
*
* @param {Consentflow_Testsubtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_testsubtitle2 = /** @type {((inputs?: Consentflow_Testsubtitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Testsubtitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_testsubtitle2(inputs)
	if (locale === "es") return es_consentflow_testsubtitle2(inputs)
	if (locale === "fr") return fr_consentflow_testsubtitle2(inputs)
	return ar_consentflow_testsubtitle2(inputs)
});
export { consentflow_testsubtitle2 as "consentFlow.testSubtitle" }