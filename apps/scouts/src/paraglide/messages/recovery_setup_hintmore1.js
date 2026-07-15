/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Hintmore1Inputs */

const en_recovery_setup_hintmore1 = /** @type {(inputs: Recovery_Setup_Hintmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adding another method improves your security.`)
};

const es_recovery_setup_hintmore1 = /** @type {(inputs: Recovery_Setup_Hintmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir otro método mejora tu seguridad.`)
};

const fr_recovery_setup_hintmore1 = /** @type {(inputs: Recovery_Setup_Hintmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'ajout d'une méthode supplémentaire améliore votre sécurité.`)
};

const ar_recovery_setup_hintmore1 = /** @type {(inputs: Recovery_Setup_Hintmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة طريقة أخرى يحسن أمانك.`)
};

/**
* | output |
* | --- |
* | "Adding another method improves your security." |
*
* @param {Recovery_Setup_Hintmore1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_hintmore1 = /** @type {((inputs?: Recovery_Setup_Hintmore1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Hintmore1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_hintmore1(inputs)
	if (locale === "es") return es_recovery_setup_hintmore1(inputs)
	if (locale === "fr") return fr_recovery_setup_hintmore1(inputs)
	return ar_recovery_setup_hintmore1(inputs)
});
export { recovery_setup_hintmore1 as "recovery.setup.hintMore" }