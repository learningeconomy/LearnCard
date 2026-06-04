/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Toasts_Credentialsclaimedcount2Inputs */

const en_toasts_credentialsclaimedcount2 = /** @type {(inputs: Toasts_Credentialsclaimedcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Successfully claimed ${i?.count} credential(s)!`)
};

const es_toasts_credentialsclaimedcount2 = /** @type {(inputs: Toasts_Credentialsclaimedcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`¡Se reclamaron ${i?.count} credencial(es) exitosamente!`)
};

const de_toasts_credentialsclaimedcount2 = /** @type {(inputs: Toasts_Credentialsclaimedcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Berechtigung(en) erfolgreich beansprucht!`)
};

const ar_toasts_credentialsclaimedcount2 = /** @type {(inputs: Toasts_Credentialsclaimedcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم المطالبة بـ ${i?.count} بيانات اعتماد بنجاح!`)
};

const fr_toasts_credentialsclaimedcount2 = /** @type {(inputs: Toasts_Credentialsclaimedcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} accréditation(s) réclamée(s) avec succès !`)
};

const ko_toasts_credentialsclaimedcount2 = /** @type {(inputs: Toasts_Credentialsclaimedcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count}개 자격 증명이 성공적으로 수령되었습니다!`)
};

/**
* | output |
* | --- |
* | "Successfully claimed {count} credential(s)!" |
*
* @param {Toasts_Credentialsclaimedcount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_credentialsclaimedcount2 = /** @type {((inputs: Toasts_Credentialsclaimedcount2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Credentialsclaimedcount2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_credentialsclaimedcount2(inputs)
	if (locale === "es") return es_toasts_credentialsclaimedcount2(inputs)
	if (locale === "de") return de_toasts_credentialsclaimedcount2(inputs)
	if (locale === "ar") return ar_toasts_credentialsclaimedcount2(inputs)
	if (locale === "fr") return fr_toasts_credentialsclaimedcount2(inputs)
	return ko_toasts_credentialsclaimedcount2(inputs)
});
export { toasts_credentialsclaimedcount2 as "toasts.credentialsClaimedCount" }