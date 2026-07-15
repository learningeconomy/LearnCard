/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claimboost_Expiredalert2Inputs */

const en_claimboost_expiredalert2 = /** @type {(inputs: Claimboost_Expiredalert2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The boost claim link has expired or has reached the maximum number of times it can be claimed.`)
};

const es_claimboost_expiredalert2 = /** @type {(inputs: Claimboost_Expiredalert2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El enlace de reclamo del boost ha expirado o ha alcanzado el número máximo de reclamos.`)
};

const fr_claimboost_expiredalert2 = /** @type {(inputs: Claimboost_Expiredalert2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le lien de réclamation du Boost a expiré ou a atteint le nombre maximum de réclamations.`)
};

const ar_claimboost_expiredalert2 = /** @type {(inputs: Claimboost_Expiredalert2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انتهت صلاحية رابط استلام التعزيز أو وصل للحد الأقصى لعدد مرات الاستلام.`)
};

/**
* | output |
* | --- |
* | "The boost claim link has expired or has reached the maximum number of times it can be claimed." |
*
* @param {Claimboost_Expiredalert2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claimboost_expiredalert2 = /** @type {((inputs?: Claimboost_Expiredalert2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claimboost_Expiredalert2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claimboost_expiredalert2(inputs)
	if (locale === "es") return es_claimboost_expiredalert2(inputs)
	if (locale === "fr") return fr_claimboost_expiredalert2(inputs)
	return ar_claimboost_expiredalert2(inputs)
});
export { claimboost_expiredalert2 as "claimBoost.expiredAlert" }