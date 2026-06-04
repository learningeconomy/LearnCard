/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Replaceemail1Inputs */

const en_recovery_replaceemail1 = /** @type {(inputs: Recovery_Replaceemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This will replace your current recovery email.`)
};

const es_recovery_replaceemail1 = /** @type {(inputs: Recovery_Replaceemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esto reemplazará tu correo de recuperación actual.`)
};

const de_recovery_replaceemail1 = /** @type {(inputs: Recovery_Replaceemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dadurch wird deine aktuelle Wiederherstellungs-E-Mail ersetzt.`)
};

const ar_recovery_replaceemail1 = /** @type {(inputs: Recovery_Replaceemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سيؤدي هذا إلى استبدال بريد الاستعادة الحالي.`)
};

const fr_recovery_replaceemail1 = /** @type {(inputs: Recovery_Replaceemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cela remplacera votre e-mail de récupération actuel.`)
};

const ko_recovery_replaceemail1 = /** @type {(inputs: Recovery_Replaceemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`현재 복구 이메일이 교체됩니다.`)
};

/**
* | output |
* | --- |
* | "This will replace your current recovery email." |
*
* @param {Recovery_Replaceemail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_replaceemail1 = /** @type {((inputs?: Recovery_Replaceemail1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Replaceemail1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_replaceemail1(inputs)
	if (locale === "es") return es_recovery_replaceemail1(inputs)
	if (locale === "de") return de_recovery_replaceemail1(inputs)
	if (locale === "ar") return ar_recovery_replaceemail1(inputs)
	if (locale === "fr") return fr_recovery_replaceemail1(inputs)
	return ko_recovery_replaceemail1(inputs)
});
export { recovery_replaceemail1 as "recovery.replaceEmail" }