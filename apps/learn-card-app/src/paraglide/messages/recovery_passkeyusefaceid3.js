/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Passkeyusefaceid3Inputs */

const en_recovery_passkeyusefaceid3 = /** @type {(inputs: Recovery_Passkeyusefaceid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use Face ID, Touch ID, or Windows Hello as your recovery method. Nothing to remember.`)
};

const es_recovery_passkeyusefaceid3 = /** @type {(inputs: Recovery_Passkeyusefaceid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usa Face ID, Touch ID o Windows Hello como método de recuperación. Nada que recordar.`)
};

const fr_recovery_passkeyusefaceid3 = /** @type {(inputs: Recovery_Passkeyusefaceid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisez Face ID, Touch ID ou Windows Hello comme méthode de récupération. Rien à retenir.`)
};

const ar_recovery_passkeyusefaceid3 = /** @type {(inputs: Recovery_Passkeyusefaceid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدم Face ID أو Touch ID أو Windows Hello كطريقة استرداد. لا حاجة للحفظ.`)
};

/**
* | output |
* | --- |
* | "Use Face ID, Touch ID, or Windows Hello as your recovery method. Nothing to remember." |
*
* @param {Recovery_Passkeyusefaceid3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_passkeyusefaceid3 = /** @type {((inputs?: Recovery_Passkeyusefaceid3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Passkeyusefaceid3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_passkeyusefaceid3(inputs)
	if (locale === "es") return es_recovery_passkeyusefaceid3(inputs)
	if (locale === "fr") return fr_recovery_passkeyusefaceid3(inputs)
	return ar_recovery_passkeyusefaceid3(inputs)
});
export { recovery_passkeyusefaceid3 as "recovery.passkeyUseFaceId" }