/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Wallet3Inputs */

const en_boostcms_wallet3 = /** @type {(inputs: Boostcms_Wallet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Return to Wallet`)
};

const es_boostcms_wallet3 = /** @type {(inputs: Boostcms_Wallet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver al Wallet`)
};

const fr_boostcms_wallet3 = /** @type {(inputs: Boostcms_Wallet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour au portefeuille`)
};

const ar_boostcms_wallet3 = /** @type {(inputs: Boostcms_Wallet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العودة إلى المحفظة`)
};

/**
* | output |
* | --- |
* | "Return to Wallet" |
*
* @param {Boostcms_Wallet3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_wallet3 = /** @type {((inputs?: Boostcms_Wallet3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Wallet3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_wallet3(inputs)
	if (locale === "es") return es_boostcms_wallet3(inputs)
	if (locale === "fr") return fr_boostcms_wallet3(inputs)
	return ar_boostcms_wallet3(inputs)
});
export { boostcms_wallet3 as "boostCMS.wallet" }