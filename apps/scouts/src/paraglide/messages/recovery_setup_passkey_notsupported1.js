/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Passkey_Notsupported1Inputs */

const en_recovery_setup_passkey_notsupported1 = /** @type {(inputs: Recovery_Setup_Passkey_Notsupported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkeys aren't supported on this device or browser. Try using a recovery phrase or backup file instead.`)
};

const es_recovery_setup_passkey_notsupported1 = /** @type {(inputs: Recovery_Setup_Passkey_Notsupported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las passkeys no son compatibles con este dispositivo o navegador. Intenta usar una frase de recuperación o archivo de respaldo.`)
};

const fr_recovery_setup_passkey_notsupported1 = /** @type {(inputs: Recovery_Setup_Passkey_Notsupported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les clés d'accès ne sont pas prises en charge sur cet appareil ou navigateur. Essayez plutôt une phrase de récupération ou un fichier de sauvegarde.`)
};

const ar_recovery_setup_passkey_notsupported1 = /** @type {(inputs: Recovery_Setup_Passkey_Notsupported1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مفاتيح المرور غير مدعومة على هذا الجهاز أو المتصفح. جرب استخدام عبارة استرداد أو ملف نسخ احتياطي بدلاً من ذلك.`)
};

/**
* | output |
* | --- |
* | "Passkeys aren't supported on this device or browser. Try using a recovery phrase or backup file instead." |
*
* @param {Recovery_Setup_Passkey_Notsupported1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_passkey_notsupported1 = /** @type {((inputs?: Recovery_Setup_Passkey_Notsupported1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Passkey_Notsupported1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_passkey_notsupported1(inputs)
	if (locale === "es") return es_recovery_setup_passkey_notsupported1(inputs)
	if (locale === "fr") return fr_recovery_setup_passkey_notsupported1(inputs)
	return ar_recovery_setup_passkey_notsupported1(inputs)
});
export { recovery_setup_passkey_notsupported1 as "recovery.setup.passkey.notSupported" }