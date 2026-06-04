/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Boost_Boostissuedsuccess2Inputs */

const en_toasts_boost_boostissuedsuccess2 = /** @type {(inputs: Toasts_Boost_Boostissuedsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost issued successfully`)
};

const es_toasts_boost_boostissuedsuccess2 = /** @type {(inputs: Toasts_Boost_Boostissuedsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost emitido exitosamente`)
};

const de_toasts_boost_boostissuedsuccess2 = /** @type {(inputs: Toasts_Boost_Boostissuedsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost erfolgreich ausgestellt`)
};

const ar_toasts_boost_boostissuedsuccess2 = /** @type {(inputs: Toasts_Boost_Boostissuedsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إصدار Boost بنجاح`)
};

const fr_toasts_boost_boostissuedsuccess2 = /** @type {(inputs: Toasts_Boost_Boostissuedsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost émis avec succès`)
};

const ko_toasts_boost_boostissuedsuccess2 = /** @type {(inputs: Toasts_Boost_Boostissuedsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`부스트가 성공적으로 발급됨`)
};

/**
* | output |
* | --- |
* | "Boost issued successfully" |
*
* @param {Toasts_Boost_Boostissuedsuccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_boost_boostissuedsuccess2 = /** @type {((inputs?: Toasts_Boost_Boostissuedsuccess2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Boost_Boostissuedsuccess2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_boost_boostissuedsuccess2(inputs)
	if (locale === "es") return es_toasts_boost_boostissuedsuccess2(inputs)
	if (locale === "de") return de_toasts_boost_boostissuedsuccess2(inputs)
	if (locale === "ar") return ar_toasts_boost_boostissuedsuccess2(inputs)
	if (locale === "fr") return fr_toasts_boost_boostissuedsuccess2(inputs)
	return ko_toasts_boost_boostissuedsuccess2(inputs)
});
export { toasts_boost_boostissuedsuccess2 as "toasts.boost.boostIssuedSuccess" }