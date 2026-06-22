/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Success_Passkeysetup1Inputs */

const en_recovery_success_passkeysetup1 = /** @type {(inputs: Recovery_Success_Passkeysetup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkey recovery is set up!`)
};

const es_recovery_success_passkeysetup1 = /** @type {(inputs: Recovery_Success_Passkeysetup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡La recuperación con clave de acceso está configurada!`)
};

const fr_recovery_success_passkeysetup1 = /** @type {(inputs: Recovery_Success_Passkeysetup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La récupération par clé d'accès est configurée !`)
};

const ar_recovery_success_passkeysetup1 = /** @type {(inputs: Recovery_Success_Passkeysetup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إعداد الاسترداد بمفتاح المرور!`)
};

/**
* | output |
* | --- |
* | "Passkey recovery is set up!" |
*
* @param {Recovery_Success_Passkeysetup1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_success_passkeysetup1 = /** @type {((inputs?: Recovery_Success_Passkeysetup1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Success_Passkeysetup1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_success_passkeysetup1(inputs)
	if (locale === "es") return es_recovery_success_passkeysetup1(inputs)
	if (locale === "fr") return fr_recovery_success_passkeysetup1(inputs)
	return ar_recovery_success_passkeysetup1(inputs)
});
export { recovery_success_passkeysetup1 as "recovery.success.passkeySetup" }