/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Incorrectpassword1Inputs */

const en_recovery_incorrectpassword1 = /** @type {(inputs: Recovery_Incorrectpassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Incorrect password or corrupted data. Please try again.`)
};

const es_recovery_incorrectpassword1 = /** @type {(inputs: Recovery_Incorrectpassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contraseña incorrecta o datos corruptos. Inténtalo de nuevo.`)
};

const fr_recovery_incorrectpassword1 = /** @type {(inputs: Recovery_Incorrectpassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mot de passe incorrect ou données corrompues. Veuillez réessayer.`)
};

const ar_recovery_incorrectpassword1 = /** @type {(inputs: Recovery_Incorrectpassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كلمة مرور غير صحيحة أو بيانات تالفة. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Incorrect password or corrupted data. Please try again." |
*
* @param {Recovery_Incorrectpassword1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_incorrectpassword1 = /** @type {((inputs?: Recovery_Incorrectpassword1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Incorrectpassword1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_incorrectpassword1(inputs)
	if (locale === "es") return es_recovery_incorrectpassword1(inputs)
	if (locale === "fr") return fr_recovery_incorrectpassword1(inputs)
	return ar_recovery_incorrectpassword1(inputs)
});
export { recovery_incorrectpassword1 as "recovery.incorrectPassword" }