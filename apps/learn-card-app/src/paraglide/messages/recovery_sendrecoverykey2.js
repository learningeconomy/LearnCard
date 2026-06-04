/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Sendrecoverykey2Inputs */

const en_recovery_sendrecoverykey2 = /** @type {(inputs: Recovery_Sendrecoverykey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Recovery Key`)
};

const es_recovery_sendrecoverykey2 = /** @type {(inputs: Recovery_Sendrecoverykey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar clave de recuperación`)
};

const de_recovery_sendrecoverykey2 = /** @type {(inputs: Recovery_Sendrecoverykey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wiederherstellungsschlüssel senden`)
};

const ar_recovery_sendrecoverykey2 = /** @type {(inputs: Recovery_Sendrecoverykey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال مفتاح الاستعادة`)
};

const fr_recovery_sendrecoverykey2 = /** @type {(inputs: Recovery_Sendrecoverykey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer la clé de récupération`)
};

const ko_recovery_sendrecoverykey2 = /** @type {(inputs: Recovery_Sendrecoverykey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`복구 키 전송`)
};

/**
* | output |
* | --- |
* | "Send Recovery Key" |
*
* @param {Recovery_Sendrecoverykey2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_sendrecoverykey2 = /** @type {((inputs?: Recovery_Sendrecoverykey2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Sendrecoverykey2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_sendrecoverykey2(inputs)
	if (locale === "es") return es_recovery_sendrecoverykey2(inputs)
	if (locale === "de") return de_recovery_sendrecoverykey2(inputs)
	if (locale === "ar") return ar_recovery_sendrecoverykey2(inputs)
	if (locale === "fr") return fr_recovery_sendrecoverykey2(inputs)
	return ko_recovery_sendrecoverykey2(inputs)
});
export { recovery_sendrecoverykey2 as "recovery.sendRecoveryKey" }