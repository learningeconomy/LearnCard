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

const fr_recovery_sendrecoverykey2 = /** @type {(inputs: Recovery_Sendrecoverykey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer la clé de récupération`)
};

const ar_recovery_sendrecoverykey2 = /** @type {(inputs: Recovery_Sendrecoverykey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال مفتاح الاستعادة`)
};

/**
* | output |
* | --- |
* | "Send Recovery Key" |
*
* @param {Recovery_Sendrecoverykey2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_sendrecoverykey2 = /** @type {((inputs?: Recovery_Sendrecoverykey2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Sendrecoverykey2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_sendrecoverykey2(inputs)
	if (locale === "es") return es_recovery_sendrecoverykey2(inputs)
	if (locale === "fr") return fr_recovery_sendrecoverykey2(inputs)
	return ar_recovery_sendrecoverykey2(inputs)
});
export { recovery_sendrecoverykey2 as "recovery.sendRecoveryKey" }