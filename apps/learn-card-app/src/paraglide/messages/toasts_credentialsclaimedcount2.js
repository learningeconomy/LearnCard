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

const fr_toasts_credentialsclaimedcount2 = /** @type {(inputs: Toasts_Credentialsclaimedcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} accréditation(s) réclamée(s) avec succès !`)
};

const ar_toasts_credentialsclaimedcount2 = /** @type {(inputs: Toasts_Credentialsclaimedcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم المطالبة بـ ${i?.count} بيانات اعتماد بنجاح!`)
};

/**
* | output |
* | --- |
* | "Successfully claimed {count} credential(s)!" |
*
* @param {Toasts_Credentialsclaimedcount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_credentialsclaimedcount2 = /** @type {((inputs: Toasts_Credentialsclaimedcount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Credentialsclaimedcount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_credentialsclaimedcount2(inputs)
	if (locale === "es") return es_toasts_credentialsclaimedcount2(inputs)
	if (locale === "fr") return fr_toasts_credentialsclaimedcount2(inputs)
	return ar_toasts_credentialsclaimedcount2(inputs)
});
export { toasts_credentialsclaimedcount2 as "toasts.credentialsClaimedCount" }