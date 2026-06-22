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

const fr_legal_consentlayerdefinition2 = /** @type {(inputs: Legal_Consentlayerdefinition2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous décidez quelles données se connectent à quelles applications, et pour combien de temps.`)
};

const ar_legal_consentlayerdefinition2 = /** @type {(inputs: Legal_Consentlayerdefinition2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنت تقرر أي البيانات تتصل بأي تطبيق، ولأي مدة.`)
};

/**
* | output |
* | --- |
* | "You decide what data connects to which apps, and for how long." |
*
* @param {Legal_Consentlayerdefinition2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const legal_consentlayerdefinition2 = /** @type {((inputs?: Legal_Consentlayerdefinition2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Legal_Consentlayerdefinition2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_legal_consentlayerdefinition2(inputs)
	if (locale === "es") return es_legal_consentlayerdefinition2(inputs)
	if (locale === "fr") return fr_legal_consentlayerdefinition2(inputs)
	return ar_legal_consentlayerdefinition2(inputs)
});
export { legal_consentlayerdefinition2 as "legal.consentLayerDefinition" }