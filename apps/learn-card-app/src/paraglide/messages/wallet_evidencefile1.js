/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Evidencefile1Inputs */

const en_wallet_evidencefile1 = /** @type {(inputs: Wallet_Evidencefile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Evidence File`)
};

const es_wallet_evidencefile1 = /** @type {(inputs: Wallet_Evidencefile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivo de evidencia`)
};

const de_wallet_evidencefile1 = /** @type {(inputs: Wallet_Evidencefile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nachweisdatei`)
};

const ar_wallet_evidencefile1 = /** @type {(inputs: Wallet_Evidencefile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملف الدليل`)
};

const fr_wallet_evidencefile1 = /** @type {(inputs: Wallet_Evidencefile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fichier de preuve`)
};

const ko_wallet_evidencefile1 = /** @type {(inputs: Wallet_Evidencefile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`증빙 파일`)
};

/**
* | output |
* | --- |
* | "Evidence File" |
*
* @param {Wallet_Evidencefile1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_evidencefile1 = /** @type {((inputs?: Wallet_Evidencefile1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Evidencefile1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_evidencefile1(inputs)
	if (locale === "es") return es_wallet_evidencefile1(inputs)
	if (locale === "de") return de_wallet_evidencefile1(inputs)
	if (locale === "ar") return ar_wallet_evidencefile1(inputs)
	if (locale === "fr") return fr_wallet_evidencefile1(inputs)
	return ko_wallet_evidencefile1(inputs)
});
export { wallet_evidencefile1 as "wallet.evidenceFile" }