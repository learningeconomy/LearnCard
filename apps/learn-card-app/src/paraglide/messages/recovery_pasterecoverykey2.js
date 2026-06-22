/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Pasterecoverykey2Inputs */

const en_recovery_pasterecoverykey2 = /** @type {(inputs: Recovery_Pasterecoverykey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please paste the recovery key from your email.`)
};

const es_recovery_pasterecoverykey2 = /** @type {(inputs: Recovery_Pasterecoverykey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor pega la clave de recuperación de tu correo.`)
};

const fr_recovery_pasterecoverykey2 = /** @type {(inputs: Recovery_Pasterecoverykey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez coller la clé de récupération de votre e-mail.`)
};

const ar_recovery_pasterecoverykey2 = /** @type {(inputs: Recovery_Pasterecoverykey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى لصق مفتاح الاسترداد من بريدك الإلكتروني.`)
};

/**
* | output |
* | --- |
* | "Please paste the recovery key from your email." |
*
* @param {Recovery_Pasterecoverykey2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_pasterecoverykey2 = /** @type {((inputs?: Recovery_Pasterecoverykey2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Pasterecoverykey2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_pasterecoverykey2(inputs)
	if (locale === "es") return es_recovery_pasterecoverykey2(inputs)
	if (locale === "fr") return fr_recovery_pasterecoverykey2(inputs)
	return ar_recovery_pasterecoverykey2(inputs)
});
export { recovery_pasterecoverykey2 as "recovery.pasteRecoveryKey" }