/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Credentialclaimfailed2Inputs */

const en_toasts_credentialclaimfailed2 = /** @type {(inputs: Toasts_Credentialclaimfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to claim Credential`)
};

const es_toasts_credentialclaimfailed2 = /** @type {(inputs: Toasts_Credentialclaimfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo reclamar la credencial`)
};

const de_toasts_credentialclaimfailed2 = /** @type {(inputs: Toasts_Credentialclaimfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Berechtigung konnte nicht beansprucht werden`)
};

const ar_toasts_credentialclaimfailed2 = /** @type {(inputs: Toasts_Credentialclaimfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر المطالبة ببيانات الاعتماد`)
};

const fr_toasts_credentialclaimfailed2 = /** @type {(inputs: Toasts_Credentialclaimfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de réclamer l'accréditation`)
};

const ko_toasts_credentialclaimfailed2 = /** @type {(inputs: Toasts_Credentialclaimfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자격 증명을 수령할 수 없습니다`)
};

/**
* | output |
* | --- |
* | "Unable to claim Credential" |
*
* @param {Toasts_Credentialclaimfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_credentialclaimfailed2 = /** @type {((inputs?: Toasts_Credentialclaimfailed2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Credentialclaimfailed2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_credentialclaimfailed2(inputs)
	if (locale === "es") return es_toasts_credentialclaimfailed2(inputs)
	if (locale === "de") return de_toasts_credentialclaimfailed2(inputs)
	if (locale === "ar") return ar_toasts_credentialclaimfailed2(inputs)
	if (locale === "fr") return fr_toasts_credentialclaimfailed2(inputs)
	return ko_toasts_credentialclaimfailed2(inputs)
});
export { toasts_credentialclaimfailed2 as "toasts.credentialClaimFailed" }