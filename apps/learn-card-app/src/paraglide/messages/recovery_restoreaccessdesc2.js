/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Restoreaccessdesc2Inputs */

const en_recovery_restoreaccessdesc2 = /** @type {(inputs: Recovery_Restoreaccessdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose how you’d like to restore access to your account.`)
};

const es_recovery_restoreaccessdesc2 = /** @type {(inputs: Recovery_Restoreaccessdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige cómo quieres restaurar el acceso a tu cuenta.`)
};

const fr_recovery_restoreaccessdesc2 = /** @type {(inputs: Recovery_Restoreaccessdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez comment vous souhaitez restaurer l’accès à votre compte.`)
};

const ar_recovery_restoreaccessdesc2 = /** @type {(inputs: Recovery_Restoreaccessdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر كيف تريد استعادة الوصول إلى حسابك.`)
};

/**
* | output |
* | --- |
* | "Choose how you’d like to restore access to your account." |
*
* @param {Recovery_Restoreaccessdesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_restoreaccessdesc2 = /** @type {((inputs?: Recovery_Restoreaccessdesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Restoreaccessdesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_restoreaccessdesc2(inputs)
	if (locale === "es") return es_recovery_restoreaccessdesc2(inputs)
	if (locale === "fr") return fr_recovery_restoreaccessdesc2(inputs)
	return ar_recovery_restoreaccessdesc2(inputs)
});
export { recovery_restoreaccessdesc2 as "recovery.restoreAccessDesc" }