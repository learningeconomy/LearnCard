/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Share_Nocredentialstoshare3Inputs */

const en_share_nocredentialstoshare3 = /** @type {(inputs: Share_Nocredentialstoshare3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No credentials to share.`)
};

const es_share_nocredentialstoshare3 = /** @type {(inputs: Share_Nocredentialstoshare3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No hay credenciales para compartir.`)
};

const fr_share_nocredentialstoshare3 = /** @type {(inputs: Share_Nocredentialstoshare3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun justificatif à partager.`)
};

const ar_share_nocredentialstoshare3 = /** @type {(inputs: Share_Nocredentialstoshare3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد بيانات اعتماد للمشاركة.`)
};

/**
* | output |
* | --- |
* | "No credentials to share." |
*
* @param {Share_Nocredentialstoshare3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const share_nocredentialstoshare3 = /** @type {((inputs?: Share_Nocredentialstoshare3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_Nocredentialstoshare3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_nocredentialstoshare3(inputs)
	if (locale === "es") return es_share_nocredentialstoshare3(inputs)
	if (locale === "fr") return fr_share_nocredentialstoshare3(inputs)
	return ar_share_nocredentialstoshare3(inputs)
});
export { share_nocredentialstoshare3 as "share.noCredentialsToShare" }