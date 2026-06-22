/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Success_Recoverykeysent2Inputs */

const en_recovery_success_recoverykeysent2 = /** @type {(inputs: Recovery_Success_Recoverykeysent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recovery key sent to your email!`)
};

const es_recovery_success_recoverykeysent2 = /** @type {(inputs: Recovery_Success_Recoverykeysent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Clave de recuperación enviada a tu correo!`)
};

const fr_recovery_success_recoverykeysent2 = /** @type {(inputs: Recovery_Success_Recoverykeysent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clé de récupération envoyée à votre e-mail !`)
};

const ar_recovery_success_recoverykeysent2 = /** @type {(inputs: Recovery_Success_Recoverykeysent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرسال مفتاح الاسترداد إلى بريدك الإلكتروني!`)
};

/**
* | output |
* | --- |
* | "Recovery key sent to your email!" |
*
* @param {Recovery_Success_Recoverykeysent2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_success_recoverykeysent2 = /** @type {((inputs?: Recovery_Success_Recoverykeysent2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Success_Recoverykeysent2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_success_recoverykeysent2(inputs)
	if (locale === "es") return es_recovery_success_recoverykeysent2(inputs)
	if (locale === "fr") return fr_recovery_success_recoverykeysent2(inputs)
	return ar_recovery_success_recoverykeysent2(inputs)
});
export { recovery_success_recoverykeysent2 as "recovery.success.recoveryKeySent" }