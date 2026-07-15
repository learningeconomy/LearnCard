/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Setexpdate3Inputs */

const en_consentflow_setexpdate3 = /** @type {(inputs: Consentflow_Setexpdate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set an expiration date?`)
};

const es_consentflow_setexpdate3 = /** @type {(inputs: Consentflow_Setexpdate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Establecer una fecha de expiración?`)
};

const fr_consentflow_setexpdate3 = /** @type {(inputs: Consentflow_Setexpdate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Définir une date d'expiration ?`)
};

const ar_consentflow_setexpdate3 = /** @type {(inputs: Consentflow_Setexpdate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعيين تاريخ انتهاء صلاحية؟`)
};

/**
* | output |
* | --- |
* | "Set an expiration date?" |
*
* @param {Consentflow_Setexpdate3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_setexpdate3 = /** @type {((inputs?: Consentflow_Setexpdate3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Setexpdate3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_setexpdate3(inputs)
	if (locale === "es") return es_consentflow_setexpdate3(inputs)
	if (locale === "fr") return fr_consentflow_setexpdate3(inputs)
	return ar_consentflow_setexpdate3(inputs)
});
export { consentflow_setexpdate3 as "consentFlow.setExpDate" }