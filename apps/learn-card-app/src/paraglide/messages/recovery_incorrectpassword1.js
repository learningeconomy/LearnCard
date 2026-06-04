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

const de_recovery_incorrectpassword1 = /** @type {(inputs: Recovery_Incorrectpassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Falsches Passwort oder beschädigte Daten. Bitte versuche es erneut.`)
};

const ar_recovery_incorrectpassword1 = /** @type {(inputs: Recovery_Incorrectpassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كلمة مرور غير صحيحة أو بيانات تالفة. يرجى المحاولة مرة أخرى.`)
};

const fr_recovery_incorrectpassword1 = /** @type {(inputs: Recovery_Incorrectpassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mot de passe incorrect ou données corrompues. Veuillez réessayer.`)
};

const ko_recovery_incorrectpassword1 = /** @type {(inputs: Recovery_Incorrectpassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`비밀번호가 틀렸거나 데이터가 손상되었습니다. 다시 시도해 주세요.`)
};

/**
* | output |
* | --- |
* | "Incorrect password or corrupted data. Please try again." |
*
* @param {Recovery_Incorrectpassword1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_incorrectpassword1 = /** @type {((inputs?: Recovery_Incorrectpassword1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Incorrectpassword1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_incorrectpassword1(inputs)
	if (locale === "es") return es_recovery_incorrectpassword1(inputs)
	if (locale === "de") return de_recovery_incorrectpassword1(inputs)
	if (locale === "ar") return ar_recovery_incorrectpassword1(inputs)
	if (locale === "fr") return fr_recovery_incorrectpassword1(inputs)
	return ko_recovery_incorrectpassword1(inputs)
});
export { recovery_incorrectpassword1 as "recovery.incorrectPassword" }