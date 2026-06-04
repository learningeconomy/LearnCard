/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Securityupdated1Inputs */

const en_recovery_securityupdated1 = /** @type {(inputs: Recovery_Securityupdated1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your account security was recently updated on another device. Please verify to continue.`)
};

const es_recovery_securityupdated1 = /** @type {(inputs: Recovery_Securityupdated1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La seguridad de tu cuenta se actualizó recientemente en otro dispositivo. Verifica para continuar.`)
};

const de_recovery_securityupdated1 = /** @type {(inputs: Recovery_Securityupdated1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deine Kontosicherheit wurde kürzlich auf einem anderen Gerät aktualisiert. Bitte bestätige, um fortzufahren.`)
};

const ar_recovery_securityupdated1 = /** @type {(inputs: Recovery_Securityupdated1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تحديث أمان حسابك مؤخراً على جهاز آخر. يرجى التحقق للمتابعة.`)
};

const fr_recovery_securityupdated1 = /** @type {(inputs: Recovery_Securityupdated1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La sécurité de votre compte a été récemment mise à jour sur un autre appareil. Veuillez vérifier pour continuer.`)
};

const ko_recovery_securityupdated1 = /** @type {(inputs: Recovery_Securityupdated1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`다른 기기에서 계정 보안이 최근 업데이트되었습니다. 계속하려면 확인해 주세요.`)
};

/**
* | output |
* | --- |
* | "Your account security was recently updated on another device. Please verify to continue." |
*
* @param {Recovery_Securityupdated1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_securityupdated1 = /** @type {((inputs?: Recovery_Securityupdated1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Securityupdated1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_securityupdated1(inputs)
	if (locale === "es") return es_recovery_securityupdated1(inputs)
	if (locale === "de") return de_recovery_securityupdated1(inputs)
	if (locale === "ar") return ar_recovery_securityupdated1(inputs)
	if (locale === "fr") return fr_recovery_securityupdated1(inputs)
	return ko_recovery_securityupdated1(inputs)
});
export { recovery_securityupdated1 as "recovery.securityUpdated" }