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

const fr_wallet_evidencefile1 = /** @type {(inputs: Wallet_Evidencefile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fichier de preuve`)
};

const ar_wallet_evidencefile1 = /** @type {(inputs: Wallet_Evidencefile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملف الدليل`)
};

/**
* | output |
* | --- |
* | "Evidence File" |
*
* @param {Wallet_Evidencefile1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_evidencefile1 = /** @type {((inputs?: Wallet_Evidencefile1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Evidencefile1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_evidencefile1(inputs)
	if (locale === "es") return es_wallet_evidencefile1(inputs)
	if (locale === "fr") return fr_wallet_evidencefile1(inputs)
	return ar_wallet_evidencefile1(inputs)
});
export { wallet_evidencefile1 as "wallet.evidenceFile" }