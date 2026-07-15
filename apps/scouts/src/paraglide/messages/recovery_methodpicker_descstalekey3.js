/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Methodpicker_Descstalekey3Inputs */

const en_recovery_methodpicker_descstalekey3 = /** @type {(inputs: Recovery_Methodpicker_Descstalekey3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your account security was recently updated on another device. Please verify to continue.`)
};

const es_recovery_methodpicker_descstalekey3 = /** @type {(inputs: Recovery_Methodpicker_Descstalekey3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La seguridad de tu cuenta se actualizó recientemente en otro dispositivo. Verifica para continuar.`)
};

const fr_recovery_methodpicker_descstalekey3 = /** @type {(inputs: Recovery_Methodpicker_Descstalekey3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La sécurité de votre compte a été récemment mise à jour sur un autre appareil. Veuillez vérifier pour continuer.`)
};

const ar_recovery_methodpicker_descstalekey3 = /** @type {(inputs: Recovery_Methodpicker_Descstalekey3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تحديث أمان حسابك مؤخراً على جهاز آخر. يرجى التحقق للمتابعة.`)
};

/**
* | output |
* | --- |
* | "Your account security was recently updated on another device. Please verify to continue." |
*
* @param {Recovery_Methodpicker_Descstalekey3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_methodpicker_descstalekey3 = /** @type {((inputs?: Recovery_Methodpicker_Descstalekey3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Methodpicker_Descstalekey3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_methodpicker_descstalekey3(inputs)
	if (locale === "es") return es_recovery_methodpicker_descstalekey3(inputs)
	if (locale === "fr") return fr_recovery_methodpicker_descstalekey3(inputs)
	return ar_recovery_methodpicker_descstalekey3(inputs)
});
export { recovery_methodpicker_descstalekey3 as "recovery.methodPicker.descStaleKey" }