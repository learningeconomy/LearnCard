/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Passkeynotsupported2Inputs */

const en_recovery_passkeynotsupported2 = /** @type {(inputs: Recovery_Passkeynotsupported2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkeys aren't supported on this device or browser. Try using a recovery phrase or backup file instead.`)
};

const es_recovery_passkeynotsupported2 = /** @type {(inputs: Recovery_Passkeynotsupported2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las claves de acceso no son compatibles con este dispositivo o navegador. Intenta usar una frase de recuperación o un archivo de copia de seguridad.`)
};

const fr_recovery_passkeynotsupported2 = /** @type {(inputs: Recovery_Passkeynotsupported2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les clés d'accès ne sont pas prises en charge sur cet appareil ou ce navigateur. Essayez d'utiliser une phrase de récupération ou un fichier de sauvegarde.`)
};

const ar_recovery_passkeynotsupported2 = /** @type {(inputs: Recovery_Passkeynotsupported2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مفاتيح المرور غير مدعومة على هذا الجهاز أو المتصفح. حاول استخدام عبارة استرداد أو ملف نسخة احتياطية بدلاً من ذلك.`)
};

/**
* | output |
* | --- |
* | "Passkeys aren't supported on this device or browser. Try using a recovery phrase or backup file instead." |
*
* @param {Recovery_Passkeynotsupported2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_passkeynotsupported2 = /** @type {((inputs?: Recovery_Passkeynotsupported2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Passkeynotsupported2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_passkeynotsupported2(inputs)
	if (locale === "es") return es_recovery_passkeynotsupported2(inputs)
	if (locale === "fr") return fr_recovery_passkeynotsupported2(inputs)
	return ar_recovery_passkeynotsupported2(inputs)
});
export { recovery_passkeynotsupported2 as "recovery.passkeyNotSupported" }