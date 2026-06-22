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

const fr_recovery_recoveryemailsent2 = /** @type {(inputs: Recovery_Recoveryemailsent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous avons précédemment envoyé un e-mail de récupération à votre adresse. Ouvrez cet e-mail et suivez les étapes ci-dessous.`)
};

const ar_recovery_recoveryemailsent2 = /** @type {(inputs: Recovery_Recoveryemailsent2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أرسلنا سابقاً بريداً إلكترونياً للاستعادة إلى عنوانك. افتح ذلك البريد واتبع الخطوات أدناه.`)
};

/**
* | output |
* | --- |
* | "We previously sent a recovery email to your recovery address. Open that email and follow the steps below." |
*
* @param {Recovery_Recoveryemailsent2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_recoveryemailsent2 = /** @type {((inputs?: Recovery_Recoveryemailsent2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Recoveryemailsent2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_recoveryemailsent2(inputs)
	if (locale === "es") return es_recovery_recoveryemailsent2(inputs)
	if (locale === "fr") return fr_recovery_recoveryemailsent2(inputs)
	return ar_recovery_recoveryemailsent2(inputs)
});
export { recovery_recoveryemailsent2 as "recovery.recoveryEmailSent" }