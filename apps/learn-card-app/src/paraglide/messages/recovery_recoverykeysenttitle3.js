/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Recoverykeysenttitle3Inputs */

const en_recovery_recoverykeysenttitle3 = /** @type {(inputs: Recovery_Recoverykeysenttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recovery key sent`)
};

const es_recovery_recoverykeysenttitle3 = /** @type {(inputs: Recovery_Recoverykeysenttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clave de recuperación enviada`)
};

const fr_recovery_recoverykeysenttitle3 = /** @type {(inputs: Recovery_Recoverykeysenttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clé de récupération envoyée`)
};

const ar_recovery_recoverykeysenttitle3 = /** @type {(inputs: Recovery_Recoverykeysenttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرسال مفتاح الاسترداد`)
};

/**
* | output |
* | --- |
* | "Recovery key sent" |
*
* @param {Recovery_Recoverykeysenttitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_recoverykeysenttitle3 = /** @type {((inputs?: Recovery_Recoverykeysenttitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Recoverykeysenttitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_recoverykeysenttitle3(inputs)
	if (locale === "es") return es_recovery_recoverykeysenttitle3(inputs)
	if (locale === "fr") return fr_recovery_recoverykeysenttitle3(inputs)
	return ar_recovery_recoverykeysenttitle3(inputs)
});
export { recovery_recoverykeysenttitle3 as "recovery.recoveryKeySentTitle" }