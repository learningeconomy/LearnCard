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

const fr_recovery_replaceemail1 = /** @type {(inputs: Recovery_Replaceemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cela remplacera votre e-mail de récupération actuel.`)
};

const ar_recovery_replaceemail1 = /** @type {(inputs: Recovery_Replaceemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سيؤدي هذا إلى استبدال بريد الاسترداد الحالي.`)
};

/**
* | output |
* | --- |
* | "This will replace your current recovery email." |
*
* @param {Recovery_Replaceemail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_replaceemail1 = /** @type {((inputs?: Recovery_Replaceemail1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Replaceemail1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_replaceemail1(inputs)
	if (locale === "es") return es_recovery_replaceemail1(inputs)
	if (locale === "fr") return fr_recovery_replaceemail1(inputs)
	return ar_recovery_replaceemail1(inputs)
});
export { recovery_replaceemail1 as "recovery.replaceEmail" }