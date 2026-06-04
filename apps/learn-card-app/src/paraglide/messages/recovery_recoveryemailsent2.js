/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Recoveryemailsent2Inputs */

const en_recovery_recoveryemailsent2 = /** @type {(inputs: Recovery_Recoveryemailsent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We previously sent a recovery email to your recovery address. Open that email and follow the steps below.`)
};

const es_recovery_recoveryemailsent2 = /** @type {(inputs: Recovery_Recoveryemailsent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviamos un correo de recuperación a tu dirección. Abre ese correo y sigue los pasos a continuación.`)
};

const de_recovery_recoveryemailsent2 = /** @type {(inputs: Recovery_Recoveryemailsent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wir haben zuvor eine Wiederherstellungs-E-Mail an deine Adresse gesendet. Öffne diese E-Mail und folge den untenstehenden Schritten.`)
};

const ar_recovery_recoveryemailsent2 = /** @type {(inputs: Recovery_Recoveryemailsent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أرسلنا سابقاً بريداً إلكترونياً للاستعادة إلى عنوانك. افتح ذلك البريد واتبع الخطوات أدناه.`)
};

const fr_recovery_recoveryemailsent2 = /** @type {(inputs: Recovery_Recoveryemailsent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous avons précédemment envoyé un e-mail de récupération à votre adresse. Ouvrez cet e-mail et suivez les étapes ci-dessous.`)
};

const ko_recovery_recoveryemailsent2 = /** @type {(inputs: Recovery_Recoveryemailsent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이전에 복구 이메일을 복구 주소로 보냈습니다. 해당 이메일을 열고 아래 단계를 따르세요.`)
};

/**
* | output |
* | --- |
* | "We previously sent a recovery email to your recovery address. Open that email and follow the steps below." |
*
* @param {Recovery_Recoveryemailsent2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_recoveryemailsent2 = /** @type {((inputs?: Recovery_Recoveryemailsent2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Recoveryemailsent2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_recoveryemailsent2(inputs)
	if (locale === "es") return es_recovery_recoveryemailsent2(inputs)
	if (locale === "de") return de_recovery_recoveryemailsent2(inputs)
	if (locale === "ar") return ar_recovery_recoveryemailsent2(inputs)
	if (locale === "fr") return fr_recovery_recoveryemailsent2(inputs)
	return ko_recovery_recoveryemailsent2(inputs)
});
export { recovery_recoveryemailsent2 as "recovery.recoveryEmailSent" }