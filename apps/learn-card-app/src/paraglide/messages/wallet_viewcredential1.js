/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Viewcredential1Inputs */

const en_wallet_viewcredential1 = /** @type {(inputs: Wallet_Viewcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Credential`)
};

const es_wallet_viewcredential1 = /** @type {(inputs: Wallet_Viewcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver credencial`)
};

const de_wallet_viewcredential1 = /** @type {(inputs: Wallet_Viewcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Berechtigung ansehen`)
};

const ar_wallet_viewcredential1 = /** @type {(inputs: Wallet_Viewcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض الشهادة`)
};

const fr_wallet_viewcredential1 = /** @type {(inputs: Wallet_Viewcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir le titre`)
};

const ko_wallet_viewcredential1 = /** @type {(inputs: Wallet_Viewcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자격증명 보기`)
};

/**
* | output |
* | --- |
* | "View Credential" |
*
* @param {Wallet_Viewcredential1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_viewcredential1 = /** @type {((inputs?: Wallet_Viewcredential1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Viewcredential1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_viewcredential1(inputs)
	if (locale === "es") return es_wallet_viewcredential1(inputs)
	if (locale === "de") return de_wallet_viewcredential1(inputs)
	if (locale === "ar") return ar_wallet_viewcredential1(inputs)
	if (locale === "fr") return fr_wallet_viewcredential1(inputs)
	return ko_wallet_viewcredential1(inputs)
});
export { wallet_viewcredential1 as "wallet.viewCredential" }