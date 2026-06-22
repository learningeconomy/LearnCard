/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Usedifferentemail2Inputs */

const en_recovery_usedifferentemail2 = /** @type {(inputs: Recovery_Usedifferentemail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use a different email`)
};

const es_recovery_usedifferentemail2 = /** @type {(inputs: Recovery_Usedifferentemail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usar un correo diferente`)
};

const fr_recovery_usedifferentemail2 = /** @type {(inputs: Recovery_Usedifferentemail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utiliser un e-mail différent`)
};

const ar_recovery_usedifferentemail2 = /** @type {(inputs: Recovery_Usedifferentemail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدام بريد إلكتروني مختلف`)
};

/**
* | output |
* | --- |
* | "Use a different email" |
*
* @param {Recovery_Usedifferentemail2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_usedifferentemail2 = /** @type {((inputs?: Recovery_Usedifferentemail2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Usedifferentemail2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_usedifferentemail2(inputs)
	if (locale === "es") return es_recovery_usedifferentemail2(inputs)
	if (locale === "fr") return fr_recovery_usedifferentemail2(inputs)
	return ar_recovery_usedifferentemail2(inputs)
});
export { recovery_usedifferentemail2 as "recovery.useDifferentEmail" }