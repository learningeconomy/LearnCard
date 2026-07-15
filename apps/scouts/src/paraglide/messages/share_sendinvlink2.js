/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Share_Sendinvlink2Inputs */

const en_share_sendinvlink2 = /** @type {(inputs: Share_Sendinvlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send invite link to connect`)
};

const es_share_sendinvlink2 = /** @type {(inputs: Share_Sendinvlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar enlace de invitación para conectar`)
};

const fr_share_sendinvlink2 = /** @type {(inputs: Share_Sendinvlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer un lien d'invitation pour se connecter`)
};

const ar_share_sendinvlink2 = /** @type {(inputs: Share_Sendinvlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال رابط دعوة للتواصل`)
};

/**
* | output |
* | --- |
* | "Send invite link to connect" |
*
* @param {Share_Sendinvlink2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const share_sendinvlink2 = /** @type {((inputs?: Share_Sendinvlink2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_Sendinvlink2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_sendinvlink2(inputs)
	if (locale === "es") return es_share_sendinvlink2(inputs)
	if (locale === "fr") return fr_share_sendinvlink2(inputs)
	return ar_share_sendinvlink2(inputs)
});
export { share_sendinvlink2 as "share.sendInvLink" }